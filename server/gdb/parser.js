(function ()
{

var utils = {};

utils.getLineNumber = function(data)
{
	var lines = data.split("\n");

	for (var i = 0; i < lines.length; ++i)
	{
		var lineNumber = lines[i].match(/at[^0-9]*([0-9]+)/);

		console.log("LINENUMBER");
		console.log(lineNumber);

		if (lineNumber) return lineNumber[1];
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

function Parser(client)
{
	this.client = client;
}

Parser.utils = utils;

Parser.prototype.onStop = function(data)
{
	this.client.emit("gdb_break", data.location);
	this.client.emit("gdb_stack", data.backtrace);
	this.client.emit("gdb_variables", data.blockSymbols);
}

Parser.prototype.onContinue = function(data)
{
	this.client.emit("gdb_continue");
}

Parser.prototype.setFakeBreakpoint = function(lineNumber)
{
	console.log("setting fake breakpoint to: " + lineNumber);
	this.fakeBreakpoint = lineNumber;
	console.log(this);
}

Parser.prototype.onHitBreakpoint = function(data)
{
	console.log("onHitBreakpoint");
	console.log(data);
	var line = utils.getLineNumber(data);

	if (!this.fakeBreakpoint && line == 0) return;

	console.log("fixed breakpoint: " + this.fakeBreakpoint);
	console.log("parsed breakpoint: " + line);

	if (this.fakeBreakpoint) line = this.fakeBreakpoint;

	this.client.emit("gdb_break", {line: line});
}

Parser.prototype.onData = function(data)
{
	this.client.emit("gdb_message", data);
}

Parser.prototype.onError = function(err)
{
	this.client.emit("gdb_error", err);
}

module.exports = Parser;

}).call(this);
