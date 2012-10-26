(function()
{

var Backbone = require("backbone"),
	_ = require("underscore");

module.exports = {

create: function(model)
{
	return Backbone.Collection.extend(
	{
		id: 0,
		model: model,

		_assignIds: function(models, options)
		{
			models.forEach(function(model)
			{
				if (!model.id) model.id = this.id++;
			}.bind(this));
		},

		add: function(models, options)
		{
			models = _.isArray(models) ? models.slice() : [models];
			this._assignIds(models, options);
			return Backbone.Collection.prototype.add.call(this, models, options);
		},

		create: function(model, options)
		{
			if (!model.id) model.id = this.id++;
			return Backbone.Collection.prototype.create.call(this, model, options);
		},

		reset: function(models, options)
		{
			models = _.isArray(models) ? models.slice() : [models];
			this._assignIds(models, options);
			return Backbone.Collection.prototype.reset.call(this, models, options);
		},

		bindToBackend: function(backend)
		{
			this.on("add", function(model, collection, options)
			{
				if (options.socketSilent) return;

				var json = model.toJSON();
				json.id = model.id;

				backend.emit("created", json);
			});

			this.on("change", function(model, options)
			{
				if (options.socketSilent) return;

				var json = model.toJSON();
				json.id = model.id;				

				backend.emit("updated", json);
			})

			this.on("remove", function(model, collection, options)
			{
				if (options.socketSilent) return;

				var json = model.toJSON();
				json.id = model.id;				

				backend.emit("deleted", json);
			});
		}
	});
}

}

}).call(this);
