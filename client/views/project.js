define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	EditorView = require("app/views/editor"),
	DebugView = require("app/views/debug"),
	DeviceListView = require("app/views/device-list"),
	ProjectNameView = require("app/views/project-name"),
	ProgressView = require("app/views/progress"),
	ErrorListView = require("app/views/error-list"),
	File = require("app/models/file"),
	DeviceCollection = require("app/models/device-collection"),
	ErrorCollection = require("app/models/error-collection"),
	App = require("app/app");

var ProjectView = Backbone.View.extend(
{
	el: "body",

	events:
	{
		"click .buildButton": "onBuild",
		"click .flashButton": "onFlash",
		"click .debugButton": "onDebug",
		"click .removeButton": "onRemove"
	},

	initialize: function(options)
	{
		_.bindAll(this);

		this.project = this.model;

		this.devices = options.devices;

		this.deviceListView = new DeviceListView(
		{
			collection: this.devices
		});

		this.projectNameView = new ProjectNameView(
		{
			model: this.project
		});

		this.$(".settingsList").append(this.projectNameView.render().el);
		this.$(".devicesView").append(this.deviceListView.render().el);

		// check if project has any files
		if (this.project.get("files").length === 0)
		{
			// show empty view saying this project has no files
		}
		else
		{
			// load active project's first file
			var fileName = this.project.get("files")[0].name;
			this.openFile(fileName);
		}

		this.devices.fetch();

		this.progressView = new ProgressView({ el: ".progressView" });

		this.errors = new ErrorCollection();

		this.errorListView = new ErrorListView(
		{
			collection: this.errors
		});

		this.errorListView.on("error:click", this.onErrorClick);

		$(".errorsView").append(this.errorListView.render().el);
	},

	onErrorClick: function(view, model)
	{
		var line = parseInt(model.get("line"), 10);

		this.editorView.highlightError(line);
	},

	openFile: function(fileName)
	{
		this.project.openFile(fileName, function(err, file)
		{
			if (err) return alert(err);
			
			mixpanel.track("project file: open");
			file.project = this.project;

			this.activeFile = new File(file);

			this.editorView = new EditorView(
			{ 
				model: this.activeFile, el: ".editorView" 
			});

			this.editorView.render();

		}.bind(this));
	},

	onBuild: function()
	{
		this.setCompileErrors([]);

		this.progressView.setVisible(true);
		this.progressView.setText("Building project...");

		this.project.build(function(err, compileErrors)
		{
			console.log(compileErrors);
			
			mixpanel.track("project:build");
			this.progressView.setSuccess(!err && !compileErrors);
			this.progressView.setVisible(false);
			this.progressView.setText(err || compileErrors ? 
				"Build failed" : "Build succeeded");

			if (err)
			{
				mixpanel.track("Build failed");
				return App.error(err);
			}
			else if (compileErrors)
			{
				console.log(JSON.stringify(compileErrors))
				
					this.setCompileErrors(compileErrors);
				// mixpanel.track("Compile failed" + JSON.stringify(compileErrors), JSON.stringify(compileErrors), function()
				// 				{
				// 				}.bind(this));
			}
		}.bind(this));
	},

	onFlash: function()
	{
		this.progressView.setVisible(true);
		this.progressView.setText("Flashing device...");

		// hack
		this.project.flash(function(err)
		{
			mixpanel.track("project:flash");
			this.progressView.setSuccess(!err);
			this.progressView.setVisible(false);
			this.progressView.setText(err ? 
				"Error flashing" : "Flashing succeeded");

			if (err)
			{
				mixpanel.track("project:flash failed");
				return App.error(err);
			} 
		}.bind(this));
	},

	onDebug: function()
	{
		// if flash succeeded, switch to debug view
		this.debugView = new DebugView(
		{
			model: this.project,
			editor: this.editorView.editor,
			el: ".debugView"
		});

		this.$(".debugView").removeClass("hide");

		this.debugView.on("debugEnd", function()
		{
			mixpanel.track("project:debug");
			this.$(".debugView").addClass("hide");
		}.bind(this));
	},
	
	onRemove: function()
	{
		var confirmDialog = confirm("Are you sure you want to remove this project?");
		if (confirmDialog == true)
		{
			App.vent.trigger("closeProject");
			this.project.destroy(function(err)
			{
				if (err)
				{
					mixpanel.track("project:remove failed");
					return App.error(err);
				}
			}.bind(this));
		}
		else
		{
		  return false;
		}
	},

	setCompileErrors: function(errors)
	{
		this.errors.reset(errors);
	},

	close: function()
	{
		mixpanel.track("project: close");
		this.editorView.close();
		this.deviceListView.close();
		this.projectNameView.remove();
		this.errorListView.close();
		this.undelegateEvents();
		this.stopListening();
	}
});

return ProjectView;

});
