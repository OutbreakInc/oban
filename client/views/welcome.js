define(function(require)
{

var Backbone = require("backbone");

var WelcomeView = Backbone.View.extend(
{
	el: ".welcomeView",

	events:
	{
		"click .newProjectBtn": "createProject"
	},

	initialize: function(options)
	{
		this.projectsSocket = options.projectsSocket;
		this.projects = options.collection;
	},

	createProject: function()
	{
		var dialog = $("#newProjectModal");

		dialog.modal();

		var inputField = $("#newProjectModal .projectName");
		var errorField = $("#newProjectModal .error");
		var createBtn = $(".createProject");

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

			this.projects.create(name, function(err, project)
			{
				enableControls(true);

				if (err)
				{
					return errorField.html(err);
				}

				dialog.modal("hide");

				// now open this project
				// something.emit("open", project);

			}.bind(this));
		}.bind(this));

		dialog.on("hidden", clearInputs);
	}
});

return WelcomeView;

});