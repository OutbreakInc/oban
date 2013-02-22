(function()
{

module.exports =
{

documentsDir: function()
{
	switch (process.platform())
	{
	case "darwin": return process.env["HOME"] + "/Documents";
	}
},

settingsDir: function()
{
	switch (process.platform())
	{
	case "darwin": return process.env["HOME"] + 
		"/Library/Application Support/outbreak-ide";
	}
},

settingsDirForPort: function(port)
{
	switch (process.platform())
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

sdkDir: function()
{
	return __dirname + "/../../ardbeg/SDK/";
},

gdbServerDir: function()
{
	return __dirname + "/../../ardbeg/gdbServer/";
},

platformDir: function()
{
	return __dirname + "/../../ardbeg/Platform/";
}

}

}).call(this);
