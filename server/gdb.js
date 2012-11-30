(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	path = require("path"),
	net = require("net"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),	
	utils = require("./utils");

var PYTHON_SCRIPT = utils.scriptsDir() + "/gdb.py";
var PYTHON_HOST = "127.0.0.1";

function Gdb(binary)
{
	EventEmitter.call(this);

	console.assert(	binary, 
					"GDB binary must be set");

	console.assert(	fs.existsSync(binary), 
					"GDB binary wasn't found on the file system");

	this.binary = binary;
}

util.inherits(Gdb, EventEmitter);

Gdb.events =
{
	STOP: "stop",
	CONTINUE: "continue",
	RAW: "raw"
};

Gdb.prototype.setDebugging = function(isEnabled) 
{
	console.log("set gdb debugging: " + isEnabled);
	this.isDebugging = isEnabled;
};

// start gdb process and connect to our local gdb server
Gdb.prototype.run = function(symbolFile)
{
	this.process = spawn(this.binary, [], {cwd: path.dirname(symbolFile)});

	this.rawCommand("source " + PYTHON_SCRIPT);
	this.rawCommand("file " + symbolFile);
	this.rawCommand("target remote localhost:1033");

	this.isStopped = false;

	var gdb = this;

	// setTimeout(function() { gdb.setBreakpoint(15); gdb.resume() }, 3000);

	// if we don't set encoding, data will be given to us as Buffer objects
	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	this.process.stderr.on("data", function(err)
	{
		console.error("ERROR: " + err);
	});

	this.process.stdout.on("data", function(data)
	{
		if (gdb.isDebugging)
		{
			console.log("gdb output: ", data);
		}

		// look for special python marker
		if (data.indexOf("python started on port") != -1)
		{
			var port = parseInt(data.split(" ")[4], 10);
			gdb._connectAttempts = 0;
			gdb._connectSocket(PYTHON_HOST, port);
		}

		gdb.emit(Gdb.events.RAW, data);
	});
};

Gdb.prototype.isRunning = function()
{
	return !!this.process;
}

Gdb.prototype.rawCommand = function(command)
{
	this.process.stdin.write(command + "\n");
}

Gdb.prototype.setBreakpoint = function(line)
{
	var convertedLine = parseInt(line, 10);

	if (!convertedLine)
	{
		console.error("ERROR: invalid breakpoint line number: " + line);
		return;
	}

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

Gdb.prototype._connectSocket = function(host, port)
{
	var gdb = this;

	this.socket = net.connect({
		host: host,
		port: port }, 
		function()
		{
			console.log("Connected to python GDB host");
			gdb._bindEvents();

		});

	this.socket.setEncoding("utf8");
	this._bindReconnectEvent();
}

Gdb.prototype._bindReconnectEvent = function()
{
	var gdb = this;

	this.socket.on("error", function(err)
	{
		// python server may take some time to start, try connecting up to 5 times
		if (err.code == "ECONNREFUSED")
		{
			if (gdb._connectAttempts < 5)
			{
				setTimeout(function()
				{
					++gdb._connectAttempts;
					// gdb.socket.destroy();
					gdb._connectSocket();

				}, 1000);
			}
			else
			{
				console.log("Exceeded connection attempts to python GDB host");
			}
		}

		console.log("Socket error:");
		console.log(err);
	});	
}

Gdb.prototype._bindEvents = function()
{
	var gdb = this;

	this.socket.on("data", function(data)
	{
		if (gdb.isDebugging)
		{
			console.log("PYTHON GDB DATA:");
			console.log(data);
		}

		data = JSON.parse(data);

		if (data.event)
		{
			switch (data.event)
			{
			case Gdb.events.STOP:
				gdb.isStopped = true;
				break;
			case Gdb.events.CONTINUE:
				gdb.isStopped = false;
				break;
			}

			gdb.emit(data.event, data.data);
		}
	});	
}


module.exports = Gdb;

}).call(this);