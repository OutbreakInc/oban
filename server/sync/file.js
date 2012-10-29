(function()
{

var winston = require("winston"),
	BackboneStore = require("../backbone-store"),
	FileStore = require("../file-store"),
	FileModel = require("../models/file");

module.exports = {};

module.exports.name = "File";

module.exports.load = function(backboneio)
{
	var File = backboneio.createBackend();

	var dataStore = new BackboneStore(FileModel, module.exports.name);

	dataStore.collection.bindToBackend(File);

	File.use(function(req, res, next)
	{
		winston.debug(req.backend);
		winston.debug(req.method);
		winston.debug(JSON.stringify(req.model));
		next();
	});

	File.use(dataStore.middleware());

	File.dataStore = dataStore;

	winston.debug("loaded sync module: "+module.exports.name);

	return File;
}

}).call(this);
