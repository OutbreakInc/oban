define(function(require)
{

var Backbone = require("backbone"),
	StackFrame = require("app/models/stack-frame"),
	io = require("socket.io");

var StackCollection = Backbone.Collection.extend(
{
	model: StackFrame,

	initialize: function(options)
	{
		_.bindAll(this);

		this.socket = options.socket;

		this.socket.on("gdb_stack", function(stack)
		{
			this.reset(stack);

		}.bind(this));
	}
});

return StackCollection;

});