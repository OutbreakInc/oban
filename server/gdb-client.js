(function()
{
var spawn = require("child_process").spawn,
	_ = require("underscore"),
	GdbListener = require("./gdb/listener"),
	Parser = require("./gdb/parser"),
	Gdb = require("./gdb");

function GdbClient()
{
	this.gdb = new Gdb("gdb");
}

module.exports = GdbClient;

GdbClient.prototype =
{

run: function(file)
{
	gdb.run(file);
	// gdb.setDebugging(true);
	// gdb.run("demo.elf");
	gdb.rawCommand("b main");
},

stop: function()
{
	gdb.stop();
},

attachClient: function(client)
{
	var parser = new Parser;
	_.bindAll(parser);

	var listener = new GdbListener(client);

	client.on("gdb_command", function(command, data)
	{
		console.log("client command: ", command);
		gdb.rawCommand(command);
	});

	client.on("gdb_break", function(line)
	{
		parser.setFakeBreakpoint(line);
		gdb.setBreakpoint(line);
		gdb.resume();
	});

	client.on("gdb_sigint", function()
	{
		gdb.pause();
	});

	client.on("disconnect", function()
	{
		gdb.exit();
	});

	listener.on(/All defined variables/, parser.onShowVariables);
	listener.on(/stopped/, parser.onHitBreakpoint);

	this.gdb.setListener(listener);
}

}

}).call(this);