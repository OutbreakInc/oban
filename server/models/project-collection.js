var Project = require("./project"),
	fs = require("fs"),
	async = require("async"),
	Side = require("sidestep"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	utils = require("../utils");

function ProjectCollection(callback)
{
	var self = this;
	self._attrs = {};
	self._attrs.projects = [];

	// load all projects
	fs.readdir(utils.projectsDir(), function(err, files)
	{
		if (err) return callback(err);

		async.forEachSeries(files, function(file, next)
		{
			var project = new Project(
				{ name: file, dir: utils.projectsDir() },
				function(err)
				{
					if (err)
					{
						// just skip invalid project directories
						// and go on
						console.log("Error while loading project:");
						console.log(err);
					}
					else
					{
						self._attrs.projects.push(project);
					}

					next();
				});
		},
		function(err)
		{
			if (err) return callback(err);

			callback();
		});
	});

	EventEmitter.call(this);
}

util.inherits(ProjectCollection, EventEmitter);

ProjectCollection.prototype.toJSON = function()
{
	return this._attrs;
}

// var projects = new ProjectCollection(function(err)
// {
// 	if (err)
// 	{
// 		console.log("ERROR:", err);
// 	}
// 	else
// 	{
// 		console.log(JSON.stringify(projects, null, "\t"));		
// 	}
// });
