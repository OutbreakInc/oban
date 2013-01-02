(function()
{

var BackendCollection = require("./backend-collection"),
	BackboneStore = require("./backbone-store"),
	util = require("util"),
	_ = require("underscore");

function BackboneMultiStore(model, name, options)
{
	BackboneStore.call(this, model, name, options);
	this._collections = {};
	this._options = options;
}

util.inherits(BackboneMultiStore, BackboneStore);

module.exports = BackboneMultiStore;

BackboneMultiStore.prototype.middleware = function(backend)
{
	var self = this;
	
	return function(req, res, next)
	{
		var socket = req.socket;
		var channel = req.channel;

		if (!self[req.method]) 
		{
			return next(new Error("Unsuppored method " + req.method));
		}

		if (!self._collections[channel])
		{
			self._collections[channel] = new self.Collection(null, self._options);
			self._collections[channel].bindToBackend(backend, channel);

			console.log("made new channel: " + channel);

			socket.on("disconnect", function()
			{
				console.log("removing store for disconnected socket");
				delete self._collections[channel];

				console.log("collections:");

				_.values(self._collections).forEach(function(collection)
				{
					console.log(collection.toJSON());
				});
			});
		}

		self[req.method](self._collections[channel], req, res, next);

		console.log("METHOD: " + req.method);
		console.log("collections:");

		_.values(self._collections).forEach(function(collection)
		{
			console.log(collection.toJSON());
		});

	};
}

}).call(this);
