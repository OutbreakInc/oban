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
require("backbone.marionette");

var Range = ace.require("ace/range").Range;

App.FileModel = require("app/models/file");
App.DeviceModel = require("app/models/device");
App.ProjectModel = require("app/models/project");
App.DebuggerModel = require("app/models/debugger");
App.IdeModel = require("app/models/ide");
App.Templates = require("app/templates");

require("backbone.io");
require("yui/treeview-min");

////////////////////////////////////////////////////////////////

function idGen()
{
    var S4 = function()
    {
        return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
    };

    return (S4() + S4() + S4());
}

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
	backend:  { name: "File", channel: idGen() },
	model: App.FileModel,

	initialize: function()
	{
		this.bindBackend();
	},

	open: function(path)
	{
		this.create({  });

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

App.DebuggerCollection = Backbone.Collection.extend(
{
	backend: { name: "Debugger", channel: idGen() },
	model: App.DebuggerModel,

	initialize: function()
	{
		this.bindBackend();
	}
});

App.Debuggers = new App.DebuggerCollection;

App.Debuggers.on("reset", function(collection)
{
});

App.Debuggers.on("add", function(model, collection)
{
});

App.ProjectItemView = Backbone.Marionette.ItemView.extend(
{
	template: App.Templates.projectItem,
	tagName: "li",
	className: "projectListItem",

	events:
	{
		"click .openProjectBtn": "openProject"
	},

	openProject: function()
	{
		App.WelcomeApp.vent.trigger("project:open", this.model);
	}
});

App.ProjectListView = Backbone.Marionette.CompositeView.extend(
{
	template: App.Templates.projectList,
	className: "projectList span12",
	itemView: App.ProjectItemView,

	appendHtml: function(collectionView, itemView)
	{
		collectionView.$("ul").append(itemView.el);
	}
});

App.WelcomeApp = new Backbone.Marionette.Application();

App.WelcomeApp.addRegions({ mainRegion: ".welcomeView", projectList: ".welcomeView .projectList" });

App.WelcomeApp.addInitializer(function(options)
{
	var projectListView = new App.ProjectListView(
	{
		collection: options.projects,
	});

	App.WelcomeApp.projectList.show(projectListView);

	App.WelcomeApp.vent.on("project:open", function(project)
	{
		App.activeProject = project;

		App.projectView = new App.ProjectView({ model: project });
		App.statusBarView = new App.StatusBarView({ el: "body" });
	});

	App.WelcomeApp.vent.on("project:create", function(options)
	{
		App.Projects.create({ name: options.name });
	});
});

// views

App.DebugView = Backbone.View.extend(
{
	events:
	{
		"click .continueButton": "onUserContinue",
		"click .pauseButton": "onPause"
	},

	initialize: function(options)
	{
		_.bindAll(this);

		var tree = new YAHOO.widget.TreeView(document.getElementById("varTree"));
		tree.render();		

		this.messageView = this.$(".messageView");
		this.messageView.html("");
		this.socket = io.connect();

		this.stackView = new App.StackView({collection: App.stack});

		this.breakpoints = {};

		var self = this;

		this.socket.on("gdb_message", this.onData);
		this.socket.on("gdb_break", this.onBreakpoint);
		this.socket.on("gdb_stack", this.onStack);
		this.socket.on("gdb_variables", this.onVariables);
		this.socket.on("gdb_continue", this.onContinue);

		this.model.save("runStatus", "stop");
		this.model.save("runStatus", "start",
		{
			success: function(project, response)
			{
				self.$el.removeClass("hiddenView");
			}
		});

		this.editor = options.editor;

		this.editor.on("guttermousedown", this.onSetBreakpoint);

		$(".varView").removeClass("hiddenView");
		this.tree = new YAHOO.widget.TreeView(document.getElementById("varTree"));
		this.tree.render();
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

	onStack: function(stack)
	{
		App.stack.reset(stack);
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

App.StackFrameModel = Backbone.Model.extend(
{
});

App.StackCollection = Backbone.Collection.extend(
{
	model: App.StackFrameModel
});

App.stack = new App.StackCollection();

App.StatusBarView = Backbone.View.extend(
{
	events:
	{
		"click .buildButton": "build",
		"click .runButton": "run",
	},

	initialize: function()
	{
		this.$(".nav-collapse").removeAttr("hidden");
	},

	build: function()
	{
		// tell backend to compile the file
		App.activeProject.set("buildStatus", "verify");
		App.activeProject.save();
	},

	run: function()
	{
		if (App.debugView)
		{
			App.debugView.unbindEvents();
		}

		App.debugView = new App.DebugView({ 
			el: ".debugView",
			model: App.activeProject,
			editor: App.editorView.editor });
	}
});

App.ProjectView = Backbone.View.extend(
{
	initialize: function()
	{
		this.editorView = new App.EditorView({ model: this.model, el: ".editorView" });

		this.deviceListView = new App.DeviceListView(
		{
			el: ".devicesList",
			collection: App.Devices
		});

		App.activeProject = this.model;

		// check if project has any files
		if (App.activeProject.get("files").length === 0)
		{
			// show empty view saying this project has no files
		}
		else
		{
			// load active project's first file
			this.socket.emit("file:open", App.activeProject.get("files")[0], App.activeProject.toJSON());
		}
	}	
});

App.EditorView = Backbone.View.extend(
{
	initialize: function()
	{
		this.$el.removeAttr("hidden");

		this.editor = ace.edit(this.$(".documentView")[0]);

		_.bindAll(this);

		App.Projects.on("add", this.addToProjectList);
		App.Projects.on("reset", this.addAllProjects);

		App.Files.on("add", this.addFile);
		App.Files.on("reset", this.addAll);
		
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
	},

	setup: function()
	{
		// set single instance of IDE model
		this.model = this.collection.at(0);

		// load currently active project
		var id = this.model.get("activeProject");

		if (id !== undefined)
		{
			App.activeProject = App.Projects.get(id);

			// load active project's first file
			App.Files.fetch();
			App.activeFile = App.Files.at(0);
		}
		else
		{
			// show welcome screen and list of projects
			// var view = new App.WelcomeView;
		}
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

	render: function()
	{
		//this.$el.html(Handlebars.partials.login(this.model.toJSON()));
		var session = this.editor.getSession();		
	},

	createProject: function()
	{
		console.log("create");
		var projectName = prompt("Enter your project's name", "hello-world");

		if (projectName)
		{
			App.activeProject = App.Projects.create({ name: projectName }, { wait: true });
		}
	},

	openProject: function(project)
	{
		App.activeProject = project;
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
	Backbone.io.connect();

	App.Projects.fetch();

	// initially, only load the welcome view
	App.WelcomeApp.start({ projects: App.Projects });
});

});

