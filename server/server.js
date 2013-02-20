(function () 
{
var http = require("http"),
	mime = require("./mime"),
	fs = require("fs"),
	Core = require("./core"),
	badger = require("badger")(__filename);

var base = __dirname + "/../client";
var server = http.createServer(function(request, response)
{
	//sanitize url by filtering out path-unfriendly sequences
	var url = request.url.split("/").filter(function(p){return((p != "") && (p != ".."));}).join("/");
	
	url = (url == "")? "IDE.html" : url;	//default to IDE.html for root requests
	
	var path = base + "/" + url;
	var resourceMIME = mime.lookup(path);
	
	badger.debug("Requesting: ", request.url, " => ", path, "(" + resourceMIME + ")");
	
	var f = fs.createReadStream(path).on("open", function(fd)
	{
		response.writeHead(200,
		{
			"Content-Type": resourceMIME
		});
		f.pipe(response);	//send the file through
		
	}).on("error", function(e)
	{
		var code = (e.code == "ENOENT")? 404 : 500;	//cheesy error handler
		
		badger.debug("failed (" + code + "): ", url);	//debugging
		
		response.writeHead(code, {"Content-Type": "text/plain"});
		response.end(code.toString());
		f.destroy();
	});
});
server.listen(24400);

var config =
{
	nodePort: 24400,
	mode: "app"
};

var core = new Core(server, config);
core.init();

}).call(this);