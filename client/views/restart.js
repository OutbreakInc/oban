define(function(require)
{

var Backbone = require("backbone"),
	App = require("app/app"),
	NewProjectView = require("app/views/new-project");

var RestartView = Backbone.View.extend(
{
	el: "#restartModal",

	events:
	{
		"click .refreshBtn": "onRefresh"
	},

	onRefresh: function()
	{
		location.reload();
	},

	render: function()
	{
		this.$el.modal(
		{
			keyboard: false,
			backdrop: "static"
		});
		
		return this;
	}
});

return RestartView;

});