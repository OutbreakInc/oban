requirejs.config(
{
	baseUrl: "lib/platform",

	paths:
	{
		ace: "../ace",
		yui: "../yui",
		app: "../.."
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

		"socket.io":
		{
			exports: "io"
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
		},

		"ace/mode-c_cpp":
		{
			deps: ["ace/ace"]
		}
	}
});