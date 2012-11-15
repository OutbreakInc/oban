requirejs.config(
{
	baseUrl: "lib/platform",

	paths:
	{
		ace: "../ace",
		yui: "../yui" 
	},

	shim:
	{
		"backbone":
		{
			deps: [ "jquery", "underscore" ],
			exports: "Backbone"
		},

		"underscore":
		{
			exports: "_"
		},

		"backbone.io" : [ "backbone", "socket.io" ],

		"yui/yahoo-dom-event":
		{
			exports: "YAHOO"
		},

		"yui/treeview-min": [ "yui/yahoo-dom-event" ],

		"ace/ace":
		{
			exports: "ace"
		}
	}
});