if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var IdeModel = Backbone.Model.extend(
	{
	});

	IdeModel.meta =
	{
		name: "Ide"
	};

	return IdeModel;
});
