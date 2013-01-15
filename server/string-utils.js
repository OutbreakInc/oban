var _ = require("underscore");

_.mixin(
{
	stricmp: function(str1, str2)
	{
		return str1.toLowerCase() === str2.toLowerCase();
	}
});