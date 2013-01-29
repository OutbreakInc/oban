define(function(require)
{

var Backbone = require("backbone"),
	App = require("app/app");

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
		var dialog = $("#newProjectModal");

		dialog.modal();

		var inputField = $("#newProjectModal .projectName");
		var errorField = $("#newProjectModal .error");
		var createBtn = $(".createProject");

		dialog.on("shown", function()
		{
			inputField.focus();
		});

		var enableControls = function(isEnabled)
		{
			inputField.prop("disabled", !isEnabled);
			createBtn.prop("disabled", !isEnabled);
		}

		var clearInputs = function()
		{
			errorField.empty();
			inputField.val("");			
		}
		
		createBtn.click(function()
		{
			enableControls(false);

			var name = inputField.val();
			
			mixpanel.track("Created project", null, function()
			{
				this.projects.create(name, function(err, project)
				{
					enableControls(true);

					if (err)
					{
						return errorField.html(err);
					}

					dialog.modal("hide");

					// now open this project
					App.vent.trigger("openProject", project);
					// something.emit("open", project);

				}.bind(this));
			}.bind(this));
		}.bind(this));

		dialog.on("hidden", clearInputs);
	}
});

return WelcomeView;

});