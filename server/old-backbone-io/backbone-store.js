(function()
{

var BackendCollection = require("./backend-collection");

function BackboneStore(model, name, options)
{
	this.Collection = BackendCollection.create(model, name);
	this.collection = new this.Collection(null, options);
}

module.exports = BackboneStore;

BackboneStore.prototype.middleware = function()
{
	var self = this;

	return function(req, res, next) 
	{
		if (!self[req.method]) 
		{
			return next(new Error("Unsuppored method " + req.method));
		}

		self[req.method](self.collection, req, res, next);
	};
}

BackboneStore.prototype.create = function(collection, req, res, next) 
{
	// can't really check if the model addition failed, because if
	// the model fails validation, Backbone itself will throw an Error
	// This error is caught higher upstream by backbone.io and is
	// sent back with res.end()
	collection.add(req.model);
	res.end(req.model);
}
		
BackboneStore.prototype.read = function(collection, req, res, next) 
{
	if (req.model.id)
	{
		var model = collection.get(req.model.id);

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
		res.end(collection.toJSON());
	}
}
		
BackboneStore.prototype.update = function(collection, req, res, next)
{
	var item = collection.get(req.model.id);

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
}
		
BackboneStore.prototype.delete = function(collection, req, res, next)
{
	collection.remove(req.model, {socketSilent: true});
	res.end(req.model);
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
