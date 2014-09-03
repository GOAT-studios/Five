// Of the form: {keyCode: active}, e.g. {34: true, 32: false}
// meaning key 34 is pressed, key 32 is not
var keyStates = {};



(function() {



var Input = function() {
	// Of the form: {keyCode: behaviour}, e.g. {34: 'left', 32: 'jump'}
	// meaning key 34 is configured to move the player to the left, 32 to let it jump
	this.keyMap = {};

	inputs.push (this);

	return this;
}


// Configure keys
Input.prototype.mapKeys = function(keys) {
	Five.Utils.merge (this.keyMap, keys);

	return this;
}

Input.prototype.updateKeys = function() {
	for(keyCode in this.keyMap) {
		this[this.keyMap[keyCode]] = !!keyStates[keyCode];
	}

	return this;
}



var handlerDown = function(e) {
	keyStates[e.keyCode] = true;
	updateInputs ();
}
var handlerUp = function(e) {
	keyStates[e.keyCode] = false;
	updateInputs ();
}
var updateInputs = function() {
	for(var i = 0, len = inputs.length; i < len; i++) {
		inputs[i].updateKeys ();
	}
}

document.addEventListener ("keyup", handlerUp);
document.addEventListener ("keyDown", handlerDown);

var inputs = [];




var Plugin = {
	name: "Input",
	"Input": {
		construct: function(game) {
			return new Input ();
		}
	}
}
Five.plugins.push (Plugin);



}())