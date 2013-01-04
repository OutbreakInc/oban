define(function(require)
{
	var _ = require("underscore");

	var templates =
	{
		// stackItem: "<strong><%= name %></strong>(<%= args %>) <em><%= location %></em>"
		stackItem: "<strong><%= name %></strong>",
		projectItem: "<%= name %>",
		projectList: 	"List of projects:<br>" +
						"<ul>" +
						"</ul>"
	}

	compiledTemplates = {};

	_.forEach(templates, function(text, name)
	{
		compiledTemplates[name] = _.template(text)
	});

	return compiledTemplates;
});
