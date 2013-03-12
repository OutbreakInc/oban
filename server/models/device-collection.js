var Device = require("./device"),
	DeviceServer = require("../device-server"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	badger = require("badger")(__filename),
	async = require("async"),
	_ = require("underscore");

var Errors =
{
	NO_SUCH_DEVICE: "No such device"
};

function DeviceCollection(options, callback)
{
	// on initialization, start a device server
	// and find all connected devices

	options = options || {};

	_.bindAll(this);

	this._attrs = {};
	this._attrs.devices = [];

	this._deviceServer = new DeviceServer(function()
	{
		this._deviceServer.on("connect", this._add);
		this._deviceServer.on("disconnect", this._remove);

		this._deviceServer.on("list", this._reset);

		this._deviceServer.on("started", this._onServerStart);
		this._deviceServer.on("stopped", this._onServerStop);

		this._deviceServer.on("error", badger.error);

		this._deviceServer.on("cantStart", this._onServerInvalid);

		this._gotStatusRequest = false;

		this._deviceServer.run();

		callback();
		
	}.bind(this));

	EventEmitter.call(this);
}

util.inherits(DeviceCollection, EventEmitter);

DeviceCollection.Errors = Errors;

DeviceCollection.prototype._reset = function(devices)
{
	// only process one status request per run of the device server
	// if device server restarts, then we can accept another one
	if (this._gotStatusRequest) return;

	this._gotStatusRequest = true;

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

		this.emit("reset", this._attrs.devices);

	}.bind(this));
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
	badger.debug("device server stopped!");

	this.emit("stopped");

	this._attrs.devices = [];
	this._gotStatusRequest = false;
}

DeviceCollection.prototype._onServerInvalid = function()
{
	badger.debug("device server binary invalid!");

	this._attrs.isServerInvalid = true;
	this.emit("cantStart");
	this._gotStatusRequest = false;
}

DeviceCollection.prototype.findBySerial = function(serialNumber)
{
	return _.find(this._attrs.devices, function(device)
	{
		return (device.serialNumber() == serialNumber);
	});
}

DeviceCollection.prototype.flash = function(serialNumber, fullFilePath, callback)
{
	var device = this.findBySerial(serialNumber);

	if (!device) return callback(Errors.NO_SUCH_DEVICE);

	this._deviceServer.flash(device.toJSON(), fullFilePath, callback);
}

DeviceCollection.prototype.isServerInvalid = function()
{
	return this._attrs.isServerInvalid;
}

DeviceCollection.prototype.toJSON = function()
{
	return this._attrs.devices;
}

module.exports = DeviceCollection;