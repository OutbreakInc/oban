(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	path = require("path"),
	net = require("net"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	_ = require("underscore"),
	dirs = require("./dirs"),
	badger = require("badger")(__filename),
	idGen = require("./id-gen");

var PYTHON_SCRIPT = __dirname + "/gdb/gdb.py";
var PYTHON_HOST = "127.0.0.1";

function Gdb(binary)
{
	EventEmitter.call(this);

	console.assert(	binary, 
					"GDB binary must be set");

	console.assert(	fs.existsSync(binary), 
					"GDB binary wasn't found on the file system");

	this.binary = binary;
	this._breakpoints = { isDirty: false, lines: {} };
	this._actions = [];
	this._idCallbacks = {};

	_.bindAll(this);

	badger.debug("gdb initialized with binary:", binary);
}

util.inherits(Gdb, EventEmitter);

Gdb.events =
{
	STOP: "stop",
	CONTINUE: "continue",
	RAW: "raw",
	VARIABLE_RESULT: "variable",
	ERROR: "gdb_error"
};

Gdb.actions =
{
	RESUME: "resume",
	PAUSE: "pause"
}

Gdb.prototype._init = function(port, symbolFile)
{
	this.process = spawn(this.binary, [], { cwd: path.dirname(symbolFile) });

	// so GDB doesn't prompt us when we delete all breakpoints
	this.rawCommand("set confirm off");
	this.rawCommand("target remote localhost:" + port);

	this.isStopped = false;

	// if we don't set encoding, data will be given to us as Buffer objects
	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");
}

Gdb.prototype.unpause = function(port, callback)
{
	this.process = spawn(this.binary);

	// so GDB doesn't prompt us when we delete all breakpoints
	this.rawCommand("set confirm off");
	this.rawCommand("target remote localhost:" + port);

	this.isStopped = false;

	// if we don't set encoding, data will be given to us as Buffer objects
	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	this._resume();

	// hack, make it actually correctly find out when we are running
	setTimeout(function()
	{
		callback();

	}.bind(this), 1000);
}

// start gdb process and connect to our local gdb server
Gdb.prototype.run = function(symbolFile, port)
{
	console.assert( symbolFile && symbolFile.length > 0,
					"GDB symbol file must be specified");

	console.assert( _.isNumber(port) && port > 0,
					"Must specify valid device server port: " + port);

	badger.debug("run arguments:", arguments);

	this.process = spawn(this.binary, [], { cwd: path.dirname(symbolFile) });

	// so GDB doesn't prompt us when we delete all breakpoints
	this.rawCommand("set confirm off");

	this.isStopped = false;

	// if we don't set encoding, data will be given to us as Buffer objects
	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	this.rawCommand("source " + PYTHON_SCRIPT);
	this.rawCommand("file " + symbolFile);

	this.rawCommand("target remote localhost:" + port);

	var gdb = this;

	this.process.stderr.on("data", function(err)
	{
		badger.error(err);
		gdb.emit(Gdb.events.ERROR, err);
	});

	this.process.stdout.on("data", function(data)
	{
		badger.debug("gdb output: ", data);

		// look for special python marker
		if (data.indexOf("python started on port") != -1)
		{
			var port = parseInt(data.split(" ")[4], 10);
			gdb._connectAttempts = 0;
			gdb._connectSocket(PYTHON_HOST, port);
		}

		gdb.emit(Gdb.events.RAW, data);
	});

	this.process.on("exit", function(code)
	{
		badger.debug("gdb has exited with code: " + code);
	});
};

Gdb.prototype.isRunning = function()
{
	return !!this.process;
}

Gdb.prototype.rawCommand = function(command)
{
	badger.debug("sending raw command:", command);
	this.process.stdin.write(command + "\n");
}

Gdb.prototype.toggleBreakpoint = function(line)
{
	if (this._breakpoints.lines.hasOwnProperty(line))
	{
		badger.debug("Removing breakpoint at line " + line);
		delete this._breakpoints.lines[line];
	}
	else
	{
		badger.debug("Adding breakpoint at line: " + line);
		this._breakpoints.lines[line] = true;
	}

	this._breakpoints.isDirty = true;

	if (this.isStopped)
	{
		this._syncBreakpoints();
	}
	else
	{
		this._pause();
	}
}

Gdb.prototype.queueAction = function(action)
{

	this._actions.push(action);

	badger.debug("action queued: " + action);
	badger.debug("is stopped? " + this.isStopped);
	badger.debug("stop triggered? " + this._stopTriggered);
	badger.debug("actions: " + this._actions);

	if (this.isStopped)
	{
		this._processActions();
		return;
	}

	if (!this._stopTriggered && this._actions[this._actions.length - 1] == Gdb.actions.PAUSE)
	{
		this._pause();
	}
}

Gdb.prototype.exit = function()
{
	badger.debug("gdb exit issued");

	if (this.process)
	{
		this._unbindEvents();
		this.process.kill("SIGTERM");
		delete this.process;
	}
	else
	{
		badger.warning("tried to kill gdb process when it wasn't running");
	}	
}

Gdb.prototype.lookupVariable = function(variableStr, callback)
{
	var id = idGen();

	this.socket.write(
		JSON.stringify({ type: "variable", variable: variableStr, id: id }));

	this._idCallbacks[id] = callback;

	badger.debug("list of id callbacks:", this._idCallbacks);
}

Gdb.prototype._connectSocket = function(host, port)
{
	var gdb = this;

	this.socket = net.connect({
		host: host,
		port: port }, 
		function()
		{
			badger.debug("Connected to python GDB host");
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
				badger.error("Exceeded connection attempts to python GDB host");
			}
		}

		badger.error("Socket error:", err);
	});	
}

Gdb.prototype._bindEvents = function()
{
	this.socket.on("data", this._processData);
}

Gdb.prototype._unbindEvents = function()
{
	if (this.socket)
	{
		this.socket.removeListener("data", this._processData);
	}
}

Gdb.prototype._processData = function(data)
{
 	badger.debug("PYTHON GDB DATA:");
	badger.debug(data);

	data = JSON.parse(data);

	if (data.event)
	{
		switch (data.event)
		{
		case Gdb.events.STOP:
			this.isStopped = true;
			this._onStop();
			break;
		case Gdb.events.CONTINUE:
			this.isStopped = false;
			break;
		case Gdb.events.VARIABLE_RESULT:
			this._variableCallback(data);
			break;
		}

		this.emit(data.event, data.data);
	}
}

Gdb.prototype._variableCallback = function(data)
{
	if (!data.id)
	{
		return badger.error("Variable data event didn't have an ID!");
	}

	// find callback based on id
	callback = this._idCallbacks[data.id];

	if (!callback)
	{
		return badger.error("Variable data event id did not have a matching callback!");
	}

	// remove callback from list of ID callbacks
	delete this._idCallbacks[data.id];

	callback(null, data.data.value);
}

Gdb.prototype._syncBreakpoints = function()
{
	// clear all breakpoints first
	this.rawCommand("delete");

	badger.debug("breakpoints:", this._breakpoints);

	var gdb = this;

	_.keys(this._breakpoints.lines).forEach(function(line)
	{
		badger.debug("b " + line);
		gdb.rawCommand("b " + line);
	});

	this._breakpoints.isDirty = false;
}

Gdb.prototype._resume = function()
{
	this.rawCommand("c");
	delete this._stopTriggered;
}

Gdb.prototype._pause = function()
{
	if (this.process)
	{
		this._stopTriggered = true;
		this.process.kill("SIGINT");
	}
}

Gdb.prototype._processActions = function()
{
	var action = this._actions[this._actions.length - 1];

	// we only need to do something if the last action is a resume action
	// if the last action was a pause action, we are already stopped,
	// so nothing needs to be done
	if (action == Gdb.actions.RESUME)
	{
		this._resume();
	}

	// empty out the actions array
	this._actions.length = 0;
}

Gdb.prototype._onStop = function()
{
	if (this._breakpoints.isDirty)
	{
		this._syncBreakpoints();
	}

	// take last action in queue - that is the state we should leave GDB at
	if (this._actions.length > 0)
	{
		this._processActions();	
	}
	else if (this._stopTriggered)
	{
		// if there were no actions, the stop was triggered just to
		// sync breakpoints, so we should resume

		this._resume();
	}
}

module.exports = Gdb;

}).call(this);