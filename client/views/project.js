define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	EditorView = require("app/views/editor"),
	DeviceListView = require("app/views/device-list"),
	ProgressView = require("app/views/progress"),
	File = require("app/models/file"),
	DeviceCollection = require("app/models/device-collection"),
	App = require("app/app");

var ProjectView = Backbone.View.extend(
{
	el: "body",

	events:
	{
		"click .buildButton": "onBuild",
		"click .runButton": "onRun"
	},

	initialize: function(options)
	{
		this.project = this.model;

		this.devices = options.devices;

		this.deviceListView = new DeviceListView(
		{
			collection: this.devices
		});

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
	},

	openFile: function(fileName)
	{
		this.project.openFile(fileName, function(err, file)
		{
			if (err) return alert(err);

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
		this.progressView.setVisible(true);
		this.progressView.setText("Building project...");

		this.project.build(function(err)
		{
			this.progressView.setSuccess(!err);
			this.progressView.setVisible(false);
			this.progressView.setText(err ? 
				"Build failed" : "Build succeeded");

			if (err) return App.error(err);

		}.bind(this));
	},

	onRun: function()
	{
		this.progressView.setVisible(true);
		this.progressView.setText("Flashing device...");

		// hack
		this.project.flash(function(err)
		{
			this.progressView.setSuccess(!err);
			this.progressView.setVisible(false);
			this.progressView.setText(err ? 
				"Error flashing" : "Flashing succeeded");

			if (err) return App.error(err);

		}.bind(this));
	},

	close: function()
	{
		this.editorView.close();
		this.deviceListView.close();
		this.undelegateEvents();
		this.stopListening();
	}
});

return ProjectView;

});
