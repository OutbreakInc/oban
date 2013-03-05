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
	BuildState = require("app/models/build-state").Model,
	BuildStates = require("app/models/build-state").States,
	App = require("app/app"),
	q = require("q");

var ProjectView = Backbone.View.extend(
{
	el: "body",

	events:
	{
		"click .buildButton": "build",
		"click .runButton": "onRun",
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

		this.listenTo(this.devices, "reset", this.onDevicesReset);
		this.listenTo(this.devices, "add", this.pairProjectWithDevice);

		this.updateButtons();

		this.buildState = new BuildState();
	},

	// look for the first unused device and open it for the current project
	pairProjectWithDevice: function()
	{
		// if we're already paired with device, do nothing
		if (this.openDevice) return;

		// find first unused device
		var unusedDevice = this.devices.find(function(device)
		{
			return !(device.get("isOpenBy"));
		});

		// couldn't find an unused device, give up
		if (!unusedDevice)
		{
			this.updateButtons();
		}
		else
		{
			// assign this device to this client
			unusedDevice.open(function(err, device)
			{
				if (err) return alert(err);

				this.openDevice = device;
				this.listenTo(this.openDevice, "destroy", this.onProjectDeviceRemoved);

				this.updateButtons();

			}.bind(this));
		}
	},

	onDevicesReset: function()
	{
		if (this.openDevice)
		{
			this.stopListening(this.openDevice);
			delete this.openDevice;
		}

		this.pairProjectWithDevice();
	},

	onProjectDeviceRemoved: function()
	{
		this.stopListening(this.openDevice);
		delete this.openDevice;
		this.updateButtons();
	},

	onErrorClick: function(view, model)
	{
		var line = parseInt(model.get("line"), 10);

		this.editorView.highlightError(line);
	},

	// enable/disable flash and debug buttons based on if we have a device open
	updateButtons: function()
	{
		var haveDevice = !!(this.openDevice);

		this.$(".runButton").setEnabled(haveDevice);
		this.$(".debugButton").setEnabled(haveDevice);
	},

	// open the given file, set it as the active file, 
	// and create an editor view for it
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
				model: this.activeFile, 
				el: ".editorView",
				buildState: this.buildState
			});

			this.editorView.render();

		}.bind(this));
	},

	build: function()
	{
		var deferred = q.defer();

		this.setCompileErrors([]);
		
		this.editorView.clearError();
		this.progressView.setText("Building project...");
		this.progressView.setVisible(true);
		
		this.project.build(function(err, compileErrors)
		{
			var isSuccess = (!err && !compileErrors);
			
			mixpanel.track("project:build");
			this.progressView.setSuccess(isSuccess);
			this.progressView.setText(err || compileErrors ? 
				"Build failed" : "Build succeeded");
			this.progressView.setVisible(false);

			if (err)
			{
				deferred.reject(err);
			}
			else if (compileErrors)
			{
				deferred.reject("Compile errors");
				this.setCompileErrors(compileErrors);
			}
			else
			{
				deferred.resolve();
				this.buildState.set("state", BuildStates.NEEDS_FLASH);
			}

		}.bind(this));

		return deferred.promise;
	},

	onRun: function()
	{
		if (this.buildState.get("state") == BuildStates.NEEDS_BUILD)
		{
			this.build().then(this.run);
		}
		else
		{
			this.run();
		}
	},
	
	run: function()
	{
		var deferred = q.defer();

		this.progressView.setText("Flashing device...");
		this.progressView.setVisible(true);

		this.project.flash(this.openDevice.get("serialNumber"),
		function(err)
		{
			if (err)
			{
				err = "Flash error: " + err;

				mixpanel.track("project:flash failed");
				this.setCompileErrors([{ err: err }]);
			}

			mixpanel.track("project:flash");
			this.progressView.setSuccess(!err);
			
			this.progressView.setText(err ? 
				"Error flashing" : "Flashing succeeded");
			this.progressView.setVisible(false);

			if (err) deferred.reject(err);
			else 
			{
				this.buildState.set("state", BuildStates.READY_TO_DEBUG);
				setTimeout(deferred.resolve(), 1000);
			}

		}.bind(this));

		return deferred.promise;
	},

	onDebug: function()
	{
		var state = this.buildState.get("state");

		switch (this.buildState.get("state"))
		{
		case BuildStates.READY_TO_DEBUG:
			this.debug();
			break;

		case BuildStates.NEEDS_FLASH:
			this.run().then(this.debug);
			break;

		default:
			console.log("Warning: build state seems to be invalid, falling back to `NEEDS_BUILD`");
		case BuildStates.NEEDS_BUILD:
			this.build().then(this.run).then(this.debug);
			break;
		}
	},
	
	debug: function()
	{
		// disable editing code in debug view
		this.editorView.setEditable(false);

		// if flash succeeded, switch to debug view
		this.debugView = new DebugView(
		{
			model: this.project,
			editor: this.editorView.editor,
			device: this.openDevice,
			el: ".debugView"
		});

		this.$(".debugView").removeClass("hide");

		this.debugView.on("debugEnd", function()
		{
			mixpanel.track("project:debug");
			this.$(".debugView").addClass("hide");
			this.editorView.setEditable(true);

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

	close: function(callback)
	{
		mixpanel.track("project:close");

		this._closeDebugger();

		this._closeOpenDevices().then(
		function()
		{
			this._cleanUp();
			callback();
		}.bind(this),
		function(err)
		{
			this._cleanUp();
			callback(err);
		}.bind(this));
	},

	_closeDebugger: function()
	{
		if (this.debugView) this.debugView.onEnd();
	},

	_closeOpenDevices: function()
	{
		var deferred = q.defer();

		if (!this.openDevice) return deferred.resolve();

		this.openDevice.close(function(err)
		{
			if (err) deferred.reject(err);
			else deferred.resolve();	
		});

		return deferred.promise;
	},

	_cleanUp: function()
	{
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
