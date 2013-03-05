(function()
{
var spawn = require("child_process").spawn,
	_ = require("underscore"),
	Parser = require("./gdb/parser"),
	Gdb = require("./gdb"),
	badger = require("badger")(__filename),
	EventListener = require("./event-listener"),
	dirs = require("./dirs");

function GdbClient(deviceServer)
{
	this.deviceServer = deviceServer;
}

module.exports = GdbClient;

GdbClient.prototype =
{

run: function(file, callback)
{
	var self = this;

	dirs.sdk()
	.then(function(dir)
	{
		this.gdb = new Gdb(dir + "/bin/arm-none-eabi-gdb");

		badger.debug("running gdbclient on port " + this.deviceServer.port);

		if (this.events)
		{
			this.events.forEach(function(event)
			{
				this.listenTo(this.gdb, event.name, event.callback);

			}.bind(this));
		}
		else
		{
			badger.warning("`this.events` did not exist, did you call run() before attachClient()?");
		}
		
		if (!this.deviceServer.isStarted)
		{
			badger.error("Device server not started, can't connect to GDB");
			return callback("Device server not started");
		}

		this.gdb.run(file, this.deviceServer.port);
		callback();
	}.bind(this));
},

// just used to resume a paused galago, does no actual debugging
resume: function(callback)
{
	badger.debug("resuming program");

	dirs.sdk()
	.then(function(dir)
	{
		this.gdb = new Gdb(dir + "/bin/arm-none-eabi-gdb");

		this.gdb.unpause(this.deviceServer.port,
		function()
		{
			this.gdb.exit();
			callback();

		}.bind(this));
	}.bind(this));
},

stop: function()
{
	this.gdb.exit();
},

attachClient: function(client)
{
	var parser = new Parser(client);
	_.bindAll(parser);

	this.events =
	[
		{ name: Gdb.events.STOP, callback: parser.onStop },
		{ name: Gdb.events.CONTINUE, callback: parser.onContinue },
		{ name: Gdb.events.RAW, callback: parser.onData },
		{ name: Gdb.events.ERROR, callback: parser.onError }
	];

	this.listenTo(client, "gdb_command", function(command, data)
	{
		badger.debug("client command: ", command);
		this.gdb.rawCommand(command);
	});

	this.listenTo(client, "gdb_break", function(line)
	{
		badger.debug("gdb_break", line);
		this.gdb.toggleBreakpoint(line);
	});

	this.listenTo(client, "gdb_pause", function()
	{
		badger.debug("queued pause");	
		this.gdb.queueAction(Gdb.actions.PAUSE);
	});

	this.listenTo(client, "gdb_resume", function()
	{
		badger.debug("queued continue");
		this.gdb.queueAction(Gdb.actions.RESUME);
	});

	this.listenTo(client, "gdb_exit", function()
	{
		this._onExit(client);
	});

	this.listenTo(client, "disconnect", function()
	{
		this._onExit(client);
	});

	this.listenTo(client, "gdb_query", function(variableStr, callback)
	{
		this.gdb.lookupVariable(variableStr, function(err, fields)
		{
			callback(null, fields);
		});
	});
},

_onExit: function(client)
{
	this.events.forEach(function(event)
	{
		this.gdb.removeListener(event.name, event.callback);

	}.bind(this));

	this.stopListening();
	this.stop();
}

}

_.extend(GdbClient.prototype, EventListener);

}).call(this);