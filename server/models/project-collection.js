var Project = require("./project"),
	fs = require("fs"),
	async = require("async"),
	Step = require("step"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	utils = require("../utils");

function ProjectCollection()
{
	var self = this;
	self._attrs = {};
	self._attrs.projects = [];

	// load all projects
	fs.readdir(utils.projectsDir(), function(err, files)
	{
		if (err) return self.emit("error", err);

		async.forEachSeries(files, function(file, next)
		{
			var project = new Project({ name: file });

			project.on("loaded", function()
			{
				self._attrs.projects.push(project);
				next();
			});

			project.on("error", function(err)
			{
				// just skip invalid project directories
				// and go on
				console.log("Error while loading project:");
				console.log(err);
				next();
			});
		},
		function(err)
		{
			if (err) return self.emit("error", err);

			self.emit("loaded");
		});
	});

	EventEmitter.call(this);
}

util.inherits(ProjectCollection, EventEmitter);

ProjectCollection.prototype.toJSON = function()
{
	return this._attrs;
}

// var projects = new ProjectCollection;

// projects.on("error", function(err)
// {
// 	console.log(err);
// });

// projects.on("loaded", function()
// {
// 	console.log(JSON.stringify(projects, null, "\t"));

// });