(function()
{

var backboneio = require("backbone.io"),
	fs = require("fs"),
	winston = require("winston"),
	BackboneStore = require("./backbone-store"),
	BackboneMultiStore = require("./backbone-multi-store"),
	FileStore = require("./file-store"),	
	_ = require("underscore");

var MODELS_DIR = __dirname + "/../client/models/";

function DataSync(app, path)
{
	this.app = app;
	this.path = path;
	this.backends = {};
	this.collections = {};
}

module.exports = DataSync;

DataSync.prototype =
{

// loads the data syncer with persistence of its settings to the specified path
load: function(path)
{
	var modelFiles = fs.readdirSync(MODELS_DIR);

	modelFiles = _.filter(modelFiles, function(file) 
	{ 
		return file.lastIndexOf(".js") == file.length - 3
	});

	var options = { path: this.path };

	modelFiles.forEach(function(syncFile)
	{
		var model = require(MODELS_DIR + syncFile);
		var backend = this._loadModel(model, options);

		this.backends[model.meta.name] = backend;
		this.collections[model.meta.name] = backend.dataStore.collection;
	}, this);

	this.socket = backboneio.listen(this.app, this.backends);
},

unload: function()
{
	this.socket.close();
},

_loadModel: function(model, options)
{
	var backend = backboneio.createBackend();

	var options = _.extend(_.clone(options), model.meta.options);

	console.log(model.meta);

	var dataStore;

	if (options.singleClient)
	{
		dataStore = new BackboneMultiStore(model, model.meta.name, options);
	}
	else
	{
		dataStore = new BackboneStore(model, model.meta.name, options);
		dataStore.collection.bindToBackend(backend);
	}

	backend.use(dataStore.middleware(backend));
	backend.dataStore = dataStore;

	winston.debug("loaded module: "+model.meta.name);

	return backend;
}

}

}).call(this);