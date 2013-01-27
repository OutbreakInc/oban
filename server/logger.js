"use strict";

var basename = require("path").basename;

var LogLevels =
{
	ERROR: { level: 0, prefix: "[error]" },
	WARNING: { level: 1, prefix: "[warning]" },
	DEBUG: { level: 2, prefix: "[debug]" }
};

var GLOBAL_LOG_LEVEL = LogLevels.ERROR;

module.exports = function logger(filename)
{
	return {

		// default log level
		LOG_LEVEL: LogLevels.ERROR,

		error: function()
		{
			var args = Array.prototype.slice.call(arguments);
			args.unshift(LogLevels.ERROR); 
			this._log.apply(this, args);
		},

		warning: function()
		{
			var args = Array.prototype.slice.call(arguments);
			args.unshift(LogLevels.WARNING);
			this._log.apply(this, args);
		},

		debug: function()
		{
			var args = Array.prototype.slice.call(arguments);
			args.unshift(LogLevels.DEBUG);
			this._log.apply(this, args);
		},

		_log: function()
		{
			var args = Array.prototype.slice.call(arguments);

			var logLevel = args.shift();

			var level = logLevel.level;
			var prefix = logLevel.prefix;

			if (level > this.LOG_LEVEL && level > GLOBAL_LOG_LEVEL) return;

			// capture location of log message
			var errList = new Error().stack.split('\n')[3].split(/[:)]/);
			var line = errList[errList.length - 3];

			args.unshift(basename(filename) + ":" + line + ":");
			args.unshift(prefix);
			console.log.apply(this, args);
		},

		setLevel: function(level)
		{
			level = parseInt(level, 10);
			if (isNaN(level) || level < 0) return this.error("Invalid log level!");

			this.LOG_LEVEL = level;
		},

		setGlobalLevel: function(level)
		{
			level = parseInt(level, 10);
			if (isNaN(level) || level < 0) return this.error("Invalid log level!");

			GLOBAL_LOG_LEVEL = level;
		}
	}
}
