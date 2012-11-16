(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs");

module.exports = {};

var BUILDER = "../SDK/scripts/build.sh";
var PROJECT_PATH = process.env.HOME + "/outbreak/";

module.exports.build = function(sources, name)
{
	var buildProcess = spawn(BUILDER, [name, sources.join(" ")], 
		{ 
			env: 
			{ 
				PART: "lpc1343", 
				BUILD_DIR: PROJECT_PATH + name 
			} 
		});

	buildProcess.stderr.setEncoding("utf8");
	buildProcess.stderr.on("data", function()
	{
		console.log(arguments);
	});

	buildProcess.stdout.setEncoding("utf8");

	buildProcess.stdout.on("data", function()
	{
		console.log(arguments);
	});

	buildProcess.on("exit", function()
	{
		console.log("exit");
		console.log(arguments);
	});
}

module.exports.build(["derp.cpp", "herp.cpp"], "derp");

}).call(this);