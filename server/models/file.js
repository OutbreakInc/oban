var EventEmitter = require("events").EventEmitter,
	util = require("util");

var File = function(options)
{
	options = options || {};

	this._attrs = {};

	this._attrs.name = options.name;
	this._attrs.isOpen = false;

	var self = this;

	if (!this._attrs.name || this._attrs.name.length === 0)
	{
		process.nextTick(
		function()
		{
			self.emit("error", "Must provide a valid file name!");
		});

		return;
	}
	else
	{
		process.nextTick(
		function()
		{
			self.emit("loaded");
		});
	}

	EventEmitter.call(this);
}

util.inherits(File, EventEmitter);

File.prototype.name = function()
{
	return this._attrs.name;
}

File.prototype.open = function()
{
	this._attrs.isOpen = true;
}

File.prototype.close = function()
{
	this._attrs.isOpen = false;
	delete this._attrs.contents;
}

File.prototype.isOpen = function()
{
	return this._attrs.isOpen;
}

File.prototype.setContents = function(contents, callback)
{
	callback = callback || function(){};

	if (!this._attrs.isOpen)
	{
		return callback("File isn't open");
	}

	this._attrs.contents = contents;

	this.emit("modified", this._attrs.contents);
	callback();
}

File.prototype.toJSON = function()
{
	return this._attrs;
}

module.exports = File;
