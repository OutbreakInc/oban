define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	App = require("app/app");

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
		this.listenTo(this.project, "change", this.render);
		this.listenTo(this.project, "destroy", this.remove);
	},

	render: function()
	{
		this.$el.html(this.template(this.project.toJSON()));
		console.log("render!");

		if (this.project.has("isOpenBy"))
		{
			console.log("isOpenBy");
			this.$(".projectListItem").text(this.project.get("name") + "*");
		}

		return this;
	},

	openProject: function()
	{	
		mixpanel.track("project:open");
		App.vent.trigger("openProject", this.project);
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
		this.listenTo(this.projects, "remove", this.onRemove);

		_.bindAll(this);
	},

	addAll: function()
	{
		this.$el.empty();
		this.projects.each(this.addOne);
	},

	addOne: function(project)
	{
		var view = new ProjectListItem({ model: project });

		this.$el.append(view.render().el);
	},

	onRemove: function(project)
	{	
		this.projects.remove(project);
	}
});

return ProjectList;

});