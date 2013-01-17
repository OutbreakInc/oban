define(function(require)
{

var Backbone = require("backbone"),
	App = require("app/app"),
	ace = require("ace/ace"),
	Range = ace.require("ace/range").Range,
	CppMode = ace.require("ace/mode/c_cpp").Mode;

require("ace/mode-c_cpp");

var EditorView = Backbone.View.extend(
{
	initialize: function()
	{
		this.$el.removeAttr("hidden");

		this.editor = ace.edit(this.$(".documentView")[0]);

		_.bindAll(this);

		App.Files.on("add", this.addFile);
		App.Files.on("reset", this.addAll);
		
		this.editor.setTheme("ace/theme/chrome");
		
		this.el.style.fontSize = "11px";

		this.session = this.editor.getSession();
		this.session.setMode(new CppMode);
		
		setTimeout(_.bind(function()
		{
			console.log("Settings applied.");
			
			this.editor.setBehavioursEnabled(false);
			this.editor.setShowPrintMargin(false);
			this.editor.setHighlightActiveLine(false);
			this.editor.setSelectionStyle("line");
			this.editor.session.setUseSoftTabs(false);
			
		}, this), 100);	//this should be done when ACE emits an event that I don't yet know about
	},

	setup: function()
	{
		// set single instance of IDE model
		this.model = this.collection.at(0);

		// load currently active project
		var id = this.model.get("activeProject");

		if (id !== undefined)
		{
			App.activeProject = App.Projects.get(id);

			// load active project's first file
			App.Files.fetch();
			App.activeFile = App.Files.at(0);
		}
		else
		{
			// show welcome screen and list of projects
			// var view = new App.WelcomeView;
		}
	},

	onBuildStatus: function(err)
	{
		// check arguments to see if file built successfully

		// if it didn't build successfully, highlight the lines that had issues

		// err:
		// compileErrors: [ { line: 5, message: "Unexpected identifier" }, ... ]

		// if err is null, compilation succeeded
		console.log(arguments);
	},

	render: function()
	{
		//this.$el.html(Handlebars.partials.login(this.model.toJSON()));
		var session = this.editor.getSession();		
	},

	addFile: function(file)
	{
		this.fileView = new App.FileView({ model: file, session: this.session });
		this.fileView.render();
	},

	// addAll: function()
	// {
	// 	App.Files.each(this.addFile, this);
	// }
});

return EditorView;

});