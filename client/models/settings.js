define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var SettingsModel = Backbone.Model.extend(
{
	initialize: function(options)
	{
		this.socket = io.connect("http://localhost:8000/settings");
	},
	
	fetch: function()
	{
		this.socket.emit("get", function(err, settings)
		{
			if (err) return alert(err);
			
			this.set(settings);
		}.bind(this));
	},
	
	save: function(callback)
	{
		this.socket.emit("save", this.attributes, function(err, settings)
		{
			if (err) return alert(err);
			
			callback();
		}.bind(this));
	}
	
});

return SettingsModel;

});