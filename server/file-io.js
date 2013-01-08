var fs = require("fs"),
	_ = require("underscore");

function FileIo(path)
{
	this.path = path;

	if (this.path[this.path.length - 1] != "/")
	{
		this.path += "/";
	}

	if (!fs.existsSync(this.path))
	{
		fs.mkdirSync(this.path);
	}
}

FileIo.prototype.write = function(fileName, data, callback)
{
	console.log("writing file " + fileName);
	fs.writeFile(this.path + fileName, data, "utf8", callback);
}

FileIo.prototype.read = function(fileName, callback)
{
	fs.readFile(this.path + fileName, "utf8", callback);
}

FileIo.prototype.create = function(fileName, callback)
{
	this.write(fileName, "", callback);
}

FileIo.prototype.remove = function(fileName, callback)
{
	console.log("removing ", this.path + fileName);
	fs.unlink(this.path + fileName, callback);
}

FileIo.prototype.watch = function(fileName, callback)
{
	fs.watchFile(this.path + fileName, function(curr, prev)
	{
		if (curr.mtime > prev.mtime) callback();
	});
}

module.exports = FileIo;