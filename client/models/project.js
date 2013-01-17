define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var ProjectModel = Backbone.Model.extend(
{
	initialize: function()
	{
		this.socket = io.connect("http://localhost:8000/project");

		this._bindEvents();
	},

	_bindEvents: function()
	{
		var setIfIdMatches = function(project)
		{
			if (project.id != this.id) return;

			this.clear({ silent: true });
			this.set(project);

		}.bind(this);

		this.socket.on("open", setIfIdMatches);
		this.socket.on("close", setIfIdMatches);
	},

	open: function(callback)
	{
		if (this.has("isOpenBy"))
		{
			if (this._isOpenByMe()) return;
			else return callback("Project already open");
		}

		this.socket.emit("open", this.id, function(err)
		{
			if (err) return callback(err);
			callback();

		}.bind(this));
	},

	close: function(callback)
	{
		if (!this.has("isOpenBy")) return;
		else if (!this._isOpenByMe()) 
		{
			return callback("Project is open by someone else");
		}

		this.socket.emit("close", this.id, function(err)
		{
			if (err) return callback(err);
			callback();

		}.bind(this));
	},

	openFile: function(name, callback)
	{
		if (!this._isOpenByMe())
		{
			return callback("Can't open files on a project not open by you");
		}

				
	},

	_isOpenByMe: function()
	{
		var openBy = this.get("isOpenBy");
		return (openBy && openBy == this.socket.socket.sessionid);
	}

});

return ProjectModel;

});
