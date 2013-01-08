var EventEmitter = require("events").EventEmitter,
	util = require("util");

var Errors = 
{
	INVALID_FILE_NAME: "Invalid file name",
	CANT_EDIT_CLOSED_FILE: "Can't edit closed file"
};

var File = function(options, callback)
{
	options = options || {};

	this._attrs = {};

	this._attrs.name = options.name;
	this._attrs.isOpen = false;

	if (!this._attrs.name || this._attrs.name.length === 0)
	{
		return process.nextTick(function()
		{
			callback(new Error(Errors.INVALID_FILE_NAME));
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
		return callback(new Error(Errors.CANT_EDIT_CLOSED_FILE));
	}

	this._attrs.contents = contents;

	this.emit("modified", this._attrs.contents);
	callback();
}

File.prototype.toJSON = function()
{
	return this._attrs;
}

File.Errors = Errors;

module.exports = File;
