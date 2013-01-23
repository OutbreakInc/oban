define(function(require)
{

var Backbone = require("backbone"),
	App = require("app/app"),
	StackListView = require("app/views/stack-list"),
	StackCollection = require("app/models/stack-collection"),
	YAHOO = require("yui/yahoo-dom-event"),
	ace = require("ace/ace"),
	Range = ace.require("ace/range").Range;	

require("yui/treeview-min");	

var DebugView = Backbone.View.extend(
{
	events:
	{
		"click .continueButton": "onUserContinue",
		"click .pauseButton": "onPause"
	},

	initialize: function(options)
	{
		_.bindAll(this);

		this.messageView = $(".messageView");
		this.messageView.html("");
		this.project = this.model;
		this.socket = this.project.socket;

		this.stack = new StackCollection({ socket: this.socket });

		this.stackListView = new StackListView({ collection: this.stack });
		this.$(".callstackView").append(this.stackListView.render().el);

		this.breakpoints = {};

		var self = this;

		this.socket.on("gdb_message", this.onData);
		this.socket.on("gdb_break", this.onBreakpoint);
		this.socket.on("gdb_variables", this.onVariables);
		this.socket.on("gdb_continue", this.onContinue);

		this.editor = options.editor;

		this.editor.on("guttermousedown", this.onSetBreakpoint);

		$(".varView").removeClass("hide");
		this.tree = new YAHOO.widget.TreeView($("#varTree")[0]);
		this.tree.render();

		this.project.debug(function(err)
		{
			if (err)
			{
				this.trigger("debugEnd");
			}

		}.bind(this));
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

	setMarker: function(line)
	{
		var line = parseInt(line, 10);
        var row = line - 1;
		var range = new Range(row, 0, row, 100);

		this.clearMarker();

        this.breakPointMark = 
        	this.editor.session.addMarker(range, "ace_selection", "background");
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
		this.clearMarker();
	},

	onUserContinue: function()
	{
		this.socket.emit("gdb_resume");
		this.clearMarker();
	},

	onVariables: function(variables)
	{
		console.log("variables");
		console.log(variables);

		var root = this.tree.getRoot();
		this.tree.removeChildren(root);

		for (var i = 0; i < variables.length; ++i)
		{
			var variable = variables[i];

			var node = new YAHOO.widget.TextNode({ 
				label: variable.name + ": " + variable.value + " ("+variable.type+")"
			}, root);
		}

		this.tree.render();
	},

	onPause: function()
	{
		this.socket.emit("gdb_pause");
	},

	unbindEvents: function()
	{
		this.socket.removeListener("gdb_message", this.onData);
	}
});

return DebugView;

});