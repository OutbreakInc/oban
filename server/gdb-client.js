(function()
{
var spawn = require("child_process").spawn,
	_ = require("underscore"),
	Parser = require("./gdb/parser"),
	Gdb = require("./gdb");

function GdbClient()
{
	this.gdb = new Gdb("/usr/local/arm-none-eabi/bin/arm-none-eabi-gdb");
}

module.exports = GdbClient;

GdbClient.prototype =
{

run: function(file)
{
	this.gdb.run(file);
	// this.gdb.setDebugging(true);
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

	var events =
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
		parser.setFakeBreakpoint(line);
		self.gdb.setBreakpoint(line);
		self.gdb.resume();
	});

	client.on("gdb_sigint", function()
	{	
		self.gdb.pause();
	});

	client.on("disconnect", function()
	{
		events.forEach(function(event)
		{
			self.gdb.removeListener(event.name, event.callback);
		});

		self.stop();
	});

	events.forEach(function(event)
	{
		self.gdb.on(event.name, event.callback);
	});
}

}

}).call(this);