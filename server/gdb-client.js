(function()
{
var spawn = require("child_process").spawn,
	_ = require("underscore"),
	Parser = require("./gdb/parser"),
	Gdb = require("./gdb"),
	badger = require("badger")(__filename);

function GdbClient(deviceServer)
{
	this.gdb = new Gdb(__dirname + "/../SDK6/bin/arm-none-eabi-gdb");
	// this.gdb = new Gdb("/usr/local/gdb-7.5/bin/gdb-7.5");
	this.gdb.setDebugging(true);
	this.deviceServer = deviceServer;
}

module.exports = GdbClient;

GdbClient.prototype =
{

run: function(file, callback)
{
	badger.debug("running gdbclient on port " + this.deviceServer.port);

	if (!this.deviceServer.isStarted)
	{
		console.log("Device server not started, can't connect to GDB");
		return callback("Device server not started");
	}

	this.gdb.run(file, this.deviceServer.port);
	this.gdb.setDebugging(true);
	callback();
	// this.gdb.run("demo.elf");
},

stop: function()
{
	this.gdb.exit();
},

attachClient: function(client)
{
	var parser = new Parser(client);
	_.bindAll(parser);

	var self = this;

	this.events =
	[
		{ name: Gdb.events.STOP, callback: parser.onStop },
		{ name: Gdb.events.CONTINUE, callback: parser.onContinue },
		{ name: Gdb.events.RAW, callback: parser.onData }
	];

	client.on("gdb_command", function(command, data)
	{
		console.log("client command: ", command);
		self.gdb.rawCommand(command);
	});

	client.on("gdb_break", function(line)
	{
		console.log("GDB_BREAK " + line);
		self.gdb.toggleBreakpoint(line);
	});

	client.on("gdb_pause", function()
	{	
		self.gdb.queueAction(Gdb.actions.PAUSE);
	});

	client.on("gdb_resume", function()
	{
		self.gdb.queueAction(Gdb.actions.RESUME);
	});

	client.on("gdb_exit", function()
	{
		self._onExit(client);
	});

	client.on("disconnect", function()
	{
		self._onExit(client);
	});

	this.events.forEach(function(event)
	{
		self.gdb.on(event.name, event.callback);
	});
},

_onExit: function(client)
{
	this.events.forEach(function(event)
	{
		this.gdb.removeListener(event.name, event.callback);

	}.bind(this));

	this.stop();
}

}

}).call(this);