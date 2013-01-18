function DeviceCollectionController(deviceCollection, sockets)
{
	// this.devices = deviceCollection;
	this.sockets = sockets.of("/deviceCollection");

	this.devices = 
	[
		{
			id: "1",
			deviceId: "0x1234",
			name: "Galago"
		},
		{
			id: "2",
			deviceId: "0xDEAD",
			name: "Blacksheep"
		}
	];

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

		setTimeout(function()
		{
			socket.emit("remove", this.devices[0]);

			setTimeout(function()
			{
				socket.emit("add", this.devices[0]);

			}.bind(this), 1000);

		}.bind(this), 1000);


	}.bind(this));
}

module.exports = DeviceCollectionController;