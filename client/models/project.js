define(function(require)
{
	var Backbone = require("backbone"),
		io = require("socket.io");

	var ProjectModel = Backbone.Model.extend(
	{
		initialize: function()
		{
			this.socket = io.connect("http://localhost:8000/project");
		},

		open: function(callback)
		{
			if (this.get("isOpen")) return callback("Project already open");

			this.socket.emit("open", this.id, function(err)
			{
				if (err) return callback(err);

				callback();

			}.bind(this));
		}

	});

	return ProjectModel;
});
