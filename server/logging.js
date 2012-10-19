(function()
{

module.exports = {};

module.exports.configure = function(winston)
{
	var options = 
	{
		// colorize: true,
		timestamp: true
	};

	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, options);
}

}).call(this);