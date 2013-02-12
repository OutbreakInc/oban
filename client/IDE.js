define(function(require)
{

var $ = require("jquery"),
	ProjectCollection = require("app/models/project-collection"),
	DeviceCollection = require("app/models/device-collection"),
	ErrorCollection = require("app/models/error-collection"),
	SettingCollection = require("app/models/setting-collection"),
	Dashboard = require("app/views/dashboard"),
	WelcomeView = require("app/views/welcome"),
	RestartView = require("app/views/restart"),
	ProjectView = require("app/views/project"),
	ErrorListView = require("app/views/error-list"),
	App = require("app/app");

require("bootstrap");
require("backbone.marionette");

$.fn.highlight = function() {
   $(this).each(function() {
        var el = $(this);
        el.before("<div/>")
        el.prev()
            .width(el.width())
            .height(el.height())
            .css({
                "position": "absolute",
                "background-color": "yellow",
                "opacity": ".9"   
            })
            .fadeOut(700);
    });
}

$.fn.setEnabled = function(isEnabled)
{
	if (isEnabled) 
	{
		$(this).removeAttr("disabled");
	}
	else
	{
		$(this).attr("disabled", "disabled");
	}
}

App.addInitializer(function(options)
{
	this.vent.on("openProject", function(project)
	{
		var openProject = function()
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

				this.vent.off("closeProjectSuccess", openProject);

			}.bind(this));

		}.bind(this);

		if (this.activeProjectView)
		{
			if (this.activeProject.get("name") == project.get("name")) return;

			this.vent.trigger("closeProject");

			this.vent.on("closeProjectSuccess", openProject);
		}
		else
		{
			openProject();
		}

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

			this.activeProjectView.close(function(err)
			{
				delete this.activeProjectView;
				App.Views.welcomeView.setVisible(true);

				if (err) App.error("Close project view error: " + err);

			}.bind(this));

		}.bind(this));

	}.bind(this));
});

App.addInitializer(function(options)
{
	// init collections
	App.Collections = {};

	App.Collections.projects = new ProjectCollection();
	App.Collections.settings = new SettingCollection();
	App.Collections.devices = new DeviceCollection();

	// init views
	App.Views = {};

	App.Views.dashboard = new Dashboard(
	{
		projects: App.Collections.projects,
		settings: App.Collections.settings
	});

	App.Views.welcomeView = new WelcomeView(
	{
		collection: App.Collections.projects
	});

	App.Views.restartView = new RestartView();
});

App.addInitializer(function()
{
	var socket = io.connect("http://localhost:8000");

	socket.on("disconnect", function()
	{
		App.Views.restartView.render();
	});
});

App.error = function(message, line)
{
	alert(message);
	// App.Collections.errors.add({ message: message, line: line });
}

App.start();

});