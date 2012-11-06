(function()
{

var fs = require("fs"),
	winston = require("winston");

var MS_BETWEEN_SAVES = 1000;

module.exports = {};

module.exports.middleware = function(collection)
{
	var recentlySaved = false;
	var fileName = collection.name + ".json";

	winston.debug("created file store middleware");

	// restore collection from file on load if file exists

	if (fs.existsSync(fileName))
	{
		collection.reset(JSON.parse(
			fs.readFileSync(fileName, "utf8")));

		winston.debug("restored collection:");
		winston.debug(JSON.stringify(collection.toJSON()));		
	}

	return function(method, model, collection, options)
	{
		winston.debug("file store middleware invoked!");
		console.log(arguments);

		// immediately save collection when it's been modified, 
		// but only save once every MS_BETWEEN_SAVES milliseconds
		if (recentlySaved) return;

		recentlySaved = true;

		winston.debug("saving "+fileName+" to file");

		// pretty hacky, but the most clear and obvious way without
		// writing too much code elsewhere to invoke this function
		// differently for each Backbone event type
		if (method == "reset")
		{
			collection = model;
		}
		else if (method.indexOf("change") == 0)
		{
			collection = model.collection;
		}

		fs.writeFile(fileName, 
			JSON.stringify(collection.toJSON(), null, " "), "utf8", 
			function(err)
		{
			if (err) return winston.error("Couldn't save data to disk!");

			winston.debug("saved to file");

			// allow saving again after certain period of time
			setTimeout(function()
			{
				winston.debug(collection.name+" save timeout reached");
				recentlySaved = false;

			}, MS_BETWEEN_SAVES);
		});

	}
}

}).call(this);