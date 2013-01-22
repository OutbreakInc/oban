define(function(require)
{

var $ = require("jquery"),
	ProjectCollection = require("app/models/project-collection"),
	DeviceCollection = require("app/models/device-collection"),
	ErrorCollection = require("app/models/error-collection"),
	Dashboard = require("app/views/dashboard"),
	WelcomeView = require("app/views/welcome"),
	ProjectView = require("app/views/project"),
	ErrorListView = require("app/views/error-list"),
	App = require("app/app");

require("bootstrap");
require("backbone.marionette");

App.addInitializer(function(options)
{
	this.vent.on("openProject", function(project)
	{
		project.open(function(err)
		{
			if (err) return App.error("Open project error: " + err);

			this.vent.trigger("openProjectSuccess");
			this.activeProject = project;

			this.activeProjectView = new ProjectView(
			{
				model: this.activeProject,
				devices: App.Collections.devices
			});

			App.Views.welcomeView.setVisible(false);

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
			if (err) return App.error("Close project error: " + err);

			this.vent.trigger("closeProjectSuccess");
			delete this.activeProject;

			this.activeProjectView.close();
			delete this.activeProjectView;

			App.Views.welcomeView.setVisible(true);

		}.bind(this));

	}.bind(this));
});

App.addInitializer(function(options)
{
	// init collections
	App.Collections = {};

	App.Collections.projects = new ProjectCollection();
	App.Collections.devices = new DeviceCollection();
	App.Collections.errors = new ErrorCollection();

	// init views
	App.Views = {};

	App.Views.dashboard = new Dashboard(
	{
		collection: App.Collections.projects
	});

	App.Views.welcomeView = new WelcomeView(
	{
		collection: App.Collections.projects
	});

	App.Views.errorListView = new ErrorListView(
	{
		collection: App.Collections.errors
	});

	$(".errorsView").append(App.Views.errorListView.render().el);
});


App.error = function(message, line)
{
	App.Collections.errors.add({ message: message, line: line });
}

App.start();

});