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
		this.goBuild(function(){}, function(){});
	},

	goBuild: function(updateUI, callback)
	{
		this.setCompileErrors([]);
		
		this.editorView.clearError();
		this.progressView.setText("Building project...");
		this.progressView.setVisible(true, function(){});
		
		this.project.build(function(err, compileErrors)
		{
			console.log(compileErrors);

			var isSuccess = (!err && !compileErrors);
			
			mixpanel.track("project:build");
			this.progressView.setSuccess(isSuccess);
			this.progressView.setText(err || compileErrors ? 
				"Build failed" : "Build succeeded");
			this.progressView.setVisible(false, updateUI);
			
			if (compileErrors)
			{
				this.setCompileErrors(compileErrors);
			}
			else
			{
				this.editorView.clearDirty();
			}
			
			callback();

		}.bind(this));
	},

	onFlash: function()
	{
		//isDirty checks if the editor has changed, and thus needs to be rebuilt before flashing
		if(this.editorView.isDirty())
		{
			//todo: a bit of a hack to wait for the "build succeeded" progressview to fade away before changing the text
			//to "flashing device"
			this.goBuild(function()
			{
				this.progressView.setText("Flashing device...");
				this.progressView.setVisible(true, function(){});
			}.bind(this),function()
			{
				this.goFlash(function(){},function(){});
			}.bind(this));
		}
		else
		{
			this.progressView.setText("Flashing device...");
			this.progressView.setVisible(true, function(){});			
			this.goFlash(function(){});
		}
	},
	
	goFlash: function(callback)
	{
		if(!this.errors.length > 0)
		{
			// hack
			this.project.flash(function(err)
			{
				if (err)
				{
					mixpanel.track("project:flash failed");
					return App.error(err);
				}

				mixpanel.track("project:flash");
				this.progressView.setSuccess(!err);
				
				this.progressView.setText(err ? 
					"Error flashing" : "Flashing succeeded");
				this.progressView.setVisible(false, callback);

			}.bind(this));
		}
		else
		{
			$(".errorList").highlight();
		}
	},

	onDebug: function()
	{
		//isDirty checks if the editor has changed, and thus needs to be rebuilt and reflashed before debugging
		if(this.editorView.isDirty())
		{
			this.goBuild(function()
			{
				this.progressView.setText("Flashing device...");
				this.progressView.setVisible(true, function(){});
			}.bind(this),function()
			{
				this.goFlash(function()
				{
					this.goDebug();
				}.bind(this));
			}.bind(this));
		}
		else
		{
			this.goDebug();
		}
	},
	
	goDebug: function()
	{
		if(!this.errors.length > 0)
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
		}
		else
		{
			$(".errorList").highlight();
		}
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
				mixpanel.track("project:removed");
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
