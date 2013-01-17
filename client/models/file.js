define(function(require)
{

var Backbone = require("backbone"),
	io = require("socket.io");

var FileModel = Backbone.Model.extend(
{
	initialize: function(options)
	{
		this.name = options.name;
		this.socket = io.connect("http://localhost:8000/file");

		this._bindEvents();
	},

	open: function()
	{
		if (this.has("isOpenBy"))
		{
			if (this._isOpenByMe()) return;
			else return callback("File already open");
		}

		this.socket.emit("open", this.id, )
	},

	_isOpenByMe: function()
	{
		var openBy = this.get("isOpenBy");
		return (openBy && openBy == this.socket.socket.sessionid);
	}
});

return FileModel;

});