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

deviceServer.on("connect", function()
{
	winston.debug("device connected!");
});

}).call(this);