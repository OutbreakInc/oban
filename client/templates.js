define(function(require)
{
	var _ = require("underscore");

	var templates =
	{
		// stackItem: "<strong><%= name %></strong>(<%= args %>) <em><%= location %></em>"
		stackItem: "<strong><%= name %></strong>"
	}

	compiledTemplates = {};

	_.forEach(templates, function(text, name)
	{
		compiledTemplates[name] = _.template(text)
	});

	return compiledTemplates;
});
