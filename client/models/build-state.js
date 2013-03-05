define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

var States =
{
	NEEDS_BUILD: "NEEDS_BUILD",
	NEEDS_FLASH: "NEEDS_FLASH",
	READY_TO_DEBUG: "READY_TO_DEBUG"
}

var BuildState = Backbone.Model.extend(
{
	defaults:
	{
		state: States.NEEDS_BUILD
	},

	validate: function(attrs, options)
	{
		if (!attrs.state) return "Missing `state`";

		var found = _.any(States, function(state)
		{
			return state == attrs.state;
		});

		if (!found) return "Invalid `state` setting";
	}
});

return {
	Model: BuildState,
	States: States
};

});