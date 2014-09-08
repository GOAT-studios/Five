(function() {




var Setup = function(Five) {
    window.Five = Five;
}





var Game = function() {
    EventEmitter (this);

    this.Plugins = new Plugins (this);

    this.initTime = null;
    this.loadTime = null;
    this.startTime = null;
    this.pauseTime = null;
    this.stopTime = null;

    this.playing = false;
    this.timer = null;
    this.frames = 0;
    this.drawTimes = [];

    this.container = document.createElement ("div");
    this.container.classList.add ("Five-container");

    return this;
}

Game.prototype.init = function(args) {
    this.initTime = Five.time ();
    this.Plugins.fire ("init", args);
    if(this.Draw && this.Draw.domElement)
        this.domElement = this.Draw.domElement;

    this.emit("init");

    return this;
}

Game.prototype.load = function(args) {
    if(!this.initTime)
        this.init ();

    this.loadTime = Five.time ();
    this.Plugins.fire ("load", args);
    this.emit("load");

    return this;
}

Game.prototype.start = function(args) {
    if(!this.playing) {
        if(!this.loadTime)
            this.load ();

        this.startTime = Five.time ();
        this.playing = true;
        this.Plugins.fire ("start", args);
        this.emit("start");
        this.requestAnimationFrame ();
    }

    return this;
}

Game.prototype.pause = function(args) {
    if(this.playing) {
        this.pauseTime = Five.time ();
        this.playing = false;
        this.Plugins.fire ("pause", args);
        this.emit("pause");
        this.cancelAnimationFrame ();
    }

    return this;
}

Game.prototype.stop = function(args) {
    if(this.playing) {
        this.stopTime = Five.time ();
        this.playing = false;
        this.Plugins.fire ("stop", args);
        this.emit("stop");
        this.cancelAnimationFrame ();
        this.reset ();
    }

    return this;
}

Game.prototype.Loop = function() {
    var START = Five.time ();

    this.frames++;
    this.Plugins.fire ("update");
    this.emit("update");
    this.Plugins.fire ("draw");
    this.emit("draw");
    this.requestAnimationFrame ();

    var END = Five.time ();
    this.drawTimes.push (END - START);

    return this;
}


Game.prototype.requestAnimationFrame = function() {
    var game = this;
    this.timer = requestAnimationFrame(function() {
        game.Loop.apply(game, []);
    });

    return this;
}

Game.prototype.cancelAnimationFrame = function() {
    cancelAnimationFrame (this.timer);

    return this;
}










var Plugins = function(game) {
    this.game = game;
    this.plugins = {};

    return this;
}

Plugins.prototype.add = function(plugin) {
    if(typeof plugin === "string")
        plugin = Five.getPlugin (plugin);

    this.plugins[plugin.name] = plugin;

    for (path in plugin) {
        if(path !== "name") {
            var content = plugin[path].content || plugin[path].construct (this.game);
            Five.Utils.addToObjectFromPath (this.game, path, content);
        }
    }

    return this;
}

Plugins.prototype.addMultiple = function(plugins) {
    for(var i = 0, len = plugins.length; i < len; i++) {
        this.add (plugins[i]);
    }

    return this;
}

Plugins.prototype.remove = function (id) {
    var plugin = this.get (id);

    for (path in plugin) {
        Five.Utils.addToObjectFromPath (this.game, path, undefined);
    }

    return this;
}

Plugins.prototype.get = function(id) {
    //id is the plugin name, registered with this game
    if(this.plugins[id])
        return this.plugins[id];

    //iterate over all plugins and check if the id is one of their paths
    for(name in this.plugins) {
        var plugin = this.plugins[name];
        for(path in plugin) {
            if(path === id)
                return plugin;
        }
    }

    return null;
}

Plugins.prototype.fire = function(event, args) {
    for(name in this.plugins) {
        plugins[name].fire (event, args);
    }

    return this;
}









var EventEmitter = function(obj) {
    if(!obj) obj = this;

    obj.__events = {};
    obj.__allEvents = [];

    obj.addListener = obj.on = function(event, listener) {
        if(!this.__events[event]) this.__events[event] = [];

        if(listener) {
            this.__events[event].push(listener);
        }
        else {
            this.__allEvents.push(event); // event is now the callback
        }

        return this;
    }

    obj.once = function(event, listener) {
        if(!this.__events[event]) this.__events[event] = [];

        if(listener) {
            var func = function() {
                listener.call(null, arguments);
                obj.removeListener(event, func);
            }
            this.__events[event].push(func);
        }
        else {
            var func = function() {
                event.call(null, arguments);
                obj.removeListener(func);
            }
            this.__allEvents.push(func);
        }

        return this;
    }

    obj.emit = function(event, args) {
        if(!args) args = [];
        if(this.__events[event]) {
            var listeners = this.__events[event];
            for(var i = 0, len = listeners.length; i < len; i++) {
                listeners[i].apply(null, args);
            }
        }
        var args = [event].concat(args);
        for(var i = 0, len = this.__allEvents.length; i < len; i++) {
            this.__allEvents[i].apply(null, args);
        }

        return this;
    }

    obj.removeListener = function(event, listener) {
        if(!listener) {
            var listener = event;
            for(event in this.__events) {
                this.removeListener(event, listener);
            }
        }
        else {
            var listeners = this.__events[event];
            if(listeners.indexOf(listener) !== -1) {
                listeners.splice(listeners.indexOf(listener), 1);
            }
            if(this.__allEvents.indexOf(listener) !== -1) {
                this.__allEvents.splice(this.__allEvents.indexOf(listener), 1);
            }
        }

        return this;
    }

    obj.removeAllListeners = function(event) {
        this.__events[event] = [];

        return this;
    }

    obj.listeners = function(event) {
        return this.__events[event] || [];
    }


    return obj;
}














var Five = {

    Game: Game,

    EventEmitter: EventEmitter,

    Plugins: Plugins,

    plugins: [],


    Utils: {

        /* Objects */
        merge: function(first, second, blacklist) {
            if(!blacklist) var blacklist = [];

            for(key in second) {
                if(blacklist.indexOf(key) === -1) {
                    first[key] = second[key];
                }
            }

            return first;
        },
        getObjectFromPath: function(base, path) {
            var current = base;
            var steps = path.split (".");

            for (var i = 0, len = steps.length; i < len; i++) {
                var step = steps[i];
                if (!current[step]) current[step] = {};
                current = current[step];
            }

            return current;
        },
        addToObjectFromPath: function(base, path, child) {
            var current = base;
            var steps = path.split (".");
            var lastStep = steps.slice(-1)[0];

            for (var i = 0, len = steps.length - 1; i < len; i++) {
                var step = steps[i];
                if (!current[step]) current[step] = {};
                current = current[step];
            }
            current[lastStep] = child;

            return current;
        },
        arrayToObject: function(array, key) {
            var obj = {};
            for(var i = 0, len = array.length; i < len; i++) {
                obj[array[i][key]] = array[i];
            }

            return obj;
        },

        /* Angles */
        toRadians: function(deg) {
            return (deg * Math.PI) / 180;
        },
        toDegrees: function(rad) {
            return (rad * 180) / Math.PI;
        },

        /* Game */
        getAverageDrawTime: function(game) {
            var sum = 0;
            for(var i = 0, len = game.drawTimes.length; i < len; i++) {
                sum += game.drawTimes[i];
            }
            return sum / len;
        }
    },

    getPlugin: function(id) {
        for(var i = 0, len = this.plugins.length; i < len; i++) {
            var plugin = this.plugins[i];
            if(plugin.name === id)
                return plugin;

            for(path in plugin) {
                if(path === id)
                    return plugin;
            }
        }

        return null;
    },

    registerContainer: function(elem) {
        elem.classList.add ("Five-assets-container");
        this.container.appendChild (elem);

        return this;
    },

    time: (function() {
        if(performance && performance.now) {
            return function() { return performance.now(); }
        } else if(performance && performance.webkitNow) {
            return function() { return performance.webkitNow(); }
        } else {
            return function() { return Date.now(); }
        }
    })()

}

Five.container = document.createElement ("div");
Five.container.setAttribute ("id", "Five-assets-top");
Five.container.setAttribute ("style", "width:0;height:0;visibility:hidden;overflow:hidden;")
document.addEventListener ("DOMContentLoaded", function() {
    document.body.appendChild (Five.container);
});



Setup (Five);




}())