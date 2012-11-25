(function () 
{
var express = require("express"),
	app = express.createServer(),
	gdb = require("./gdb-hook"),
	fs = require("fs"),
	utils = require("./utils"),
	winston = require("winston"),
	File = require("../client/models/file"),
	logging = require("./logging"),
	toolchain = require("./toolchain"),
	Core = require("./core");

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

var core = new Core(app);
core.init();

}).call(this);