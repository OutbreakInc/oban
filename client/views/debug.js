define(function(require)
{

var Backbone = require("backbone"),
	App = require("app/app"),
	StackListView = require("app/views/stack-list"),
	StackCollection = require("app/models/stack-collection"),
	YAHOO = require("yui/yahoo-dom-event"),
	ace = require("ace/ace"),
	Range = ace.require("ace/range").Range,
	_ = require("underscore");	

require("yui/treeview-min");	

var DebugView = Backbone.View.extend(
{
	events:
	{
		"click .continueButton": "onUserContinue",
		"click .pauseButton": "onUserPause",
		"click .endButton" : "onEnd"
	},

	unbindEvents: function()
	{
		this.socket.removeListener("gdb_message", this.onData);
		this.socket.removeListener("gdb_break", this.onBreakpoint);
		this.socket.removeListener("gdb_variables", this.onVariables);
		this.socket.removeListener("gdb_continue", this.onContinue);
		this.socket.removeListener("gdb_error", this.onError);
		this.socket.removeListener("gdb_pause", this.onPause);
		this.editor.removeListener("guttermousedown", this.onSetBreakpoint);
		this.undelegateEvents();
	},

	// end a debugging session, leaving the program in whatever state it's
	// currently in (could be either running or stopped)
	onEnd: function()
	{
		this.setButtonLoading(".endButton", true);

		this.unbindEvents();
		this.clearMarker();
		this.clearSidebar();
		this.stackListView.remove();

		_.forEach(this.breakpoints, function(value, row)
		{
			console.log("clearing breakpoint at row:", row);
			this.editor.session.clearBreakpoint(row);

		}, this);

		this.setButtonLoading(".endButton", false);

		this.trigger("debugEnd");
		this.socket.emit("gdb_exit");
	},

	initialize: function(options)
	{
		_.bindAll(this);

		this.messageView = $(".messageView");
		this.messageView.html("");
		this.project = this.model;
		this.socket = this.project.socket;
		this.device = options.device;

		this.stack = new StackCollection({ socket: this.socket });

		this.stackListView = new StackListView({ collection: this.stack });
		this.$(".callstackView").append(this.stackListView.render().el);

		this.breakpoints = {};

		var self = this;

		this.socket.on("gdb_message", this.onData);
		this.socket.on("gdb_break", this.onBreakpoint);
		this.socket.on("gdb_variables", this.onVariables);
		this.socket.on("gdb_continue", this.onContinue);
		this.socket.on("gdb_error", this.onError);
		this.socket.on("gdb_pause", this.onPause);

		this.editor = options.editor;

		this.editor.on("guttermousedown", this.onSetBreakpoint);

		$(".varView").removeClass("hide");

		this.tree = new YAHOO.widget.TreeView($("#varTree")[0]);
		this.tree.render();

		this.project.debug(function(err)
		{
			if (err) this.trigger("debugEnd");

		}.bind(this));

		// when the device is unplugged, stop debugging
		this.listenTo(this.device, "destroy", this.onEnd);
	},

	onSetBreakpoint: function(event)
	{
		var target = event.domEvent.target;
			
		if (target.className.indexOf("ace_gutter-cell") == -1) 
			return; 
		if (!event.editor.isFocused()) 
			return; 
		if (event.clientX > 25 + target.getBoundingClientRect().left) 
			return; 

		var row = event.getDocumentPosition().row;

		if (this.breakpoints[row]) 
		{
			this.editor.session.clearBreakpoint(row);
			delete this.breakpoints[row];
		}
		else 
		{
			this.editor.session.setBreakpoint(row);
			this.breakpoints[row] = true;
		}

		// rows are zero-indexed, lines are not
		var line = row + 1;	

		this.socket.emit("gdb_break", line);
		event.stop();
	},

	onData: function(data)
	{
		data = data.replace("\n", "<br>");
		this.messageView.append(data + "<br>");		
	},

	onUserPause: function()
	{
		if (this.isPaused) return;

		this.socket.emit("gdb_pause");

		this.setButtonLoading(".pauseButton", true);
	},	

	onPause: function()
	{
		this.setButtonLoading(".pauseButton", false);
		this.$(".pauseButton").attr("disabled", "disabled");
		this.$(".continueButton").setEnabled(true);
		this.isPaused = true;
	},

	setMarker: function(line)
	{
		var line = parseInt(line, 10);
        var row = line - 1;
		var range = new Range(row, 0, row, 100);

		this.clearMarker();

        this.breakPointMark = 
        	this.editor.session.addMarker(range, "ace_selection", "background");

        // if row isn't visible, scroll to it and center on it
        if (!this.editor.isRowVisible(row))
        {
        	this.editor.scrollToLine(row, true);
        }
	},

	clearMarker: function()
	{
        if (this.breakPointMark)
        {
            this.editor.session.removeMarker(this.breakPointMark);
            delete this.breakPointMark;
        }
	},

	onBreakpoint: function(data)
	{
		this.setMarker(data.line);
	},

	onContinue: function()
	{
		this.isPaused = false;
		this.clearMarker();
		this.clearSidebar();
		this.$(".continueButton").setEnabled(false);
		this.$(".pauseButton").setEnabled(true);
	},

	onUserContinue: function()
	{
		this.socket.emit("gdb_resume");
		this.onContinue();
	},

	onError: function(err)
	{
		alert(err);
		this.onEnd();
	},

	clearSidebar: function()
	{
		this.stack.reset();

		var root = this.tree.getRoot();
		this.tree.removeChildren(root);
		this.tree.render();
	},

	onVariables: function(variables)
	{
		// clear the tree of existing variables
		var root = this.tree.getRoot();
		this.tree.removeChildren(root);

		_.forEach(variables, function(variable)
		{
			var node = new YAHOO.widget.TextNode(
			{
				id: variable.name,
				label: this._printVar(variable)
			}, root);

			if (_.isArray(variable.value))
			{
				_.forEach(variable.value, function(subVar)
				{
					var subNode = new YAHOO.widget.TextNode(
					{
						id: variable.name + "." + subVar.name,
						label: this._printVar(subVar)
					}, node);

					if (subVar.resolvable)
					{
						subNode.setDynamicLoad(this.loadVariable);
					}

				}, this);
			}
		}, this);

		this.tree.render();
	},

	loadVariable: function(node, callback)
	{
		this.socket.emit("gdb_query", node.data.id, function(err, subVars)
		{
			if (err) 
			{
				alert(err);
				callback();
				return;
			}

			_.forEach(subVars, function(subVar)
			{
				var subNode = new YAHOO.widget.TextNode(
				{
					id: node.data.id + "." + subVar.name,
					label: this._printVar(subVar)
				}, node);
			}, this);

			callback();
			
		}.bind(this));
	},

	_printVar: function(variable)
	{
		return variable.name + 
			(_.isArray(variable.value) ? "" : ": " + variable.value) + 
			" ("+variable.type+")";
	},

	setButtonLoading: function(buttonName, isLoading)
	{
		this.$(".continueButton").setEnabled(!isLoading);
		this.$(".pauseButton").setEnabled(!isLoading);
		this.$(".endButton").setEnabled(!isLoading);

		this.$(buttonName).setLoading(isLoading);
	}
});

return DebugView;

});