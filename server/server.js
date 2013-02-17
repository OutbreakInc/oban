(function () 
{
var http = require("http"),
	fs = require("fs"),
	Core = require("./core");

var base = __dirname + "/../client";
var server = http.createServer(function(request, response)
{
	var url = (request.url == "/")? "IDE.html" : request.url;

	var path = base + "/" + url;
	console.log("Requesting: ", request.url, " => ", path);
	var f = fs.createReadStream(path).on("open", function(fd)
	{
		console.log("serving: ", url);
		var mime = "application/octet-stream";
		response.writeHead(200,
		{
			//"Content-Type": mime
		});
		f.pipe(response);
	}).on("error", function(e)
	{
		var code = (e.code == "ENOENT")? 404 : 500;
		console.log("failed (" + code + "): ", url);
		response.writeHead(code,
		{
			"Content-Type": "text/plain"
		});
		response.end(code.toString());
	});
});

server.listen(8000);

/*app.configure(function()
{
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	// app.use(express.logger("dev"));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/../client"));
});
*/

/*app.get("/", function(req, res)
{
	res.sendfile("client/IDE.html");
});
*/

var config =
{
	nodePort: 8000,
	mode: "app"
};

var core = new Core(server, config);
core.init();

}).call(this);