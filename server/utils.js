(function()
{

var fs = require("fs");

if (process.env["LOGICODE_CONFIG"] == "dev")
{
	module.exports = require("./utils-dev");
	return;
}

module.exports =
{

modulesDir: function()
{
	switch (process.platform())
	{
	case "darwin": return process.env["HOME"] + "/Documents/Logiblock/modules";
	case "win32":
	{
		var dir = fs.existsSync(process.env["HOMEPATH"] + "/Documents") ?
			process.env["HOMEPATH"] + "/Documents" :
			process.env["HOMEPATH"] + "/My Documents";

		return (dir + "/Logiblock/modules");
	}
	case "linux": return process.env["HOME"] + "/.logiblock/local/modules";
	}
},

coreModulesDir: function()
{
	return module.exports.settingsDir() + "/modules";
},

settingsDir: function()
{
	switch (process.platform())
	{
	case "darwin": 
		return process.env["HOME"] + "/Library/Application Support/Logiblock";
	case "win32":
		return process.env["APPDATA"] + "/Logiblock";
	case "linux":
		return process.env["HOME"] + "/.logiblock";
	}
},

// keep around to not break code, replace/remove later
projectsDir: function()
{
	return module.exports.modulesDir();
},

sdkDir: function()
{
	return __dirname + "/../../ardbeg/SDK/";
},

gdbServerDir: function()
{
	return __dirname + "/../../ardbeg/gdbServer/";
},

platformDir: function()
{
	return __dirname + "/../../ardbeg/Platform/";
}

}

}).call(this);
