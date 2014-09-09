(function() {


var Assets = function(game) {
	Five.EventEmitter(this);
	this.createContainer();
	this.checkFeatures();
	var self = this;

	this.assets = [];
	this.loading = 0;
	this.success = 0;
	this.errors = 0;
	this.done = 0;
	this.progress = 0;
	this.loaded = 0;
	this.totalSize = 0;

	var assetDone = function() {
		if(self.loading === 0) {self.emit("alldone"); self.progress = 1;}
	};
	this.on("done", assetDone);
	this.on("error", assetDone);

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
	asset.on("error", function(error) {
		assets.loading--;
		assets.errors++;
		assets.done++;
		assets.emit("error", [asset, error]);
		assets.updateProgress();
	});
	asset.on("success", function(loadedByXhr) {
		assets.loading--;
		assets.success++;
		assets.done++;
		assets.detailedProgress = loadedByXhr;
		if(asset.element) assets.container.appendChild(asset.element);
		assets.emit("done", [asset]);
		assets.updateProgress();
	});
	asset.on("progress", function(e) {
		assets.updateProgress();
	});

	this.assets.push(asset);
	this.loading++;


	return this;
}


Assets.prototype.get = function(id) {
	for(var i = 0, len = this.assets.length; i < len; i++) {
		var asset = this.assets[i];
		if(asset.name === id || asset.urls.indexOf(id) !== -1)
			return asset;
	}

	return null;
}


Assets.prototype.updateProgress = function() {
	var total = 0;
	var loaded = 0;

	if(this.detailedProgress) {
		for(var i = 0, len = this.assets.length; i < len; i++) {
			var asset = this.assets[i];
			total += asset.size || 0;
			loaded += (asset.size || 0) * (asset.loaded || 0);
		}
	}
	else {
		for(var i = 0, len = this.assets.length; i < len; i++) {
			total++;
			loaded += this.assets[i].loading ? 0 : 1;
		}
	}

	this.totalSize = total;
	this.loaded = loaded;
	this.progress = loaded / total;

	this.emit("progress", [{total: total, loaded: loaded, progress: this.progress}]);
}








/*
 * UTILS
 */

Assets.prototype.getType = function(url) {
	var imgType = /\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/i;
	var textType = /\.(txt|md|html|shtml|ejs|js|css)$/i;
	var audioType = /\.(mp3|ogg|m4a|wav|flac|ape|wv|aac)$/i;
	var videoType = /\.(mp4|mpg|mpeg|webm|mkv|flv|ogv|avi|mov|wmv)$/i;

	if(imgType.test(url)) return "image";
	if(textType.test(url)) return "text";
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
	this.size = 0;
	this.loaded = 0;

	this.xhr = null;
	this.data = null;
	this.blobUrl = null;
	this.text = null;
	this.element = null;

	this.on("error", function(error) {
		asset.loading = false;
		asset.error = error || true;
		asset.success = false;
	});
	this.on("success", function(xhr) {
		asset.loading = false;
		asset.success = true;
	});
	this.on("progress", function(e) {
		if(e.lengthComputable) {
			this.size = e.total;
			this.loaded = e.loaded;
		}
	});

	this.load();

	return this;
}

Asset.prototype.load = function() {
	var asset = this;

	if(this.denyBinary && this.type !== "text") {

		loadElement(this);

		this.on("elemdone", function(elem) {
			asset.element = elem;
			asset.progress = 1;
			asset.emit("success", [false]);
		});

	} else {

		loadXhr(this.urls, !this.denyBinary, this);

		this.on("xhrdone", function(xhr) {
			asset.xhr = xhr;
			asset.data = xhr.response;
			asset.loaded = asset.size;
			asset.progress = 1;

			if(xhr.responseType === "blob")
				asset.blobUrl = URL.createObjectURL(asset.data);
			if(asset.type === "text" && xhr.responseType !== "blob") {
				asset.text = xhr.responseText;
				asset.element = document.createElement("code");
				asset.element.innerHTML = asset.text;
			} else if (asset.type !== "text" && xhr.reponseType === "blob") {
				asset.element = document.createElement(asset.type);
				asset.element.setAttribute("src", asset.blobUrl);
			}

			asset.emit("success", [true]);
		});
	}

	return this;
}




var loadXhr = function(urls, loadAsBlob, asset) {
	loadXhrLoop(urls, 0, loadAsBlob, asset);
}

var loadXhrLoop = function(urls, index, loadAsBlob, asset) {
	var url = urls[index];

	var xhr = new XMLHttpRequest("GET", url, true);
	xhr.open("GET", url, true);
	if(loadAsBlob) xhr.responseType = "blob";
	xhr.old = false;

	var onerror = function(e) {
		if(!xhr.old) {
			if(urls[index+1]) loadXhrLoop(urls, index+1, loadAsBlob, asset); //Try next url
			else asset.emit("error"); //Give up
			xhr.old = true;
			xhr.abort();
		}
	}
	var onload = function(e) {
		if(!xhr.old) {
			asset.emit("xhrdone", [xhr]); //All done!
			xhr.old = true;
		}
	}
	var onreadystatechange = function(e) {
		if(!xhr.old) {
			if(xhr.readyState === 2) {
				asset.size = parseInt(xhr.getResponseHeader("Content-Length"), 10);
			}
			if(xhr.readyState === 4 && xhr.status === 200) {
				asset.emit("xhrdone", [xhr]);
				xhr.old = true;
			} else if(xhr.readyState >= 2 && xhr.status !== 200) {
				onerror(e);
			}
		}
	}
	var onprogress = function(e) {
		if(!xhr.old) {
			asset.emit("progress", [e]);
		}
	}

	xhr.load = onload;
	xhr.onerror = onerror;
	xhr.onreadystatechange = onreadystatechange;
	xhr.onprogress = onprogress;



	xhr.send();
}


var loadElement = function(asset) {
	if(asset.type === "video" || asset.type === "audio") {
		var elem = document.createElement(asset.type);
		for(var i = 0, len = urls.length; i < len; i++) {
			var src = document.createElement("source");
			src.setAttribute("src", urls[i]);
			elem.appendChild(src);
		}
	}
	else {
		loadImageLoop (asset, 0, document.createElement("img"));
	}
}

var loadImageLoop = function(asset, index, elem) {
	var url = asset.urls[index];

	elem.setAttribute("src", url);

	var onerror = function() {
		if(asset.urls[index+1]) loadImageLoop(asset, index+1, elem);
		else asset.emit("error", [elem]);
	}
	var onload = function() {
		asset.emit("elemdone", [elem]);
	}

	elem.onerror = onerror;
	elem.onload = onload;
}














var Plugin = {
	name: "Assets",
	"Assets": {
		construct: function(game) {
			return new Assets(game);
		}
	}
}
Five.plugins.push(Plugin);



})();