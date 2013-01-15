define(function(require)
{

var Backbone = require("backbone"),
	Project = require("app/models/project");

var ProjectCollection = Backbone.Collection.extend(
{
	model: Project,

	initialize: function(options)
	{
		this.socket = options.socket;
	},

	create: function(name, callback)
	{
		this.socket.emit("add", name, function(err, project)
		{
			if (err) return callback(err);

			this.add(project);
			callback(null, project);

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