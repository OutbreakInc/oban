var express = require("express"),
	backboneio = require("backbone.io");

var app = express.createServer();
app.listen(8000);

console.log(__dirname + "/../client2/");
app.use(express.static(__dirname + "/../client2/"));

app.get("/", function(req, res)
{
	res.redirect("/IDE.html");
});

var File = backboneio.createBackend();

File.use(function(req, res, next)
{
	console.log(req.backend);
	console.log(req.method);
	console.log(JSON.stringify(req.model));
	next();
});

File.use(backboneio.middleware.memoryStore());

backboneio.listen(app, { File: File });
