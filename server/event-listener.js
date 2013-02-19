var _ = require("underscore"),
	EventEmitter = require("events").EventEmitter,
	inherits = require("util").inherits;

module.exports =
{
	listenTo: function(obj, name, callback) 
	{
		var listeners = this._listeners || (this._listeners = []);

		// create a version of cb bound to `this`, use that for the callback
		var boundCb = _.bind(callback, this);

		listeners.push({ obj: obj, name: name, callback: boundCb });
		obj.on(name, boundCb);
		return this;
	},

	stopListening: function(obj, name)
	{
		var listeners = this._listeners;

		if (!listeners) return;

		var toRemove = [];
		var toKeep = [];
		var filter;

		// remove all listeners for object for the event `name`
		if (obj && name) 
		{
			filter = function(listener)
			{
				return (listener.obj == obj && listener.name == name);
			}
		}
		// remove all listeners for object
		else if (obj)
		{
			filter = function(listener)
			{
				return (listener.obj == obj);
			}
		}
		// remove all listeners
		else
		{
			filter = function(listener)
			{
				return true;
			}
		}

		listeners.forEach(function(listener)
		{
			if (filter(listener)) toRemove.push(listener);
			else toKeep.push(listener);
		});

		toRemove.forEach(function(listener)
		{
			listener.obj.removeListener(listener.name, listener.callback);
		});

		this._listeners = toKeep.length !== 0 ? toKeep : undefined;

		return this;
	}
}

// function A()
// {

// }

// A.prototype = module.exports;

// function Derp()
// {

// }

// inherits(Derp, EventEmitter);

// var derp = new Derp;

// var merp = new A;

// merp.listenTo(derp, "hi", function() { console.log("listened!"); });

// derp.emit("hi");

// merp.stopListening(derp, "hi");

// derp.emit("hi");
