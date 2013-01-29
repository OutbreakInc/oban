(function()
{

var Settings = require("../models/settings"),
	Mixins = require("./mixins"),
	_ = require("underscore");

function SettingsController(settings, sockets)
{
	_.bindAll(this);
	
	this.settings = settings;
	this.sockets = sockets.of("/settings");

	this._init();
}

SettingsController.prototype._init = function()
{
	this.sockets.on("connection", function(socket)
	{
		socket.on("get", this._list);

		socket.on("save", function(attrs, callback)
		{
			this.settings.setAttrs(attrs, function(err)
			{
				if (err) return callback(err.message);
	
				this.settings.saveFile(function(err)
				{
					if (err) return callback(err.message);
	
					callback(null);
				});
			}.bind(this));
		}.bind(this));
	}.bind(this));
}

SettingsController.prototype._list = function(callback)
{
	callback(null, this.settings._attrs);
}
module.exports = SettingsController;

}).call(this);