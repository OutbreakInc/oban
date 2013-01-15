define(function(require)
{

var $ = require("jquery"),
	ProjectCollection = require("app/models/project-collection"),
	Dashboard = require("app/views/dashboard"),
	WelcomeView = require("app/views/welcome"),
	App = require("app/app");

require("bootstrap");
require("backbone.marionette");

App.addInitializer(function(options)
{
	this.vent.on("openProject", function(project)
	{
		project.open(function(err)
		{
			if (err) return alert("ERROR: " + err);

			
		});

		// alert("opening project " + project.get("name"));
	});
});

App.start();

var projects = new ProjectCollection();

var dashboard = new Dashboard(
{
	collection: projects
});

var welcomeView = new WelcomeView(
{
	collection: projects
});

});