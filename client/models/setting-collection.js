define(function(require)
{

var Backbone = require("backbone"),
	Setting = require("app/models/setting"),
	io = require("socket.io");

var SettingCollection = Backbone.Collection.extend(
{
	model: Setting,

	initialize: function(options)
	{
		this.socket = io.connect("/settingCollection");

		_.bindAll(this);

		this._bindEvents();
	},

	fetch: function()
	{
		this.socket.emit("get", function(err, settings)
		{
			if (err) return alert(err);
			this.reset(settings.collection);
		}.bind(this));
	},

	sync: function(callback)
	{
		mixpanel.track("settings:save");
		this.socket.emit("save", this.models, function(err, settings)
		{
			if (err) return alert(err);
			
			callback();
		}.bind(this));
	},

	_bindEvents: function()
	{
		this.socket.on("add", this.add);
		this.socket.on("remove", this.remove);
	}
});

return SettingCollection;

});