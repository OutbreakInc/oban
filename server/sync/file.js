(function()
{

var winston = require("winston");

module.exports = {};

module.exports.load = function(backboneio)
{
	var File = backboneio.createBackend();

	File.use(function(req, res, next)
	{
		winston.debug(req.backend);
		winston.debug(req.method);
		winston.debug(JSON.stringify(req.model));
		next();
	});

	File.use(backboneio.middleware.memoryStore());

	return File;
}

module.exports.name = "File";

}).call(this);