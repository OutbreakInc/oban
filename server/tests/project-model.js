(function()
{

var assert = require("assert"),
	fs = require("fs"),
	Project = require("../models/project"),
	Errors = Project.Errors;

require("shelljs/global");

describe("Project Model", function()
{
	before(function(done)
	{
		if (fs.existsSync("nonExistentDir"))
		{
			rm("-r", "nonExistentDir");
		}

		if (!fs.existsSync("projectsDir"))
		{
			mkdir("projectsDir");
		}

		if (!fs.existsSync("projectsDir/noProjectJson"))
		{
			mkdir("projectsDir/noProjectJson");
		}

		cp("-R", "fixtures/existingProject", "projectsDir");

		done();
	});

	after(function(done)
	{
		if (fs.existsSync("projectsDir"))
		{
			rm("-r", "projectsDir");
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
			var project = new Project(
				{ name: "derp", baseDir: "" }, 
			function(err)
			{
				assert.equal(err.message, Errors.INVALID_BASEDIR);
				done();
			});
		});

		it("should not allow non-existent base directories", function(done)
		{
			var project = new Project(
				{ name: "derp", baseDir: "nonExistentDir" }, 
			function(err)
			{
				assert.equal(err.message, Errors.NON_EXISTENT_BASEDIR);
				done();
			});
		});

		it("should not restore a project with no project.json file", function(done)
		{
			var project = new Project(
				{ name: "noProjectJson", baseDir: "projectsDir" }, 
			function(err)
			{
				assert.equal(err.message, Errors.NO_PROJECT_JSON);
				done();
			});
		});

		it("should correctly initialize a project from scratch", function(done)
		{
			var project = new Project(
				{ name: "emptyProject", baseDir: "projectsDir", create: true }, 
			function(err)
			{
				if (err) return done(err);

				assert.equal(fs.existsSync(
					"projectsDir/emptyProject/" + Project.DEFAULT_FILE_NAME), true);

				assert.equal(fs.existsSync(
					"projectsDir/emptyProject/project.json"), true);

				done();
			});
		});

		it("should correctly restore an existing project", function(done)
		{
			var project = new Project(
				{ name: "existingProject", baseDir: "projectsDir", create: true }, 
			function(err)
			{
				if (err) return done(err);

				assert.equal(fs.existsSync(
					"projectsDir/existingProject/" + Project.DEFAULT_FILE_NAME), true);

				assert.equal(fs.existsSync(
					"projectsDir/existingProject/project.json"), true);

				project.openFile(Project.DEFAULT_FILE_NAME, 
					function(err, file)
				{
					if (err) return done(err);

					assert.equal(file.contents, "");
					assert.equal(project._attrs.buildStatus, Project.BuildStatus.UNCOMPILED);
					assert.equal(project._attrs.runStatus, Project.RunStatus.STOPPED);
				});

				done();
			});
		});
	});
});

}).call(this);
