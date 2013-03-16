(function()
{

var badger = require("badger")(__filename),
	fs = require("fs"),
	dirs = require("./dirs"),
	ProjectCollection = require("./models/project-collection"),
	DeviceCollection = require("./models/device-collection"),
	SettingCollection = require("./models/setting-collection"),
	ProjectCollectionController = require("./controllers/project-collection"),
	ProjectController = require("./controllers/project"),
	FileController = require("./controllers/file"),
	SettingController = require("./controllers/setting-collection"),
	DeviceCollectionController = require("./controllers/device-collection"),
	DeviceController = require("./controllers/device"),
	socketIo = require("socket.io"),
	mkdirp = require("mkdirp"),
	Side = require("sidestep"),
	_ = require("underscore");

function Core(server, config)
{
	console.assert(	config,
					"Must pass a configuration");

	console.assert( config.nodePort,
					"Must pass a node port setting");

	this.server = server;
	this.config = config;

	_.bindAll(this);
}

module.exports = Core;

Core.prototype =
{

init: function()
{
	this._initDirectories()
		.then(this._initControllers)
		.then(this._initVersion).done();
},

_initControllers: function()
{
	var sockets = this.sockets = socketIo.listen(this.server);

	sockets.set("log level", 1);
	var devices, projects, settings;

	var step = new Side(this);

	step.define(
	function()
	{
		dirs.modules()
		.then(function(modulesDir)
		{
			projects = new ProjectCollection({ baseDir: modulesDir }, step.next);
		});
	},
	function(err)
	{
		devices = new DeviceCollection({}, step.next);
	},
	function(err)
	{
		settings = new SettingCollection(step.next);
	},
	function()
	{
		badger.debug("initializing controllers");
		var pcController = new ProjectCollectionController(projects, sockets);
		var projectController = new ProjectController(projects, devices, sockets);
		var fileController = new FileController(projects, sockets);
		var settingController = new SettingController(settings, sockets);
		var dcController = new DeviceCollectionController(devices, sockets);
		var deviceController = new DeviceController(devices, sockets);

		step.next();
	})
	.error(badger.error)
	.exec();
},

_initDirectories: function()
{
	badger.debug("initializing directories");

	return dirs.settings()
	.then(function(settingsDir)
	{
		this.settingsDir = settingsDir;
		this._mkdirIfNotExist(this.settingsDir);

		return dirs.modules();

	}.bind(this))
	.then(function(projectsDir)
	{
		this.projectsDir = projectsDir;
		this._mkdirIfNotExist(this.projectsDir);

	}.bind(this));
},

_mkdirIfNotExist: function(dir)
{
	if (!fs.existsSync(dir))
	{
		badger.debug("creating: " + dir);
		mkdirp.sync(dir);
	}
},

_initVersion: function()
{
	return dirs.ide()
	.then(function(dir)
	{
		console.log(dir);
		var version = require(dir + "/module.json").version;

		badger.debug("IDE version: " + version);

		var versionSocket = this.sockets.of("/version");

		versionSocket.on("connection", function(socket)
		{
			socket.on("version", function(callback)
			{
				callback(null, version);
			});
		});

	}.bind(this));
}

}

}).call(this);