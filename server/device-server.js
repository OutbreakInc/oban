(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	path = require("path"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	net = require("net"),
	badger = require("badger")(__filename);
	_ = require("underscore"),
	JsonStreamer = require("./json-streamer"),
	dirs = require("./dirs");

var Errors =
{
	STARTUP_ERROR: "Couldn't start server"
};

function DeviceServer(callback)
{
	EventEmitter.call(this);

	dirs.bin()
	.then(function(binDir)
	{
		this.binary = binDir + "GalagoServer";

		badger.debug("setting device server binary:");
		badger.debug(this.binary);

		if (!fs.existsSync(this.binary))
		{
			badger.error(
				"Device server binary wasn't found on the file system (looked in: " +
				path.resolve(this.binary) + ")");

			this.binaryMissing = true;
		}

		this.isStarted = false;

		this.streamer = new JsonStreamer;

		callback();

	}.bind(this));
}

util.inherits(DeviceServer, EventEmitter);

var DEVICE_CONNECTED_MSG = "";

DeviceServer.prototype.flash = function(device, fullFilePath, callback)
{
	badger.debug("flashing device on port:", device.gdbPort);
	badger.debug(fullFilePath);

	// syntax: f<gdbPort><[absolute path]>
	this.socket.write("f" + device.gdbPort + "[" + fullFilePath + "]");

	var flashCallback = function(data)
	{
		badger.debug("flashback!");

		// got an error while flashing
		if (data && data.err)
		{
			this.streamer.removeListener("data", flashCallback);
			clearTimeout(flashTimeout);
			callback(data.err.msg);
		}

		if (!data || !data.event || data.event != "flashed") return;

		if (data.device.serialNumber == device.serialNumber)
		{
			this.streamer.removeListener("data", flashCallback);
			clearTimeout(flashTimeout);
			callback();
		}

	}.bind(this);

	this.streamer.on("data", flashCallback);

	var flashTimeout = setTimeout(function()
	{
		this.streamer.removeListener("data", flashCallback);
		callback("Flash timeout!");

	}.bind(this), 10000);
}

DeviceServer.prototype._onStatus = function(data)
{
	this.devices = data.devices;

	this.emit("list", this.devices);

	//! HACK: expose first device in list for debugging
	if (this.devices.length > 0)
	{
		this.port = this.devices[0].gdbPort;
		badger.debug("assigned port " + this.port + " as the gdb debug port");
		this.isStarted = true;
	}
}

DeviceServer.prototype._onDeviceConnect = function(data)
{
	this.emit("connect", data.device);
}

DeviceServer.prototype._onDeviceDisconnect = function(data)
{
	this.emit("disconnect", data.device);
}

DeviceServer.prototype._onError = function(err)
{
	badger.error(err);
	this.emit("error", err.msg);
}

DeviceServer.prototype.requestStatus = function()
{
	this.socket.write("?");
}

DeviceServer.prototype.run = function()
{
	badger.debug("Starting device server...");

	if (this.binaryMissing) return;
	
	this.process = spawn(this.binary, [], {cwd: path.dirname(this.binary) });

	this.process.stdout.setEncoding("utf8");
	this.process.stderr.setEncoding("utf8");

	this.process.stdout.on("data", function(data)
	{
		badger.debug("got stdout data: ", data);

		try
		{
			data = JSON.parse(data);
		} 
		catch(e)
		{
			badger.error("Couldn't parse TCP port JSON:");
			badger.error(e);
			badger.error(data);
			return this.emit("error", Errors.STARTUP_ERROR);
		}

		if (!data.port)
		{
			badger.error("JSON data missing port parameter");
			return this.emit("error", Errors.STARTUP_ERROR);
		}

		this.socket = net.connect(
		{
			host: "localhost",
			port: data.port
		},
		function()
		{
			badger.debug("connected to GalagoServer");

			// upon connect, query for currently connected devices
			this.requestStatus();

		}.bind(this));

		this.socket.setEncoding("utf8");

		var buffer;
		var inJson = false;

		this.socket.on("data", this.streamer.processChunk);

		this.streamer.on("data", function(data)
		{
			badger.debug("data:", data);

			switch (data.event)
			{
			case "status": 
				this._onStatus(data);
				break;
			case "plug":
				this._onDeviceConnect(data);
				break;
			case "unplug":
				this._onDeviceDisconnect(data);
				break;
			default:
			{
				badger.warning("unknown event");

				if (data.err) this._onError(data.err);
				else
				{
					badger.warning(data);
				}

				break;
			}
			}

		}.bind(this));

		this.streamer.on("error", badger.error);

	}.bind(this));

	this.process.stderr.on("data", function(err)
	{
		badger.error(err);
	});

	this.process.on("exit", function(code)
	{
		badger.error("GalagoServer exited with code: " + code);
		this.isStarted = false;
		this._cleanUpListeners();
		delete this.port;
		this.emit("stopped");

		// code 255 means we can't start the server, don't try to restart
		if (code === 127)
		{
			this.emit("cantStart");
		}
		else
		{
			// restart GalagoServer
			badger.error("restarting GalagoServer...");
			this.run();
		}

	}.bind(this));
}

DeviceServer.prototype._cleanUpListeners = function()
{
	if (this.streamer) this.streamer.removeAllListeners();
	if (this.socket) this.socket.removeAllListeners();
	this.process.stdout.removeAllListeners();
	this.process.removeAllListeners();
}

module.exports = DeviceServer;

}).call(this);