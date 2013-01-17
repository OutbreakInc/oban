define(function(require)
{

var Backbone = require("backbone"),
	EditorView = require("app/views/editor"),
	File = require("app/models/file");

var ProjectView = Backbone.View.extend(
{
	initialize: function()
	{
		this.project = this.model;
		this.editorView = new App.EditorView({ model: this.model, el: ".editorView" });

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


			this.socket.emit("file:open", App.activeProject.get("files")[0], App.activeProject.toJSON());
		}
	}	
});

return ProjectView;

});