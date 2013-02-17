define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var DeviceModel = Backbone.Model.extend(
{
	initialize: function()
	{
		this.on("remove", this.onRemove, this);
		this.socket = io.connect("http://localhost:8000/device");
	},

	onRemove: function()
	{
		this.trigger("destroy");
	},

	open: function(callback)
	{
		this.socket.emit("open", this.get("serialNumber"), function(err, device)
		{
			if (err) return alert(err);

			this._setIfIdMatches(device);
			callback(null, this);

		}.bind(this));
	},

	close: function(callback)
	{
		if (!this.has("isOpenBy")) return;
		else if (!this._isOpenByMe()) 
		{
			return callback("Device is open by someone else");
		}

		this.socket.emit("close", this.get("serialNumber"), function(err, device)
		{
			if (err) return callback(err);

			this._setIfIdMatches(device);
			callback(null, this);

		}.bind(this));
	},

	_setIfIdMatches: function(project)
	{
		if (project.id != this.id) return;

		this.clear({ silent: true });
		this.set(project);
	},

	_isOpenByMe: function()
	{
		var openBy = this.get("isOpenBy");
		return (openBy && openBy == this.socket.socket.sessionid);
	}	
});

return DeviceModel;

});
