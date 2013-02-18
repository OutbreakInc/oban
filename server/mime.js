module.exports = (function(){

var types =
{
	"html": "text/html",
	"js": "application/javascript",
	"css": "text/css",
	"png": "image/png",
	"jpeg": "image/jpeg",
	"txt": "text/plain",
};
var default_type = "application/octet-stream";

return(
{
	lookup: function mime_lookup(path, fallback)
	{
		//borrowed from https://github.com/broofa/node-mime
		return(types[path.replace(/.*[\.\/]/, '').toLowerCase()] || fallback || default_type);
	}
});

})();
