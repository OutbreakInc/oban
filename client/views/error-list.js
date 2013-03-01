define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

require("backbone.marionette");

var ErrorItemView = Backbone.Marionette.ItemView.extend(
{
	tagName: "li",

	template: "#errorItemTemplate",

	events:
	{
		"click .view": "onClick"
	},

	onClick: function()
	{
		this.trigger("click", this.model);
	}
});

var ErrorListView = Backbone.Marionette.CollectionView.extend(
{
	itemView: ErrorItemView,
	tagName: "ul",
	className: "errorList",
	itemViewEventPrefix: "error",

	appendHtml: function(collectionView, itemView)
	{
		collectionView.$el.append(itemView.el);
	}
});

return ErrorListView;

});