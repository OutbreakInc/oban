var Toolchain = require("./toolchain");

var compiler = new Toolchain.Compiler();

compiler.compile({sdk: "../SDK6/", platform: "../Platform", module: process.argv[2]}, function()
{
	console.log(arguments);
});
