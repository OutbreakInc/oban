var fs = require("fs");
var childProcess = require("child_process");
var http = require("http");

Process.prototype =
{
}
function Process(path, args)
{
	childProcess.spawn(path, args)
}

Module.prototype =
{
	rootPath: null,
}
function Module(rootPath)
{
	
}

Toolchain.prototype =
{
	binDir: null,
	
	compile: function(output, sourceFileArray, settings)
	{
		
		var compiler = childProcess.spawn(this.binDir + "/gcc", args);
		{
			
		}
	},
	
	assemble: function(output, sourceFileArray, settings)
	{
		;
	},
	
	link: function(output, objectFileArray, settings)
	{
		;
	},
	
	disassemble: function(output, objectFileArray, settings)
	{
		;
	}
}
function Toolchain(binDir)
{
	this.binDir = binDir;
}

// http://modules.logiblock.com/galago/
// outbreak/gps/versions
//
//
//
Downloader.prototype =
{
}
function Downloader(ownerName, moduleName, version)
{
	http.request("http://modules.logiblock.com/galago/" + ownerName + "/" + moduleName + "/")
}

Dependencies.prototype =
{
	baseDir: null,
	
	find: function(moduleName)
	{
		var mod = new Module(baseDir + "/" + moduleName);
		
		if(!mod.exists())
	}
};
function Dependencies(baseDir)
{
}

