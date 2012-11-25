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
		},

		validate: function(attrs)
		{
			if (!attrs.name) return "must have a name";
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
