(function () 
{
var express = require("express"),
	app = express.createServer(),
	io = require("socket.io").listen(app),
	gdb = require("./gdb-hook"),
	fs = require("fs");

var GDB_SCRIPT = "demo.gdb";

app.listen(8000);

app.configure(function()
{
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.use(express.logger("dev"));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/../client"));
    console.log(__dirname + "/../client");
});

io.set("log level", 1);

io.sockets.on("connection", function(socket)
{
	gdb.runGdb(GDB_SCRIPT, socket);

	socket.on("gdb_break", function(line)
	{
		socket.emit("gdb_break", { "foo": "bar" });
	});
});

}).call(this);