define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore");

var DeviceListView = Backbone.View.extend(
{
	initialize: function(options)
	{
		_.bindAll(this);

		this.devices = options.collection;
		this.devices.bind("add", this.addOne);
		this.devices.bind("reset", this.addAll);

		this.devices.fetch();
	},

	addOne: function(device)
	{
		var view = new DeviceView({ model: device });
		this.$el.append(view.render().el);
	},

	addAll: function()
	{
		this.$el.empty();
		this.devices.each(this.addOne);
	}
});

var DeviceView = Backbone.View.extend(
{
	initialize: function(options)
	{
		_.bindAll(this);

		this.device = options.model;

		this.device.on("change", this.render);
		this.device.on("destroy", this.remove);
	},

	render: function()
	{
		var id = this.device.get("deviceId");
		var name = this.device.get("name");

		this.$el.html("<li>"+id+": "+name+"</li>");

		return this;
	}
});

return DeviceListView;

});