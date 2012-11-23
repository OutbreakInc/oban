(function()
{

var BackendCollection = require("./backend-collection");

function BackboneStore(model, name, options)
{
	var Collection = BackendCollection.create(model, name);

	this.collection = new Collection(null, options);
}

module.exports = BackboneStore;

BackboneStore.prototype.middleware = function()
{
	var self = this;

	var crud = 
	{
		create: function(req, res, next) 
		{
			// can't really check if the model addition failed, because if
			// the model fails validation, Backbone itself will throw an Error
			// This error is caught higher upstream by backbone.io and is
			// sent back with res.end()
			self.collection.add(req.model);
			res.end(req.model);
		},
		
		read: function(req, res, next) 
		{
			if (req.model.id)
			{
				var model = self.collection.get(req.model.id);

				if (model)
				{
					res.end(model);
				}
				else
				{
					res.end(new Error("No such model"));
				}
			} 
			else 
			{
				res.end(self.collection.toJSON());
			}
		},
		
		update: function(req, res, next)
		{
			var item = self.collection.get(req.model.id);

			if (!item) return res.end(new Error("No such model"));
			
			var result = item.set(req.model, {socketSilent: true});

			if (!result)
			{
				res.end(new Error("Validation failed!"));
			}
			else
			{
				res.end(req.model);
			}
		},
		
		delete: function(req, res, next)
		{
			self.collection.remove(req.model, {socketSilent: true});
			res.end(req.model);
		}
	};
	
	return function(req, res, next) 
	{
		if (!crud[req.method]) 
		{
			return next(new Error("Unsuppored method " + req.method));
		}

		crud[req.method](req, res, next);
	};
}

// var Person = Backbone.Model.extend();

// var a = new Person({name: "John"});
// var b = new Person({name: "Sam"});

// create a middleware and a backend collection for the Person model
// var derp = module.exports(Person);

// set up the given backend to emit its events when the collection changes
// derp.collection.bindToBackend({
// 	emit: console.log
// });

// // this won't fire any backend events
// derp.collection.add([a, b], {socketSilent: true});

}).call(this);
