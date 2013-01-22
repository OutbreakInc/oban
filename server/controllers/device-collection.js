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

		socket.on("flash", function(project, callback)
		{
			this.devices.flash(project.path() + "/" + project.files[0].name(),
			function()
			{
				callback();
			});

		}.bind(this));

	}.bind(this));

	this.devices.on("add", this._onAdd);
	this.devices.on("remove", this._onRemove);
}

DeviceCollectionController.prototype._onAdd = function(device)
{
	this.sockets.emit("add", device);
}

DeviceCollectionController.prototype._onRemove = function(device)
{
	this.sockets.emit("remove", device);
}

module.exports = DeviceCollectionController;