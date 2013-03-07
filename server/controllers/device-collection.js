var _ = require("underscore");

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
			callback(null, this.devices);

		}.bind(this));

	}.bind(this));

	this.devices.on("add", this._onAdd);
	this.devices.on("remove", this._onRemove);
	this.devices.on("stopped", this._onStop);
}

DeviceCollectionController.prototype._onAdd = function(device)
{
	this.sockets.emit("add", device);
}

DeviceCollectionController.prototype._onRemove = function(device)
{
	this.sockets.emit("remove", device);
}

DeviceCollectionController.prototype._onStop = function()
{
	this.sockets.emit("clear");
}

module.exports = DeviceCollectionController;