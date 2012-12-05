(function () 
{
var express = require("express"),
	app = express.createServer(),
	winston = require("winston"),
	logging = require("./logging"),
	Core = require("./core");

logging.configure(winston);

app.listen(8000);

app.configure(function()
{
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.use(express.logger("dev"));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/../client"));
});

app.get("/", function(req, res)
{
	res.sendfile("client/IDE.html");
});

var config =
{
	nodePort: 8000,
	mode: "app"
};

var core = new Core(app, config);
core.init();

}).call(this);