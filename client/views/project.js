define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	EditorView = require("app/views/editor"),
	DeviceListView = require("app/views/device-list"),
	File = require("app/models/file"),
	DeviceCollection = require("app/models/device-collection");

var ProjectView = Backbone.View.extend(
{
	initialize: function()
	{
		this.project = this.model;

		this.devices = new DeviceCollection();

		this.deviceListView = new DeviceListView(
		{
			el: ".devicesList",
			collection: this.devices
		});

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

	close: function()
	{
		this.editorView.close();
	}
});

return ProjectView;

});
