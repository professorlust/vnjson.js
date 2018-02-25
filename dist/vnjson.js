var vnjs = {
  plugins: {},
  TREE: {},
  DEBUG: false,
  audio: {}
};

vnjs.on = function (event, handler) {
  if (!vnjs.plugins[event]) {
    vnjs.plugins[event] = [];
  }

  ;
  vnjs.plugins[event].push(handler);
};

vnjs.emit = function (event) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (Array.isArray(vnjs.plugins[event])) {
    vnjs.plugins[event].map(function (handler) {
      handler.call.apply(handler, [vnjs].concat(args));
    });
  }
  /*
  else{
   Выводятся системные слушатели
   console.log(`Event [ ${event} ] not found`)
  }
  */

};

vnjs.off = function (event) {
  delete vnjs.plugins[event];
};
/*
 * В {state} должно помещаться все то
 * что сохроняется в карту памяти
 * И что важно загрузить из нее без последствий.
 * В состоянии не должно быть мусора
 */


vnjs.state = {
  scene: 'scene',
  label: 'label',
  index: 0,
  screens: []
};
/*
 * Получает текущее тела из состояние
 */

vnjs.current = {
  scene: function scene() {
    return vnjs.TREE[vnjs.state.scene];
  },
  label: function label() {
    return vnjs.TREE[vnjs.state.scene][vnjs.state.label];
  },
  object: function object() {
    return vnjs.TREE[vnjs.state.scene][vnjs.state.label][vnjs.state.index];
  }
};

vnjs.setScene = function (name, body) {
  this.TREE[name] = body;
  this.state.scene = name;
  body.characters.map(function (character) {
    var aliase = Object.keys(character)[0];
    vnjs.on(aliase, function (reply) {
      vnjs.emit('character', {
        aliase: aliase,
        param: character[aliase],
        reply: reply
      });
    });
  });
  this.emit('load', body.assets); // this.parse();//??? Возможно это будет вызываться не здесь
};

vnjs.parse = function (obj) {
  var ctx = null;

  if (obj) {
    ctx = obj;
  } else {
    ctx = vnjs.current.object();
  }

  ;

  for (var event in ctx) {
    vnjs.emit(event, ctx[event]);
  }

  ;
};

vnjs.next = function () {
  this.parse();
  this.state.index++;
  return '-------------------------';
};

vnjs.init = function (conf) {
  vnjs.conf = conf; // this.parse({'jump': conf.entryScene});

  vnjs.emit('getScreens');
  return true;
};
/**
 conf = /scenes/
*/
vnjs.on('getScene', function (data) {
  var sceneName = data.sceneName,
      labelName = data.labelName,
      index = data.index;
  var DEBUG = this.DEBUG,
      conf = this.conf,
      setScene = this.setScene,
      emit = this.emit;
  var uri = "".concat(conf.gameDir, "/").concat(conf.scenesDir, "/").concat(conf.local, "/").concat(sceneName, ".json");
  emit('preload', data);
  fetch(uri).then(function (r) {
    return r.json();
  }).then(function (sceneBody) {
    if (DEBUG) {
      console.log(sceneName, sceneBody); //	console.log(data);
    }

    vnjs.setScene(sceneName, sceneBody, labelName, index);
  });
  /*
  
  setScene("*", sceneBody);
  
  state.label = "mainMenu";
  
  next();
  */
});
vnjs.on('getScreens', function () {
  var conf = this.conf,
      DEBUG = this.DEBUG,
      emit = this.emit;

  function fetchCss(filename) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = filename;
    var h = document.getElementsByTagName('head')[0];
    h.appendChild(l);
  }

  ;
  var uriHtml = "".concat(conf.gameDir, "/screens.html");
  var uriCss = "".concat(conf.gameDir, "/screens.css");
  var gameRoot = document.querySelector(conf.element);
  fetch(uriHtml).then(function (r) {
    return r.text();
  }).then(function (screens) {
    fetchCss(uriCss);
    gameRoot.innerHTML = screens;
  }).then(function () {
    var screensNodeList = document.querySelectorAll(conf.screenClass);
    screensNodeList.forEach(function (screen) {
      var styles = {
        display: 'none',
        width: '100%',
        height: '100%'
      };
      Object.assign(screen.style, styles);
      /*Код кантораЮ необходимо для работы 'Правильлного show/hide'*/

      screen.setAttribute("displayOld", screen.style.display);
      DEBUG && console.log(screen);
    });
    emit('screensLoaded');
  }); //.catch(function(error) { console.error(error); })
});
vnjs.on('jump', function (pathname) {
  var parse = this.parse,
      state = this.state,
      emit = this.emit,
      DEBUG = this.DEBUG;
  var pathArr = pathname.split('/');
  /*****
  #WARN
  > {jump: 'label/0'}
  < Object { labelName: "0", sceneName: "label", index: 0 }
  
  ******/

  function getName() {
    var sceneName = pathArr[0];
    var labelName = pathArr[1];
    var index = pathArr[2] || 0;
    return {
      labelName: labelName,
      sceneName: sceneName,
      index: +index
    };
  }

  ;

  function isNum(num) {
    return /[0-9]/.test(+num);
  }

  ;

  function isScene(pathname) {
    if (pathArr.length === 3) {
      return true;
    } else if (pathArr.length === 2) {
      return !isNum(pathArr[1]);
    }
  }

  ;
  var pathObj = getName(pathname);
  {
    DEBUG && console.log('jump: ', pathObj);
  }
  ;

  if (isScene(pathname)) {
    // set state
    vnjs.state.scene = pathObj.sceneName;
    vnjs.state.label = pathObj.labelName;
    vnjs.state.index = pathObj.index;
    emit('getScene', pathObj);
  } else {
    var pathArr1 = pathname.split('/'); // set state

    vnjs.state.scene = vnjs.state.scene;
    vnjs.state.label = pathArr1[1];
    vnjs.state.index = pathObj.index; // setLabel(pathname, ctx.scene[pathname],  obj.num );

    parse();
  }
  /*
  state.index = 0;
  state.label = "chapter1";
  state.scene = "scene2";
  parse();*/

});
function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof2(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.Navigo = factory();
})(this, function () {
  'use strict';

  var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
    return _typeof2(obj);
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
  };

  function isPushStateAvailable() {
    return !!(typeof window !== 'undefined' && window.history && window.history.pushState);
  }

  function Navigo(r, useHash, hash) {
    this.root = null;
    this._routes = [];
    this._useHash = useHash;
    this._hash = typeof hash === 'undefined' ? '#' : hash;
    this._paused = false;
    this._destroyed = false;
    this._lastRouteResolved = null;
    this._notFoundHandler = null;
    this._defaultHandler = null;
    this._usePushState = !useHash && isPushStateAvailable();
    this._onLocationChange = this._onLocationChange.bind(this);
    this._genericHooks = null;
    this._historyAPIUpdateMethod = 'pushState';

    if (r) {
      this.root = useHash ? r.replace(/\/$/, '/' + this._hash) : r.replace(/\/$/, '');
    } else if (useHash) {
      this.root = this._cLoc().split(this._hash)[0].replace(/\/$/, '/' + this._hash);
    }

    this._listen();

    this.updatePageLinks();
  }

  function clean(s) {
    if (s instanceof RegExp) return s;
    return s.replace(/\/+$/, '').replace(/^\/+/, '^/');
  }

  function regExpResultToParams(match, names) {
    if (names.length === 0) return null;
    if (!match) return null;
    return match.slice(1, match.length).reduce(function (params, value, index) {
      if (params === null) params = {};
      params[names[index]] = decodeURIComponent(value);
      return params;
    }, null);
  }

  function replaceDynamicURLParts(route) {
    var paramNames = [],
        regexp;

    if (route instanceof RegExp) {
      regexp = route;
    } else {
      regexp = new RegExp(route.replace(Navigo.PARAMETER_REGEXP, function (full, dots, name) {
        paramNames.push(name);
        return Navigo.REPLACE_VARIABLE_REGEXP;
      }).replace(Navigo.WILDCARD_REGEXP, Navigo.REPLACE_WILDCARD) + Navigo.FOLLOWED_BY_SLASH_REGEXP, Navigo.MATCH_REGEXP_FLAGS);
    }

    return {
      regexp: regexp,
      paramNames: paramNames
    };
  }

  function getUrlDepth(url) {
    return url.replace(/\/$/, '').split('/').length;
  }

  function compareUrlDepth(urlA, urlB) {
    return getUrlDepth(urlB) - getUrlDepth(urlA);
  }

  function findMatchedRoutes(url) {
    var routes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    return routes.map(function (route) {
      var _replaceDynamicURLPar = replaceDynamicURLParts(clean(route.route)),
          regexp = _replaceDynamicURLPar.regexp,
          paramNames = _replaceDynamicURLPar.paramNames;

      var match = url.replace(/^\/+/, '/').match(regexp);
      var params = regExpResultToParams(match, paramNames);
      return match ? {
        match: match,
        route: route,
        params: params
      } : false;
    }).filter(function (m) {
      return m;
    });
  }

  function match(url, routes) {
    return findMatchedRoutes(url, routes)[0] || false;
  }

  function root(url, routes) {
    var matched = routes.map(function (route) {
      return route.route === '' || route.route === '*' ? url : url.split(new RegExp(route.route + '($|\/)'))[0];
    });
    var fallbackURL = clean(url);

    if (matched.length > 1) {
      return matched.reduce(function (result, url) {
        if (result.length > url.length) result = url;
        return result;
      }, matched[0]);
    } else if (matched.length === 1) {
      return matched[0];
    }

    return fallbackURL;
  }

  function isHashChangeAPIAvailable() {
    return typeof window !== 'undefined' && 'onhashchange' in window;
  }

  function extractGETParameters(url) {
    return url.split(/\?(.*)?$/).slice(1).join('');
  }

  function getOnlyURL(url, useHash, hash) {
    var onlyURL = url,
        split;

    var cleanGETParam = function cleanGETParam(str) {
      return str.split(/\?(.*)?$/)[0];
    };

    if (typeof hash === 'undefined') {
      // To preserve BC
      hash = '#';
    }

    if (isPushStateAvailable() && !useHash) {
      onlyURL = cleanGETParam(url).split(hash)[0];
    } else {
      split = url.split(hash);
      onlyURL = split.length > 1 ? cleanGETParam(split[1]) : cleanGETParam(split[0]);
    }

    return onlyURL;
  }

  function manageHooks(handler, hooks, params) {
    if (hooks && (typeof hooks === 'undefined' ? 'undefined' : _typeof(hooks)) === 'object') {
      if (hooks.before) {
        hooks.before(function () {
          var shouldRoute = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
          if (!shouldRoute) return;
          handler();
          hooks.after && hooks.after(params);
        }, params);
        return;
      } else if (hooks.after) {
        handler();
        hooks.after && hooks.after(params);
        return;
      }
    }

    handler();
  }

  function isHashedRoot(url, useHash, hash) {
    if (isPushStateAvailable() && !useHash) {
      return false;
    }

    if (!url.match(hash)) {
      return false;
    }

    var split = url.split(hash);
    return split.length < 2 || split[1] === '';
  }

  Navigo.prototype = {
    helpers: {
      match: match,
      root: root,
      clean: clean,
      getOnlyURL: getOnlyURL
    },
    navigate: function navigate(path, absolute) {
      var to;
      path = path || '';

      if (this._usePushState) {
        to = (!absolute ? this._getRoot() + '/' : '') + path.replace(/^\/+/, '/');
        to = to.replace(/([^:])(\/{2,})/g, '$1/');

        history[this._historyAPIUpdateMethod]({}, '', to);

        this.resolve();
      } else if (typeof window !== 'undefined') {
        path = path.replace(new RegExp('^' + this._hash), '');
        window.location.href = window.location.href.replace(/#$/, '').replace(new RegExp(this._hash + '.*$'), '') + this._hash + path;
      }

      return this;
    },
    on: function on() {
      var _this = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (typeof args[0] === 'function') {
        this._defaultHandler = {
          handler: args[0],
          hooks: args[1]
        };
      } else if (args.length >= 2) {
        if (args[0] === '/') {
          var func = args[1];

          if (_typeof(args[1]) === 'object') {
            func = args[1].uses;
          }

          this._defaultHandler = {
            handler: func,
            hooks: args[2]
          };
        } else {
          this._add(args[0], args[1], args[2]);
        }
      } else if (_typeof(args[0]) === 'object') {
        var orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);
        orderedRoutes.forEach(function (route) {
          _this.on(route, args[0][route]);
        });
      }

      return this;
    },
    off: function off(handler) {
      if (this._defaultHandler !== null && handler === this._defaultHandler.handler) {
        this._defaultHandler = null;
      } else if (this._notFoundHandler !== null && handler === this._notFoundHandler.handler) {
        this._notFoundHandler = null;
      }

      this._routes = this._routes.reduce(function (result, r) {
        if (r.handler !== handler) result.push(r);
        return result;
      }, []);
      return this;
    },
    notFound: function notFound(handler, hooks) {
      this._notFoundHandler = {
        handler: handler,
        hooks: hooks
      };
      return this;
    },
    resolve: function resolve(current) {
      var _this2 = this;

      var handler, m;

      var url = (current || this._cLoc()).replace(this._getRoot(), '');

      if (this._useHash) {
        url = url.replace(new RegExp('^\/' + this._hash), '/');
      }

      var GETParameters = extractGETParameters(current || this._cLoc());
      var onlyURL = getOnlyURL(url, this._useHash, this._hash);
      if (this._paused) return false;

      if (this._lastRouteResolved && onlyURL === this._lastRouteResolved.url && GETParameters === this._lastRouteResolved.query) {
        if (this._lastRouteResolved.hooks && this._lastRouteResolved.hooks.already) {
          this._lastRouteResolved.hooks.already(this._lastRouteResolved.params);
        }

        return false;
      }

      m = match(onlyURL, this._routes);

      if (m) {
        this._callLeave();

        this._lastRouteResolved = {
          url: onlyURL,
          query: GETParameters,
          hooks: m.route.hooks,
          params: m.params,
          name: m.route.name
        };
        handler = m.route.handler;
        manageHooks(function () {
          manageHooks(function () {
            m.route.route instanceof RegExp ? handler.apply(undefined, m.match.slice(1, m.match.length)) : handler(m.params, GETParameters);
          }, m.route.hooks, m.params, _this2._genericHooks);
        }, this._genericHooks, m.params);
        return m;
      } else if (this._defaultHandler && (onlyURL === '' || onlyURL === '/' || onlyURL === this._hash || isHashedRoot(onlyURL, this._useHash, this._hash))) {
        manageHooks(function () {
          manageHooks(function () {
            _this2._callLeave();

            _this2._lastRouteResolved = {
              url: onlyURL,
              query: GETParameters,
              hooks: _this2._defaultHandler.hooks
            };

            _this2._defaultHandler.handler(GETParameters);
          }, _this2._defaultHandler.hooks);
        }, this._genericHooks);
        return true;
      } else if (this._notFoundHandler) {
        manageHooks(function () {
          manageHooks(function () {
            _this2._callLeave();

            _this2._lastRouteResolved = {
              url: onlyURL,
              query: GETParameters,
              hooks: _this2._notFoundHandler.hooks
            };

            _this2._notFoundHandler.handler(GETParameters);
          }, _this2._notFoundHandler.hooks);
        }, this._genericHooks);
      }

      return false;
    },
    destroy: function destroy() {
      this._routes = [];
      this._destroyed = true;
      this._lastRouteResolved = null;
      this._genericHooks = null;
      clearTimeout(this._listeningInterval);

      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', this._onLocationChange);
        window.removeEventListener('hashchange', this._onLocationChange);
      }
    },
    updatePageLinks: function updatePageLinks() {
      var self = this;
      if (typeof document === 'undefined') return;

      this._findLinks().forEach(function (link) {
        if (!link.hasListenerAttached) {
          link.addEventListener('click', function (e) {
            var location = self.getLinkPath(link);

            if (!self._destroyed) {
              e.preventDefault();
              self.navigate(location.replace(/\/+$/, '').replace(/^\/+/, '/'));
            }
          });
          link.hasListenerAttached = true;
        }
      });
    },
    generate: function generate(name) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var result = this._routes.reduce(function (result, route) {
        var key;

        if (route.name === name) {
          result = route.route;

          for (key in data) {
            result = result.toString().replace(':' + key, data[key]);
          }
        }

        return result;
      }, '');

      return this._useHash ? this._hash + result : result;
    },
    link: function link(path) {
      return this._getRoot() + path;
    },
    pause: function pause() {
      var status = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      this._paused = status;

      if (status) {
        this._historyAPIUpdateMethod = 'replaceState';
      } else {
        this._historyAPIUpdateMethod = 'pushState';
      }
    },
    resume: function resume() {
      this.pause(false);
    },
    historyAPIUpdateMethod: function historyAPIUpdateMethod(value) {
      if (typeof value === 'undefined') return this._historyAPIUpdateMethod;
      this._historyAPIUpdateMethod = value;
      return value;
    },
    disableIfAPINotAvailable: function disableIfAPINotAvailable() {
      if (!isPushStateAvailable()) {
        this.destroy();
      }
    },
    lastRouteResolved: function lastRouteResolved() {
      return this._lastRouteResolved;
    },
    getLinkPath: function getLinkPath(link) {
      return link.getAttribute('href');
    },
    hooks: function hooks(_hooks) {
      this._genericHooks = _hooks;
    },
    _add: function _add(route) {
      var handler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var hooks = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      if (typeof route === 'string') {
        route = encodeURI(route);
      }

      this._routes.push((typeof handler === 'undefined' ? 'undefined' : _typeof(handler)) === 'object' ? {
        route: route,
        handler: handler.uses,
        name: handler.as,
        hooks: hooks || handler.hooks
      } : {
        route: route,
        handler: handler,
        hooks: hooks
      });

      return this._add;
    },
    _getRoot: function _getRoot() {
      if (this.root !== null) return this.root;
      this.root = root(this._cLoc().split('?')[0], this._routes);
      return this.root;
    },
    _listen: function _listen() {
      var _this3 = this;

      if (this._usePushState) {
        window.addEventListener('popstate', this._onLocationChange);
      } else if (isHashChangeAPIAvailable()) {
        window.addEventListener('hashchange', this._onLocationChange);
      } else {
        var cached = this._cLoc(),
            current = void 0,
            _check = void 0;

        _check = function check() {
          current = _this3._cLoc();

          if (cached !== current) {
            cached = current;

            _this3.resolve();
          }

          _this3._listeningInterval = setTimeout(_check, 200);
        };

        _check();
      }
    },
    _cLoc: function _cLoc() {
      if (typeof window !== 'undefined') {
        if (typeof window.__NAVIGO_WINDOW_LOCATION_MOCK__ !== 'undefined') {
          return window.__NAVIGO_WINDOW_LOCATION_MOCK__;
        }

        return clean(window.location.href);
      }

      return '';
    },
    _findLinks: function _findLinks() {
      return [].slice.call(document.querySelectorAll('[data-navigo]'));
    },
    _onLocationChange: function _onLocationChange() {
      this.resolve();
    },
    _callLeave: function _callLeave() {
      var lastRouteResolved = this._lastRouteResolved;

      if (lastRouteResolved && lastRouteResolved.hooks && lastRouteResolved.hooks.leave) {
        lastRouteResolved.hooks.leave(lastRouteResolved.params);
      }
    }
  };
  Navigo.PARAMETER_REGEXP = /([:*])(\w+)/g;
  Navigo.WILDCARD_REGEXP = /\*/g;
  Navigo.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
  Navigo.REPLACE_WILDCARD = '(?:.*)';
  Navigo.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
  Navigo.MATCH_REGEXP_FLAGS = '';
  return Navigo;
});
{
  var root = null;
  vnjs.router = new Navigo(root, true, '#!');
}
;
vnjs.router.on(function () {
  return console.log('############ vnjson.js #############');
}).on('/:scene', function (params) {
  var scene = params.scene;
  console.warn([scene].join('|'));
}).on('/:scene/:label', function (params) {
  var scene = params.scene,
      label = params.label;
  console.warn([scene, label].join('|'));
}).on('/:scene/:label/:index', function (params) {
  //router.navigate('/products/list');
  var scene = params.scene,
      label = params.label,
      index = params.index;
  console.warn([scene, label, index].join('|'));
}).notFound(function () {
  console.warn('Маршрута не существует');
}).resolve();
/**



Плагины
get-screens
 &
screen-show
объеденить в один ->screen

* Так же можно было бы объеденить jump и getScenes
*
*/
function getRealDisplay(elem) {
  if (elem.currentStyle) {
    return elem.currentStyle.display;
  } else if (window.getComputedStyle) {
    var computedStyle = window.getComputedStyle(elem, null);
    return computedStyle.getPropertyValue('display');
  }
}

function hide(el) {
  if (!el.getAttribute('displayOld')) {
    el.setAttribute("displayOld", el.style.display);
  }

  el.style.display = "none";
}

displayCache = {};

function isHidden(el) {
  var width = el.offsetWidth,
      height = el.offsetHeight,
      tr = el.nodeName.toLowerCase() === "tr";
  return width === 0 && height === 0 && !tr ? true : width > 0 && height > 0 && !tr ? false : getRealDisplay(el);
}

function toggle(el) {
  isHidden(el) ? show(el) : hide(el);
}

function show(el) {
  if (getRealDisplay(el) != 'none') return;
  var old = el.getAttribute("displayOld");
  el.style.display = old || "";

  if (getRealDisplay(el) === "none") {
    var nodeName = el.nodeName,
        body = document.body,
        display;

    if (displayCache[nodeName]) {
      display = displayCache[nodeName];
    } else {
      var testElem = document.createElement(nodeName);
      body.appendChild(testElem);
      display = getRealDisplay(testElem);

      if (display === "none") {
        display = "block";
      }

      body.removeChild(testElem);
      displayCache[nodeName] = display;
    }

    el.setAttribute('displayOld', display);
    el.style.display = display;
  }
}

vnjs.on('screen', function (id) {
  this.emit(id); //console.log(id);

  vnjs.prevScreen = null;
  /* Если если это первая сцена, то предыдущей нет*/

  if (this.prevScreen !== null) {
    hide(this.prevScreen);
  } //prefix
  //show.id
  //hide.pref.screen
  //push.state.screens


  show(document.getElementById(id));
});
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

vnjs.on('audio', function (data) {
  if (typeof data === 'string') {
    vnjs.audio[data].play();
  } else if (_typeof(data) === 'object') {
    vnjs.audio[data.id][data.action](); // vnjs.audio[data.id].loop = data.loop;
  } else {
    console.error('incorect data type');
  }
});
/* @events
    * preload
    * load
    * postload
 */
vnjs.on('load', function (assets) {
  var DEBUG = this.DEBUG,
      emit = this.emit;
  var persent = 100 / assets.length;
  var PROGREESS = 0;
  var i = 0;

  var _loop = function _loop(asset) {
    position = [i += 1, '/', assets.length].join("");
    var progress = Math.round(PROGREESS += persent) + "%";

    if (asset.type === "image") {
      var img = new Image();
      img.src = asset.path;

      img.onload = function () {
        emit('imageLoad', asset);
      };
    } else if (asset.type === "audio") {
      var audio = new Audio();
      audio.addEventListener('canplaythrough', function () {
        emit('audioLoad', asset);
      }, false);
      audio.src = asset.path;
      vnjs.audio[asset.id] = audio;
    } else {
      console.error('asset type incorect');
      return "break";
    }

    var data = Object.assign(asset, {
      progress: progress,
      position: position
    });
    emit('asset', data);
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = assets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var asset = _step.value;
      var position;

      var _ret = _loop(asset);

      if (_ret === "break") break;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  ;
  {
    DEBUG && console.info('LOADING...');
  }
  ;
  emit('postload');
});
//# sourceMappingURL=vnjson.js.map
