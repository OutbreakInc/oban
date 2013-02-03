var _ = require("underscore");

function ProjectCollectionController(projectCollection, sockets)
{
	_.bindAll(this);

	this.projects = projectCollection;
	this.sockets = sockets.of("/projectCollection");

	this._init();
}

ProjectCollectionController.prototype._init = function()
{
	this.sockets.on("connection", function(socket)
	{
		socket.on("list", this._list);

		socket.on("add", function(name, callback)
		{
			this.projects.addProject(name, function(err, project)
			{
				if (err) return callback(err.message);

				socket.broadcast.emit("add", project);
				callback(null, project);

			}.bind(this));

		}.bind(this));

		socket.on("remove", function(id, callback)
		{
			this.projects.removeProject(id, function(err)
			{
				if (err) return callback(err.message);
				console.log("this.projects)",this.projects);
				socket.broadcast.emit("remove", this.projects);
				callback(null, this.projects);

			}.bind(this));

		}.bind(this));
		
	}.bind(this));
}

ProjectCollectionController.prototype._list = function(callback)
{
	callback(null, this.projects);
}

module.exports = ProjectCollectionController;