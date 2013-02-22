(function()
{

var badger = require("badger")(__filename),
	fs = require("fs"),
	utils = require("./utils"),
	ProjectCollection = require("./models/project-collection"),
	DeviceCollection = require("./models/device-collection"),
	SettingCollection = require("./models/setting-collection"),
	ProjectCollectionController = require("./controllers/project-collection"),
	ProjectController = require("./controllers/project"),
	FileController = require("./controllers/file"),
	SettingController = require("./controllers/setting-collection"),
	DeviceCollectionController = require("./controllers/device-collection"),
	DeviceController = require("./controllers/device"),
	GdbClient = require("./gdb-client"),
	socketIo = require("socket.io"),
	Side = require("sidestep");

function Core(server, config)
{
	console.assert(	config,
					"Must pass a configuration");

	console.assert( config.nodePort,
					"Must pass a node port setting");

	console.assert( config.mode || 
					(config.mode != "server" && config.mode != "app"),
					"Must have a mode (app or server)");

	this.server = server;
	this.config = config;
}

module.exports = Core;

Core.prototype =
{

init: function()
{
	badger.debug("initializing directories");
	this._initDirectories();

	var sockets = socketIo.listen(this.server);

	sockets.set("log level", 1);
	var devices, projects, settings;

	var step = new Side(this);

	step.define(
	function()
	{
		projects = new ProjectCollection(
			{ baseDir: utils.projectsDir() }, step.next);
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
	switch (this.config.mode)
	{
	case "app":
		this.settingsDir = utils.settingsDir();
		this.projectsDir = utils.projectsDir();
		break;
	}

	this._mkdirIfNotExist(this.projectsDir);
	this._mkdirIfNotExist(this.settingsDir);
},

_mkdirIfNotExist: function(dir)
{
	if (!fs.existsSync(dir))
	{
		fs.mkdirSync(dir);
	}
},

_onStop: function(project)
{
	this.gdbClient.stop();
}

}

}).call(this);