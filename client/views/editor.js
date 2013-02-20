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
	initialize: function(options)
	{
		this.file = options.model;

		this.$el.removeAttr("hidden");

		this.editor = ace.edit(this.$(".documentView")[0]);

		_.bindAll(this);
		
		this.editor.setTheme("ace/theme/chrome");
		
		this.el.style.fontSize = "11px";

		this.session = this.editor.getSession();
		this.session.setMode(new CppMode);
		this.dirty = true;
		
		setTimeout(_.bind(function()
		{	
			this.editor.setBehavioursEnabled(false);
			this.editor.setShowPrintMargin(false);
			this.editor.setHighlightActiveLine(false);
			this.editor.setSelectionStyle("line");
			this.editor.session.setUseSoftTabs(false);
			
		}, this), 100);	//this should be done when ACE emits an event that I don't yet know about

		this.listenTo(this.file, "change", this.render);

		// ace doesn't support listenTo syntax
		this.session.on("change", this.save);
	},

	render: function()
	{
		var text = this.file.toJSON().contents;

		this.session.setValue(text, { renderCall: true });
		return this;
	},

	save: function(e)
	{
		// don't prompt a save if we called setValue
		// or else we'll end up in an infinite render/save loop
		if (e.flags && e.flags.renderCall) return;
		
		mixpanel.track("file: saved");
		this.dirty = true;
		this.file.setContents(this.session.getValue(),
		function(err)
		{
			if (err) return alert(err);

		});
	},

	close: function()
	{
		mixpanel.track("file: close");
		this.$el.attr("hidden", "hidden");
		this.stopListening();
		this.session.removeListener("change", this.save);
	},

	highlightError: function(line)
	{
		this.clearError();

		this.editor.gotoLine(line, 0);

		var range = new Range(line - 1, 0, line, 0);

		this.highlightedError = 
			this.session.addMarker(range, "ide-line-error", "background");
	},

	clearError: function()
	{
		if (this.highlightedError)
		{
			this.session.removeMarker(this.highlightedError);
			delete this.highlightedError;
		}
	},
	
	isDirty: function()
	{
		return this.dirty;
	},

	clearDirty: function()
	{
		this.dirty = false;
	},

	setEditable: function(isEditable)
	{
		this.editor.setReadOnly(!isEditable);

		if (isEditable) this.editor.renderer.showCursor();
		else this.editor.renderer.hideCursor();
	}
});

return EditorView;

});