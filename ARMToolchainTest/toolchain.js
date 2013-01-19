module.exports = (function(){

var fs = require("fs");
var childProcess = require("child_process");
var http = require("http");

var _ =
{
	extend: function(obj)
	{
		var recurse = arguments.callee;
		Array.prototype.slice.call(arguments, 1).forEach(function(source)
		{
			for(var prop in source)
			{
				if(source[prop] instanceof Array)
					obj[prop] = ((obj[prop] instanceof Array)? obj[prop] : []).concat(source[prop]);
				else if((typeof(obj[prop]) == "object") && (typeof(source[prop]) == "object"))
					recurse(obj[prop], source[prop]);
				else
					obj[prop] = source[prop];
			}
		});
		return(obj);
	},
};

_.extend(ParseError.prototype, Error);
function ParseError(message, file)
{
	this.message = message;
	this.file = file;
}

_.extend(FileError.prototype, Error);
function FileError(message, file)
{
	this.message = message;
	this.file = file;
}


Module.prototype =
{
	rootPath: undefined,
	moduleJson: undefined,
	
	open: function(callback)
	{
		var pJSONPath = this.rootPath + "/project.json";
		fs.readFile(pJSONPath, "utf8", function(err, data)
		{
			if(err)
				return(callback(new FileError("Could not open module JSON file", pJSONPath)));
			
			try
			{
				if(!(this.moduleJson = JSON.parse(data)))	throw(true);
			}
			catch(e)
			{
				console.log("parse error: ", e);
				return(callback(new ParseError("Could not parse module JSON file", pJSONPath)));
			}
			
			callback(undefined, this.moduleJson);
			
		}.bind(this));
	},
	
	exists: function()
	{
		return(moduleJson != undefined);
	},
}
function Module(rootPath)
{
	this.rootPath = rootPath;
}

Toolchain.prototype =
{
	resolvePaths: function(paths, basesTable)
	{
		var resolvedPaths = [];
		paths.forEach(function(source)
		{
			var path = [];
			if(basesTable[source.base])	path.push(basesTable[source.base]);
			if(source.dir)				path.push(source.dir);
			path.push(source.name);
			resolvedPaths.push(path.join("/"));
		});
		return(resolvedPaths);
	},
	
	compile: function(pathsTable, output, project, callback)
	{
		var args =
		[
			"-o", output,
		];
		
		//gaunt
		if(project.settings && project.settings.gaunt)
			args.push("-nostdlib");
		
		//debugging
		if(project.settings && project.settings.debug)
			args.push("-g");
		
		//other compiler flags
		if(project.otherCompilerFlags && (project.otherCompilerFlags instanceof Array))
			args = args.concat(project.otherCompilerFlags);
		
		//add definitions
		if(typeof(project.definitions) == "object")
			for(var k in project.definitions)
				args.push("-D" + k + "=" + project.definitions[k]);
		
		//paths used to resolve complex referenced paths
		pathsTable = _.extend({undefined: "."}, pathsTable);
		
		if(project.linkFile)
			this.resolvePaths([project.linkFile], pathsTable).forEach(function(path)
			{
				args.push("-T", path);
			});
		
		//resolve and add include files
		if(project.include)
			this.resolvePaths(project.include, pathsTable).forEach(function(path)
			{
				args.push("-I", path);
			});
		
		//resolve and add sources
		args = args.concat(this.resolvePaths(project.files, pathsTable));
		
		console.log("args: ", args);
		
		//compile!
		var compiler = childProcess.spawn(pathsTable.sdk + "/bin/arm-none-eabi-g++", args,
		{
			env:
			{
				"PATH": (pathsTable.sdk + "/bin"),
				"LD_PATH": (pathsTable.sdk + "/lib")
			}
		});
		compiler.stdout.setEncoding("utf8");
		compiler.stderr.setEncoding("utf8");
		
		var compileErrors = [];
		var stdout = "", stderr = "";
		
		compiler.stdout.on("data", function(data)
		{
			stdout += data;
		}.bind(this));
		compiler.stderr.on("data", function(data)
		{
			stderr += data;
		}.bind(this));
		compiler.on("exit", function(returnCode)
		{
			//for each line of output, see if it matches the way GCC formats an error
			stderr.split("\n").forEach(function(line)
			{
				//this regex looks for errors like:
				//	"./example.cpp:74:2: error: 'mistake' was not declared in this scope"
				//	"./example.cpp:93: undefined reference to `mistake'"
				//and breaks it into:
				//	match[1]: "./example.cpp"
				//	match[2]: "74"
				//	match[3]: "2"
				//	match[4]: " error: 'mistake' was not declared in this scope"
				
				var m = line.match(/^(.*?):(\d+):(\d*):{0,1}(.*)/);
				if(m)
					compileErrors.push({raw: line, file: m[1], line: m[2], charIndex: m[3] || 0, err: m[4].trim()});
			});
			
			//invoke callback with no error
			callback(undefined,
			{
				compileErrors: compileErrors,
				returnCode: returnCode,
				stderr: stderr
			});
		}.bind(this));
	},
	
	assemble: function(output, sourceFileArray, settings)	//might not need
	{
		;
	},
	
	link: function(output, objectFileArray, settings)	//might not need
	{
		;
	},
	
	disassemble: function(pathsTable, objectFileArray, callback)
	{
		var args = ["-d"];
		
		args = args.concat(objectFileArray);
		
		var disassembler = childProcess.spawn(pathsTable.sdk + "/bin/arm-none-eabi-objdump", args,
		{
			env:
			{
				"PATH": (pathsTable.sdk + "/bin"),
				"LD_PATH": (pathsTable.sdk + "/lib")
			}
		});
		disassembler.stdout.setEncoding("utf8");
		disassembler.stderr.setEncoding("utf8");
		var stdout = "", stderr = "";
		
		disassembler.stdout.on("data", function(data)
		{
			stdout += data;
		}.bind(this));
		disassembler.stderr.on("data", function(data)
		{
			stderr += data;
		}.bind(this));
		disassembler.on("exit", function(returnCode)
		{
			callback(undefined,
			{
				returnCode: returnCode,
				disassembly: stdout,
				errors: stderr
			});
		}.bind(this));
	}
}
function Toolchain()
{
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


Targets.prototype =
{
	open: function(targetsJsonFile, callback)
	{
		fs.readFile(targetsJsonFile, "utf8", function(err, data)
		{
			if(err)	return(callback(new FileError("Could not load targets JSON file", targetsJsonFile)));
			
			var targets;
			try
			{
				if(!(targets = JSON.parse(data)))	throw(true);
			}
			catch(e)
			{
				console.log("parse error: ", e);
				return(callback(new ParseError("Could not parse targets JSON file", targetsJsonFile)));
			}
			
			this.add(targets.targets);
			callback(undefined);
			
		}.bind(this));
	},
	add: function(arrayOfTargets)
	{
		arrayOfTargets.forEach(function(target)
		{
			//crudely validate the target
			if(!target.name)
				return(true);	//continue
			//...
			
			//this could simply replace an existing definition, which is expected
			this.targets[target.name] = target;
			
		}.bind(this));
	},
	resolve: function(targetName, moduleJson)
	{
		var target = this.targets[targetName];
		if(!target)
			return(undefined);
		
		target = _.extend({}, target);
		if(target["extends"])
		{
			var ancestor = this.resolve(target["extends"]);
			if(ancestor)
				_.extend(target, ancestor, {name: target.name});
		}
		
		if(moduleJson)
			_.extend(target, moduleJson, {name: moduleJson.name});
		
		return(target);
	}
}
function Targets()
{
	this.targets = {};
}


Dependencies.prototype =
{
	baseDir: null,
	
	find: function(ownerName, moduleName)
	{
		var modulePath = ownerName + "_" + moduleName;
		
		var mod = new Module(baseDir + "/" + modulePath);
		mod.open();
		if(!mod.exists())
			console.log("Can't find, and would have to download module: " + moduleName);
	}
};
function Dependencies(baseDir)
{
}



////////////////////////////////////////////////////////////////


//global setting!
/*
var sdkBase = "../SDK6/";
var platformBase = sdkBase + "../platform/";

var toolchain = new Toolchain(sdkBase);

var targets = new Targets();

targets.open(platformBase + "targets.json", function(err)
{
	if(err)
	{
		console.log("error: ", err);
		return;
	}
	
	var module = new Module(".");

	module.open(function(err, moduleJson)
	{
		if(err)
		{
			console.log("error: ", err);
			return;
		}
		
		var targetName = moduleJson.compatibleWith[0];	//@@hack
		
		var settings = targets.resolve(targetName, moduleJson);
		
		if(!settings)
		{
			console.log("could not resolve target: " + targetName);
			return;
		}
		
		console.log("settings: ", settings);
		
		toolchain.compile("out.elf", {"project": ".", "platform": platformBase}, settings, function(err, compileResult)
		{
			console.log("compilation complete: ", compileResult);
			
			toolchain.disassemble(["out.elf"], function(err, result)
			{
				console.log("disassembly complete: ", result);
			});
		});
	});
});
*/

Compiler.prototype =
{
	toolchain: null,
	targets: null,
	
	compile: function(dirs, callback)
	{
		var ths = this;
		this.targets.open(dirs.platform + "/targets.json", function(err)
		{
			if(err)	return(callback(err));
			
			var module = new Module(dirs.module);
			module.open(function(err, moduleJson)
			{
				if(err)	return(callback(err));
				var targetName = moduleJson.compatibleWith[0];	//@@hack!
				
				var settings = ths.targets.resolve(targetName, moduleJson);
				
				if(!settings)
					return(callback(new Error("Could not resolve target '" + targetName + "'")));
				
				var outputName = (dirs.output || dirs.module || ".") + "/module.elf";
				ths.toolchain.compile(dirs, outputName, settings, function(err, compileResult)
				{
					//console.log("compilation complete: ", compileResult);
					if(err)	return(callback(err));
					
					//@@diag and debug
					ths.toolchain.disassemble(dirs, [outputName], function(err, result)
					{
						console.log("disassembly complete: ", result);
					});
					
					callback(undefined, outputName, compileResult);
				});
			});
		});
	}
};
function Compiler()
{
	this.toolchain = new Toolchain();
	this.targets = new Targets();
}

return(
{
	Compiler: Compiler
});

})();