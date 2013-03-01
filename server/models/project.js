var _ = require("underscore"),
	FileIo = require("../file-io"),
	SettingsIo = require("../settings-io"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	fs = require("fs"),
	Side = require("sidestep"),
	async = require("async"),
	idGen = require("../id-gen"),
	File = require("./file"),
	dirs = require("../dirs"),
	q = require("q");

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

var Compatibility =
{
	GALAGO_4: "Galago4"
};

var Errors = 
{
	INVALID_PROJECT_NAME: "Invalid project name",
	INVALID_BASEDIR: "Invalid base directory",
	NON_EXISTENT_BASEDIR: "Non-existent base directory",
	NO_PROJECT_JSON: "Project directory missing project.json",
	INVALID_PROJECT_JSON: "Invalid project.json file",
	FILE_RENAME_EXISTS: "The new name of the file being renamed already exists",
	NO_SUCH_FILE: "No such file",
	ALREADY_OPEN: "Project is already open by someone else"
};

var nextTickError = function(err, callback)
{
	return process.nextTick(function()
	{
		callback(err);
	});
}

var Project = function(options, callback)
{
	options = options || {};

	if (!this._checkName(options.name))
	{
		return nextTickError(new Error(Errors.INVALID_PROJECT_NAME), callback);
	}

	if (!options.baseDir || options.baseDir.length === 0)
	{
		return nextTickError(new Error(Errors.INVALID_BASEDIR), callback);
	}

	if (!fs.existsSync(options.baseDir))
	{
		return nextTickError(new Error(Errors.NON_EXISTENT_BASEDIR), callback);
	}

	// this contains the serializable properties of the project
	this._attrs = {};

	this._attrs.name = options.name;
	this._attrs.path = options.baseDir + "/" + this._attrs.name + "/";

	this._attrs.buildStatus = BuildStatus.UNCOMPILED;
	this._attrs.runStatus = RunStatus.STOPPED;
	this._attrs.isOpenBy = undefined;

	this._attrs.files = [];

	this._fileIo = new FileIo(this._attrs.path);
	this._settingsIo = new SettingsIo(this._attrs.path, "module");

	this.step = new Side(this);

	if (fs.existsSync(this._attrs.path) && 
		fs.existsSync(this._settingsIo.path()))
	{
		console.log("project:restore " + this._attrs.name);

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

	this._attrs.compatibleWith = [ Compatibility.GALAGO_4 ];

	var error;

	this.addFile(DEFAULT_FILE_NAME, function(err)
	{
		err = error;
	});

	var step = this.step;

	step.define(
	function()
	{
		console.log("next step of init");

		if (error) return step.next(error);

		step.next();
		callback(null, this);
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

		_.extend(this._attrs, attrs);

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
			callback(null, this);

		}.bind(this));
	}.bind(this));
}

Project.prototype._checkName = function(name, callback)
{
	return !(!name || name.length === 0);
}

Project.prototype.findFile = function(name)
{
	return _.find(this._attrs.files, function(file)
	{
		return file.name() === name;
	});
}

Project.prototype._saveAttrs = function(callback)
{
	var step = this.step;

	step.define(
	function()
	{
		this._settingsIo.write(this.toFile(), step.next);
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

Project.prototype.setOpen = function(userId, isOpen, callback)
{
	if (this._attrs.isOpenBy &&
		this._attrs.isOpenBy != userId) 
	{
		return callback(new Error(Errors.ALREADY_OPEN));
	}

	this._attrs.isOpenBy = isOpen ? userId : undefined;
	callback();
}

Project.prototype.addFile = function(name, callback)
{
	if (this.findFile(name)) return callback("File already exists");

	var step = this.step;

	var file;

	step.define(
	function()
	{
		file = new File({ name: name }, step.next);
	},
	function(err)
	{
		this._attrs.files.push(file);
		this._fileIo.create(file.name(), step.next);
	})
	.error(function(err)
	{
		// cancel _saveAttrs task
		step.removeNextTask();
	})
	.exec();

	this._saveAttrs(function(err)
	{
		if (err) return callback(err);

		callback(null, file);
	});
}

Project.prototype.removeFile = function(name, options, callback)
{
	console.log("model:remove", name, options)
	var file = this.findFile(name);

	if (!file) return callback(new Error(Errors.NO_SUCH_FILE));

	if (typeof options == "function")
	{
		callback = options;
	}

	this._attrs.files = _.filter(this._attrs.files, function(otherFile)
	{
		return file.name() !== otherFile.name();
	});

	var step = this.step;

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
		step.next();
		callback();
	})
	.error(function(err)
	{
		callback(err);	
	})
	.exec();
}

Project.prototype.renameFile = function(oldName, newName, callback)
{
	var file = this.findFile(oldName);

	if (!file) return callback(new Error(Errors.NO_SUCH_FILE));

	if (oldName == newName) return callback();

	var step = this.step;

	step.define(
	function()
	{
		this._fileIo.exists(newName, step.next);
	},
	function(err, exists)
	{
		if (exists) return callback(Errors.FILE_RENAME_EXISTS);

		this._fileIo.rename(oldName, newName, step.next);
	},
	function(err)
	{
		file.setName(newName, step.next);
	},
	function(err)
	{
		this._saveAttrs(step.next);
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

Project.prototype.openFile = function(name, callback)
{
	var file = this.findFile(name);

	if (!file) return callback(new Error(Errors.NO_SUCH_FILE));

	var step = this.step;

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
		step.next();
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
	var file = this.findFile(name);

	if (!file) return callback(new Error(Errors.NO_SUCH_FILE));

	file.close();
	file.removeAllListeners();

	callback();
}

Project.prototype.saveFile = function(name, callback)
{
	console.log("saving " + name);

	var file = this.findFile(name);

	if (!file) return callback(new Error(Errors.NO_SUCH_FILE));

	this._fileIo.write(file.name(), file.contents(), function(err)
	{
		if (err) return callback(err);

		this._attrs.buildStatus = BuildStatus.UNCOMPILED;
		callback();

	}.bind(this));
}

Project.prototype.name = function()
{
	return this._attrs.name;
}

Project.prototype.setName = function(newName, callback)
{
	var step = this.step;

	step.define(
	function()
	{
		if (!this._checkName(newName))
		{
			step.next(new Error(Errors.INVALID_PROJECT_NAME));
		}
		else
		{
			step.next();
		}
	},
	function(err)
	{
		this._attrs.name = newName;
		step.next();
		this._saveAttrs(callback);
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

Project.prototype.build = function(callback)
{
	// tell build system to build
	// magicalBuildSystem.build(function(err))

	var err;
	var binary = "module.elf";

	console.log("about to compile");

	q.all([ dirs.bin(), dirs.sdk(), dirs.platform() ])
	.then(function(dirList)
	{
		var binDir = dirList[0], 
			sdkDir = dirList[1], 
			platformDir = dirList[2];

		var Sdk = require(binDir + "SDK");

		if (!Sdk) return callback("Couldn't find SDK");

		var Compiler = Sdk.Compiler;

		if (!Compiler) return callback("Couldn't find compiler");

		var compiler = new Compiler;

		compiler.compile(
		{
			sdk: sdkDir,
			platform: platformDir,
			project: this._attrs.path

		}, function(err, outputName, result)
		{
			if (err) return callback(err);

			if (result.compileErrors.length > 0)
			{
				console.log(result.compileErrors);
				this._attrs.buildStatus = BuildStatus.ERRORS;
				return callback(null, result.compileErrors);
			}

			this._attrs.buildStatus = BuildStatus.COMPILED;
			this._attrs.binary = binary;
			
			callback();

		}.bind(this));
	}.bind(this));
}

Project.prototype.binary = function()
{
	return this._attrs.binary;
}

Project.prototype.path = function()
{
	return this._attrs.path;
}

Project.prototype.files = function()
{
	return this._attrs.files;
}

Project.prototype.buildStatus = function()
{
	return this._attrs.buildStatus;
}

Project.prototype.runStatus = function()
{
	return this._attrs.runStatus;
}

Project.prototype.isOpenBy = function()
{
	return this._attrs.isOpenBy;
}

Project.prototype.id = function()
{
	return this._attrs.id;
}

Project.prototype.toJSON = function()
{
	return _.omit(this._attrs, [ "path", "binary" ]);
}

Project.prototype.toFile = function()
{
	var json = _.omit(this._attrs, [ "path", "buildStatus", "runStatus", "binary", "isOpenBy" ]);

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

