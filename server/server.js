(function () 
{
var express = require("express"),
	app = express.createServer(),
	gdb = require("./gdb-hook"),
	DeviceServer = require("./device-server"),
	dataSync = require("./sync"),
	fs = require("fs"),
	winston = require("winston"),
	logging = require("./logging");

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
    app.use(express.static(__dirname + "/../client2"));
});

app.get("/", function(req, res)
{
	res.redirect("/IDE.html");
});

dataSync.load(app);

// io.set("log level", 1);

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

}).call(this);