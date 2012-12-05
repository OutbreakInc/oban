(function()
{

var winston = require("winston"),
	fs = require("fs"),
	utils = require("./utils"),
	DataSync = require("./sync"),
	DeviceServer = require("./device-server"),
	toolchain = require("./toolchain"),
	File = require("../client/models/file"),
	Gdb = require("./gdb-client");

function Core(app)
{
	this.app = app;
}

module.exports = Core;

Core.prototype =
{

init: function()
{
	winston.debug("initializing directories");
	this._initDirectories();

	winston.debug("loading data sync module");
	this.dataSync = new DataSync(this.app);
	this.dataSync.load();

	// this.dataSync.socket.set("log level", 1);

	this.socket = this.dataSync.socket;

	winston.debug("loading device server module");

	this.deviceServer = new DeviceServer;
	this.deviceServer.run();

	this.gdb = new Gdb("gdb");

	this._bindDeviceServerEvents();
	this._bindFileEvents();
	this._bindProjectEvents();
	this._bindIdeEvents();

	this._bindGdbEvents();

	this._initIde();
},

_initDirectories: function()
{
	this._mkdirIfNotExist(utils.projectsDir());
	this._mkdirIfNotExist(utils.settingsDir());
},

_initIde: function()
{
	var ides = this.dataSync.collections.Ide;
	var projects = this.dataSync.collections.Project;
	var files = this.dataSync.collections.File;

	if (ides.length === 0)
	{
		if(projects.length === 0)
		{
			debugger;
			projects.add({name: "Untitled"});
		}
		
		ides.add({ activeProject: projects.at(0).id });
	}

	var ide = ides.at(0);

	var project = projects.get(ide.get("activeProject"));

	var filePath = project.get("files")[0];
	var fileName = filePath.slice(filePath.lastIndexOf("/") + 1);

	var file = new File({
		name: fileName, 
		project: project.toJSON() });

	// set active files to new project's file
	files.reset([file]);
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

	function loadFile(file)
	{
		// sync with existing file on disk, if possible
		if (fs.existsSync(file.path()))
		{
			winston.debug("restoring " + file.path() + " from file");
			self._readFile(file);
		}
		else
		{
			self._saveFile(file);	
		}
	}

	files.on("reset", function()
	{
		console.log("reset");
		files.forEach(loadFile);
	});

	files.on("change", function()
	{
		// console.log(arguments);
	});

	files.on("add", loadFile);

	files.on("change:name", function(file)
	{
		winston.debug("file rename event: " + file.get("name"));
	});

	files.on("change:text", function(file)
	{
		winston.debug("file text change event!");
		self._saveFile(file);
	});
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
		this.gdb.run(project.get("binary"));
	}
	}
},

_onStop: function(project)
{
	this.gdb.stop();
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
			// text: "//#include <LPC1313.h>\n\nint main()\n{\n\treturn 0;\n}\n", 
			name: "main.cpp", 
			project: project.toJSON() });

		project.addFile(file.path());

		// set active files to new project's file
		files.reset([file]);
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
		console.log(project.toJSON());

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
},

_bindIdeEvents: function()
{

},

_bindGdbEvents: function()
{
	var self = this;

	// todo: support multiple clients attaching to GDB
	this.socket.on("connection", function(client)
	{
		console.log("ATTACH");
		self.gdb.attachClient(client);
	});
},

_readFile: function(file)
{
	var filePath = file.path();

	fs.readFile(filePath, "utf8",
		function(err, data)
	{
		if (err) return winston.error("Couldn't read file from " + filePath + "!");

		file.set("text", data);
	});	
},

_saveFile: function(file)
{
	var filePath = file.path();

	fs.writeFile(filePath, file.get("text"), "utf8", 
		function(err)
	{
		if (err) return winston.error("Couldn't save file to " + filePath + "!");

		winston.debug("saved file to " + filePath);
	});	
}

}

}).call(this);