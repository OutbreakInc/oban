(function()
{
	spawn = require("child_process").spawn;

	function getLineNumber(data)
	{
		var lines = data.split("\n");

		for (var i = 0; i < lines.length; ++i)
		{
			var lineNumber = lines[i].match(/^[0-9]+/);

			if (lineNumber) return lineNumber[0];
		}

		return -1;
	};

	module.exports.runGdb = function(startScript, client)
	{
		var gdb = spawn("./arm-elf-gdb", ["-x", startScript]);

		var fakeBreakpoint;

		gdb.stderr.setEncoding("utf8");
		gdb.stderr.on("data", function(data)
		{
			console.log("GDB ERROR:");
			console.log(data);
		});

		gdb.stdout.setEncoding("utf8");
		gdb.stdout.on("data", function(data)
		{
			if (/stopped/.exec(data) !== null)
			{
				console.log("fixed breakpoint: " + fakeBreakpoint);
				var line = getLineNumber(data);

				if (fakeBreakpoint) line = fakeBreakpoint;

				client.emit("gdb_break", {line: line});
			}

			client.emit("gdb_message", data);
		});

		client.on("gdb_command", function(command, data)
		{
			console.log("client command: ", command);
			gdb.stdin.write(command + "\n");
		});

		client.on("gdb_break", function(line)
		{
			fakeBreakpoint = line;
			gdb.stdin.write("b " + line + "\n");
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