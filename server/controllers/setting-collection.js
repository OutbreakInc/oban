(function()
{

var Setting = require("../models/setting-collection"),
	Mixins = require("./mixins"),
	_ = require("underscore");

function SettingCollectionController(setting, sockets)
{
	_.bindAll(this);
	
	this.setting = setting;
	this.sockets = sockets.of("/settingCollection");

	this._init();
}

SettingCollectionController.prototype._init = function()
{
	this.sockets.on("connection", function(socket)
	{
		socket.on("get", this._list);

		socket.on("save", function(attrs, callback)
		{
			this.setting.setAttrs(attrs, function(err)
			{
				if (err) return callback(err.message);
	
				this.setting.saveFile(function(err)
				{
					if (err) return callback(err.message);
	
					callback(null);
				});
			}.bind(this));
		}.bind(this));
	}.bind(this));
}

SettingCollectionController.prototype._list = function(callback)
{
	callback(null, this.setting._attrs);
}
module.exports = SettingCollectionController;

}).call(this);