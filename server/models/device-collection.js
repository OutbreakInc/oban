var Device = require("./device"),
	DeviceServer = require("../device-server"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	badger = require("badger")(__filename),
	async = require("async"),
	_ = require("underscore");

function DeviceCollection(options, callback)
{
	// on initialization, start a device server
	// and find all connected devices

	options = options || {};

	_.bindAll(this);

	this._attrs = {};
	this._attrs.devices = [];

	this._deviceServer = new DeviceServer;

	this._deviceServer.on("connect", this._add);
	this._deviceServer.on("disconnect", this._remove);

	this._deviceServer.on("list", this._reset);

	this._deviceServer.on("started", this._onServerStart);
	this._deviceServer.on("stopped", this._onServerStop);

	this._deviceServer.on("error", badger.error);

	this._statusRequested = true;

	this._deviceServer.run();

	process.nextTick(function()
	{
		callback();
	});

	EventEmitter.call(this);
}

util.inherits(DeviceCollection, EventEmitter);

DeviceCollection.prototype._reset = function(devices)
{
	if (!this._statusRequested) return;

	badger.debug("reset devices", devices);

	this._attrs.devices = [];

	async.forEachSeries(devices, function(data, nextDevice)
	{
		var device = new Device(data, nextDevice);
		this._attrs.devices.push(device);

	}.bind(this),
	function(err)
	{
		if (err) return badger.error(err);
	});

	this._statusRequested = false;
}

DeviceCollection.prototype._add = function(data)
{
	var device = new Device(data, function()
	{
		this._attrs.devices.push(device);
		this.emit("add", device);

		badger.debug("devices after _add:", this._attrs.devices);

	}.bind(this));
}

DeviceCollection.prototype._remove = function(data)
{
	var removedDevice;

	_.some(this._attrs.devices, function(device, index)
	{
		if (device.gdbPort() == data.gdbPort)
		{
			removedDevice = this._attrs.devices.splice(index, 1)[0];
			return true;
		}

		return false;
		
	}.bind(this));

	if (!removedDevice)
	{
		console.log("DeviceCollection: error: tried to remove a device " +
					"we never had in our list");
		return;
	}

	badger.debug("devices after _remove:", this._attrs.devices);

	this.emit("remove", removedDevice);
}

DeviceCollection.prototype._onServerStart = function()
{
	this.emit("started");
}

DeviceCollection.prototype._onServerStop = function()
{
	this.emit("stopped");

	this._attrs.devices = [];
	// TODO: try to restart the device server
}

DeviceCollection.prototype.flash = function(fullFilePath, callback)
{
	this._deviceServer.flash(fullFilePath, callback);
}

DeviceCollection.prototype.toJSON = function()
{
	return this._attrs.devices;
}

module.exports = DeviceCollection;