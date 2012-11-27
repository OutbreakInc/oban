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
	var self = this;

	this.listeners.forEach(function(listener)
	{
		if (listener.pattern.exec(data))
		{
			listener.callback(data, self.client);
		}
	});
}

module.exports = GdbListener;

}).call(this);
