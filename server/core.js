(function()
{

var winston = require("winston"),
	fs = require("fs"),
	utils = require("./utils"),
	toolchain = require("./toolchain"),
	ProjectCollection = require("./models/project-collection"),
	DeviceCollection = require("./models/device-collection"),
	ProjectCollectionController = require("./controllers/project-collection"),
	ProjectController = require("./controllers/project"),
	FileController = require("./controllers/file"),
	DeviceCollectionController = require("./controllers/device-collection"),
	GdbClient = require("./gdb-client"),
	socketIo = require("socket.io"),
	Side = require("sidestep");

function Core(app, config)
{
	console.assert(	config,
					"Must pass a configuration");

	console.assert( config.nodePort,
					"Must pass a node port setting");

	console.assert( config.mode || 
					(config.mode != "server" && config.mode != "app"),
					"Must have a mode (app or server)");

	this.app = app;
	this.config = config;
}

module.exports = Core;

Core.prototype =
{

init: function()
{
	winston.debug("initializing directories");
	this._initDirectories();

	var sockets = socketIo.listen(this.app);

	var devices, projects;

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
	function()
	{
		var pcController = new ProjectCollectionController(projects, sockets);
		var projectController = new ProjectController(projects, devices._deviceServer, sockets);
		var fileController = new FileController(projects, sockets);

		winston.debug("loading device server module");
		var dcController = new DeviceCollectionController(devices, sockets);

		step.next();
	})
	.error(function(err)
	{
		console.log("ERROR:");
		console.log(err);
	})
	.exec();


	// this._bindDeviceServerEvents();
	// this._bindFileEvents();
	// this._bindProjectEvents();
	// this._bindIdeEvents();

	// this._bindGdbEvents();

	// this._initIde();

	// this.gdbClient.run("/Users/exhaze/Documents/outbreak-ide/hello-world/BasicBlink.elf");
},

_initDirectories: function()
{
	switch (this.config.mode)
	{
	case "server":
		this.settingsDir = utils.settingsDirForPort(this.config.nodePort);
		this.projectsDir = utils.projectsDirForPort(this.config.nodePort);
		break;
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

_onBuildFinished: function(err, project, outputFile)
{
	if (err)
	{
		project.set("buildStatus", "errors");
		// return all error messages to frontend
		// also return lines where errors happened
	}
	else
	{
		project.set("buildStatus", "compiled");
		project.set("binary", outputFile);
	}
},

_onRun: function(project)
{
	// assume project is built for now, change this later
	// to build the project if it isn't built
	switch (project.get("buildStatus"))
	{
	case "compiled":
	{
		this.gdbClient.run(project.get("binary"), function(err)
		{
			if (err)
			{
				winston.error(err);
				project.set("runStatus", "stop");
			}
		});
	}
	}
},

_onStop: function(project)
{
	this.gdbClient.stop();
},

_bindProjectEvents: function()
{
	var files = this.dataSync.collections.File;
	var projects = this.dataSync.collections.Project;

	var self = this;

	projects.on("add", function(project)
	{
		var projectPath = self.projectsDir + "/" + project.get("name");

		project.set("path", projectPath);

		self._mkdirIfNotExist(projectPath);

		var file = new File({ 
			// text: "//#include <LPC1313.h>\n\nint main()\n{\n\treturn 0;\n}\n", 
			name: "main.cpp", 
			project: project.toJSON() });

		project.addFile(file.path());
	});

	projects.on("change:buildStatus", function(project)
	{
		winston.debug("build status changed for project: " + project.get("name"));

		winston.debug("build status: " + project.get("buildStatus"));
		console.log(project.toJSON());

		switch (project.get("buildStatus"))
		{
		case "verify":
		{
			toolchain.build(project,
				function(err, outputFile)
				{
					self._onBuildFinished(err, project, outputFile);
				});
			break;
		}

		}
	});

	projects.on("change:runStatus", function(project)
	{
		winston.debug("run status changed for project: " + project.get("name"));
		winston.debug("run status: " + project.get("runStatus"));

		switch (project.get("runStatus"))
		{
		case "start":
		{
			self._onRun(project);
			break;
		}
		case "stop":
		{
			self._onStop(project);
			break;
		}
		}		

	});
}

}

}).call(this);