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
		this.socket.on("clear", this.removeModels);
		this.socket.on("reset", this.reset);
		this.socket.on("error", this.onError);
	},

	removeModels: function()
	{
		this.forEach(function(model)
		{
			this.remove(model);

		}.bind(this));
	},

	fetch: function()
	{
		this.socket.emit("list", function(err, devices)
		{
			if (err) return this.onError(err);

			this.reset(devices);

		}.bind(this));
	},

	onError: function(err)
	{
		this.trigger("error", err);
	}
});

return DeviceCollection;

});