define(function(require)
{

var Backbone = require("backbone"),
	ProjectList = require("app/views/project-list");

var Dashboard = Backbone.View.extend(
{
	el: ".topbarContainer",

	initialize: function(options)
	{
		this.projects = options.collection;

		this.projectList = new ProjectList({ collection: this.projects });

		this.projects.fetch();
	}
});

return Dashboard;

});