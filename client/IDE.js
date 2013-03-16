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
	App = require("app/app"),
	io = require("socket.io");

require("bootstrap");
require("backbone.marionette");

$.fn.setEnabled = function(isEnabled)
{
	if (isEnabled) 
	{
		$(this).removeAttr("disabled").removeClass("disabled");
	}
	else
	{
		$(this).attr("disabled", "disabled").addClass("disabled");
	}
}

$.fn.setLoading = function(isLoading)
{
	// if loading, disable button and set its text to its data loading attribute
	var data = $(this).data(),
		$el = $(this);

	var state = (isLoading ? "loading" : "reset") + "Text";

	data.resetText || $el.data("resetText", $el.html());
	var text = data[state] || "Loading...";
	$el.html(text);
	$el.setEnabled(!isLoading);
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
			if (this.activeProject.get("name") == project.get("name") &&
				this.activeProject.get("owner") == project.get("owner")) 
			{
				console.log("tried to open project that we already have open, ignoring action");
				return;
			}

			var switchingProject = true;

			this.vent.trigger("closeProject", switchingProject);

			this.vent.on("closeProjectSuccess", openProject);
		}
		else
		{
			openProject();
		}

	}.bind(this));

	this.vent.on("closeProject", function(switchingProject)
	{
		if (!this.activeProject)
		{
			return console.log(	"error: tried to close a project when no " +
								" project was open");
		}

		this.activeProject.close(function(err)
		{
			if (err) return App.error("Close project error: " + err);

			this.activeProjectView.close(function(err)
			{
				delete this.activeProjectView;

				// don't show welcome view if switching to another project
				// in order to prevent flicker
				if (!switchingProject)
				{
					App.Views.welcomeView.setVisible(true);
				}

				if (err) App.error("Close project view error: " + err);

				this.vent.trigger("closeProjectSuccess");
				delete this.activeProject;

			}.bind(this));

		}.bind(this));

	}.bind(this));
});

App.addInitializer(function()
{
	$(document).keydown(function(event)
	{
		// Make sure backspace key doesn't trigger page navigation.
		if (event.keyCode === 8)
		{
			var doPrevent = false;

			if (event.keyCode === 8) 
			{
				var d = event.srcElement || event.target;
				if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD')) 
					|| d.tagName.toUpperCase() === 'TEXTAREA') 
				{
					doPrevent = d.readOnly || d.disabled;
				}
				else 
				{
					doPrevent = true;
				}
			}

			if (doPrevent) event.preventDefault();
		}
		// Make sure escape key doesn't kill the socket.io connection on Firefox
		else if (event.keyCode === 27)
		{
			event.preventDefault();
		}
	});
});

App.addInitializer(function(options)
{
	// init collections
	App.Collections = {};

	App.Collections.projects = new ProjectCollection();
	// App.Collections.settings = new SettingCollection();
	App.Collections.devices = new DeviceCollection();

	// init views
	App.Views = {};

	App.Views.dashboard = new Dashboard(
	{
		projects: App.Collections.projects,
		// settings: App.Collections.settings
	});

	App.Views.welcomeView = new WelcomeView(
	{
		collection: App.Collections.projects
	});

	App.Views.restartView = new RestartView();
});

App.addInitializer(function()
{
	var socket = io.connect();

	socket.on("disconnect", function()
	{
		socket.disconnect();
		App.Views.restartView.render();
	});
});

App.addInitializer(function()
{
	// set up version number
	var socket = io.connect("/version");

	$version = $(".versionText");

	socket.emit("version", function(err, version)
	{
		if (err) return $version.text("Couldn't retrieve version");

		$version.text("v" + version);
	});
});

App.error = function(message, line)
{
	alert(message);
	// App.Collections.errors.add({ message: message, line: line });
}

App.start();

});