define(function(require)
{

var Backbone = require("backbone"),
	ProjectList = require("app/views/project-list"),
	SettingList = require("app/views/setting-list"),
	App = require("app/app");

var Dashboard = Backbone.View.extend(
{
	el: ".topbarContainer",

	events:
	{
		"click #homeButton" : "closeProject",
		"click #settingsButton" : "openSettings"
	},

	initialize: function(options)
	{
		this.projects = options.projects;

		this.projectList = new ProjectList({ collection: this.projects });

		this.projects.fetch();

		this.projectControls = this.$(".projectControls");
		
		this.settings = options.settings;
		this.settingsList = new SettingList({ collection: this.settings });
		this.settings.fetch();
		
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
	},
	
	openSettings: function(e)
	{
		//hack, not sure how to tie into new templates
		
		var dialog = $("#userSettingsModal");
		var saveBtn = $(".saveBtn");
	
		dialog.modal();
		
		var enableControls = function(isEnabled)
		{
			saveBtn.prop("disabled", !isEnabled);
		}
		
		saveBtn.click(function()
		{
			enableControls(false);
			
			mixpanel.track("Changed tracking");
			this.settings.save(function(err)
			{
				// if (!this.settings.get("allowTracking"))
				// 				mixpanel.disable();
					
				enableControls(true);

				if (err)
				{
					return errorField.html(err);
				}

				dialog.modal("hide");
				saveBtn.off();
			}.bind(this));
		}.bind(this));
	}
	
});

return Dashboard;

});