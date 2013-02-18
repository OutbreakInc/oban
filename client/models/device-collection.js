define(function(require)
{

var Backbone = require("backbone"),
	Device = require("app/models/device"),
	io = require("socket.io");

var DeviceCollection = Backbone.Collection.extend(
{
	model: Device,

	initialize: function(options)
	{
		this.socket = io.connect("/deviceCollection");

		_.bindAll(this);

		this._bindEvents();
	},

	_bindEvents: function()
	{
		this.socket.on("add", this.add);
		this.socket.on("remove", this.remove);
		this.socket.on("clear", this.reset);
	},

	fetch: function()
	{
		this.socket.emit("list", function(err, devices)
		{
			if (err) return alert(err);

			this.reset(devices);

		}.bind(this));
	}
});

return DeviceCollection;

});