define(function(require)
{

var Backbone = require("backbone");

var ProgressView = Backbone.View.extend(
{
	initialize: function()
	{
		this.progress = this.$(".progress");
		this.progressBar = this.$(".progress .bar");
	},

	setSuccess: function(isSuccess)
	{	
		this.$(".progress .bar").addClass(isSuccess ? "bar-success" : "bar-danger");
		this.$(".progress").removeClass("progress-striped active");
	},

	setVisible: function(isVisible)
	{
		this.$el.stop();

		if (isVisible)
		{
			this.$el.fadeIn("fast");
		}
		else
		{
			this.$el.delay(2000).fadeOut("slow", function()
			{
				this.progressBar.removeClass("bar-success bar-danger");
				this.progress.addClass("progress-striped active");
			}.bind(this));
		}
	},

	setText: function(text)
	{
		this.progressBar.text(text);
	}
});

return ProgressView;

});