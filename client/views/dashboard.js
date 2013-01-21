define(function(require)
{

var Backbone = require("backbone"),
	ProjectList = require("app/views/project-list"),
	App = require("app/app");

var Dashboard = Backbone.View.extend(
{
	el: ".topbarContainer",

	events:
	{
		"click #homeButton" : "closeProject"
	},

	initialize: function(options)
	{
		this.projects = options.collection;

		this.projectList = new ProjectList({ collection: this.projects });

		this.projects.fetch();

		this.projectControls = this.$(".projectControls");

		App.vent.on("openProjectSuccess", function()
		{
			this.projectControls.removeAttr("hidden");

		}.bind(this));

		App.vent.on("closeProjectSuccess", function()
		{
			this.projectControls.attr("hidden", "hidden");
			
		}.bind(this));
	},

	closeProject: function(e)
	{
		App.vent.trigger("closeProject");
		return false;
	}
});

return Dashboard;

});