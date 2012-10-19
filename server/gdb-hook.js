(function()
{
	var spawn = require("child_process").spawn,
		_ = require("underscore"),
		GdbListener = require("./gdb/listener"),
		Parser = require("./gdb/parser"),
		Gdb = require("./gdb");

	module.exports.runGdb = function(startScript, client)
	{
		var gdb = new Gdb("./arm-elf-gdb");
		var listener = new GdbListener(client);
		var parser = new Parser;

		_.bindAll(parser);

		gdb.setListener(listener);
		// gdb.setDebugging(true);

		listener.on(/All defined variables/, parser.onShowVariables);
		listener.on(/stopped/, parser.onHitBreakpoint);

		gdb.run("demo.elf");

		gdb.process.stdin.write("b main\n");

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
	};

}).call(this);