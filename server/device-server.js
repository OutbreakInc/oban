(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	path = require("path"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	winston = require("winston"),
	_ = require("underscore");

function DeviceServer()
{
	EventEmitter.call(this);

	this.binary = __dirname + "/../gdbServer/GalagoServer";

	winston.debug("setting device server binary:")
	winston.debug(this.binary);

	console.assert(fs.existsSync(this.binary),
					"Device server binary wasn't found on the file system (looked in: " +
						path.resolve(this.binary) + ")");
}

util.inherits(DeviceServer, EventEmitter);

var DEVICE_CONNECTED_MSG = "";

DeviceServer.prototype.run = function()
{
	winston.debug("Starting device server...");

	this.process = spawn(this.binary);

	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	var deviceServer = this;

	this.process.stdout.on("data", function(data)
	{
		if (/connected/.exec(data))
		{
			deviceServer.emit("connected");
		}

		if (/Exiting!/.exec(data))
		{
			deviceServer.process.kill();
		}

		// todo: move to custom log file just for device server
		winston.debug(data);
	});

	this.process.stderr.on("data", function(data)
	{
		winston.error(data);
	});
}

var server = new DeviceServer;
server.run();

}).call(this);