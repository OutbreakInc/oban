var _ = require("underscore"),
	CollectionErrors = require("../models/device-collection").Errors,
	EventListener = require("../event-listener"),
	badger = require("badger")(__filename),
	_ = require("underscore");

var Errors =
{
	CLIENT_HAS_OPEN_DEVICE: "You already have a device open"
};	

function DeviceController(deviceCollection, sockets)
{
	_.bindAll(this);
	
	this.sockets = sockets.of("/device");
	this.devices = deviceCollection;

	this._init();
}

_.extend(DeviceController.prototype, EventListener);

DeviceController.prototype.events =
{
	"open": "onOpen",
	"close": "onClose" 
}

DeviceController.prototype._init = function()
{
	this.listenTo(this.sockets, "connection", function(socket)
	{
		badger.debug("got a socket connection");

		_.forEach(this.events, function(handler, event)
		{
			socket.on(event, this.findDevice(socket, this[handler]));

		}, this);

	}.bind(this));

	this._disconnectListeners = {};
	this._socketOpenDevices = {};

	this.listenTo(this.devices, "stopped", this.onServerStopped);	
}

DeviceController.prototype.findDevice = function(socket, handler)
{
	return function()
	{
		arguments = Array.prototype.slice.call(arguments);

		var callback = arguments[arguments.length - 1];

		var device = this.devices.findBySerial(arguments[0]);

		if (!device) return callback(CollectionErrors.NO_SUCH_DEVICE);

		// replace id parameter with resolved device
		arguments[0] = device;

		// add socket as first argument
		arguments.unshift(socket);

		handler.apply(this, arguments);

	}.bind(this);
}

DeviceController.prototype.onOpen = function(socket, device, callback)
{
	if (this._socketOpenDevices[socket.id])
	{
		return callback(Errors.CLIENT_HAS_OPEN_DEVICE);
	}

	device.open(socket.id, function(err)
	{
		if (err) return callback(err.message);

		callback(null, device);
		socket.broadcast.emit("open", device);

		// TODO: closeDeviceFn does not get properly removed when a client closes
		// a project, fix this later
		var closeDeviceFn = function()
		{
			device.close();
			delete this._socketOpenDevices[socket.id];
			this.sockets.emit("close", device);

			badger.debug(	"closed device " + device.serialNumber() + 
							"(client disconnected)");

			this.stopListening(this.devices, "remove", unplugDeviceFn);

		}.bind(this);

		var unplugDeviceFn = function(removedDevice)
		{
			if (removedDevice.serialNumber() != device.serialNumber()) return;

			device.close();
			delete this._socketOpenDevices[socket.id];

			badger.debug(	"closed device " + device.serialNumber() + 
							"(device unplugged)");

			this.stopListening(this.devices, "remove", unplugDeviceFn);

		}.bind(this);

		this.listenTo(socket, "disconnect", closeDeviceFn);
		this.listenTo(this.devices, "remove", unplugDeviceFn);

		this._disconnectListeners[device.serialNumber()] = closeDeviceFn;
		this._socketOpenDevices[socket.id] = device;

	}.bind(this));
}

DeviceController.prototype.onServerStopped = function()
{
	this._disconnectListeners = {};
	this._socketOpenDevices = {};

	// remove all unplug device callbacks
	this.stopListening(this.devices, "remove");

}

DeviceController.prototype.onClose = function(socket, device, callback)
{
	badger.debug("onClose: " + device.serialNumber());
	device.close();

	callback(null, device);
	socket.broadcast.emit("close", device);

	delete this._socketOpenDevices[socket.id];

	var serial = device.serialNumber();

	if (this._disconnectListeners[serial])
	{
		badger.debug("removing disconnect listener since device is closed");
		socket.removeListener("disconnect", this._disconnectListeners[serial]);
	}
}

module.exports = DeviceController;