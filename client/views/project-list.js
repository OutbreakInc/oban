define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

var ProjectListItem = Backbone.View.extend(
{
	tagName: "li",

	template: _.template($("#projectListTemplate").html()),

	events:
	{
		"click .projectListItem": "openProject"
	},

	initialize: function(options)
	{
		this.project = options.model;
		this.listenTo(this.project, "all", this.render);
		this.listenTo(this.project, "destroy", this.remove);
	},

	render: function()
	{
		this.$el.html(this.template(this.project.toJSON()));

		if (this.project.get("isOpen"))
		{
			this.$el.addClass("text-error");
		}

		return this;
	},

	openProject: function()
	{
		

	}
});

var ProjectList = Backbone.View.extend(
{
	el: "#projectList",

	initialize: function(options)
	{
		this.projects = options.collection;

		this.listenTo(this.projects, "reset", this.addAll);
		this.listenTo(this.projects, "add", this.addOne);

		_.bindAll(this);
	},

	addAll: function()
	{
		this.projects.each(this.addOne);
	},

	addOne: function(project)
	{
		var view = new ProjectListItem({ model: project });

		this.$el.append(view.render().el);
	}
});

return ProjectList;

});