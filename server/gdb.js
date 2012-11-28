(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	path = require("path"),
	Parser = require("./gdb/parser");

function Gdb(binary)
{
	console.assert(	binary, 
					"GDB binary must be set");

	console.assert(	fs.existsSync(binary), 
					"GDB binary wasn't found on the file system");

	this.binary = binary;
}

Gdb.prototype.setDebugging = function(isEnabled) 
{
	console.log("set gdb debugging: " + isEnabled);
	this.isDebugging = isEnabled;
};

// sets up a listener which will be passed all GDB output
Gdb.prototype.setListener = function(listener) 
{
	if (!listener)
	{
		console.warn("WARNING: listener is undefined");
		console.trace();
	}

	this.listener = listener;
};

Gdb.prototype.removeListener = function()
{
	delete this.listener;
}

// start gdb process and connect to our local gdb server
Gdb.prototype.run = function(symbolFile)
{
	this.process = spawn(this.binary, [], {cwd: path.dirname(symbolFile)});

	this.rawCommand("file " + symbolFile);

	this.rawCommand("target remote localhost:1033");

	// if we don't set encoding, data will be given to us as Buffer objects
	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	this.process.stderr.on("data", function(err)
	{
		console.error("ERROR: " + err);
		console.trace();
	});

	var buffer;

	var gdb = this;

	this.process.stdout.on("data", function(data)
	{
		// build up data in buffer until we see that the stream has "terminated"
		// meaning, we saw a single line at the end with "(gdb)" on it

		buffer += data;

		if (/stopped/.exec(data))
		{
			gdb.getGlobalVariables();
		}

		if (Parser.utils.hasTerminator(data))
		{
			if (gdb.listener)
			{
				gdb.listener.emit(buffer);
				buffer = "";
			}
		}

		if (gdb.isDebugging)
		{
			console.log("gdb output: ", data);
		}
	});
};

Gdb.prototype.isRunning = function()
{
	return !!this.process;
}

Gdb.prototype.rawCommand = function(command) 
{
	this.process.stdin.write(command + "\n");
};

Gdb.prototype.setBreakpoint = function(line)
{
	this.rawCommand("b " + line);
	// TODO: add to internal list of breakpoints to easily clear later
}

Gdb.prototype.resume = function()
{
	this.rawCommand("c");
}

Gdb.prototype.pause = function()
{
	if (this.process)
	{
		this.process.kill("SIGINT");
	}
}

Gdb.prototype.exit = function()
{
	if (this.process)
	{
		this.pause();
		this.rawCommand("quit");
		this.process.stdin.end();
		delete this.process;
	}
}

Gdb.prototype.getGlobalVariables = function()
{
	this.rawComand("info variables");
}

module.exports = Gdb;

}).call(this);