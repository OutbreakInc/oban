var _ = require("underscore");

var CANT_START_BINARY = "The debugger can't be started",
	SERVER_EXITED = "The debugger has exited for an unknown reason";

function DeviceCollectionController(deviceCollection, sockets)
{
	_.bindAll(this);
	
	this.sockets = sockets.of("/deviceCollection");

	this.devices = deviceCollection;

	this._init();
}

DeviceCollectionController.prototype._init = function()
{
	this.sockets.on("connection", function(socket)
	{
		socket.on("list", function(callback)
		{
			if (this.devices.isServerInvalid())
			{
				return callback(CANT_START_BINARY);
			}

			callback(null, this.devices);

		}.bind(this));

	}.bind(this));

	this.devices.on("add", this._onAdd);
	this.devices.on("remove", this._onRemove);
	this.devices.on("reset", this._onReset);
	this.devices.on("stopped", this._onStop);
	this.devices.on("cantStart", this._onCantStart);
}

DeviceCollectionController.prototype._onAdd = function(device)
{
	this.sockets.emit("add", device);
}

DeviceCollectionController.prototype._onRemove = function(device)
{
	this.sockets.emit("remove", device);
}

DeviceCollectionController.prototype._onReset = function(devices)
{
	this.sockets.emit("reset", devices);
}

DeviceCollectionController.prototype._onStop = function()
{
	this.sockets.emit("clear");
	this.sockets.emit("error", SERVER_EXITED);
}

DeviceCollectionController.prototype._onCantStart = function()
{
	this.sockets.emit("error", CANT_START_BINARY);
}

module.exports = DeviceCollectionController;