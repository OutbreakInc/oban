define(function(require) 
{

var App = {};

var $ = require("jquery"),
	_ = require("underscore"),
	Backbone = require("backbone"),
	YAHOO = require("yui/yahoo-dom-event"),
	ace = require("ace/ace");

require("ace/mode-c_cpp");

App.FileModel = require("app/models/file");
App.DeviceModel = require("app/models/device");
App.ProjectModel = require("app/models/project");

require("backbone.io");
require("yui/treeview-min");

////////////////////////////////////////////////////////////////

Array.prototype.merge = function(appendage)
{
	var arr = appendage;
	arr.unshift(0);
	arr.unshift(appendage.length + 1);
	Array.prototype.splice.apply(this, arr);
	return(this);
}

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

// var Range = require("ace/range").Range;

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

// model/collections
App.EditorModel = Backbone.Model.extend();

App.ProjectCollection = Backbone.Collection.extend(
{
	backend: "Project",
	model: App.ProjectModel,

	initialize: function()
	{
		this.bindBackend();
	}
});

App.Projects = new App.ProjectCollection;

App.FileCollection = Backbone.Collection.extend(
{
	backend: "File",
	model: App.FileModel,

	initialize: function()
	{
		this.bindBackend();
	}
});

App.Files = new App.FileCollection;

App.DeviceCollection = Backbone.Collection.extend(
{
	backend: "Device",
	model: App.DeviceModel,

	initialize: function()
	{
		this.bindBackend();
	}
});

App.Devices = new App.DeviceCollection;

// views

App.EditorView = Backbone.View.extend(
{
	addToProjectList: function(project)
	{
	},

	addAllProjects: function()
	{
	},

	initialize: function()
	{
		_.bindAll(this);

		this.model = new App.EditorModel();

		this.deviceListView = new App.DeviceListView(
		{
			el: ".devicesList",
			collection: App.Devices
		});

		App.Projects.on("add", this.addToProjectList);
		App.Projects.on("reset", this.addAllProjects);

		App.Files.on("add", this.addFile);
		App.Files.on("reset", this.addAll);

		this.model.on("change", this.render);
		this.editor = ace.edit(this.$el.find(".documentView")[0]);
		
		this.editor.setTheme("ace/theme/chrome");
		
		this.el.style.fontSize = "11px";

		this.session = this.editor.getSession();		
		var ACECPlusPlusMode = ace.require("ace/mode/c_cpp").Mode;
		this.session.setMode(new ACECPlusPlusMode());
		
		setTimeout(_.bind(function()
		{
			console.log("Settings applied.");
			
			this.editor.setBehavioursEnabled(false);
			this.editor.setShowPrintMargin(false);
			this.editor.setHighlightActiveLine(false);
			this.editor.setSelectionStyle("line");
			this.editor.session.setUseSoftTabs(false);
			
		}, this), 100);	//this should be done when ACE emits an event that I don't yet know about
		
		this.editor.on("guttermousedown", this.toggleBreakpoint);

		$(".runcontrols #verifyButton").click(this.verifyBuild);
		// this.fileView.model.on("change:buildStatus", this.onBuildStatus);
	},

	verifyBuild: function()
	{
		// tell backend to compile the file
		this.fileView.model.set("buildStatus", "verify");
		this.fileView.model.save();
	},

	onBuildStatus: function(err)
	{
		// check arguments to see if file built successfully

		// if it didn't build successfully, highlight the lines that had issues

		// err:
		// compileErrors: [ { line: 5, message: "Unexpected identifier" }, ... ]

		// if err is null, compilation succeeded
		console.log(arguments);
	},

	toggleBreakpoint: function(e)
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
			// setBreakpoint(line, false);
		}
		else {
			e.editor.session.setBreakpoint(row);
			// setBreakpoint(line, true);
		}
		e.stop();	
	},

	render: function()
	{
		//this.$el.html(Handlebars.partials.login(this.model.toJSON()));
		var session = this.editor.getSession();
		
		// session.setValue("hello");	//this.model
	},

	events:
	{
		"change .documentView": "update",
		"click .settingsButton" : "createProject"
	},

	createProject: function()
	{
		console.log("create");
		this.activeProject = App.Projects.create({ name: "New Project" });
	},
	
	update: function()
	{
		console.log("derp");
	},

	addFile: function(file)
	{
		console.log(file);
		this.fileView = new App.FileView({ model: file, session: this.session });
		this.fileView.render();
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
		_.bindAll(this);

		this.session = options.session;

		this.model.on("change", this.render);
		this.model.on("destroy", this.remove);

		this.model.on("change:buildStatus", this.onBuildStatus);

		this.session.on("change", this.save);
	},

	onBuildStatus: function()
	{
		console.log("buildStatus");
		console.log(arguments);
	},

	render: function()
	{
		console.log("render");
		var text = this.model.toJSON().text;
		console.log(text);
		this.session.setValue(text, { renderCall: true });
		return this;
	},

	save: function(e)
	{
		// don't prompt a save if we called setValue
		// or else we'll end up in an infinite render/save loop
		if (e.flags && e.flags.renderCall) return;

		this.model.save({ "text": this.session.getValue() }, { silent: true });
	}
});

App.DeviceListView = Backbone.View.extend(
{
	initialize: function(options)
	{
		this.collection = options.collection;
		this.collection.bind("add", this.addOne, this);
		this.collection.bind("reset", this.addAll, this);

		this.collection.fetch();
	},

	addOne: function(device)
	{
		var view = new App.DeviceView({model: device});
		this.$el.append(view.render().el);
	},

	addAll: function()
	{
		this.$el.empty();
		this.collection.each(this.addOne.bind(this));
	}
});

App.DeviceView = Backbone.View.extend(
{
	initialize: function(options)
	{
		this.model.on("change", this.render, this);
		this.model.on("destroy", this.remove, this);
	},

	render: function()
	{
		var id = this.model.get("deviceId");
		var name = this.model.get("name");

		this.$el.html("<li>"+id+": "+name+"</li>");

		return this;
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

});

