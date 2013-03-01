var Project = require("./project"),
	fs = require("fs"),
	async = require("async"),
	_ = require("underscore"),
	Side = require("sidestep"),
	EventEmitter = require("events").EventEmitter,
	util = require("util");

require("shelljs/global");
require("../string-utils");

var Errors =
{
	INVALID_BASEDIR: "Invalid base directory",
	NON_EXISTENT_BASEDIR: "Non-existent base directory",
	DUPLICATE_NAME: "Duplicate project name",
	NO_SUCH_PROJECT: "No such project"
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
	this.step = new Side(this);

	var step = this.step;

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
				console.log(path + ":");

				if (err)
				{
					console.log(err);
					return next();
				}
				// skip non-directories
				else if (!stats.isDirectory())
				{
					console.log("skipping (not a directory)");
					return next();
				}

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
					else if (this.findById(project.id()))
					{
						// don't allow duplicate IDs
						console.log("skipping (duplicate project id)");
					}
					else if (this.findByName(project.name()))
					{
						console.log("skipping (duplicate project name)");
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
			step.next();
			callback();

		}.bind(this));
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();

	EventEmitter.call(this);
}

util.inherits(ProjectCollection, EventEmitter);

ProjectCollection.prototype.findByName = function(name)
{
	return _.find(this._attrs.projects, function(project)
	{
		return _.stricmp(project.name(), name);
	});
}

ProjectCollection.prototype.findById = function(id)
{
	return _.find(this._attrs.projects, function(project)
	{
		return project.id() == id;
	});	
}

ProjectCollection.prototype.addProject = function(name, callback)
{
	// don't allow duplicate project names
	if (this.findByName(name))
	{
		console.log("DUPLICATE");
		return callback(new Error(Errors.DUPLICATE_NAME));
	}

	var step = this.step;

	step.define(
	function()
	{
		var project = new Project(
		{
			name: name,
			baseDir: this._attrs.baseDir,
			create: true
		}, step.next);
	},
	function(err, project)
	{
		step.next();
		this._attrs.projects.push(project);
		callback(null, project);
		this.emit("add", project);
	}).
	error(function(err)
	{
		callback(err);
	})
	.exec();
}

// this also deletes the project from disk
ProjectCollection.prototype.removeProject = function(id, callback)
{
	var removedProject;

	_.some(this._attrs.projects, function(project, index)
	{
		if (project.id() == id)
		{
			removedProject = this._attrs.projects.splice(index, 1)[0];
			return true;
		}
		else return false;

	}.bind(this));

	if (!removedProject)
	{
		return callback(new Error(Errors.NO_SUCH_PROJECT));
	}

	var step = this.step;

	step.define(
	function()
	{
		// remove project from disk
		exec(
			"rm -rf " + removedProject.path(),
			{ async: true },
			step.next);
	},
	function(errCode, output)
	{
		step.next();
		callback();
	})
	.error(function(err)
	{
		callback("Error code: " + err);
	})
	.exec();
}

ProjectCollection.prototype.renameProject = function(id, newName, callback)
{
	var project = this.findById(id);

	if (!project)
	{
		return callback(new Error(Errors.NO_SUCH_PROJECT));
	}

	// check to see if we already have a project with this name
	var duplicateProject = this.findByName(newName);

	if (duplicateProject)
	{
		// if the project found is the same as the ID, it's already been
		// renamed, return successfully
		if (duplicateProject.id() == id)
		{
			return callback();
		}
		else
		{
			return callback(new Error(Errors.DUPLICATE_NAME));
		}
	}

	project.set("name", newName);

	var step = this.step;

	step.define(
	function()
	{
		project._saveAttrs(step.next);
	},
	function(err)
	{
		step.next();
		callback();
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

ProjectCollection.prototype.toJSON = function()
{
	return this._attrs.projects;
}

ProjectCollection.Errors = Errors;

module.exports = ProjectCollection;

// var projects = new ProjectCollection(
// 	{
// 		baseDir: utils.projectsDir()
// 	},
// 	function(err)
// {
// 	if (err)
// 	{
// 		console.log("ERROR:", err);
// 	}
// 	else
// 	{
// 		console.log(JSON.stringify(projects));
// 		// var project = projects.findById("e8a0c7fb913");

// 		// if (project)
// 		// {
// 		// 	console.log("trying to rename project: " + project.get("name"));

// 		// 	// console.log(JSON.stringify(projects, null, "\t"));
// 		// 	projects.renameProject("e8a0c7fb913", "hi", function(err)
// 		// 	{
// 		// 		if (err) console.log(err);
// 		// 		else console.log("renamed!");
// 		// 	});
// 		// }
// 		// else
// 		// {
// 		// 	console.log("no projects to rename");
// 		// }
// 	}
// });
