define(function(require)
{

var $ = require("jquery"),
	ProjectCollection = require("app/models/project-collection"),
	DeviceCollection = require("app/models/device-collection"),
	Dashboard = require("app/views/dashboard"),
	WelcomeView = require("app/views/welcome"),
	ProjectView = require("app/views/project"),
	App = require("app/app");

require("bootstrap");
require("backbone.marionette");

App.addInitializer(function(options)
{
	this.vent.on("openProject", function(project)
	{
		project.open(function(err)
		{
			if (err) return alert("Open project error: " + err);

			this.vent.trigger("openProjectSuccess");
			this.activeProject = project;

			this.activeProjectView = new ProjectView(
			{
				model: this.activeProject,
				devices: App.devices
			});

		}.bind(this));

	}.bind(this));

	this.vent.on("closeProject", function()
	{
		if (!this.activeProject)
		{
			return console.log(	"error: tried to close a project when no " +
								" project was open");
		}

		this.activeProject.close(function(err)
		{
			if (err) return alert("Close project error: " + err);

			this.vent.trigger("closeProjectSuccess");
			delete this.activeProject;

			this.activeProjectView.close();

		}.bind(this));

	}.bind(this));
});

App.start();

App.projects = new ProjectCollection();
App.devices = new DeviceCollection();

var dashboard = new Dashboard(
{
	collection: App.projects
});

var welcomeView = new WelcomeView(
{
	collection: App.projects
});

});