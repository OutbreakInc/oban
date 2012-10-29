(function()
{

var winston = require("winston"),
	BackboneStore = require("../backbone-store"),
	FileStore = require("../file-store"),
	DeviceModel = require("../models/device");

module.exports = {};

module.exports.name = "Device";

module.exports.load = function(backboneio)
{
	var Device = backboneio.createBackend();

	var dataStore = new BackboneStore(
		DeviceModel, module.exports.name, { dontSaveToFile: true });

	dataStore.collection.bindToBackend(Device);

	Device.use(function(req, res, next)
	{
		winston.debug(req.backend);
		winston.debug(req.method);
		winston.debug(JSON.stringify(req.model));
		next();
	});

	Device.use(dataStore.middleware());

	Device.dataStore = dataStore;

	winston.debug("loaded module: "+module.exports.name);

	return Device;
}

}).call(this);
