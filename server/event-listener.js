var _ = require("underscore"),
	EventEmitter = require("events").EventEmitter,
	inherits = require("util").inherits,
	badger = require("badger")(__filename);

module.exports =
{
	listenTo: function(obj, name, callback) 
	{
		var listeners = this._listeners || (this._listeners = []);

		// create a version of cb bound to `this`, use that for the callback
		var boundCb = _.bind(callback, this);

		listeners.push({ obj: obj, name: name, callback: boundCb, originalCb: callback });
		obj.on(name, boundCb);

		badger.debug("listeners:");
		var msg = "";
		listeners.forEach(function(listener)
		{
			msg += listener.name + ", ";
		});

		badger.debug(msg);

		return this;
	},

	stopListening: function(obj, name, callback)
	{
		var listeners = this._listeners;

		if (!listeners) return;

		var toRemove = [];
		var toKeep = [];
		var filter;

		// remove one specific listener
		if (obj && name && callback)
		{
			filter = function(listener)
			{
				return (listener.obj == obj && listener.name == name &&
						listener.originalCb == callback);
			}
		}
		// remove all listeners for object for the event `name`
		else if (obj && name)
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
