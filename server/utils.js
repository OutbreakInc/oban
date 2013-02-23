(function()
{

var fs = require("fs"),
	q = require("q");

module.exports =
{

modulesDir: function()
{
	var deferred = q.defer();

	switch (process.platform)
	{
	case "darwin": 
		deferred.resolve(process.env["HOME"] + "/Documents/Logiblock/modules");
		break;

	case "win32":
	{
		promise = q.nfcall(fs.exists, process.env["HOMEPATH"] + "/Documents");

		promise.then(function(exists)
		{
			if (exists) deferred.resolve(process.env["HOMEPATH"] + "/Documents");
			else deferred.resolve(process.env["HOMEPATH"] + "/My Documents");
		});

		break;
	}
	case "linux":
		deferred.resolve(process.env["HOME"] + "/.logiblock/local/modules");
		break;
	}

	return deferred.promise;
},

coreModulesDir: function()
{
 	return process.env["LOGIBLOCK_CORE_PATH"] ? 
		process.env["LOGIBLOCK_CORE_PATH"] :
		module.exports.settingsDir() + "/modules";
},

settingsDir: function()
{
	switch (process.platform)
	{
	case "darwin": 
		return process.env["HOME"] + "/Library/Application Support/Logiblock";
	case "win32": 
		return process.env["APPDATA"] + "/Logiblock";
	case "linux": 
		return process.env["HOME"] + "/.logiblock";
	}
},

// backwards compatibility
projectsDir: function()
{
	return module.exports.modulesDir();
},

sdkDir: function()
{
	return module.exports.coreModulesDir() + "/SDK/";
},

gdbServerDir: function()
{
	return module.exports.coreModulesDir() + "/platform/bin/";
},

platformDir: function()
{
	return module.exports.coreModulesDir() + "/platform/";
}

}

}).call(this);
