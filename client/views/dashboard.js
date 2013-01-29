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
		"click #homeButton" : "closeProject",
		"click #settingsButton" : "openSettings"
	},

	initialize: function(options)
	{
		this.projects = options.collection;

		this.projectList = new ProjectList({ collection: this.projects });

		this.projects.fetch();

		this.projectControls = this.$(".projectControls");
		
		this.settings = options.settings;
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
		$("#allowTrack").prop("checked", this.settings.get("allowTracking"));
		
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
			this.settings.set("allowTracking", $("#allowTrack").prop("checked"));
			
			// mixpanel.track("Changed tracking", null, function()
			// {
				this.settings.save(function(err)
				{
					if (!this.settings.get("allowTracking"))
						mixpanel.disable();
						
					enableControls(true);
	
					if (err)
					{
						return errorField.html(err);
					}
	
					dialog.modal("hide");
				}.bind(this));
			//}.bind(this));
		}.bind(this));
	}
	
});

return Dashboard;

});