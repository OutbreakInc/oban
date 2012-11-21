(function()
{

var Backbone = require("backbone"),
	FileStore = require("./file-store"),
	_ = require("underscore"),
	idGen = require("./idGen");

module.exports = {

create: function(model, name)
{
	return Backbone.Collection.extend(
	{
		id: idGen(),
		model: model,
		name: name,

		initialize: function(models, options)
		{
			options = options || {};

			if (options.dontSaveToFile) return;

			this.on("all", FileStore.middleware(this), this);
		},

		_setId: function(model)
		{
			if (model.id === undefined || model.id === null) 
			{
				model.set("id", idGen(), { silent: true });
			}
		},

		_assignIds: function(models, options)
		{
			models = _.isArray(models) ? models.slice() : [models];

			// transform all model objects into actual instances of the model
			// and only then assign ID
			for (var i = 0; i < models.length; ++i)
			{
				models[i] = Backbone.Collection.prototype._prepareModel.call(this, models[i], options);
				this._setId(models[i]);
			}

			return models;
		},

		add: function(models, options)
		{
			models = this._assignIds(models, options);
			return Backbone.Collection.prototype.add.call(this, models, options);
		},

		create: function(model, options)
		{
			model = Backbone.Collection.prototype._prepareModel.call(this, model, options);			
			this._setId(model);
			return Backbone.Collection.prototype.create.call(this, model, options);
		},

		reset: function(models, options)
		{
			this._assignIds(models, options);
			return Backbone.Collection.prototype.reset.call(this, models, options);
		},

		bindToBackend: function(backend)
		{
			this.on("add", function(model, collection, options)
			{
				if (options.socketSilent) return;

				var json = model.toJSON();

				console.log("emit add");
				console.log(json);

				backend.emit("created", json);
			});

			this.on("change", function(model, options)
			{
				if (options.socketSilent) return;

				var json = model.toJSON();

				console.log("emit change");
				console.log(json);

				backend.emit("updated", json);
			});

			this.on("remove", function(model, collection, options)
			{
				if (options.socketSilent) return;

				var json = model.toJSON();			

				backend.emit("deleted", json);
			});

			this.on("reset", function(collection)
			{
				var json = collection.toJSON();

				backend.emit("reset", json);

				console.log("reset");
				console.log(json);
			});
		}
	});
}

}

}).call(this);
