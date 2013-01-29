var fs = require("fs"),
	path = require("path"),
	_ = require("underscore");

var MS_BETWEEN_SAVES = 500;

function SettingsIo(settingsPath, name)
{
	//console.log("settingsPath", settingsPath)
	this.name = name;
	this.settingsFilePath = 
		path.normalize(settingsPath + "/" + this.name + ".json");
}

SettingsIo.prototype.path = function()
{
	return this.settingsFilePath;
}

SettingsIo.prototype.write = function(data, callback)
{
	console.log("writing to " + this.settingsFilePath);

	fs.writeFile(	this.settingsFilePath, 
					JSON.stringify(data, null, "\t"), 
					"utf8", callback);	
}

SettingsIo.prototype.read = function(callback)
{
	fs.readFile(this.settingsFilePath, "utf8", function(err, data)
	{
		if (err) return callback(err); 
		console.log("JSON.parse(data)",JSON.parse(data));
		callback(null, JSON.parse(data));
	});
}

SettingsIo.prototype.exists = function(fileName, callback)
{
	fs.exists(this.settingsFilePath, function(exists)
	{
		callback(null, exists);
	});
}

SettingsIo.prototype.watch = function(callback)
{
	fs.watchFile(this.settingsFilePath, function(curr, prev)
	{
		if (curr.mtime > prev.mtime) callback();
	});
}

module.exports = SettingsIo;