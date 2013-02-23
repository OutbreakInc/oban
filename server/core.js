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
	mkdirp = require("mkdirp"),
	Side = require("sidestep");

function Core(server, config)
{
	console.assert(	config,
					"Must pass a configuration");

	console.assert( config.nodePort,
					"Must pass a node port setting");

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
		utils.projectsDir().then(function(dir)
		{
			projects = new ProjectCollection({ baseDir: dir }, step.next);
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
	this.settingsDir = utils.settingsDir();
	this.projectsDir = utils.projectsDir();

	this._mkdirIfNotExist(this.projectsDir);
	this._mkdirIfNotExist(this.settingsDir);
},

_mkdirIfNotExist: function(dir)
{
	if (!fs.existsSync(dir))
	{
		mkdirp.sync(dir);
	}
},

_onStop: function(project)
{
	this.gdbClient.stop();
}

}

}).call(this);