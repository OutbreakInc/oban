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
		this.socket = io.connect("http://localhost:8000/settingCollection");

		_.bindAll(this);

		this._bindEvents();
	},

	fetch: function()
	{
		console.log("fetch")
		this.socket.emit("get", function(err, settings)
		{
			if (err) return alert(err);
			console.log("fetch", JSON.stringify(settings.collection))
			this.reset(settings.collection);
		}.bind(this));
	},

	save: function(callback)
	{
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