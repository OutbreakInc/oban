define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var ProjectModel = Backbone.Model.extend(
{
	initialize: function()
	{
		this.socket = io.connect("http://localhost:8000/project");

		_.bindAll(this);

		this._bindEvents();
	},

	_bindEvents: function()
	{
		this.socket.on("open", this._setIfIdMatches);
		this.socket.on("close", this._setIfIdMatches);
	},

	_setIfIdMatches: function(project)
	{
		if (project.id != this.id) return;

		this.clear({ silent: true });
		this.set(project);

	},

	open: function(callback)
	{
		if (this.has("isOpenBy"))
		{
			if (this._isOpenByMe()) return;
			else return callback("Project already open");
		}

		this.socket.emit("open", this.id, function(err, project)
		{
			if (err) return callback(err);

			this._setIfIdMatches(project);
			callback(null, project);

		}.bind(this));
	},

	close: function(callback)
	{
		if (!this.has("isOpenBy")) return;
		else if (!this._isOpenByMe()) 
		{
			return callback("Project is open by someone else");
		}

		this.socket.emit("close", this.id, function(err, project)
		{
			if (err) return callback(err);

			this._setIfIdMatches(project);
			callback(null, project);

		}.bind(this));
	},

	openFile: function(fileName, callback)
	{
		if (!this._isOpenByMe())
		{
			return callback("Can't open files on a project not open by you");
		}

		this.socket.emit("openFile", this.id, fileName, function(err, file)
		{
			if (err) return callback(err);

			callback(null, file);
		});	
	},

	_isOpenByMe: function()
	{
		var openBy = this.get("isOpenBy");
		return (openBy && openBy == this.socket.socket.sessionid);
	}

});

return ProjectModel;

});
