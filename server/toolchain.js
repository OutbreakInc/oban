(function()
{

var spawn = require("child_process").spawn,
	fs = require("fs"),
	path = require("path");

module.exports = {};

var BUILDER = "../SDK/scripts/build.sh";

module.exports =
{

build: function(project, callback)
{
	var sources = project.get("files"),
		name = project.get("name"),
		path = project.get("path");


	if (!fs.existsSync(outputPath))
	{
		fs.mkdirSync(outputPath);
	}

	var buildDir = outputPath + "/build";

	if (!fs.existsSync(buildDir))
	{
		fs.mkdirSync(buildDir);
	};

	console.log(buildDir);

	var buildProcess = spawn(BUILDER, ["-g", sources.join(" ")], 
		{ 
			env: 
			{ 
				PART: "lpc1343", 
				BUILD_DIR: buildDir
			},
			cwd: buildDir
		});

	buildProcess.stderr.setEncoding("utf8");
	buildProcess.stderr.on("data", function(err)
	{
		console.log("error:");
		console.log(err);
	});

	buildProcess.stdout.setEncoding("utf8");

	buildProcess.stdout.on("data", function(data)
	{
		console.log("data:");
		console.log(data);
	});

	buildProcess.on("exit", function(exitCode)
	{
		console.log("exit");
		console.log(arguments);

		if (exitCode == 0)
		{
			callback(buildDir + "/a.out");
		}
		else
		{
			callback("")
		}
	});
}

}

}).call(this);