var EventEmitter = require("events").EventEmitter,
	util = require("util"),
	badger = require("badger")(__filename),
	_ = require("underscore");

function JsonStreamer()
{
	this._buffer = "";
	this._pos = 0;
	this._depth = 0;

	_.bindAll(this);

	EventEmitter.call(this);
}

util.inherits(JsonStreamer, EventEmitter);

JsonStreamer.prototype.processChunk = function(data)
{
	badger.debug("input data:", data);
	badger.debug("buffer:", this._buffer);

	if (data) this._buffer += data;

	if (this._depth == 0)
	{
		// discard all data up to start of JSON
		var startIndex = this._buffer.indexOf("{");

		if (startIndex === -1)
		{
			this._buffer = "";
			return;
		}

		if (startIndex != 0)
		{
			badger.debug(	"Discarded non-JSON data:", 
							this._buffer.substr(0, startIndex));
		}

		this._buffer = this._buffer.substr(startIndex);
		this._pos = 0;
		this._depth = 1;
	}

	// walk thru string until we find matching } for opening }
	for (	var i = (this._pos + 1); 
			i < this._buffer.length && this._depth > 0; 
			++i)
	{
		if (this._buffer[i] == "{") ++this._depth;
		else if (this._buffer[i] == "}") --this._depth;

		this._pos = i;
	}

	// don't have complete JSON string yet, wait for more data
	if (this._depth != 0) return;

	var json = this._buffer.substr(0, this._pos + 1);

	badger.debug("trying to parse:", json);

	this._buffer = this._buffer.substr(this._pos + 1);

	var parsed;

	var parseError;

	try
	{
		parsed = JSON.parse(json);
	}
	catch(e)
	{
		parseError = true;
		this.emit("error", e);
	}

	if (!parseError) this.emit("data", parsed);

	// if there's still data left over, keep going
	if (this._buffer.length > 0) this.processChunk();
}

module.exports = JsonStreamer;