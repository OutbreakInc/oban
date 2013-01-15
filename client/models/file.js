if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var FileModel = Backbone.Model.extend(
	{
		defaults:
		{
			buildStatus: "unverified"
		},

		validate: function(attrs)
		{
			if (!attrs.name) return "must have a name";
		}
	});

	FileModel.meta =
	{
		name: "File",
		options:
		{
			singleClient: true,
			dontSaveToFile: true
		}
	};

	return FileModel;
})
