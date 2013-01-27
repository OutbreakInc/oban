var assert = require("assert"),
	JsonStreamer = require("../json-streamer");

var util = require("util");

var streamer;

describe("JsonStreamer", function()
{
	beforeEach(function()
	{
		streamer = new JsonStreamer;
	});

	it("should correctly parse a single chunk of JSON", function(done)
	{
		streamer.on("data", function(json)
		{
			assert.equal(json.a, 5);
			done();
		});

		streamer.processChunk("{ \"a\": 5 }");
	});

	it("should correctly parse JSON split over two chunks", function(done)
	{
		streamer.on("data", function(json)
		{
			assert.equal(json.a, 5);
			done();
		});

		streamer.processChunk("{ \"a");
		streamer.processChunk("\": 5 }");
	});

	it("should correctly parse two consecutive JSON objects", function(done)
	{
		function cb1(json)
		{
			assert.equal(json.a, 5);
			streamer.removeListener("data", cb1);
			streamer.on("data", cb2);
		}

		function cb2(json)
		{
			assert.equal(json.b, "hi");
			done();
		}

		streamer.on("data", cb1);

		streamer.processChunk("{ \"a\": 5 }{ \"b\": \"hi\" }");
	});

	it("should correctly emit an error on invalid data", function(done)
	{
		streamer.on("error", function(err)
		{
			assert.equal(err.type, "unexpected_token");
			done();
		});

		streamer.processChunk("{ a: 5 }");
	});
});






