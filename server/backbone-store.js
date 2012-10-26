(function()
{

var Backbone = require("backbone");

var BackendCollection = require("./backend-collection");

module.exports = function(model)
{	
	var Collection = BackendCollection.create(model);

	var collection = new Collection;

	var crud = 
	{
		create: function(req, res, next) 
		{
			collection.add(model);
			res.end(model);
		},
		
		read: function(req, res, next) 
		{
			if (req.model.id)
			{
				res.end(collection.get(req.model.id));
			} 
			else 
			{
				res.end(collection.toJSON());
			}
		},
		
		update: function(req, res, next)
		{
			var item = collection.get(req.model.id);
			if (item) item.set(req.model, {socketSilent: true});
			res.end(req.model);
		},
		
		delete: function(req, res, next)
		{
			collection.remove(req.model, {socketSilent: true});
			res.end(req.model);
		}
	};
	
	return {
		middleware: function(req, res, next) 
		{
			if (!crud[req.method]) 
			{
				return next(new Error("Unsuppored method " + req.method));
			}

			crud[req.method](req, res, next);
		},

		collection: collection
	}
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
