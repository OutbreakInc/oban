(function()
{

var assert = require("assert"),
	Device = require("../models/device"),
	ProjectFixtures = require("./project-fixtures"),
	Errors = Device.Errors;

describe("Device Model", function()
{
	describe("#Device()", function()
	{
		it("should not allow undefined device ids", function(done)
		{
			var device = new Device({}, function(err)
			{
				assert.equal(err.message, Errors.INVALID_DEVICE_ID);
				done();
			});
		});

		it("should not allow empty device ids", function(done)
		{
			var device = new Device({ deviceId: "" }, function(err)
			{
				assert.equal(err.message, Errors.INVALID_DEVICE_ID);
				done();
			});				
		});

		it("should not allow undefined device names", function(done)
		{
			var device = new Device({ deviceId: "1" }, function(err)
			{
				assert.equal(err.message, Errors.INVALID_DEVICE_NAME);
				done();
			});
		});

		it("should not allow empty device names", function(done)
		{
			var device = new Device({ deviceId: "1", name: "" }, function(err)
			{
				assert.equal(err.message, Errors.INVALID_DEVICE_NAME);
				done();
			});				
		});		
	});
});

}).call(this);