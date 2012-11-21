(function () 
{
var express = require("express"),
	app = express.createServer(),
	gdb = require("./gdb-hook"),
	DeviceServer = require("./device-server"),
	dataSync = require("./sync"),
	fs = require("fs"),
	utils = require("./utils"),
	winston = require("winston"),
	File = require("../client/models/file"),
	logging = require("./logging"),
	toolchain = require("./toolchain")

var GDB_SCRIPT = "demo.gdb";

logging.configure(winston);

app.listen(8000);

app.configure(function()
{
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.use(express.logger("dev"));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/../client"));
});

app.get("/", function(req, res)
{
	res.sendfile("client/IDE.html");
});

toolchain.init();
dataSync.load(app);

dataSync.socket.set("log level", 1);

var deviceServer = new DeviceServer;

deviceServer.run();

deviceServer.on("connect", function(id, name)
{
	dataSync.backends.Device.dataStore.collection.add({ deviceId: id, name: name });
	winston.debug("device connected (id: "+id+", name: "+name+")");
});

deviceServer.on("disconnect", function(id, name)
{
	var collection = dataSync.backends.Device.dataStore.collection;

	var model = collection.find(function(device)
	{
		return device.get("deviceId") == id;
	});

	collection.remove(model);
	winston.debug("device disconnected (id: "+id+", name: "+name+")");
});

// user should see list of projects, stored inside of Project.json
var projects = dataSync.backends.Project.dataStore.collection;
var files = dataSync.backends.File.dataStore.collection;

files.on("change", function()
{
	console.log(arguments);
});

files.on("add", function()
{
	console.log("add");
	console.log(arguments);
})

files.on("change:name", function(file)
{
	winston.debug("file rename event: " + file.get("name"));
});

files.on("change:text", function(file)
{
	winston.debug("file text change event!");

	var filePath = file.path();

	// TODO: add creation of path to where file is supposed to be saved
	fs.writeFile(filePath, file.get("text"), "utf8", 
		function(err)
	{
		if (err) return winston.error("Couldn't save file to " + filePath + "!");

		winston.debug("saved file to " + filePath);
	});
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

// when a new project is created
projects.on("add", function(project)
{
	project.set("path", utils.projectsDir() + "/" + project.get("name"));

	var file = new File({ 
		text: "#include <LPC1313.h>\n\nint main()\n{\n\treturn 0;\n}\n", 
		name: "main.cpp", 
		project: project.toJSON(),
		buildStatus: "unverified" });

	project.addFile(file.path());

	// set active files to new project's file
	files.reset([file]);
});

}).call(this);