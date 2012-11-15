if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var DeviceModel = Backbone.Model.extend(
	{
		initialize: function()
		{
			this.on("remove", this.onRemove, this);
		},

		onRemove: function()
		{
			this.trigger("destroy");
		}		
	});

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
