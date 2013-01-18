define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	EditorView = require("app/views/editor"),
	File = require("app/models/file");

var ProjectView = Backbone.View.extend(
{
	initialize: function()
	{
		this.project = this.model;

		// this.deviceListView = new App.DeviceListView(
		// {
		// 	el: ".devicesList",
		// 	collection: App.Devices
		// });

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

		}.bind(this));
	},

	close: function()
	{
		this.editorView.close();
	}
});

return ProjectView;

});
