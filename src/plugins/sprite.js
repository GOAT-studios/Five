(function() {


var Sprite = function(image, position, dimensions) {
	this.image = image;
	this.position = position;
	this.dimensions = dimensions;

	return this;
}


var Plugin = {
	name: "Sprite",
	"Sprite": {
		content: Sprite
	}
}
Five.plugins.push(Plugin);


}())