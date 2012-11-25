(function()
{

var backboneio = require("backbone.io"),
	fs = require("fs"),
	winston = require("winston"),
	BackboneStore = require("./backbone-store"),
	FileStore = require("./file-store"),	
	_ = require("underscore");

var MODELS_DIR = __dirname + "/../client/models/";

function DataSync(app)
{
	this.app = app;
	this.backends = {};
	this.collections = {};
}

module.exports = DataSync;

DataSync.prototype =
{

load: function()
{
	var modelFiles = fs.readdirSync(MODELS_DIR);

	modelFiles = _.filter(modelFiles, function(file) 
	{ 
		return file.lastIndexOf(".js") == file.length - 3
	});

	modelFiles.forEach(function(syncFile)
	{
		var model = require(MODELS_DIR + syncFile);
		var backend = this._loadModel(model);

		this.backends[model.meta.name] = backend;
		this.collections[model.meta.name] = backend.dataStore.collection;
	}, this);

	this.socket = backboneio.listen(this.app, this.backends);
},

_loadModel: function(model)
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

}

}).call(this);