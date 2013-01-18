(function()
{

var File = require("../models/file"),
	Mixins = require("./mixins"),
	_ = require("underscore"),
	ProjectErrors = require("../models/project").Errors;

function FileController(projectCollection, sockets)
{
	this.projects = projectCollection;

	this.sockets = sockets.of("/file");

	this.sockets.on("connection", function(socket)
	{
		_.forEach(this.callbackTable, function(callback, event)
		{
			socket.on(event, 
				this.findProject(this.projects, socket, this[callback]));

		}, this);

	}.bind(this));

	this._disconnectListeners = {};
	this._socketOpenFiles = {};	
}

FileController.prototype.callbackTable =
{
	"setContents": "onSetContents"
}

FileController.prototype.onSetContents = function(socket, project, fileName, contents, callback)
{
	var file = project.findFile(fileName);

	if (!file) return callback(ProjectErrors.NO_SUCH_FILE);

	file.setContents(contents, function(err)
	{
		if (err) return callback(err.message);

		project.saveFile(file.name(), function(err)
		{
			if (err) return callback(err.message);

			callback();
		});
	});
}

_.extend(FileController.prototype, { findProject: Mixins.findProject });


module.exports = FileController;

}).call(this);