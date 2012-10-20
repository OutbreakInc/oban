(function()
{

var backboneio = require("backbone.io"),
	fs = require("fs"),
	winston = require("winston");

module.exports = {};

var backends = {};

module.exports.load = function(app)
{
	var syncFiles = fs.readdirSync(__dirname + "/sync");

	syncFiles.forEach(function(syncFile)
	{
		var syncModule = require(__dirname + "/sync/" + syncFile);

		var backend = syncModule.load(backboneio);

		backends[syncModule.name] = backend;
	});

	backboneio.listen(app, backends);

	winston.debug("Loaded sync module");
}

module.exports.backends = backends;

}).call(this);