(function()
{

var fs = require("fs"),
	verse = require("moduleverse"),
	_ = require("underscore"),
	q = require("q");

var dirs = module.exports =
{
	coreModules: function()
	{
		return dirs.settings()
		.then(function(dir)
		{
			return process.env["LOGIBLOCK_CORE_PATH"] ? 
				process.env["LOGIBLOCK_CORE_PATH"] :
				dir + "/modules";
		});
	},

	modules: function()
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

	settings: function()
	{
		var deferred = q.defer();

		switch (process.platform)
		{
		case "darwin": 
			deferred.resolve(
				process.env["HOME"] + "/Library/Application Support/Logiblock");
		case "win32": 
			deferred.resolve(process.env["APPDATA"] + "/Logiblock");
		case "linux": 
			deferred.resolve(process.env["HOME"] + "/.logiblock");
		}

		return deferred.promise;
	},

	ide: function()
	{
		return dirs.coreModules()
		.then(function(dir)
		{
			return dir + "/ide/";
		});
	},

	// backwards compatibility
	// projectsDir: function()
	// {
	// 	return module.exports.modulesDir();
	// },

	sdk: function()
	{
		return dirs.coreModules()
		.then(function(baseDir)
		{
			return verse.findLocalInstallation(baseDir, "SDK", undefined)
			.then(function(json)
			{
				return json.__path;
			});
		});
	},

	bin: function()
	{
		return dirs.platform()
		.then(function(dir)
		{
			return dir + "/bin/";
		});
	},

	platform: function()
	{
		return dirs.coreModules()
		.then(function(baseDir)
		{
			return verse.findLocalInstallation(baseDir, "platform", undefined)
			.then(function(json)
			{
				return json.__path;
			});
		});
	}
}

// var b = dirs.sdk();

// b.then(function(dir)
// {
// 	console.log(dir);
// });

}).call(this);
