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
	this.gdb.run(file);
	// this.gdb.setDebugging(true);
	// this.gdb.run("demo.elf");
	this.gdb.rawCommand("b main");
},

stop: function()
{
	this.gdb.exit();
},

attachClient: function(client)
{
	var parser = new Parser;
	_.bindAll(parser);

	var listener = new GdbListener(client);

	var self = this;

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
		self.gdb.exit();
	});

	listener.on(/All defined variables/, parser.onShowVariables);
	listener.on(/stopped/, parser.onHitBreakpoint);

	this.gdb.setListener(listener);
}

}

}).call(this);