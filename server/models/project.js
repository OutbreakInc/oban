var _ = require("underscore"),
	FileIo = require("../file-io"),
	SettingsIo = require("../settings-io"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	fs = require("fs"),
	Side = require("sidestep"),
	async = require("async"),
	idGen = require("../id-gen"),
	File = require("./file");

var DEFAULT_FILE_NAME = "main.cpp";

var RunStatus =
{
	STOPPED: "stopped",
	RUNNING: "running",
	PAUSED: "paused"
};

var BuildStatus =
{
	UNCOMPILED: "uncompiled",
	COMPILED: "compiled",
	ERRORS: "errors"
};

var Errors = 
{
	INVALID_PROJECT_NAME: "Invalid project name",
	INVALID_BASEDIR: "Invalid base directory",
	NON_EXISTENT_BASEDIR: "Non-existent base directory",
	NO_PROJECT_JSON: "Project directory missing project.json",
	INVALID_PROJECT_JSON: "Invalid project.json file"
};

var Project = function(options, callback)
{
	options = options || {};

	if (!options.name || options.name.length === 0)
	{
		return process.nextTick(function()
		{
			callback(new Error(Errors.INVALID_PROJECT_NAME));
		});
	}

	if (!options.baseDir || options.baseDir.length === 0)
	{
		return process.nextTick(function()
		{
			callback(new Error(Errors.INVALID_BASEDIR));
		});		
	}

	if (!fs.existsSync(options.baseDir))
	{
		return process.nextTick(function()
		{
			callback(new Error(Errors.NON_EXISTENT_BASEDIR));
		});	
	}

	// this contains the serializable properties of the project
	this._attrs = {};

	this._attrs.name = options.name;
	this._attrs.path = options.baseDir + "/" + this._attrs.name + "/";

	this._attrs.files = [];

	this._fileIo = new FileIo(this._attrs.path);
	this._settingsIo = new SettingsIo(this._attrs.path, "project");

	if (fs.existsSync(this._attrs.path) && 
		fs.existsSync(this._settingsIo.path()))
	{
		console.log("restoring project: " + this._attrs.name);

		process.nextTick(function()
		{
			this._restore(callback);

		}.bind(this));
	}
	else if (options.create)
	{
		console.log("init project from scratch: " + this._attrs.name);

		process.nextTick(function()
		{			
			this._init(callback);

		}.bind(this));
	}
	else
	{
		return process.nextTick(function()
		{
			callback(new Error(Errors.NO_PROJECT_JSON));

		}.bind(this));
	}

	EventEmitter.call(this);
}

util.inherits(Project, EventEmitter);

// initialize new project
Project.prototype._init = function(callback)
{
	this._attrs.id = idGen();

	this._attrs.buildStatus = BuildStatus.UNCOMPILED;
	this._attrs.runStatus = RunStatus.STOPPED;

	var step = new Side(this);

	step.define(
	function()
	{
		this.addFile(DEFAULT_FILE_NAME, step.next);
	},
	function(err)
	{
		callback();
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

// restore an existing project
Project.prototype._restore = function(callback)
{
	this._settingsIo.read(function(err, attrs)
	{
		if (err) return callback(err);
		else if (!attrs) return callback(new Error(Errors.INVALID_PROJECT_JSON));

		this._attrs = attrs;

		if (!this._attrs.id)
		{
			this._attrs.id = idGen();
		}

		var fileObjects = [];

		async.forEachSeries(this._attrs.files, function(fileAttrs, next)
		{
			var file = new File(fileAttrs, function(err)
			{
				if (err) return next(err);

				console.log("loaded file: " + file.name());
				fileObjects.push(file);
				next();	
			});
		}.bind(this),
		function(err)
		{
			if (err) return callback(err);

			this._attrs.files = fileObjects;
			callback();

		}.bind(this));
	}.bind(this));
}

Project.prototype._findFile = function(name)
{
	return _.find(this._attrs.files, function(file)
	{
		return file.name() === name;
	});
}

Project.prototype._saveAttrs = function(callback)
{
	this._settingsIo.write(this._attrs, callback);
}

Project.prototype.addFile = function(name, callback)
{
	if (this._findFile(name)) return callback("File already exists");

	var step = new Side(this);

	step.define(
	function()
	{
		step.data.file = new File({ name: name }, step.next);
	},
	function(err)
	{
		var file = step.data.file;

		this._attrs.files.push(file);
		this._fileIo.create(file.name(), step.next);
	},
	function(err)
	{
		this._saveAttrs(step.next);
	},
	function(err)
	{			
		callback(null, step.data.file);
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

Project.prototype.removeFile = function(name, options, callback)
{
	var file = this._findFile(name);

	if (!file) return callback("No such file");

	if (typeof options == "function")
	{
		callback = options;
	}

	this._attrs.files = _.filter(this._attrs.files, function(otherFile)
	{
		return file.name() !== otherFile.name();
	});

	var step = new Side(this);

	step.define(
	function()
	{
		if (options.removeFromSystem)
		{
			console.log("removing from system: " + file.name());
			this._fileIo.remove(file.name(), step.next);
		}
		else
		{
			step.next();
		}
	},
	function(err)
	{	
		console.log("removed file, now updating project settings");
		this._saveAttrs(step.next);
	},
	function(err)
	{
		console.log("updated project settings");
		callback();
	})
	.error(function(err)
	{
		callback(err);	
	})
	.exec();
}

Project.prototype.openFile = function(name, callback)
{
	var file = this._findFile(name);

	if (!file) return callback("No such file");

	var step = new Side(this);

	step.define(
	function()
	{
		this._fileIo.read(file.name(), step.next);
	}, 
	function(err, contents)
	{
		file.open();
		file.setContents(contents, step.next);
	},
	function(err)
	{
		callback(null, file);
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

Project.prototype.closeFile = function(name, callback)
{
	var file = this._findFile(name);

	if (!file) return callback("No such file");

	file.close();
	file.removeAllListeners();

	callback();
}

Project.prototype.saveFile = function(name, callback)
{
	console.log("saving " + name);

	var file = this._findFile(name);

	if (!file) return callback("No such file");

	this._fileIo.write(file.name(), file.contents(), function(err)
	{
		if (err) return callback(err);

		callback();
	});
}
 
Project.prototype.files = function()
{
	return this._attrs.files;
}

Project.prototype.toJSON = function()
{
	return _.omit(this._attrs, "path");
}

Project.prototype.toFile = function()
{
	var json = _.clone(this._attrs);

	json = _.omit(this._attrs, "path");

	var files = [];

	// don't save isOpen attribute, because it's only used during runtime
	json.files.forEach(function(file)
	{
		files.push(file.toFile());
	});

	json.files = files;

	return json;
}

Project.Errors = Errors;
Project.BuildStatus = BuildStatus;
Project.RunStatus = RunStatus;
Project.DEFAULT_FILE_NAME = DEFAULT_FILE_NAME;

module.exports = Project;

