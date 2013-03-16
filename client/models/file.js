define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io"),
	_ = require("underscore");

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
		this.saveContentsToServer();
		callback();
	},

	saveContentsToServer: _.debounce(function(callback)
	{
		callback = callback || function(){};

		this.socket.emit(	"setContents", 
							this.get("project").id,
							this.get("name"),
							this.get("contents"),
		function(err)
		{
			if (err)
			{
				alert(err);
				callback(err);
			}

			callback();

		}.bind(this));

	}, 2000)
});

return FileModel;

});