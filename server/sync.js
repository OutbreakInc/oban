(function()
{

var backboneio = require("backbone.io"),
	fs = require("fs"),
	winston = require("winston"),
	_ = require("underscore");

module.exports = {};

var backends = {};

module.exports.load = function(app)
{
	var syncFiles = fs.readdirSync(__dirname + "/sync");

	syncFiles = _.filter(syncFiles, function(file) 
	{ 
		return file.lastIndexOf(".js") == file.length - 3
	});

	syncFiles.forEach(function(syncFile)
	{
		var syncModule = require(__dirname + "/sync/" + syncFile);

		console.log(syncModule);

		var backend = syncModule.load(backboneio);

		backends[syncModule.name] = backend;
	});

	backboneio.listen(app, backends);

	winston.debug("Loaded sync module");
}

module.exports.backends = backends;

}).call(this);