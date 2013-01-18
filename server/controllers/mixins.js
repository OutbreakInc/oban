var CollectionErrors = require("../models/project-collection").Errors;

var Mixins = {};

Mixins.findProject = function(projects, socket, callback)
{
	return function()
	{
		arguments = Array.prototype.slice.call(arguments);

		var project = projects.findById(arguments[0]);

		if (!project) return callback(CollectionErrors.NO_SUCH_PROJECT);

		// replace id parameter with resolved project
		arguments[0] = project;

		// add socket as first argument
		arguments.unshift(socket);

		callback.apply(this, arguments);

	}.bind(this);
}

module.exports = Mixins;

