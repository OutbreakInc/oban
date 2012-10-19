////////////////////////////////////////////////////////////////

Array.prototype.merge = function(appendage)
{
	var arr = appendage;
	arr.unshift(0);
	arr.unshift(appendage.length + 1);
	Array.prototype.splice.apply(this, arr);
	return(this);
}

Function.prototype.ob_bind = function(thisObj)
{
	var __method = this, args = Array.prototype.slice.call(arguments, 1);
	return(function(){Array.prototype.merge.call(arguments, args); return(__method.apply(thisObj, arguments));});
};

String.prototype.trim = function()
{
	var	str = String.prototype.replace.call(this, /^\s\s*/, ''), ws = /\s/, i = str.length;
	while(ws.test(String.prototype.charAt.call(str, --i)));
	return(String.prototype.slice.call(str, 0, i + 1));
};

String.prototype.padFront = function(length, char)
{
	var l = this.length;
	var s = this;
	if(char == undefined)	char = " ";
	if(length > l)
	{
		for(var i = 0; i < (length - l); i++)
			s = char + s;
	}
	return(s);
};

var Range = require("ace/range").Range;

Date.prototype.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
Date.prototype.toCompactString = function()
{
	var tzHours = (Date.prototype.getTimezoneOffset.call(this) / -60);
	return(		Date.prototype.getDate.call(this).toString().padFront(2, "0") +
				Date.prototype.months[Date.prototype.getMonth.call(this)] +
				Date.prototype.getFullYear.call(this) +
				"/" +
				Date.prototype.getHours.call(this).toString().padFront(2, "0") +
				Date.prototype.getMinutes.call(this).toString().padFront(2, "0") +
				Date.prototype.getSeconds.call(this).toString().padFront(2, "0") +
				((tzHours >= 0)? "+" : "") +
				tzHours
			);
};

//if(JSON == undefined){JSON = {"parse": function(str){return(eval("(" + str + ")"));}};}

////////////////////////////////

var App = {};

// state/collections
App.EditorState = Backbone.State.extend();
App.FileState = Backbone.State.extend({});

App.FileCollection = Backbone.Collection.extend(
{
	backend: "File",
	state: App.FileState,

	initialize: function()
	{
		this.bindBackend();
	}
});

App.Files = new App.FileCollection;

// views

App.EditorView = Backbone.View.extend(
{
	initialize: function()
	{
		this.state = new App.EditorState();

		App.Files.on("add", this.addFile, this);
		App.Files.on("reset", this.addAll, this);

		this.state.on("change", this.render, this);
		this.editor = ace.edit(this.$el.find(".documentView")[0]);
		
		this.editor.setTheme("ace/theme/chrome");
		
		this.el.style.fontSize = "11px";

		this.session = this.editor.getSession();
		
		var session = this.editor.getSession();
		var ACECPlusPlusMode = require("ace/mode/c_cpp").Mode;
		session.setMode(new ACECPlusPlusMode());
		
		setTimeout(function()
		{
			console.log("Settings applied.");
			
			this.editor.setBehavioursEnabled(false);
			this.editor.setShowPrintMargin(false);
			this.editor.setHighlightActiveLine(false);
			this.editor.setSelectionStyle("line");
			this.editor.session.setUseSoftTabs(false);
			
		}.ob_bind(this), 100);	//this should be done when ACE emits an event that I don't yet know about
		
		this.editor.on("guttermousedown", function(e)
		{
			var target = e.domEvent.target;
				
			if (target.className.indexOf("ace_gutter-cell") == -1) 
				return; 
			if (!e.editor.isFocused()) 
				return; 
			if (e.clientX > 25 + target.getBoundingClientRect().left) 
				return; 
			var row = e.getDocumentPosition().row;
			var line = row + 1;
			if( e.editor.session.getBreakpoints()[row] ) {
				e.editor.session.clearBreakpoint(row);
				setBreakpoint(line, false);
			}
			else {
				e.editor.session.setBreakpoint(row);
				setBreakpoint(line, true);
			}
			e.stop();
		});
	},

	render: function()
	{
		//this.$el.html(Handlebars.partials.login(this.state.toJSON()));
		var session = this.editor.getSession();
		
		// session.setValue("hello");	//this.state
	},

	events:
	{
		"change .documentView": "update",
		"click .settingsButton" : "createFile"
	},

	createFile: function()
	{
		console.log("create");
		App.Files.create({text: "#include <derp.txt>\n\n\n\n"});
	},
	
	update: function()
	{
		console.log("derp");
	},

	addFile: function(file)
	{
		var view = new App.FileView({ state: file, session: this.session });
		view.render();
	},

	addAll: function()
	{
		App.Files.each(this.addFile, this);
	}
});

App.FileView = Backbone.View.extend(
{
	initialize: function(options)
	{
		this.session = options.session;

		this.state.on("change", this.render, this);
		this.state.on("destroy", this.remove, this);

		this.session.on("change", this.save.ob_bind(this));
	},

	render: function()
	{
		console.log("render");
		var text = this.state.toJSON().text;
		console.log(text);
		this.session.setValue(text, { renderCall: true });
		return this;
	},

	save: function(e)
	{
		if (e.flags && e.flags.renderCall)
		{
			console.log("OMG IT WORKS");
		}
		else
		{
			console.log("App.FileView.save");
			console.log(e);
			this.state.save({ "text": this.session.getValue() }, { silent: true });
		}
	}
});

function updateLocalVariables(tree, variables)
{
	var root = tree.getRoot();
	tree.removeChildren(root);
	
	for(var i = 0; i < variables.length; i++)
	{
		var contents = {label: variables[i]};
		
		var node = new YAHOO.widget.TextNode({label: variables[i]}, root);
	}
}

$(document).ready(function()
{
	var tree = new YAHOO.widget.TreeView(document.getElementById("varTree"));
	tree.render();

	Backbone.io.connect();

	App.Files.fetch();
	
	App.Editor = new App.EditorView({el: $(".editorView")});
});
