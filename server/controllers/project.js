var Project = require("../models/project"),
	CollectionErrors = require("../models/project-collection").Errors;

function ProjectController(projectCollection, sockets)
{
	this.projects = projectCollection;
	this.sockets = sockets.of("/project");

	this._init();

	this._disconnectListeners = {};
}

ProjectController.prototype._init = function()
{
	this.sockets.on("connection", function(socket)
	{
		socket.on("open", function(id, callback)
		{
			var project = this.projects.findById(id);

			if (!project) return callback(CollectionErrors.NO_SUCH_PROJECT);

			project.setOpen(socket.id, true, function(err)
			{
				if (err) return callback(err.message);

				callback();

				var closeProjectFn = function()
				{
					project.setOpen(socket.id, false, function(err)
					{
						if (err) console.log(err);
						else console.log("closed project " + id + "(client disconnected)");
					});
				}

				socket.on("disconnect", closeProjectFn);				
				this._disconnectListeners[id] = closeProjectFn;

			}.bind(this));

		}.bind(this));

		socket.on("close", function(id, callback)
		{
			var project = this.projects.findById(id);

			if (!project) return callback(CollectionErrors.NO_SUCH_PROJECT);

			project.setOpen(socket.id, false, function(err)
			{
				if (err) return callback(err.message);

				callback();

				if (this._disconnectListeners[id])
				{
					console.log("removing disconnect listener since project is closed");
					
					socket.removeListener("disconnect", 
						this._disconnectListeners[id]);
				}

			}.bind(this));

		}.bind(this));

	}.bind(this));
}

module.exports = ProjectController;
