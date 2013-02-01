define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

require("bootstrap-editable");

var ProjectNameView = Backbone.View.extend(
{
	className: "projectName",

	template: _.template($("#projectNameTemplate").html()),

	initialize: function(options)
	{
		_.bindAll(this);
		this.project = options.model;

		this.listenTo(this.project, "change", this.render);
	},

	render: function()
	{
		this.$el.html(this.template(this.project.toJSON()));
		
		this.nameEdit = this.$(".name").editable(
		{ 
			mode: "inline", display: false, clear: false
		});

		this.nameEdit.on("save", this.onRename);

		return this;
	},

	onRename: function(e, params)
	{
		this.project.rename(params.newValue, function(err)
		{
			if (err) return alert(err);

			this.nameEdit.editable("setValue", this.project.get("name"));

		}.bind(this));
	}
});

return ProjectNameView;

});