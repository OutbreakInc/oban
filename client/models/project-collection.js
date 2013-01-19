define(function(require)
{

var Backbone = require("backbone"),
	Project = require("app/models/project"),
	io = require("socket.io");

var ProjectCollection = Backbone.Collection.extend(
{
	model: Project,

	initialize: function(options)
	{
		this.socket = io.connect("http://localhost:8000/projectCollection");
	},

	create: function(name, callback)
	{
		this.socket.emit("add", name, function(err, project)
		{
			if (err) return callback(err);

			var projectModel = new Project(project);

			this.add(projectModel);
			callback(null, projectModel);

		}.bind(this));
	},

	fetch: function()
	{
		this.socket.emit("list", function(err, projects)
		{
			this.reset(projects);

		}.bind(this));
	}

});

return ProjectCollection;

});