define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

require("backbone.marionette");

var DeviceItemView = Backbone.Marionette.ItemView.extend(
{
	template: _.template($("#deviceItemTemplate").html()),
	tagName: "li"
});

var DeviceListView = Backbone.Marionette.CollectionView.extend(
{
	itemView: DeviceItemView,
	tagName: "ul",
	className: "devicesList",

	appendHtml: function(collectionView, itemView)
	{
		collectionView.$el.append(itemView.el);
	}
});

return DeviceListView;

});