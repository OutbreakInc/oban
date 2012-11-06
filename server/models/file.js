if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var FileModel = Backbone.Model.extend();

	FileModel.meta =
	{
		name: "File"
	};

	return FileModel;
})
