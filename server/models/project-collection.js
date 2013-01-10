var Project = require("./project"),
	fs = require("fs"),
	async = require("async"),
	Side = require("sidestep"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	utils = require("../utils");

var Errors =
{
	INVALID_BASEDIR: "Invalid base directory",
	NON_EXISTENT_BASEDIR: "Non-existent base directory",
};

function ProjectCollection(options, callback)
{
	options = options || {};

	if (!options.baseDir || options.baseDir.length === 0)
	{
		return process.nextTick(function()
		{
			callback(new Error(Errors.INVALID_BASEDIR));
		});
	}

	this._attrs = {};
	this._attrs.projects = [];
	this._attrs.baseDir = options.baseDir;

	// load all projects
	var step = new Side(this);

	step.define(
	function()
	{
		fs.readdir(this._attrs.baseDir, step.next);
	},
	function(err, projectDirs)
	{
		async.forEachSeries(projectDirs, function(dir, next)
		{
			var path = this._attrs.baseDir + "/" + dir;

			fs.stat(path, function(err, stats)
			{
				if (err)
				{
					console.log(path + ":");
					console.log(err);
					return next();
				}
				// skip non-directories
				else if (!stats.isDirectory())
				{
					return next();
				}

				console.log(path + ":");

				var project = new Project(
					{ name: dir, baseDir: this._attrs.baseDir },
					function(err)
					{
						if (err)
						{
							// just skip invalid project directories
							// and go on
							console.log(err);
						}
						else
						{
							this._attrs.projects.push(project);
						}

						next();

					}.bind(this));
			}.bind(this));
		}.bind(this),
		function(err)
		{
			callback();
		});
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();

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
