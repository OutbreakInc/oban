define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

var ProjectNameView = Backbone.View.extend(
{
	className: "projectRename",

	template: _.template($("#projectRenameTemplate").html()),

	events:
	{
		"click .doneRenamingBtn": "onDone"
	},

	initialize: function(options)
	{
		this.project = options.model;
	},

	render: function()
	{
		this.$el.html(this.template());
		this.$(".projectRenameInput").focus();		
		return this;
	},

	onDone: function()
	{
		this.project.rename(function(err)
		{
			if (err) return alert(err);

			this.project.


		}.bind(this));
	}
});

return ProjectNameView;

});