define(function(require)
{
var Backbone = require("backbone"),
	Error = require("app/models/error");

var ErrorCollection = Backbone.Collection.extend(
{
	model: Error
});

return ErrorCollection;

});
