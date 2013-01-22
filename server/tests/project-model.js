(function()
{

var assert = require("assert"),
	fs = require("fs"),
	Project = require("../models/project"),
	ProjectFixtures = require("./project-fixtures"),
	Errors = Project.Errors;

require("shelljs/global");

describe("Project Model", function()
{
	before(ProjectFixtures.load);
	after(ProjectFixtures.unload);

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
				{ name: "existingProject", baseDir: "projectsDir" }, 
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

					assert.equal(file.contents(), "int main() { return 0; }\n");
					assert.equal(project.buildStatus(), Project.BuildStatus.UNCOMPILED);
					assert.equal(project.runStatus(), Project.RunStatus.STOPPED);
				});

				done();
			});
		});

		it("should correctly rename a project", function(done)
		{
			var project = new Project(
				{ name: "existingProject", baseDir: "projectsDir" }, 
			function(err)
			{
				if (err) return done(err);

				project.setName("renamedProject", function(err)
				{
					if (err) return done(err);
					
					assert.equal(project.name(), "renamedProject");
					done();
				});
			});
		});

		it("should not allow project to be renamed to an existing project", function(done)
		{
			var project = new Project(
				{ name: "existingProject", baseDir: "projectsDir" }, 
			function(err)
			{
				var secondProject = new Project(
					{ name: "secondExistingProject", baseDir: "projectsDir" }, 
				function(err)
				{
					if (err) return done(err);

					secondProject.setName("existingProject", function(err)
					{
						if (err) return done(err);
					 
						assert.equal(err, "Existing Project Name");
						done();
					});
				});
			});
		});
				
		it("should not allow duplicate project names", function(done)
		{
			var project = new Project(
				{ name: "existingProject", baseDir: "projectsDir" }, 
			function(err)
			{
				var secondProject = new Project(
					{ name: "existingProject", baseDir: "projectsDir", create: true }, 
				function(err)
				{
					assert.equal(err, "Existing Project Name");
					
					done();
				});
			});
		});

		it("should not allow open, rename, remove, close, or save operations on file that " +
			"does not exist", function(done)
		{
			var project = new Project(
				{ name: "existingProject", baseDir: "projectsDir" }, 
			function(err)
			{
				project.openFile("noFile", function(err)
				{
					assert.equal(err.message, Errors.NO_SUCH_FILE);
				});

				project.renameFile("noFile", "stillNoFile", function(err)
				{
					assert.equal(err.message, Errors.NO_SUCH_FILE);
				});

				project.removeFile("noFile", {}, function(err)
				{
					assert.equal(err.message, Errors.NO_SUCH_FILE);
				});

				project.closeFile("noFile", function(err)
				{
					assert.equal(err.message, Errors.NO_SUCH_FILE);
				});

				project.saveFile("noFile", function(err)
				{
					assert.equal(err.message, Errors.NO_SUCH_FILE);
				});

				done();
			});				
		});
		
		it("should not allow project to be opened when already opened by someone else", function(done)
		{
			var project = new Project(
				{ name: "existingProject", baseDir: "projectsDir" }, 
			function(err)
			{
				project.setOpen("1", true, function(err)
				{
					project.setOpen("2", true, function(err)
					{
						assert.equal(err.message, Errors.ALREADY_OPEN);
						done();
					});
				});
			});				
		});
		
	});
});

}).call(this);
