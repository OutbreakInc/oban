(function ()
{

var utils = {};

utils.getLineNumber = function(data)
{
	var lines = data.split("\n");

	for (var i = 0; i < lines.length; ++i)
	{
		var lineNumber = lines[i].match(/^[0-9]+/);

		if (lineNumber) return lineNumber[0];
	}

	return -1;
};

// in: data - string
// out: array of data split by newlines, with empty lines removed
utils.lineSplit = function(data)
{
	return data.split("\n").filter(function(item)
	{
		return item.length > 0; 
	});
},

utils.hasTerminator = function(data)
{
	var lines = utils.lineSplit(data);

	return (lines[lines.length - 1].trim() == "(gdb)");
}

function Parser()
{
}

Parser.utils = utils;

Parser.prototype.onShowVariables = function(data, client) 
{
	// protocol:
	// message: gdb_variables
	// currently:
	// data: list of strings containing variable type + name
	// TODO:
	// data: list of { type: <data type>, name: <variable name> }
	var variables = [];

	var lines = utils.lineSplit(data);

	// remove first two lines, which are just the regex match and file which
	// we're in, and the last line, which is "(gdb)"
	lines = lines.slice(3, lines.length - 2);

	lines.forEach(function(line)
	{
		var lastSpace = line.lastIndexOf(" ");

		// split up into name and type
		var item =
		{
			name: line.slice(lastSpace),
			type: line.slice(0, lastSpace)
		};

		variables.push(item);
	});

	// console.log("Sending client list of variables");

	// callback(variables);

	client.emit("gdb_variables", variables);
};

Parser.prototype.setFakeBreakpoint = function(lineNumber)
{
	this.fakeBreakpoint = lineNumber;
}

Parser.prototype.onHitBreakpoint = function(data, client)
{
	console.log("fixed breakpoint: " + this.fakeBreakpoint);
	var line = getLineNumber(data);

	if (this.fakeBreakpoint) line = this.fakeBreakpoint;

	client.emit("gdb_break", {line: line});
}

module.exports = Parser;

}).call(this);
