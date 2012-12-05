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
	
	this.process = spawn(this.binary, [], {cwd: __dirname + "/../gdbServer"});

	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	var deviceServer = this;

	this.process.stdout.on("data", function(data)
	{
		if (/connected/.exec(data))
		{
			var matches = data.match(/Device '([^']*)' connected, id = ([^\.]*)/);

			var deviceName = matches[1];
			var deviceId = matches[2];

			deviceServer.emit("connect", deviceId, deviceName);
		}
		if (/removed/.exec(data))
		{
			var matches = data.match(/Device '([^']*)' removed, id = ([^\.]*)/);

			var deviceName = matches[1];
			var deviceId = matches[2];

			deviceServer.emit("disconnect", deviceId, deviceName);			
		}
		if (/Serving on port/.exec(data))
		{
			var matches = data.match(/Serving on port ([0-9]+)/);

			var port = parseInt(matches[1], 10);

			if (!port)
			{
				winston.debug("Couldn't parse port from device server data:");
				winston.debug(data);
			}
			else
			{
				deviceServer.emit("started", {port: port});
			}
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

	this.process.on("exit", function(code)
	{
		winston.debug("GalagoServer exited with code: " + code);
		deviceServer.emit("stopped");
	});
}

module.exports = DeviceServer;

}).call(this);