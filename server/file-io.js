var fs = require("fs"),
	_ = require("underscore"),
	join = require("path").join;

function FileIo(path)
{
	this.path = join(path);

	if (!fs.existsSync(this.path))
	{
		fs.mkdirSync(this.path);
	}
}

FileIo.prototype.write = function(fileName, data, callback)
{
	console.log("writing file " + fileName);
	fs.writeFile(join(this.path, fileName), data, "utf8", callback);
}

FileIo.prototype.read = function(fileName, callback)
{
	fs.readFile(join(this.path, fileName), "utf8", callback);
}

FileIo.prototype.create = function(fileName, callback)
{
	fs.writeFile(join(this.path, fileName), "", "utf8", callback);
}

FileIo.prototype.remove = function(fileName, callback)
{
	console.log("removing ", join(this.path, fileName));
	fs.unlink(join(this.path, fileName), callback);
}

FileIo.prototype.rename = function(oldName, newName, callback)
{
	fs.rename(join(this.path, oldName), join(this.path, newName), callback);
}

FileIo.prototype.exists = function(fileName, callback)
{
	fs.exists(join(this.path, fileName), function(exists)
	{
		callback(null, exists);
	});
}

FileIo.prototype.watch = function(fileName, callback)
{
	fs.watchFile(join(this.path, fileName), function(curr, prev)
	{
		if (curr.mtime > prev.mtime) callback();
	});
}

module.exports = FileIo;