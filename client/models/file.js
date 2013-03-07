define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var MAX_SAVES_PER_MS = 2000;

var FileModel = Backbone.Model.extend(
{
	initialize: function(options)
	{
		this.project = options.project;
		this.socket = io.connect("/file");
	},

	setContents: function(contents, callback)
	{
		this.set("contents", contents, { silent: true });
		this.saveContentsToServer(callback);
	},

	saveContentsToServer: function(callback)
	{
		if (this._isThrottled)
		{
			callback();
		}
		else
		{
			this._isThrottled = true;

			setTimeout(function()
			{
				this._saveContentsToServer(function(err)
				{
					this._isThrottled = false;

					if (err) return callback(err);

					callback();

				}.bind(this));

			}.bind(this), MAX_SAVES_PER_MS);
		}
	},

	_saveContentsToServer: function(callback)
	{
		this.socket.emit(	"setContents", 
							this.get("project").id,
							this.get("name"),
							this.get("contents"),
		function(err)
		{
			if (err) return callback(err);

			callback();

		}.bind(this));
	}
});

return FileModel;

});