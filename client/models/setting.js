define(function(require)
{

var Backbone = require("backbone");

var SettingModel = Backbone.Model.extend(
{
	initialize: function()
	{
		this.on("remove", this.onRemove, this);
	},

	onRemove: function()
	{
		this.trigger("destroy");
	}		
});

return SettingModel;

});