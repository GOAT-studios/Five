(function() {
	

var Collection = function(name, animations) {
	this.name = name;
	this.animations = Five.arrayToObject (animations, "name");
	this.current = animations[0];

	return this;
}

Collection.prototype.get = function(name) {
	return this.animations[name] || null;
}

Collection.prototype.getCurrent = function() {
	return this.current;
}

Collection.prototype.start = function(name) {
	this.current.stop ();
	this.get (name).start ();

	return this;
}

Collection.prototype.pause = function() {
	this.current.pause ();

	return this;
}

Collection.prototype.stop = function() {
	this.current.stop ();

	return this;
}




var Plugin = {
	name: "animations-collection",
	"Animations.Collection": {
		content: Collection
	}
}
Five.plugins.push (Plugin);



}())