if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var ProjectModel = Backbone.Model.extend(
	{
		defaults:
		{
			files: [],
		}

		initialize: function()
		{
			this.set("path", "/Users/projects/galago/" + this.get("name"));
		}

		validate: function(attrs)
		{
			// project requires: name
			if (!attrs.name) return "must have a name";
			if (!attrs.path) return "must have a path";
		},

		addFile: function(path)
		{
			this.get("files").push(path);
		}
	});

	ProjectModel.meta =
	{
		name: "Project"
	};

	return ProjectModel;
});
