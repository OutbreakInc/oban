(function()
{

var fs = require("fs"),
	verse = require("moduleverse"),
	_ = require("underscore"),
	join = require("path").join,
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
				join(dir, "/modules");
		});
	},

	modules: function()
	{
		var deferred = q.defer();

		switch (process.platform)
		{
		case "darwin": 
			deferred.resolve(join(process.env["HOME"], "/Documents/Logiblock/modules"));
			break;

		case "win32":
		{
			var basePath = join(process.env["HOMEDRIVE"], process.env["HOMEPATH"]);

			fs.exists(process.env["HOME"] + "/Documents", function(exists)
			{
				if (exists) deferred.resolve(join(basePath, "/Documents/Logiblock/modules"));
				else deferred.resolve(join(basePath, "/My Documents/Logiblock/modules"));
			});

			break;
		}
		case "linux":
			deferred.resolve(join(process.env["HOME"], "/.logiblock/local/modules"));
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
				join(process.env["HOME"], "/Library/Application Support/Logiblock"));
		case "win32": 
			deferred.resolve(join(process.env["APPDATA"], "/Logiblock"));
		case "linux": 
			deferred.resolve(join(process.env["HOME"], "/.logiblock"));
		}

		return deferred.promise;
	},

	ide: function()
	{
		return dirs.coreModules()
		.then(function(dir)
		{
			return verse.findLocalInstallation(dir, "IDE", undefined)
			.then(function(json)
			{
				return json.__path;
			});
		});
	},
	
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
			return join(dir, "/bin/");
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
	},

	deviceServerBin: function()
	{
		return dirs.bin()
		.then(function(dir)
		{
			return join(dir, ("/GalagoServer." + process.platform));
		});
	}
}

// var b = dirs.sdk();

// b.then(function(dir)
// {
// 	console.log(dir);
// });

}).call(this);
