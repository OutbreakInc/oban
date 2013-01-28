var idGen = require("../id-gen");

var Errors =
{
	INVALID_PARAMETER: "Invalid or missing parameter",	
	ALREADY_OPEN: "Device is already open by someone else"
};

var nextTickError = function(err, callback)
{
	return process.nextTick(function()
	{
		callback(err);
	});
}

var Device = function(options, callback)
{
	options = options || {};

	// TODO: figure out how to do validation here on all these

	this._attrs = {};

	this._attrs.productId = options.productID;
	this._attrs.vendorId = options.vendorID;
	this._attrs.vendorName = options.vendorName;
	this._attrs.productName = options.productName;
	this._attrs.serialNumber = options.serialNumber;
	this._attrs.allocated = options.allocated;
	this._attrs.hwActive = options.hwActive;
	this._attrs.gdbPort = options.gdbPort;

	this._attrs.isOpenBy = undefined;

	this._attrs.id = idGen();

	process.nextTick(callback);
}

Device.prototype._isValidStr = function(name)
{
	return !(!name || name.length === 0);
}

Device.prototype.gdbPort = function()
{
	return this._attrs.gdbPort;
}

Device.prototype.setOpen = function(userId, isOpen, callback)
{
	if (this._attrs.isOpenBy &&
		this._attrs.isOpenBy != userId) 
	{
		return callback(new Error(Errors.ALREADY_OPEN));
	}

	this._attrs.isOpenBy = isOpen ? userId : undefined;
	callback();	
}

Device.prototype.toJSON = function()
{
	return this._attrs;
}

Device.Errors = Errors;

module.exports = Device;