(function()
{

var assert = require("assert"),
	fs = require("fs"),
	Project = require("../models/project"),
	Errors = Project.Errors;

describe("Project Model", function()
{
	before(function(done)
	{
		if (fs.existsSync("nonExistentDir"))
		{
			fs.rmdirSync("nonExistentDir");
		}

		done();
	});

	describe("#Project()", function()
	{
		it("should not allow undefined project names", function(done)
		{
			var project = new Project({}, function(err)
			{
				assert.equal(err.message, Errors.INVALID_PROJECT_NAME);
				done();
			});
		});

		it("should not allow empty project names", function(done)
		{
			var project = new Project({ name: "" }, function(err)
			{
				assert.equal(err.message, Errors.INVALID_PROJECT_NAME);
				done();
			});				
		});

		it("should not allow undefined base directories", function(done)
		{
			var project = new Project({ name: "derp" }, function(err)
			{
				assert.equal(err.message, Errors.INVALID_BASEDIR);
				done();
			});
		});

		it("should not allow empty base directories", function(done)
		{
			var project = new Project({ name: "derp", baseDir: "" }, function(err)
			{
				assert.equal(err.message, Errors.INVALID_BASEDIR);
				done();
			});
		});

		it("should not allow non-existent base directories", function(done)
		{
			var project = new Project({ name: "derp", baseDir: "nonExistentDir" }, function(err)
			{
				assert.equal(err.message, Errors.NON_EXISTENT_BASEDIR);
				done();
			});
		});		
	});

	// describe("#methods", function()
	// {
	// 	var file;

	// 	beforeEach(function(done)
	// 	{
	// 		file = new File({ name: "derp.cpp" }, function(err)
	// 		{
	// 			if (err) return done(err);
	// 			done();
	// 		});
	// 	});

	// 	describe("#open", function()
	// 	{
	// 		it("should mark the file as open", function(done)
	// 		{
	// 			file.open();
	// 			assert.equal(file.isOpen(), true);
	// 			done();
	// 		});
	// 	});

	// 	describe("#close", function()
	// 	{
	// 		it("should mark an open file as closed and delete its contents", function()
	// 		{
	// 			file.open();
	// 			assert.equal(file.isOpen(), true);

	// 			file._attrs.contents = "foo";
	// 			file.close();

	// 			assert.equal(file.isOpen(), false);
	// 			assert.equal(file.contents(), undefined);
	// 		});
	// 	});

	// 	describe("#setContents", function()
	// 	{
	// 		it("should not allow editing a file that isn't open", function(done)
	// 		{
	// 			file.setContents("foo", function(err)
	// 			{
	// 				assert.notEqual(err, undefined);
	// 				done();
	// 			});
	// 		});

	// 		it("should allow setting contents correctly", function(done)
	// 		{
	// 			file.open();

	// 			file.setContents("foo", function(err)
	// 			{
	// 				if (err) return done(err);

	// 				assert.equal(file.contents(), "foo");
	// 				done();
	// 			});
	// 		});

	// 		it("should emit a modified event with the new contents", function(done)
	// 		{
	// 			file.open();

	// 			file.on("modified", function(contents)
	// 			{
	// 				assert.equal(contents, "foo");
	// 				done();
	// 			});

	// 			file.setContents("foo");
	// 		});
	// 	});
	// });
});

}).call(this);
