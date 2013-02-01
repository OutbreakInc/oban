define(function(require)
{

var Backbone = require("backbone"),
	_ = require("underscore"),
	App = require("app/app");

var SettingListItem = Backbone.View.extend(
{
	tagName: "p",
	
	events: 
	{
		"click .settingCheckbox" : "changeSetting"
	},

	template: _.template($("#settingsItemTemplate").html()),

	initialize: function(options)
	{
		this.setting = options.model;
		this.listenTo(this.setting, "change", this.render);
		this.listenTo(this.setting, "destroy", this.remove);
	},
	
	changeSetting: function(ev)
	{
		this.setting.set("value", $(ev.currentTarget).prop("checked"), { silent: true });
	},

	render: function()
	{
		this.$el.html(this.template(this.setting.toJSON()));
		
		console.log("render", this.el)
		return this;
	}
});

var SettingList = Backbone.View.extend(
{
	el: "#userSettingsModal",

	initialize: function(options)
	{
		console.log("initalize", options.collection)
		this.settings = options.collection;

		this.listenTo(this.settings, "reset", this.addAll);
		this.listenTo(this.settings, "add", this.addOne);

		_.bindAll(this);
	},

	addAll: function()
	{
		console.log("addAll")
		this.settings.each(this.addOne);
	},

	addOne: function(setting)
	{
		console.log("addOne", setting)
		var view = new SettingListItem({ model: setting });
	
		$("#userSettingsModal .modal-body").append(view.render().el);
	}
});

return SettingList;

});