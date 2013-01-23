 var Project = require("../models/project"),
	CollectionErrors = require("../models/project-collection").Errors,
	Mixins = require("./mixins"),
	GdbClient = require("../gdb-client"),
	_ = require("underscore"),
	winston = require("winston");

var Errors =
{
	CLIENT_HAS_OPEN_PROJECT: "You already have a project open",
	NOT_CLIENTS_PROJECT: "You don't own this project",
	CANT_RUN_UNBUILT_PROJECT: "You must build this project first"
};

function ProjectController(projectCollection, deviceServer, sockets)
{
	this.projects = projectCollection;
	this.sockets = sockets.of("/project");
	this.deviceServer = deviceServer;
	this.gdbClient = new GdbClient(this.deviceServer);

	this.sockets.on("connection", function(socket)
	{
		_.forEach(this.callbackTable, function(callback, event)
		{
			socket.on(event, this.findProject(socket, this[callback]));

		}, this);

	}.bind(this));

	this._disconnectListeners = {};
	this._socketOpenProjects = {};

	// all functions must have a valid project
}

ProjectController.prototype.callbackTable =
{
	"open": "onOpen",
	"close": "onClose",
	"openFile": "onOpenFile",
	"build": "onBuild",
	"flash": "onFlash",
	"debug": "onDebug"
}

ProjectController.prototype.findProject = function(socket, callback)
{
	return function()
	{
		arguments = Array.prototype.slice.call(arguments);

		var project = this.projects.findById(arguments[0]);

		if (!project) return callback(CollectionErrors.NO_SUCH_PROJECT);

		// replace id parameter with resolved project
		arguments[0] = project;

		// add socket as first argument
		arguments.unshift(socket);

		callback.apply(this, arguments);


	}.bind(this);
}

ProjectController.prototype.onOpen = function(socket, project, callback)
{
	if (this._socketOpenProjects[socket.id])
	{
		return callback(Errors.CLIENT_HAS_OPEN_PROJECT);
	}

	project.setOpen(socket.id, true, function(err)
	{
		if (err) return callback(err.message);

		callback(null, project);
		socket.broadcast.emit("open", project);

		var closeProjectFn = function()
		{
			project.setOpen(socket.id, false, function(err)
			{
				if (err) console.log(err);
				else console.log("closed project " + project.id() +
								 "(client disconnected)");

				delete this._socketOpenProjects[socket.id];

				this.sockets.emit("close", project);

			}.bind(this));

		}.bind(this);

		socket.on("disconnect", closeProjectFn);				
		this._disconnectListeners[project.id()] = closeProjectFn;
		this._socketOpenProjects[socket.id] = project;

	}.bind(this));
}

ProjectController.prototype.onClose = function(socket, project, callback)
{
	project.setOpen(socket.id, false, function(err)
	{
		if (err) return callback(err.message);

		callback(null, project);
		socket.broadcast.emit("close", project);

		delete this._socketOpenProjects[socket.id];

		var id = project.id();

		if (this._disconnectListeners[id])
		{
			console.log("removing disconnect listener since project is closed");

			socket.removeListener("disconnect", 
				this._disconnectListeners[id]);
		}

	}.bind(this));
}

ProjectController.prototype.onOpenFile = function(socket, project, fileName, callback)
{
	if (!this._isOpenBy(project, socket))
	{
		return callback(Errors.NOT_CLIENTS_PROJECT);
	}
	
	project.openFile(fileName, function(err, file)
	{
		if (err) return callback(err.message);

		callback(null, file);

	}.bind(this));
}

ProjectController.prototype.onBuild = function(socket, project, callback)
{
	if (!this._isOpenBy(project, socket))
	{
		return callback(Errors.NOT_CLIENTS_PROJECT);
	}

	project.build(function(err, compileErrors)
	{
		if (err) return callback(err.message);
		else if (compileErrors)
		{
			return callback(null, compileErrors);
		}

		callback(null, null, project);

	}.bind(this));
}

ProjectController.prototype.onFlash = function(socket, project, callback)
{
	if (!this._isOpenBy(project, socket))
	{
		return callback(Errors.NOT_CLIENTS_PROJECT);
	}

	// project must be built first
	if (project.buildStatus() != Project.BuildStatus.COMPILED ||
		!project.binary())
	{
		return callback(Errors.CANT_RUN_UNBUILT_PROJECT);
	}

	this.deviceServer.flash(project.path() + project.binary(), 
	function(err)
	{
		if (err) return callback("Flash failed!");

		callback();
	});
}

ProjectController.prototype.onDebug = function(socket, project, callback)
{
	// if flash succeeded, run and attach GDB
	winston.debug("attaching client to GDB");
	this.gdbClient.attachClient(socket);

	this.gdbClient.run(project.path() + project.binary(), 
	function(err)
	{
		if (err) return callback(err);

		callback();
	});
}

ProjectController.prototype._isOpenBy = function(project, socket)
{
	return project.isOpenBy() == socket.id;
}

module.exports = ProjectController;
