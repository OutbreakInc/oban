var _ = require("underscore"),
	idGen = require("../id-gen"),
	Side = require("sidestep"),
	SettingsIo = require("../settings-io"),
	utils = require("../utils");

var Settings = function(callback)
{
	this.settingsDir = utils.settingsDir();
	this.step = new Side(this);
	
	this._fileName = "settings";
	this._settingsIo = new SettingsIo(this.settingsDir, this._fileName);
	this._attrs = {};
	this._attrs.id = idGen();
	
	this._load(callback);
}

Settings.prototype._load = function(callback)
{
	var step = this.step;
	
	step.define(
	function()
	{
		this._settingsIo.exists(this._fileName, step.next);
	},
	function(err, exists)
	{
		if(exists)
		{
			this._settingsIo.read(function(err, attrs)
			{
				if (err) return callback(err);
				else if (!attrs) return callback(new Error(Errors.INVALID_PROJECT_JSON));

				_.extend(this._attrs, attrs);
				
				callback(null, this);
			}.bind(this));
		}
		else
		{
			//create file since it doesn't exist
			this._settingsIo.write("", function(err)
			{
				callback(null, this);
			});
		}
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

Settings.prototype.setAttrs = function(attrs, callback)
{
	callback = callback || function(){};

	this._attrs = attrs;

	callback();
}

Settings.prototype.saveFile = function(callback)
{
	var step = this.step;
	
	this._settingsIo.write(_.omit(this._attrs, "id"), callback);
}

module.exports = Settings;