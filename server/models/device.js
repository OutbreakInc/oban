if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var DeviceModel = Backbone.Model.extend();

	DeviceModel.meta =
	{
		name: "Device",
		options:
		{
			dontSaveToFile: true
		}
	};

	return DeviceModel;
})
