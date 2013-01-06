var _ = require("underscore"),
	FileIo = require("../file-io"),
	SettingsIo = require("../settings-io"),
	utils = require("../utils"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	fs = require("fs"),
	Step = require("step"),
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

	if (!this._attrs.name || this._attrs.name.length === 0)
	{
		return process.nextTick(
		function()
		{
			this.emit("error", "Must provide a valid project name!");
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
	else
	{
		console.log("init project from scratch: " + this._attrs.name);
		this._init();
	}

	EventEmitter.call(this);
}

util.inherits(Project, EventEmitter);

// initialize new project
Project.prototype._init = function()
{
	this._attrs.buildStatus = BuildStatus.UNCOMPILED;
	this._attrs.runStatus = RunStatus.STOPPED;

	this._attrs.files.push(new File(DEFAULT_FILE));

	var self = this;

	Step(
	function()
	{
		self._fileIo.write(self._attrs.files[0].name, "", this.parallel());
		self._settingsIo.write(self._attrs, this.parallel());
	},
	function(err)
	{
		if (err) return self.emit("error", err);

		self.emit("loaded");
	});
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

Project.prototype.addFile = function(name)
{
	if (this._findFile(name)) return callback("File already exists");

	this._attrs.files.push(new File({ name: name }));
}

Project.prototype.openFile = function(name, callback)
{
	var file = this._findFile(name);

	if (!file) return callback("No such file");

	var self = this;

	file.open();

	this._fileIo.read(file.name(), function(err, contents)
	{
		if (err) return callback(err);

		file.setContents(contents);

		file.on("modified", function(contents)
		{
			self.saveFile(file.name(), function(err)
			{
				if (err) return self.emit("error", err);
			});
		});

		callback(null, file);
	});
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
	var file = this._findFile(name);

	if (!file) return callback("No such file");

	this._fileIo.write(file.name, file.contents, function(err)
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

var project = new Project({ name: "Merp" });

project.on("loaded", function()
{
	console.log("project loaded");
	console.log(JSON.stringify(project, null, "\t"));

	console.log(project.files()[0]);

	project.openFile(project.files()[0].name(), function(err, file)
	{
		console.log("opened file:", file.name());

		file.setContents("Derp");

		project.closeFile(file.name(), function()
		{
			console.log("closed file:", file.name());
			console.log(file);
		})
	});
});

project.on("error", function(err)
{
	console.log("error: ", err);
});
