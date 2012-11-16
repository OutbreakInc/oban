(function()
{

var backboneio = require("backbone.io"),
	fs = require("fs"),
	winston = require("winston"),
	BackboneStore = require("./backbone-store"),
	FileStore = require("./file-store"),	
	_ = require("underscore");

module.exports = {};

var backends = {};

var MODELS_DIR = __dirname + "/../client/models/";

module.exports.load = function(app)
{
	var modelFiles = fs.readdirSync(MODELS_DIR);

	modelFiles = _.filter(modelFiles, function(file) 
	{ 
		return file.lastIndexOf(".js") == file.length - 3
	});

	modelFiles.forEach(function(syncFile)
	{
		var model = require(MODELS_DIR + syncFile);
		var backend = loadModel(model);

		backends[model.meta.name] = backend;
	});

	backboneio.listen(app, backends);

	winston.debug("Loaded sync module");
}

function loadModel(model)
{
	var backend = backboneio.createBackend();

	var dataStore = new BackboneStore(
		model, model.meta.name, model.meta.options);

	dataStore.collection.bindToBackend(backend);

	backend.use(dataStore.middleware());
	backend.dataStore = dataStore;

	winston.debug("loaded module: "+model.meta.name);

	return backend;
}

module.exports.backends = backends;

}).call(this);