(function()
{
	spawn = require("child_process").spawn;

	module.exports.runGdb = function(startScript, client)
	{
		var gdb = spawn("./arm-elf-gdb", ["-x", startScript]);

		gdb.stderr.setEncoding("utf8");
		gdb.stderr.on("data", function(data)
		{
			console.log("GDB ERROR:");
			console.log(data);
		});

		gdb.stdout.setEncoding("utf8");
		gdb.stdout.on("data", function(data)
		{
			if (client)
			{
				client.emit("gdb_message", data);
			}
			console.log(data);
		});

		client.on("gdb_command", function(command, data)
		{
			console.log("client command: ", command);
			gdb.stdin.write(command + "\n");
		});

		client.on("gdb_sigint", function()
		{
			gdb.kill("SIGINT");
		});

		client.on("disconnect", function()
		{
			gdb.stdin.write("quit");
			gdb.stdin.end();
		});
	};

}).call(this);