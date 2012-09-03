(function()
{

function GdbListener(client)
{
	this.client = client;
	this.listeners = [];
}

GdbListener.prototype.on = function(pattern, callback)
{
	console.assert(pattern instanceof RegExp, "GdbListener pattern must be a RegExp!");

	this.listeners.push({pattern: pattern, callback: callback});
}

GdbListener.prototype.emit = function(data)
{	
	var that = this;

	this.listeners.forEach(function(listener)
	{
		if (listener.pattern.exec(data))
		{
			console.log(that);

			listener.callback(data, that.client);
		}
	});
}

module.exports = GdbListener;

}).call(this);
