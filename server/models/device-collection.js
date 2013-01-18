var Device = require("./device"),
	DeviceServer = require("../device-server"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
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
	this._deviceServer.run();

	this._deviceServer.on("connect", this._add);
	this._deviceServer.on("disconnect", this._remove);

	// TODO: add a timeout for waiting for the device server to
	// start
	this._deviceServer.on("started", function()
	{
		callback();
	});

	this._deviceServer.on("stopped", this._onServerStop);

	EventEmitter.call(this);
}

util.inherits(DeviceCollection, EventEmitter);

DeviceCollection.prototype._add = function(id, name)
{
	var device = new Device(
	{
		deviceId: id,
		name: name
	});

	this._attrs.devices.push(device);
	this.emit("add", device);
}

DeviceCollection.prototype._remove = function(id, name)
{
	var removedDevice;

	_.some(this._attrs.devices, function(device, index)
	{
		if (device.deviceId() == id)
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

	this.emit("remove", removedDevice);
}

DeviceCollection.prototype._onServerStop = function()
{
	this.emit("stopped");

	// TODO: try to restart the device server
}

DeviceCollection.prototype.toJSON = function()
{
	return this._attrs.devices;
}

module.exports = DeviceCollection;