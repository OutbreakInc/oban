(function()
{

var fs = require("fs"),
	winston = require("winston"),
	utils = require("./utils"),
	_ = require("underscore");

var MS_BETWEEN_SAVES = 500;

module.exports = {};

module.exports.middleware = function(collection)
{
	var recentlySaved = false;
	var fileName = utils.settingsDir() + "/" + collection.name + ".json";

	winston.debug("created file store middleware: " + collection.name);

	// restore collection from file on load if file exists
	if (fs.existsSync(fileName))
	{
		console.log("restored collection: " + collection.name);
		console.log(JSON.parse(
			fs.readFileSync(fileName, "utf8")));

		collection.reset(JSON.parse(
			fs.readFileSync(fileName, "utf8")));
	}

	// don't need any of the callback's arguments because we have
	// access to the collection thru the closure

	function save()
	{
		winston.debug("file store middleware invoked for: " + fileName);

		fs.writeFile(fileName, 
			JSON.stringify(collection.toJSON(), null, " "), "utf8", 
			function(err)
		{
			if (err) return winston.error("Couldn't save data to disk!");

			winston.debug("saved to file: " + fileName);
		});
	}

	return _.debounce(save, MS_BETWEEN_SAVES);
}

}).call(this);