var _ = require("underscore"),
	idGen = require("../id-gen"),
	Side = require("sidestep"),
	SettingsIo = require("../settings-io"),
	dirs = require("../dirs");

var DEFAULT_SETTINGS =
{
	"allowTracking":
	{
		"text": "Allow sending anonymous usage statistics", 
		"value": true
	},

	"keyBindings":
	{
		"text": "Key bindings",
		"value": 
		[
			{
				"shortcut": "cmd+b",
				"event": "build:start"
			}
		]
	}
};

var Setting = function(callback)
{
	dirs.settings()
	.then(function(settingsDir)
	{
		this.settingsDir = settingsDir;
		this.step = new Side(this);
		
		this._fileName = "settings";
		this._settingsIo = new SettingsIo(this.settingsDir, this._fileName);
		this._attrs = {};
		this._attrs.id = idGen();
		
		this._load(callback);
		
	}.bind(this));
}

Setting.prototype._load = function(callback)
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

				_.extend(this._attrs, _.omit(attrs, "firstTimeOpening"));
				
				callback(null, this);
			}.bind(this));
		}
		else
		{
			this._attrs.firstTimeOpening = true;
			this._attrs.collection = [];
			var trackingSetting = {"id": idGen(), "name":"allowTracking", "text":"Allow sending anonymous usage statistics", "value": true};
			
			this._attrs.collection.push(trackingSetting);
			//create file since it doesn't exist
			this._settingsIo.write(this._attrs, function(err)
			{
				callback(null, this);
			}.bind(this));
		}
	})
	.error(function(err)
	{
		callback(err);
	})
	.exec();
}

Setting.prototype.setAttrs = function(attrs, callback)
{
	callback = callback || function(){};

	this._attrs.collection = attrs;

	callback();
}

Setting.prototype.saveFile = function(callback)
{
	var step = this.step;
	console.log("saveFile");
	this._settingsIo.write(this._attrs, callback);
}

module.exports = Setting;