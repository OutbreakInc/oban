(function()
{

var os = require("os");

var projectsDir;

module.exports =
{

documentsDir: function()
{
	switch (os.platform())
	{
	case "darwin": return process.env["HOME"] + "/Documents";
	}
},

settingsDir: function()
{
	switch (os.platform())
	{
	case "darwin": return process.env["HOME"] + "/Library/Application Support/outbreak-ide";
	}
},

projectsDir: function()
{
	return projectsDir || module.exports.documentsDir() + "/outbreak-ide";
},

setProjectsDir: function(dir)
{
	projectsDir = dir;
}

}

}).call(this);