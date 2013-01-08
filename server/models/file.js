var EventEmitter = require("events").EventEmitter,
	util = require("util");

var File = function(options, callback)
{
	options = options || {};

	this._attrs = {};

	this._attrs.name = options.name;
	this._attrs.isOpen = false;

	var self = this;

	if (!this._attrs.name || this._attrs.name.length === 0)
	{
		return process.nextTick(function()
		{
			callback("Must provide a valid file name!");
		});
	}

	EventEmitter.call(this);
	process.nextTick(function()
	{
		callback();
	});
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

File.prototype.contents = function()
{
	return this._attrs.contents;
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
