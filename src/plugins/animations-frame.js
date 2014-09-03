(function() {


var Animation = function(name, speed, sprites) {
	this.name = name;
	this.speed = speed;
	this.sprites = sprites;

	this.initTime = null;
	this.startTime = null;
	this.pauseTime = null;
	this.playing = false;
	this.pauseDuration = 0;

	return this;
}

Animation.prototype.getCurrent = function() {
	if(this.playing && this.initTime) {
		var playingTime = Five.time () - this.initTime - this.pauseDuration;
		var currentIndex = Math.floor ((playingTime / this.speed) % this.sprites.length);
		return this.sprites[currentIndex];
	}

	return this.sprites[0];
}

Animation.prototype.start = function() {
	if(!this.playing) {
		this.playing = true;
		this.startTime = Five.time ();

		if(this.pauseTime)
			this.pauseDuration += this.startTime - this.pauseTime;
		if(!this.initTime)
			this.initTime = this.startTime;
	}

	return this;
}

Animation.prototype.pause = function() {
	if(this.playing) {
		this.playing = false;
		this.pauseTime = Five.time ();
	}

	return this;
}

Animation.prototype.stop = function() {
	this.playing = false;
	this.initTime = null;
	this.startTime = null;
	this.pauseTime = null;
	this.pauseDuration = 0;

	return this;
}




var Plugin = {
	name: "animations-frame",
	"Animations.FrameByFrame": {
		content: Animation
	}
}
Five.plugins.push (Plugin);


}())