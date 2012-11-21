(function()
{

var winston = require("winston"),
	fs = require("fs"),
	utils = require("./utils"),
	DataSync = require("./sync"),
	DeviceServer = require("./device-server"),
	toolchain = require("./toolchain"),
	File = require("../client/models/file");

function Core(app)
{
	this.app = app;
}

module.exports = Core;

Core.prototype =
{

init: function()
{
	winston.debug("initializng directories");
	this._initDirectories();

	winston.debug("loading data sync module");
	this.dataSync = new DataSync(this.app);
	this.dataSync.load();
	// this.dataSync.socket.set("log level", 1);

	winston.debug("loading device server module");

	this.deviceServer = new DeviceServer;
	this.deviceServer.run();

	this._bindDeviceServerEvents();
	this._bindFileEvents();
	this._bindProjectEvents();
},

_initDirectories: function()
{
	this._mkdirIfNotExist(utils.projectsDir());
	this._mkdirIfNotExist(utils.settingsDir());
},

_mkdirIfNotExist: function(dir)
{
	if (!fs.existsSync(dir))
	{
		fs.mkdirSync(dir);
	}
},

_bindDeviceServerEvents: function()
{
	var devices = this.dataSync.collections.Device;

	this.deviceServer.on("connect", function(id, name)
	{
		devices.add({ deviceId: id, name: name });
		winston.debug("device connected (id: "+id+", name: "+name+")");
	});

	this.deviceServer.on("disconnect", function(id, name)
	{
		var model = devices.find(function(device)
		{
			return device.get("deviceId") == id;
		});

		devices.remove(model);
		winston.debug("device disconnected (id: "+id+", name: "+name+")");
	});
},

_bindFileEvents: function()
{
	var files = this.dataSync.collections.File;
	var projects = this.dataSync.collections.Project;

	var self = this;

	files.on("reset", function()
	{
		console.log("reset");

		files.forEach(function(file)
		{
			console.log("saving " + file.get("name"));
			self._saveFile(file);
		});
	});

	files.on("change", function()
	{
		console.log(arguments);
	});

	files.on("add", function()
	{
		console.log("add");
		console.log(arguments);
		self._saveFile(file);
	});

	files.on("change:name", function(file)
	{
		winston.debug("file rename event: " + file.get("name"));
	});

	files.on("change:text", function(file)
	{
		winston.debug("file text change event!");
		self._saveFile(file);
	});

	files.on("change:buildStatus", function(file)
	{
		winston.debug("build status changed for file: " + file.get("name"));

		var project = projects.get(file.get("project").id);

		winston.debug("build status: " + file.get("buildStatus"));
		console.log(project.toJSON());

		switch (file.get("buildStatus"))
		{
		case "verify":
		{
			toolchain.build(
				[file.path()], 
				file.get("name"),
				project.get("path"));
		}

		}

		file.set("buildStatus", "compiled");
	});	
},

_bindProjectEvents: function()
{
	var files = this.dataSync.collections.File;
	var projects = this.dataSync.collections.Project;

	var self = this;

	projects.on("add", function(project)
	{
		var projectPath = utils.projectsDir() + "/" + project.get("name");

		project.set("path", projectPath);

		self._mkdirIfNotExist(projectPath);

		var file = new File({ 
			text: "//#include <LPC1313.h>\n\nint main()\n{\n\treturn 0;\n}\n", 
			name: "main.cpp", 
			project: project.toJSON() });

		project.addFile(file.path());

		// set active files to new project's file
		files.reset([file]);
	});
},

_saveFile: function(file)
{
	var filePath = file.path();

	// TODO: add creation of path to where file is supposed to be saved
	fs.writeFile(filePath, file.get("text"), "utf8", 
		function(err)
	{
		if (err) return winston.error("Couldn't save file to " + filePath + "!");

		winston.debug("saved file to " + filePath);
	});	
}

}

}).call(this);