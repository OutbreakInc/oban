var EventEmitter = require("events").EventEmitter,
	util = require("util"),
	_ = require("underscore");

var Errors = 
{
	INVALID_FILE_NAME: "Invalid file name",
	CANT_EDIT_CLOSED_FILE: "Can't edit closed file"
};

var nextTickError = function(err, callback)
{
	return process.nextTick(function()
	{
		callback(err);
	});
}

var File = function(options, callback)
{
	options = options || {};

	var attrs = {};

	attrs.name = options.name;
	attrs.isOpen = false;

	this._checkAttrs(attrs, function(err)
	{
		if (err) return nextTickError(err, callback);

		this._attrs = attrs;

		EventEmitter.call(this);

		process.nextTick(function()
		{
			callback();
		});

	}.bind(this));
}

util.inherits(File, EventEmitter);

File.prototype.name = function()
{
	return this._attrs.name;
}

File.prototype.setName = function(newName, callback)
{
	var attrs = _.clone(this._attrs);
	attrs.name = newName;

	this._checkAttrs(attrs, function(err)
	{
		if (err) return callback(err);

		this._attrs = attrs;

		callback();

	}.bind(this));
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

File.prototype.toFile = function()
{
	return _.omit(this._attrs, "isOpen", "contents");
}

File.prototype._checkAttrs = function(attrs, callback)
{
	if (!attrs.name || attrs.name.length === 0)
	{
		return callback(new Error(Errors.INVALID_FILE_NAME));
	}

	callback();
}

File.Errors = Errors;

module.exports = File;
