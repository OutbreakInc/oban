define(function(require) 
{

var App = {};

var $ = require("jquery"),
	_ = require("underscore"),
	Backbone = require("backbone"),
	YAHOO = require("yui/yahoo-dom-event"),
	ace = require("ace/ace"),
	io = require("socket.io");

require("ace/mode-c_cpp");

var Range = ace.require("ace/range").Range;

App.FileModel = require("app/models/file");
App.DeviceModel = require("app/models/device");
App.ProjectModel = require("app/models/project");
App.IdeModel = require("app/models/ide");

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
App.IdeCollection = Backbone.Collection.extend(
{
	backend: "Ide",
	model: App.IdeModel,

	initialize: function()
	{
		this.bindBackend();
	}
});

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

App.DebugView = Backbone.View.extend(
{
	events:
	{
		"click .continueButton": "onContinue",
		"click .pauseButton": "onPause"
	},

	initialize: function(options)
	{
		_.bindAll(this);

		this.messageView = this.$(".messageView");
		this.messageView.html("");
		this.socket = io.connect();

		var self = this;

		this.socket.on("gdb_message", this.onData);
		this.socket.on("gdb_break", this.onBreakpoint);
		this.socket.on("gdb_stack", this.onStack);
		this.socket.on("gdb_variables", this.onVariables);

		this.model.save("runStatus", "stop");
		this.model.save("runStatus", "start",
		{
			success: function(project, response)
			{
				self.$el.removeClass("hiddenView");
			}
		});

		this.editor = options.editor;
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
		this.socket.emit("gdb_command", "continue");
		this.clearMarker();
	},

	onStack: function(stack)
	{
		console.log("stack");
		console.log(stack);
	},

	onVariables: function(variables)
	{
		console.log("variables");
		console.log(variables);
	},

	onPause: function()
	{
		this.socket.emit("gdb_sigint");
	},

	unbindEvents: function()
	{
		this.socket.removeListener("gdb_message", this.onData);
	}
});

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

		this.collection = new App.IdeCollection;
		this.collection.fetch();

		this.collection.on("reset", this.setup);

		this.deviceListView = new App.DeviceListView(
		{
			el: ".devicesList",
			collection: App.Devices
		});

		App.Projects.on("add", this.addToProjectList);
		App.Projects.on("reset", this.addAllProjects);

		App.Files.on("add", this.addFile);
		App.Files.on("reset", this.addAll);

		// this.model.on("change", this.render);
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
		$(".runcontrols #runButton").click(this.run);
	},

	setup: function()
	{
		// set single instance of IDE model
		this.model = this.collection.at(0);

		// load currently active project
		var id = this.model.get("activeProject");

		if (id !== undefined)
		{
			this.activeProject = App.Projects.get(id);

			// load active project's first file
			App.Files.fetch();
			this.activeFile = App.Files.at(0);
		}
		else
		{
			// show welcome screen and list of projects
			// var view = new App.WelcomeView;
		}
	},

	verifyBuild: function()
	{
		// tell backend to compile the file
		this.activeProject.set("buildStatus", "verify");
		this.activeProject.save();
	},

	run: function()
	{
		if (this.debugView)
		{
			this.debugView.unbindEvents();
		}

		this.debugView = new App.DebugView({ 
			el: ".debugView", 
			model: this.activeProject,
			editor: this.editor });
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
		var projectName = prompt("Enter your project's name", "hello-world");

		if (projectName)
		{
			this.activeProject = App.Projects.create({ name: projectName }, { wait: true });
		}
	},

	openProject: function(project)
	{
		this.activeProject = project;
	},
	
	update: function()
	{
		console.log("derp");
	},

	addFile: function(file)
	{
		this.fileView = new App.FileView({ model: file, session: this.session });
		this.fileView.render();
	},

	addAll: function()
	{
		App.Files.each(this.addFile, this);
	}
});

App.ProjectView = Backbone.View.extend(
{
	initialize: function(options)
	{
		_.bindAll(this);

		this.session = options.session;

		this.model.on("change:buildStatus", this.onBuildStatus);

		this.session.on("change", this.save);		
	},

	onBuildStatus: function()
	{
		console.log("buildStatus");
		console.log(arguments);
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

		this.session.on("change", this.save);
	},

	render: function()
	{
		console.log("render");
		var text = this.model.toJSON().text;
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

	App.Projects.fetch();
	
	App.Editor = new App.EditorView({el: $(".editorView")});
});

});

