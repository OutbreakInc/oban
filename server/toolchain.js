(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	utils = require("./utils");

module.exports = {};

var BUILDER = "../SDK/scripts/build.sh";

module.exports =
{

build: function(sources, name, outputPath)
{
	if (!fs.existsSync(outputPath))
	{
		fs.mkdirSync(outputPath);
	}

	var buildDir = outputPath + "/build";

	if (!fs.existsSync(buildDir))
	{
		fs.mkdirSync(buildDir);
	};

	var buildProcess = spawn(BUILDER, [name, sources.join(" ")], 
		{ 
			env: 
			{ 
				PART: "lpc1343", 
				BUILD_DIR: "\"" + buildDir + "\""
			} 
		});

	buildProcess.stderr.setEncoding("utf8");
	buildProcess.stderr.on("data", function(err)
	{
		console.log(err);
	});

	buildProcess.stdout.setEncoding("utf8");

	buildProcess.stdout.on("data", function(data)
	{
		console.log(data);
	});

	buildProcess.on("exit", function()
	{
		console.log("exit");
		console.log(arguments);
	});
}

}

// module.exports.build(["derp.cpp", "herp.cpp"], "derp");

}).call(this);