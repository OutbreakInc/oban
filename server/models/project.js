var _ = require("underscore"),
	FileIo = require("../file-io"),
	SettingsIo = require("../settings-io"),
	utils = require("../utils"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	fs = require("fs"),
	Side = require("sidestep"),
	async = require("async"),
	Mixins = require("../mixins"),
	File = require("./file");

var DEFAULT_FILE = { name: "main.cpp" };

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

var Project = function(options)
{
	options = options || {};

	// this contains the serializable properties of the project
	this._attrs = {};

	this._attrs.name = options.name;
	this._attrs.path = utils.projectsDir() + "/" + this._attrs.name + "/";

	var self = this;

	if (!this._attrs.name || this._attrs.name.length === 0)
	{
		return process.nextTick(
		function()
		{
			self.emit("error", "Must provide a valid project name!");
		});
	}

	this._attrs.files = [];

	this._fileIo = new FileIo(this._attrs.path);
	this._settingsIo = new SettingsIo(this._attrs.path, "project");

	if (fs.existsSync(this._attrs.path) && 
		fs.existsSync(this._settingsIo.path()))
	{
		console.log("restoring project: " + this._attrs.name);
		this._restore();
	}
	else if (options.create)
	{
		console.log("init project from scratch: " + this._attrs.name);
		this._init();
	}
	else
	{
		process.nextTick(function()
		{
			self.emit("error", 	self._attrs.name + ": project directory " +
								"missing project.json");
		});
	}

	EventEmitter.call(this);
}

util.inherits(Project, EventEmitter);

// initialize new project
Project.prototype._init = function()
{
	this._attrs.id = idGen();

	this._attrs.buildStatus = BuildStatus.UNCOMPILED;
	this._attrs.runStatus = RunStatus.STOPPED;

	this._attrs.files.push(new File(DEFAULT_FILE));

	var self = this;

	Side(
	function()
	{
		self._fileIo.write(self._attrs.files[0].name, "", this);
	},
	function(err)
	{
		self._saveAttrs(this);
	},
	function(err)
	{
		self.emit("loaded");
	})
	.error(function(err)
	{
		self.emit("error", err);
	})();
}

// restore an existing project
Project.prototype._restore = function()
{
	var self = this;

	this._settingsIo.read(function(err, attrs)
	{
		if (err) return self.emit("error", err);

		self._attrs = attrs;

		var fileObjects = [];

		async.forEachSeries(self._attrs.files, function(fileAttrs, next)
		{
			var file = new File(fileAttrs);

			file.on("loaded", function()
			{
				console.log("loaded file: " + file.name());
				fileObjects.push(file);
				next();
			});

			file.on("error", function(err)
			{
				next(err);
			});
		},
		function(err)
		{
			if (err) return self.emit("error", err);

			self._attrs.files = fileObjects;
			self.emit("loaded");
		});
	});
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

	var file = new File({ name: name });

	file.on("error", function(err)
	{
		callback(err);
	});

	var self = this;

	file.on("loaded", function()
	{
		self._attrs.files.push(file);

		Side(
		function()
		{
			self._fileIo.create(file.name(), this);
		},
		function(err)
		{
			self._saveAttrs(this);
		},
		function(err)
		{			
			callback(null, file);
		})
		.error(function(err)
		{
			callback(err);
		})();
	});
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

	var self = this;

	Side(
	function()
	{
		if (options.removeFromSystem)
		{
			console.log("removing from system: " + file.name());
			self._fileIo.remove(file.name(), this);
		}
		else
		{
			this();
		}
	},
	function(err)
	{	
		console.log("removed file, now updating project settings");
		self._saveAttrs(this);
	},
	function(err)
	{
		console.log("updated project settings");
		process.exit(0);
		callback();
	})
	.error(function(err)
	{
		callback(err);	
	})();
}

Project.prototype.openFile = function(name, callback)
{
	var file = this._findFile(name);

	if (!file) return callback("No such file");

	var self = this;

	Side(
	function()
	{
		self._fileIo.read(file.name(), this);
	}, 
	function(err, contents)
	{
		file.open();
		file.setContents(contents, this);
	},
	function(err)
	{
		callback(null, file);
	})
	.error(function(err)
	{
		callback(err);
	})();
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
	return this._attrs;
}

_.extend(Project.prototype, Mixins.Persistence);

module.exports = Project;

