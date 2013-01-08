(function()
{

var assert = require("assert"),
	File = require("../models/file");

describe("File Model", function()
{
	describe("#File()", function()
	{
		it("should not allow undefined filenames", function(done)
		{
			var file = new File({}, function(err)
			{
				assert.notEqual(err, undefined);
				done();
			});
		});

		it("should not allow empty filenames", function(done)
		{
			var file = new File({ name: "" }, function(err)
			{
				assert.notEqual(err, undefined);
				done();
			});				
		});
	});

	describe("#methods", function()
	{
		var file;

		beforeEach(function(done)
		{
			file = new File({ name: "derp.cpp" }, function(err)
			{
				if (err) return done(err);
				done();
			});
		});

		describe("#open", function()
		{
			it("should mark the file as open", function(done)
			{
				file.open();
				assert.equal(file.isOpen(), true);
				done();
			});
		});

		describe("#close", function()
		{
			it("should mark an open file as closed and delete its contents", function()
			{
				file.open();
				assert.equal(file.isOpen(), true);

				file._attrs.contents = "foo";
				file.close();

				assert.equal(file.isOpen(), false);
				assert.equal(file.contents(), undefined);
			});
		});

		describe("#setContents", function()
		{
			it("should not allow editing a file that isn't open", function(done)
			{
				file.setContents("foo", function(err)
				{
					assert.notEqual(err, undefined);
					done();
				});
			});

			it("should allow setting contents correctly", function(done)
			{
				file.open();

				file.setContents("foo", function(err)
				{
					if (err) return done(err);

					assert.equal(file.contents(), "foo");
					done();
				});
			});

			it("should emit a modified event with the new contents", function(done)
			{
				file.open();

				file.on("modified", function(contents)
				{
					assert.equal(contents, "foo");
					done();
				});

				file.setContents("foo");
			});
		});
	});
});

}).call(this);
