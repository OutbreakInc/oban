
function ProjectCollectionController(projectCollection, sockets)
{
	this.projects = projectCollection;
	this.sockets = sockets.of("/projectCollection");

	this._init();
}

ProjectCollectionController.prototype._init = function()
{
	this.sockets.on("connection", function(socket)
	{
		socket.on("list", function(callback)
		{
			callback(null, this.projects);

		}.bind(this));

		socket.on("add", function(name, callback)
		{
			this.projects.addProject(name, function(err, project)
			{
				if (err) return callback(err.message);

				callback(null, project);
			});

		}.bind(this));

	}.bind(this));
}

module.exports = ProjectCollectionController;