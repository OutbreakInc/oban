define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	App = require("app/app");

require("backbone.marionette");

var NewProjectView = Backbone.View.extend(
{
	el: "#newProjectModal",

	events:
	{
		"click .createProjectBtn": "onCreate"
	},

	initialize: function(options)
	{
		this.projects = this.collection;
		_.bindAll(this);

		this.bindEvents();
	},

	bindEvents: function()
	{	
		this.$el.on("shown", this.focusInput);
	},

	unbindEvents: function()
	{
		this.$el.off("shown", this.focusInput);
		this.undelegateEvents();
	},

	focusInput: function()
	{
		this.$(".projectName").focus();
	},

	render: function()
	{
		this.$el.modal();
		return this;
	},

	enableControls: function(isEnabled)
	{
		this.$(".projectName").prop("disabled", !isEnabled);
		this.$(".createProject").prop("disabled", !isEnabled);
	},

	clearInputs: function()
	{
		this.$(".error").empty();
		this.$(".projectName").val("");
	},

	onCreate: function()
	{
		this.enableControls(false);
		console.log("WAR");

		var name = this.$(".projectName").val();
		
		mixpanel.track("project:create");

		this.projects.create(name, function(err, project)
		{
			this.enableControls(true);

			if (err) return this.$(".error").html(err);

			this.$el.modal("hide");
			this.clearInputs();
			this.unbindEvents();

			// now open this project
			App.vent.trigger("openProject", project);

		}.bind(this));
	}
});

return NewProjectView;

});