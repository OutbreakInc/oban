var Errors =
{
	INVALID_DEVICE_ID: "Invalid device id",	
	INVALID_DEVICE_NAME: "Invalid device name",
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

	if (!this._isValidStr(options.deviceId))
	{
		return nextTickError(new Error(Errors.INVALID_DEVICE_ID), callback);
	}

	if (!this._isValidStr(options.name))
	{
		return nextTickError(new Error(Errors.INVALID_DEVICE_NAME), callback);
	}	

	this._attrs = {};

	this._attrs.deviceId = options.deviceId;
	this._attrs.name = options.name;
	this._attrs.isOpenBy = undefined;
}

Device.prototype._isValidStr = function(name)
{
	return !(!name || name.length === 0);
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