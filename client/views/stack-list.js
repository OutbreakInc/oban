define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

require("backbone.marionette");

var StackItemView = Backbone.Marionette.ItemView.extend(
{
	tagName: "li",
	template: _.template($("#stackItemTemplate").html()),

	events:
	{
		"click .view": "onClick"
	},

	onClick: function()
	{
		// navigate GDB to selected frame
	}
});

var StackListView = Backbone.Marionette.CollectionView.extend(
{
	itemView: StackItemView,
	tagName: "ul",

	appendHtml: function(collectionView, itemView)
	{
		collectionView.$el.append(itemView.el);
	}
});

return StackListView;

});
