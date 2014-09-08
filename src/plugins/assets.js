(function() {


var Assets = function(game) {
	Five.EventEmitter(this);
	this.createContainer();

	this.assets = [];
	this.loading = 0;
	this.success = 0;
	this.errors = 0;
	this.progress = 0;

	return this;
}


/*
 * INIT
 */

Assets.prototype.createContainer = function() {
	var container = document.createElement("div");
	container.setAttribute("class", "Five-assets");
	Five.container.appendChild(container);
	this.container = container;

	return container;
}

Assets.prototype.checkFeatures = function() {
	//TODO : detect features
	this.features = {
		xhr2: (XMLHttpRequest && Blob && (URL && URL.createObjectURL))
	};

	return this;
}


/*
 * LOADING
 */

Assets.prototype.load = function(urls, name, denyBinary) {
	var assets = this;
	/* 'denyBinary' makes sure data is not loaded as a blob
	 * By default, assets are loaded with XHR2, as a blob (if available)
	 * but with 'denyBinary = true', it will be loaded as an HTML element (or plain text, in the case of text assets).
	 */
	if(typeof urls === "string") urls = [urls];
	if(typeof name === "boolean") {denyBinary = name; name = undefined;}
	if(!this.features.xhr2) denyBinary = true; //if XHR2 is not supported, deny loading binary data

	var type = this.getType(urls[0]);

	var asset = new Asset(urls, name, type, denyBinary);
	asset.on("error", function() {
		assets.loading--;
		assets.errors++;
		assets.updateProgress();
	}
	asset.on("load", function(xhr) {
		assets.loading--;
		assets.success++;
		assets.updateProgress();
	}

	this.assets.push(asset);
	this.loading++;


	return this;
}


var loadXhr = function(urls, loadAsBlob, asset) {
	if(!events) events = {};

	loadXhrLoop(urls, 0, loadAsBlob, asset);

	return events;
}

var loadXhrLoop = function(urls, index, loadAsBlob, asset) {
	var url = urls[index];

	var xhr = new XMLHttpRequest("GET", url, true);
	if(loadAsBlob) xhr.responseType = "blob";
	xhr.old = false;

	xhr.onerror = function(e) {
		if(!xhr.old) {
			if(urls[index+1]) loadXhrLoop(urls, index++, loadAsBlob, asset); //Try next url
			else asset.emit("error"); //Give up
			xhr.old = true;
		}
	}
	xhr.onload = function(e) {
		if(!xhr.old) {
			asset.emit("xhrDone", [xhr]); //All done!
			xhr.old = true;
		}
	}
	xhr.onreadystatechange = function(e) {
		if(!xhr.old) {
			if(xhr.readyState >= 2) {
				if(xhr.status === 200) {
					asset.emit("xhrDone", [xhr]);
				} else {
					asset.emit("error");
				}
				xhr.old = true;
			}
		}
	}


	xhr.send();
}





/*
 * UTILS
 */

Assets.getType = function(url) {
	var imgType = /\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/i;
	var textType = /\.(txt|md|html|shtml|ejs|js|css)$/i;
	var audioType = /\.(mp3|ogg|m4a|wav|flac|ape|wv|aac)$/i;
	var videoType = /\.(mp4|mpg|mpeg|webm|mkv|flv|ogv|avi|mov|wmv)$/i;

	if(imgType.test(url)) return "image";
	if(textype.test(url)) return "text";
	if(audioType.test(url)) return "audio";
	if(videoType.test(url)) return "video";

	return null;
}



/*
 * ASSET
 */

var Asset = function(urls, name, type, denyBinary) {
	Five.EventEmitter(this);
	var asset = this;

	this.urls = urls;
	this.name = name;
	this.type = type;
	this.denyBinary = denyBinary;

	this.loading = true;
	this.success = null;
	this.error = null;
	this.progress = 0;

	this.xhr = null;
	this.data = null;
	this.blobUrl = null;
	this.element = null;
	this.text = null;

	this.on("error", function() {
		asset.loading = false;
		asset.error = true;
		asset.success = false;
	});
	this.on("success", function(xhr) {
		asset.loading = false;
		asset.success = true;
	});
	this.on("xhrDone", function(xhr) {
		asset.xhr = xhr;
		asset.data = xhr.response;
		if(asset.type === "text" && asset.denyBinary) {
			asset.text = xhr.responseText;
			asset.element = document.createElement("code");
			asset.element.innerHTML = asset.text;
		} else if (asset.type !== "text") {
			asset.blobUrl = URL.createObjectURL(asset.data);
			asset.element = document.createElement(asset.type);
			asset.element.setAttribute("src", asset.blobUrl);
		}

		asset.emit("success");

	}

	this.load();

	return this;
}

Asset.prototype.load = function() {
	if(this.denyBinary) {

	} else {
		loadXhr(this.urls, true, this);
	}

	return this;
}



})();