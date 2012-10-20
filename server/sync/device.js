(function()
{

var winston = require("winston");

module.exports = {};

module.exports.load = function(backboneio)
{
	var Device = backboneio.createBackend();

	Device.use(function(req, res, next)
	{
		winston.debug(req.backend);
		winston.debug(req.method);
		winston.debug(JSON.stringify(req.model));
		next();
	});

	Device.use(backboneio.middleware.memoryStore());

	return Device;
}

module.exports.name = "Device";

}).call(this);