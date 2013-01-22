define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

require("backbone.marionette");

var ErrorItemView = Backbone.Marionette.ItemView.extend(
{
	template: _.template("<div class=\"alert alert-error\"><%= message %></div>"),
	tagName: "li"
});

var ErrorListView = Backbone.Marionette.CollectionView.extend(
{
	itemView: ErrorItemView,
	tagName: "ul",
	className: "errorList",

	appendHtml: function(collectionView, itemView)
	{
		collectionView.$el.append(itemView.el);
	}
});

return ErrorListView;

});