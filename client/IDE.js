define(function(require)
{

var io = require("socket.io"),
	$ = require("jquery"),
	ProjectCollection = require("app/models/project-collection"),
	Dashboard = require("app/views/dashboard"),
	WelcomeView = require("app/views/welcome");

require("bootstrap");

var sockets = {};

sockets.projects = io.connect("http://localhost:8000/projectCollection");

var projects = new ProjectCollection({ socket: sockets.projects });

var dashboard = new Dashboard(
{
	collection: projects
});

var welcomeView = new WelcomeView(
{
	projectsSocket: sockets.projects,
	collection: projects
});

});