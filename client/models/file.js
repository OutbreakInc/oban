define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var FileModel = Backbone.Model.extend(
{
	initialize: function(options)
	{
		this.project = options.project;
		this.socket = io.connect("http://localhost:8000/file");
	},

	setContents: function(contents, callback)
	{
		this.socket.emit(	"setContents", 
							this.get("project").id,
							this.get("name"),
							contents,
		function(err)
		{
			if (err) return callback(err);

			this.set("contents", contents, { silent: true });
			this.set("dirty", true, { silent: true });
			callback();

		}.bind(this));
	}
});

return FileModel;

});