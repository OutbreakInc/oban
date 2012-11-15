if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var FileModel = Backbone.Model.extend(
	{
		path: function()
		{
			if (!this.get("project"))
			{
				console.log(this.toJSON());
				console.log("file doesn't have a project associated with it:");
				return;
			}

			return this.get("project").path + "/" + this.get("name");
		}
	});

	FileModel.meta =
	{
		name: "File"
	};

	return FileModel;
})
