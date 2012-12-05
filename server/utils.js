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
	case "darwin": return process.env["HOME"] + 
		"/Library/Application Support/outbreak-ide";
	}
},

settingsDirForPort: function(port)
{
	switch (os.platform())
	{
	case "darwin": return process.env["HOME"] + 
		"/Library/Application Support/outbreak-ide-server/" + port;
	}
},

projectsDir: function()
{
	return module.exports.documentsDir() + "/outbreak-ide";
},

projectsDirForPort: function(port)
{
	return module.exports.documentsDir() + "/outbreak-ide-server/" + port;
},

scriptsDir: function()
{
	return __dirname + "/../SDK/scripts";
}

}

}).call(this);
