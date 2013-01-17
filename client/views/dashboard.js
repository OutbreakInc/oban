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
		"click .closeProject" : "closeProject"
	},

	initialize: function(options)
	{
		this.projects = options.collection;

		this.projectList = new ProjectList({ collection: this.projects });

		this.projects.fetch();

		App.vent.on("openProjectSuccess", function()
		{
			this.$(".closeProject").removeAttr("hidden");

		}.bind(this));

		App.vent.on("closeProjectSuccess", function()
		{
			this.$(".closeProject").attr("hidden", "hidden");
			
		}.bind(this));
	},

	closeProject: function()
	{
		App.vent.trigger("closeProject");
	}
});

return Dashboard;

});