define(function(require)
{

var Backbone = require("backbone"),
	App = require("app/app"),
	NewProjectView = require("app/views/new-project");

var WelcomeView = Backbone.View.extend(
{
	el: ".welcomeView",

	events:
	{
		"click .newProjectBtn": "createProject"
	},

	initialize: function(options)
	{
		this.projects = options.collection;
	},

	setVisible: function(isVisible)
	{
		if (isVisible)
		{
			this.$el.removeClass("hide");
		}
		else
		{
			this.$el.addClass("hide");
		}
	},

	createProject: function()
	{
		var newProjectView = new NewProjectView(
		{ 
			collection: this.projects 
		});

		newProjectView.render();
	}
});

return WelcomeView;

});