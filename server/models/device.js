if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
	var Backbone = require("backbone");

	var DeviceState = Backbone.Model.extend();

	return DeviceState;
})
