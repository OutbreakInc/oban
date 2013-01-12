var fs = require("fs");
require("shelljs/global");

module.exports = {};

function load(done)
{
	if (fs.existsSync("nonExistentDir"))
	{
		rm("-r", "nonExistentDir");
	}

	if (!fs.existsSync("projectsDir"))
	{
		mkdir("projectsDir");
	}

	if (!fs.existsSync("projectsDir/noProjectJson"))
	{
		mkdir("projectsDir/noProjectJson");
	}

	cp("-R", "fixtures/existingProject", "projectsDir");

	done();
}

function unload(done)
{
	if (fs.existsSync("projectsDir"))
	{
		rm("-r", "projectsDir");
	}

	done();
}

module.exports.load = load;
module.exports.unload = unload;
