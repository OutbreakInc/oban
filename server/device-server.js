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
	JsonStreamer = require("./json-streamer");

var Errors =
{
	STARTUP_ERROR: "Couldn't start server"
};

function DeviceServer()
{
	EventEmitter.call(this);

	this.binary = __dirname + "/../gdbServer/GalagoServer";

	badger.debug("setting device server binary:")
	badger.debug(this.binary);

	console.assert(fs.existsSync(this.binary),
					"Device server binary wasn't found on the file system (looked in: " +
						path.resolve(this.binary) + ")");

	this.isStarted = false;

	this.streamer = new JsonStreamer;
}

util.inherits(DeviceServer, EventEmitter);

var DEVICE_CONNECTED_MSG = "";

DeviceServer.prototype.flash = function(fullFilePath, callback)
{
	badger.debug("flash");
	badger.debug(fullFilePath);

	// stop old device server if it's running
	if (this.process)
	{
		console.log("stopping old process");

		this.on("stopped", function()
		{
			_flash();

		}.bind(this));

		this.process.kill();
	}

	var _flash = function()
	{
		this.process = spawn(
			this.binary, 
			[fullFilePath], 
			{cwd: __dirname + "/../gdbServer"}
		);

		this.process.stdout.setEncoding("utf8");
		this.process.stderr.setEncoding("utf8");

		// after 5 seconds, assume it's been flashed
		setTimeout(function()
		{
			this.process.kill();

			// resume normal device server run
			this.run();
			callback();

		}.bind(this), 5000);

	}.bind(this);
}

DeviceServer.prototype._onStatus = function(data)
{
	this.devices = data.devices;

	this.emit("list", this.devices);
}

DeviceServer.prototype._onDeviceConnect = function(data)
{
	this.emit("connect", data.device);
}

DeviceServer.prototype._onDeviceDisconnect = function(data)
{
	this.emit("disconnect", data.device);
}

DeviceServer.prototype.requestStatus = function()
{
	this.socket.write("?");
}

DeviceServer.prototype.run = function()
{
	badger.debug("Starting device server...");	
	
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
			this.isStarted = true;

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
			}

		}.bind(this));

		this.streamer.on("error", badger.error);

	}.bind(this));

	this.process.on("exit", function(code)
	{
		winston.debug("GalagoServer exited with code: " + code);
		this.emit("stopped");
		this.isStarted = false;
		delete this.port;

	}.bind(this));
}

module.exports = DeviceServer;

}).call(this);