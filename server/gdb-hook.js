(function()
{
	var spawn = require("child_process").spawn,
		GdbListener = require("./gdb-listener");

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

	// in: data - string
	// out: array of data split by newlines, with empty lines removed
	function lineSplit(data)
	{
		return data.split("\n").filter(function(item)
		{
			return item.length > 0; 
		});
	}

	function hasTerminator(data)
	{
		var lines = lineSplit(data);

		console.log("last line: " + lines[lines.length - 1]);

		return (lines[lines.length - 1].trim() == "(gdb)");
	}

	// protocol:
	// message: gdb_variables
	// currently:
	// data: list of strings containing variable type + name
	// TODO:
	// data: list of { type: <data type>, name: <variable name> }
	function onShowVariables(data, client)
	{
		var variables = [];

		var lines = lineSplit(data);

		// remove first two lines, which are just the regex match and file which
		// we're in, and the last line, which is "(gdb)"
		lines = lines.slice(3, lines.length - 2);

		lines.forEach(function(line)
		{
			variables.push(line);
		});

		console.log("First line:");
		console.log(lines[0]);

		console.log("Sending client list of variables");

		client.emit("gdb_variables", variables);
	}

	function onHitBreakpoint(data, client)
	{
		console.log("fixed breakpoint: " + fakeBreakpoint);
		var line = getLineNumber(data);

		if (fakeBreakpoint) line = fakeBreakpoint;

		client.emit("gdb_break", {line: line});
	}

	module.exports.runGdb = function(startScript, client)
	{
		var gdb = spawn("./arm-elf-gdb");

		// load symbols
		gdb.stdin.write("file demo.elf\n");

		// connect to GDB server
		gdb.stdin.write("target remote localhost:1033\n");

		gdb.stdin.write("b main\n");
		gdb.stdin.write("info variables\n");

		var fakeBreakpoint;

		gdb.stderr.setEncoding("utf8");
		gdb.stderr.on("data", function(data)
		{
			console.log("GDB ERROR:");
			console.log(data);
		});

		gdb.stdout.on("end", function(data)
		{
			console.log("END!!");
		});

		var listener = new GdbListener(client);

		listener.on(/All defined variables/, onShowVariables);
		listener.on(/stopped/, onHitBreakpoint);

		var buffer;

		gdb.stdout.setEncoding("utf8");
		gdb.stdout.on("data", function(data)
		{
			console.log("data length: " + data.length);

			// build up data in buffer until we see that the stream has "terminated"
			// meaning, we saw a single line at the end with "(gdb)" on it
			buffer += data;

			if (hasTerminator(data))
			{
				listener.emit(buffer);
				buffer = "";
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