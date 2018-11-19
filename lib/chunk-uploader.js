var chunkupload = (function (exports) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var domain;

  // This constructor is used to store event handlers. Instantiating this is
  // faster than explicitly calling `Object.create(null)` to get a "clean" empty
  // object (tested with v8 v4.9).
  function EventHandlers() {}
  EventHandlers.prototype = Object.create(null);

  function EventEmitter() {
    EventEmitter.init.call(this);
  }

  // nodejs oddity
  // require('events') === require('events').EventEmitter
  EventEmitter.EventEmitter = EventEmitter;

  EventEmitter.usingDomains = false;

  EventEmitter.prototype.domain = undefined;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;

  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  EventEmitter.defaultMaxListeners = 10;

  EventEmitter.init = function() {
    this.domain = null;
    if (EventEmitter.usingDomains) {
      // if there is an active domain, then attach to it.
      if (domain.active && !(this instanceof domain.Domain)) ;
    }

    if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
  };

  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n))
      throw new TypeError('"n" argument must be a positive number');
    this._maxListeners = n;
    return this;
  };

  function $getMaxListeners(that) {
    if (that._maxListeners === undefined)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  };

  // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.
  function emitNone(handler, isFn, self) {
    if (isFn)
      handler.call(self);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self);
    }
  }
  function emitOne(handler, isFn, self, arg1) {
    if (isFn)
      handler.call(self, arg1);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1);
    }
  }
  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn)
      handler.call(self, arg1, arg2);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2);
    }
  }
  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn)
      handler.call(self, arg1, arg2, arg3);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2, arg3);
    }
  }

  function emitMany(handler, isFn, self, args) {
    if (isFn)
      handler.apply(self, args);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].apply(self, args);
    }
  }

  EventEmitter.prototype.emit = function emit(type) {
    var er, handler, len, args, i, events, domain;
    var doError = (type === 'error');

    events = this._events;
    if (events)
      doError = (doError && events.error == null);
    else if (!doError)
      return false;

    domain = this.domain;

    // If there is no 'error' event listener then throw.
    if (doError) {
      er = arguments[1];
      if (domain) {
        if (!er)
          er = new Error('Uncaught, unspecified "error" event');
        er.domainEmitter = this;
        er.domain = domain;
        er.domainThrown = false;
        domain.emit('error', er);
      } else if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
      return false;
    }

    handler = events[type];

    if (!handler)
      return false;

    var isFn = typeof handler === 'function';
    len = arguments.length;
    switch (len) {
      // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;
      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;
      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;
      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
      // slower
      default:
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        emitMany(handler, isFn, this, args);
    }

    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;

    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');

    events = target._events;
    if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type,
                    listener.listener ? listener.listener : listener);

        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }

    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] = prepend ? [listener, existing] :
                                            [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      }

      // Check for listener leak
      if (!existing.warned) {
        m = $getMaxListeners(target);
        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' +
                              existing.length + ' ' + type + ' listeners added. ' +
                              'Use emitter.setMaxListeners() to increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          emitWarning(w);
        }
      }
    }

    return target;
  }
  function emitWarning(e) {
    typeof console.warn === 'function' ? console.warn(e) : console.log(e);
  }
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };

  function _onceWrap(target, type, listener) {
    var fired = false;
    function g() {
      target.removeListener(type, g);
      if (!fired) {
        fired = true;
        listener.apply(target, arguments);
      }
    }
    g.listener = listener;
    return g;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };

  // emits a 'removeListener' event iff the listener was removed
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;

        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');

        events = this._events;
        if (!events)
          return this;

        list = events[type];
        if (!list)
          return this;

        if (list === listener || (list.listener && list.listener === listener)) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          position = -1;

          for (i = list.length; i-- > 0;) {
            if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          if (position < 0)
            return this;

          if (list.length === 1) {
            list[0] = undefined;
            if (--this._eventsCount === 0) {
              this._events = new EventHandlers();
              return this;
            } else {
              delete events[type];
            }
          } else {
            spliceOne(list, position);
          }

          if (events.removeListener)
            this.emit('removeListener', type, originalListener || listener);
        }

        return this;
      };

  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events;

        events = this._events;
        if (!events)
          return this;

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
          if (arguments.length === 0) {
            this._events = new EventHandlers();
            this._eventsCount = 0;
          } else if (events[type]) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else
              delete events[type];
          }
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          for (var i = 0, key; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = new EventHandlers();
          this._eventsCount = 0;
          return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          do {
            this.removeListener(type, listeners[listeners.length - 1]);
          } while (listeners[0]);
        }

        return this;
      };

  EventEmitter.prototype.listeners = function listeners(type) {
    var evlistener;
    var ret;
    var events = this._events;

    if (!events)
      ret = [];
    else {
      evlistener = events[type];
      if (!evlistener)
        ret = [];
      else if (typeof evlistener === 'function')
        ret = [evlistener.listener || evlistener];
      else
        ret = unwrapListeners(evlistener);
    }

    return ret;
  };

  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events = this._events;

    if (events) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  };

  // About 1.5x faster than the two-arg version of Array#splice().
  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
      list[i] = list[k];
    list.pop();
  }

  function arrayClone(arr, i) {
    var copy = new Array(i);
    while (i--)
      copy[i] = arr[i];
    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }

  var global$1 = (typeof global !== "undefined" ? global :
              typeof self !== "undefined" ? self :
              typeof window !== "undefined" ? window : {});

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;
  function init () {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray (b64) {
    if (!inited) {
      init();
    }
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

    // base64 is 4/3 + up to two characters of the original data
    arr = new Arr(len * 3 / 4 - placeHolders);

    // if there are placeholders, only get up to the last complete 4 chars
    l = placeHolders > 0 ? len - 4 : len;

    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 0xFF;
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr
  }

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
  }

  function encodeChunk (uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output.push(tripletToBase64(tmp));
    }
    return output.join('')
  }

  function fromByteArray (uint8) {
    if (!inited) {
      init();
    }
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[(tmp << 4) & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
      output += lookup[tmp >> 10];
      output += lookup[(tmp >> 4) & 0x3F];
      output += lookup[(tmp << 2) & 0x3F];
      output += '=';
    }

    parts.push(output);

    return parts.join('')
  }

  function read (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  }

  function write (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;

  var isArray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  var INSPECT_MAX_BYTES = 50;

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */
  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
    ? global$1.TYPED_ARRAY_SUPPORT
    : true;

  function kMaxLength () {
    return Buffer.TYPED_ARRAY_SUPPORT
      ? 0x7fffffff
      : 0x3fffffff
  }

  function createBuffer (that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length')
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }
      that.length = length;
    }

    return that
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer (arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length)
    }

    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error(
          'If encoding is specified then the first argument must be a string'
        )
      }
      return allocUnsafe(this, arg)
    }
    return from(this, arg, encodingOrOffset, length)
  }

  Buffer.poolSize = 8192; // not used by this implementation

  // TODO: Legacy, not needed anymore. Remove in next major version.
  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr
  };

  function from (that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number')
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length)
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset)
    }

    return fromObject(that, value)
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length)
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
  }

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number')
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative')
    }
  }

  function alloc (that, size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(that, size).fill(fill, encoding)
        : createBuffer(that, size).fill(fill)
    }
    return createBuffer(that, size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding)
  };

  function allocUnsafe (that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size)
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size)
  };

  function fromString (that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding')
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);

    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that
  }

  function fromArrayLike (that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that
  }

  function fromArrayBuffer (that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds')
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }
    return that
  }

  function fromObject (that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that
      }

      obj.copy(that, 0, 0, len);
      return that
    }

    if (obj) {
      if ((typeof ArrayBuffer !== 'undefined' &&
          obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0)
        }
        return fromArrayLike(that, obj)
      }

      if (obj.type === 'Buffer' && isArray(obj.data)) {
        return fromArrayLike(that, obj.data)
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
  }

  function checked (length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + kMaxLength().toString(16) + ' bytes')
    }
    return length | 0
  }
  Buffer.isBuffer = isBuffer;
  function internalIsBuffer (b) {
    return !!(b != null && b._isBuffer)
  }

  Buffer.compare = function compare (a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a === b) return 0

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  Buffer.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  };

  Buffer.concat = function concat (list, length) {
    if (!isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer.alloc(0)
    }

    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer
  };

  function byteLength (string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
        (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0

    // Use a for loop to avoid recursion
    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) return utf8ToBytes(string).length // assume utf8
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;

  function slowToString (encoding, start, end) {
    var loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return ''
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }

  // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.
  Buffer.prototype._isBuffer = true;

  function swap (b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16 () {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this
  };

  Buffer.prototype.swap32 = function swap32 () {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this
  };

  Buffer.prototype.swap64 = function swap64 () {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this
  };

  Buffer.prototype.toString = function toString () {
    var length = this.length | 0;
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  };

  Buffer.prototype.equals = function equals (b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer.compare(this, b) === 0
  };

  Buffer.prototype.inspect = function inspect () {
    var str = '';
    var max = INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }
    return '<Buffer ' + str + '>'
  };

  Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer')
    }

    if (start === undefined) {
      start = 0;
    }
    if (end === undefined) {
      end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
      thisStart = 0;
    }
    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0

    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);

    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset;  // Coerce to Number.
    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1);
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]
      if (Buffer.TYPED_ARRAY_SUPPORT &&
          typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Buffer')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read$$1 (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read$$1(arr, i + j) !== read$$1(val, j)) {
            found = false;
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  };

  Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  };

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }

    // must be an even number of digits
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i
      buf[offset + i] = parsed;
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function latin1Write (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Buffer.prototype.write = function write$$1 (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    // legacy write(string, encoding, offset, length) - remove in v0.13
    } else {
      throw new Error(
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8';

    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
          return asciiWrite(this, string, offset, length)

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  };

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf)
    } else {
      return fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];

    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
        : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray (codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    var len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    var out = '';
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res
  }

  Buffer.prototype.slice = function slice (start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;

    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf
  };

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val
  };

  Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val
  };

  Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset]
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | (this[offset + 1] << 8)
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return (this[offset] << 8) | this[offset + 1]
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  };

  Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  };

  Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  };

  Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  };

  Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4)
  };

  Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4)
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8)
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8)
  };

  function checkInt (buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = (value & 0xff);
    return offset + 1
  };

  function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24);
      this[offset + 2] = (value >>> 16);
      this[offset + 1] = (value >>> 8);
      this[offset] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = (value & 0xff);
    return offset + 1
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
      this[offset + 2] = (value >>> 16);
      this[offset + 3] = (value >>> 24);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }
    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  };

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }
    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  };

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, start + len),
        targetStart
      );
    }

    return len
  };

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    var i;
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val)
        ? val
        : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this
  };

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str
  }

  function stringtrim (str) {
    if (str.trim) return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          }

          // valid lead
          leadSurrogate = codePoint;

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null;

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray
  }


  function base64ToBytes (str) {
    return toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i];
    }
    return i
  }

  function isnan (val) {
    return val !== val // eslint-disable-line no-self-compare
  }


  // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
  }

  function isFastBuffer (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
  }

  if (typeof global$1.setTimeout === 'function') ;
  if (typeof global$1.clearTimeout === 'function') ;

  // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
  var performance = global$1.performance || {};
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() };

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var componentEmitter = createCommonjsModule(function (module) {
  /**
   * Expose `Emitter`.
   */

  {
    module.exports = Emitter;
  }

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.on =
  Emitter.prototype.addEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
      .push(fn);
    return this;
  };

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.once = function(event, fn){
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.off =
  Emitter.prototype.removeListener =
  Emitter.prototype.removeAllListeners =
  Emitter.prototype.removeEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};

    // all
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }

    // specific event
    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this;

    // remove all handlers
    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    }

    // remove specific handler
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    return this;
  };

  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */

  Emitter.prototype.emit = function(event){
    this._callbacks = this._callbacks || {};
    var args = [].slice.call(arguments, 1)
      , callbacks = this._callbacks['$' + event];

    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };

  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */

  Emitter.prototype.listeners = function(event){
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };

  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */

  Emitter.prototype.hasListeners = function(event){
    return !! this.listeners(event).length;
  };
  });

  /**
   * Check if `obj` is an object.
   *
   * @param {Object} obj
   * @return {Boolean}
   * @api private
   */

  function isObject(obj) {
    return null !== obj && 'object' === typeof obj;
  }

  var isObject_1 = isObject;

  /**
   * Module of mixed-in functions shared between node and client code
   */


  /**
   * Expose `RequestBase`.
   */

  var requestBase = RequestBase;

  /**
   * Initialize a new `RequestBase`.
   *
   * @api public
   */

  function RequestBase(obj) {
    if (obj) return mixin(obj);
  }

  /**
   * Mixin the prototype properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (const key in RequestBase.prototype) {
      obj[key] = RequestBase.prototype[key];
    }
    return obj;
  }

  /**
   * Clear previous timeout.
   *
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.clearTimeout = function _clearTimeout(){
    clearTimeout(this._timer);
    clearTimeout(this._responseTimeoutTimer);
    delete this._timer;
    delete this._responseTimeoutTimer;
    return this;
  };

  /**
   * Override default response body parser
   *
   * This function will be called to convert incoming data into request.body
   *
   * @param {Function}
   * @api public
   */

  RequestBase.prototype.parse = function parse(fn){
    this._parser = fn;
    return this;
  };

  /**
   * Set format of binary response body.
   * In browser valid formats are 'blob' and 'arraybuffer',
   * which return Blob and ArrayBuffer, respectively.
   *
   * In Node all values result in Buffer.
   *
   * Examples:
   *
   *      req.get('/')
   *        .responseType('blob')
   *        .end(callback);
   *
   * @param {String} val
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.responseType = function(val){
    this._responseType = val;
    return this;
  };

  /**
   * Override default request body serializer
   *
   * This function will be called to convert data set via .send or .attach into payload to send
   *
   * @param {Function}
   * @api public
   */

  RequestBase.prototype.serialize = function serialize(fn){
    this._serializer = fn;
    return this;
  };

  /**
   * Set timeouts.
   *
   * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
   * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
   *
   * Value of 0 or false means no timeout.
   *
   * @param {Number|Object} ms or {response, deadline}
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.timeout = function timeout(options){
    if (!options || 'object' !== typeof options) {
      this._timeout = options;
      this._responseTimeout = 0;
      return this;
    }

    for(const option in options) {
      switch(option) {
        case 'deadline':
          this._timeout = options.deadline;
          break;
        case 'response':
          this._responseTimeout = options.response;
          break;
        default:
          console.warn("Unknown timeout option", option);
      }
    }
    return this;
  };

  /**
   * Set number of retry attempts on error.
   *
   * Failed requests will be retried 'count' times if timeout or err.code >= 500.
   *
   * @param {Number} count
   * @param {Function} [fn]
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.retry = function retry(count, fn){
    // Default to 1 if no count passed or true
    if (arguments.length === 0 || count === true) count = 1;
    if (count <= 0) count = 0;
    this._maxRetries = count;
    this._retries = 0;
    this._retryCallback = fn;
    return this;
  };

  const ERROR_CODES = [
    'ECONNRESET',
    'ETIMEDOUT',
    'EADDRINFO',
    'ESOCKETTIMEDOUT'
  ];

  /**
   * Determine if a request should be retried.
   * (Borrowed from segmentio/superagent-retry)
   *
   * @param {Error} err
   * @param {Response} [res]
   * @returns {Boolean}
   */
  RequestBase.prototype._shouldRetry = function(err, res) {
    if (!this._maxRetries || this._retries++ >= this._maxRetries) {
      return false;
    }
    if (this._retryCallback) {
      try {
        const override = this._retryCallback(err, res);
        if (override === true) return true;
        if (override === false) return false;
        // undefined falls back to defaults
      } catch(e) {
        console.error(e);
      }
    }
    if (res && res.status && res.status >= 500 && res.status != 501) return true;
    if (err) {
      if (err.code && ~ERROR_CODES.indexOf(err.code)) return true;
      // Superagent timeout
      if (err.timeout && err.code == 'ECONNABORTED') return true;
      if (err.crossDomain) return true;
    }
    return false;
  };

  /**
   * Retry request
   *
   * @return {Request} for chaining
   * @api private
   */

  RequestBase.prototype._retry = function() {

    this.clearTimeout();

    // node
    if (this.req) {
      this.req = null;
      this.req = this.request();
    }

    this._aborted = false;
    this.timedout = false;

    return this._end();
  };

  /**
   * Promise support
   *
   * @param {Function} resolve
   * @param {Function} [reject]
   * @return {Request}
   */

  RequestBase.prototype.then = function then(resolve, reject) {
    if (!this._fullfilledPromise) {
      const self = this;
      if (this._endCalled) {
        console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
      }
      this._fullfilledPromise = new Promise((innerResolve, innerReject) => {
        self.on('error', innerReject);
        self.end((err, res) => {
          if (err) innerReject(err);
          else innerResolve(res);
        });
      });
    }
    return this._fullfilledPromise.then(resolve, reject);
  };

  RequestBase.prototype['catch'] = function(cb) {
    return this.then(undefined, cb);
  };

  /**
   * Allow for extension
   */

  RequestBase.prototype.use = function use(fn) {
    fn(this);
    return this;
  };

  RequestBase.prototype.ok = function(cb) {
    if ('function' !== typeof cb) throw Error("Callback required");
    this._okCallback = cb;
    return this;
  };

  RequestBase.prototype._isResponseOK = function(res) {
    if (!res) {
      return false;
    }

    if (this._okCallback) {
      return this._okCallback(res);
    }

    return res.status >= 200 && res.status < 300;
  };

  /**
   * Get request header `field`.
   * Case-insensitive.
   *
   * @param {String} field
   * @return {String}
   * @api public
   */

  RequestBase.prototype.get = function(field){
    return this._header[field.toLowerCase()];
  };

  /**
   * Get case-insensitive header `field` value.
   * This is a deprecated internal API. Use `.get(field)` instead.
   *
   * (getHeader is no longer used internally by the superagent code base)
   *
   * @param {String} field
   * @return {String}
   * @api private
   * @deprecated
   */

  RequestBase.prototype.getHeader = RequestBase.prototype.get;

  /**
   * Set header `field` to `val`, or multiple fields with one object.
   * Case-insensitive.
   *
   * Examples:
   *
   *      req.get('/')
   *        .set('Accept', 'application/json')
   *        .set('X-API-Key', 'foobar')
   *        .end(callback);
   *
   *      req.get('/')
   *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
   *        .end(callback);
   *
   * @param {String|Object} field
   * @param {String} val
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.set = function(field, val){
    if (isObject_1(field)) {
      for (const key in field) {
        this.set(key, field[key]);
      }
      return this;
    }
    this._header[field.toLowerCase()] = val;
    this.header[field] = val;
    return this;
  };

  /**
   * Remove header `field`.
   * Case-insensitive.
   *
   * Example:
   *
   *      req.get('/')
   *        .unset('User-Agent')
   *        .end(callback);
   *
   * @param {String} field
   */
  RequestBase.prototype.unset = function(field){
    delete this._header[field.toLowerCase()];
    delete this.header[field];
    return this;
  };

  /**
   * Write the field `name` and `val`, or multiple fields with one object
   * for "multipart/form-data" request bodies.
   *
   * ``` js
   * request.post('/upload')
   *   .field('foo', 'bar')
   *   .end(callback);
   *
   * request.post('/upload')
   *   .field({ foo: 'bar', baz: 'qux' })
   *   .end(callback);
   * ```
   *
   * @param {String|Object} name
   * @param {String|Blob|File|Buffer|fs.ReadStream} val
   * @return {Request} for chaining
   * @api public
   */
  RequestBase.prototype.field = function(name, val) {
    // name should be either a string or an object.
    if (null === name || undefined === name) {
      throw new Error('.field(name, val) name can not be empty');
    }

    if (this._data) {
      throw new Error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
    }

    if (isObject_1(name)) {
      for (const key in name) {
        this.field(key, name[key]);
      }
      return this;
    }

    if (Array.isArray(val)) {
      for (const i in val) {
        this.field(name, val[i]);
      }
      return this;
    }

    // val should be defined now
    if (null === val || undefined === val) {
      throw new Error('.field(name, val) val can not be empty');
    }
    if ('boolean' === typeof val) {
      val = '' + val;
    }
    this._getFormData().append(name, val);
    return this;
  };

  /**
   * Abort the request, and clear potential timeout.
   *
   * @return {Request}
   * @api public
   */
  RequestBase.prototype.abort = function(){
    if (this._aborted) {
      return this;
    }
    this._aborted = true;
    this.xhr && this.xhr.abort(); // browser
    this.req && this.req.abort(); // node
    this.clearTimeout();
    this.emit('abort');
    return this;
  };

  RequestBase.prototype._auth = function(user, pass, options, base64Encoder) {
    switch (options.type) {
      case 'basic':
        this.set('Authorization', `Basic ${base64Encoder(`${user}:${pass}`)}`);
        break;

      case 'auto':
        this.username = user;
        this.password = pass;
        break;

      case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
        this.set('Authorization', `Bearer ${user}`);
        break;
    }
    return this;
  };

  /**
   * Enable transmission of cookies with x-domain requests.
   *
   * Note that for this to work the origin must not be
   * using "Access-Control-Allow-Origin" with a wildcard,
   * and also must set "Access-Control-Allow-Credentials"
   * to "true".
   *
   * @api public
   */

  RequestBase.prototype.withCredentials = function(on) {
    // This is browser-only functionality. Node side is no-op.
    if (on == undefined) on = true;
    this._withCredentials = on;
    return this;
  };

  /**
   * Set the max redirects to `n`. Does noting in browser XHR implementation.
   *
   * @param {Number} n
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.redirects = function(n){
    this._maxRedirects = n;
    return this;
  };

  /**
   * Maximum size of buffered response body, in bytes. Counts uncompressed size.
   * Default 200MB.
   *
   * @param {Number} n
   * @return {Request} for chaining
   */
  RequestBase.prototype.maxResponseSize = function(n){
    if ('number' !== typeof n) {
      throw TypeError("Invalid argument");
    }
    this._maxResponseSize = n;
    return this;
  };

  /**
   * Convert to a plain javascript object (not JSON string) of scalar properties.
   * Note as this method is designed to return a useful non-this value,
   * it cannot be chained.
   *
   * @return {Object} describing method, url, and data of this request
   * @api public
   */

  RequestBase.prototype.toJSON = function() {
    return {
      method: this.method,
      url: this.url,
      data: this._data,
      headers: this._header,
    };
  };

  /**
   * Send `data` as the request body, defaulting the `.type()` to "json" when
   * an object is given.
   *
   * Examples:
   *
   *       // manual json
   *       request.post('/user')
   *         .type('json')
   *         .send('{"name":"tj"}')
   *         .end(callback)
   *
   *       // auto json
   *       request.post('/user')
   *         .send({ name: 'tj' })
   *         .end(callback)
   *
   *       // manual x-www-form-urlencoded
   *       request.post('/user')
   *         .type('form')
   *         .send('name=tj')
   *         .end(callback)
   *
   *       // auto x-www-form-urlencoded
   *       request.post('/user')
   *         .type('form')
   *         .send({ name: 'tj' })
   *         .end(callback)
   *
   *       // defaults to x-www-form-urlencoded
   *      request.post('/user')
   *        .send('name=tobi')
   *        .send('species=ferret')
   *        .end(callback)
   *
   * @param {String|Object} data
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.send = function(data){
    const isObj = isObject_1(data);
    let type = this._header['content-type'];

    if (this._formData) {
      throw new Error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
    }

    if (isObj && !this._data) {
      if (Array.isArray(data)) {
        this._data = [];
      } else if (!this._isHost(data)) {
        this._data = {};
      }
    } else if (data && this._data && this._isHost(this._data)) {
      throw Error("Can't merge these send calls");
    }

    // merge
    if (isObj && isObject_1(this._data)) {
      for (const key in data) {
        this._data[key] = data[key];
      }
    } else if ('string' == typeof data) {
      // default to x-www-form-urlencoded
      if (!type) this.type('form');
      type = this._header['content-type'];
      if ('application/x-www-form-urlencoded' == type) {
        this._data = this._data
          ? `${this._data}&${data}`
          : data;
      } else {
        this._data = (this._data || '') + data;
      }
    } else {
      this._data = data;
    }

    if (!isObj || this._isHost(data)) {
      return this;
    }

    // default to json
    if (!type) this.type('json');
    return this;
  };

  /**
   * Sort `querystring` by the sort function
   *
   *
   * Examples:
   *
   *       // default order
   *       request.get('/user')
   *         .query('name=Nick')
   *         .query('search=Manny')
   *         .sortQuery()
   *         .end(callback)
   *
   *       // customized sort function
   *       request.get('/user')
   *         .query('name=Nick')
   *         .query('search=Manny')
   *         .sortQuery(function(a, b){
   *           return a.length - b.length;
   *         })
   *         .end(callback)
   *
   *
   * @param {Function} sort
   * @return {Request} for chaining
   * @api public
   */

  RequestBase.prototype.sortQuery = function(sort) {
    // _sort default to true but otherwise can be a function or boolean
    this._sort = typeof sort === 'undefined' ? true : sort;
    return this;
  };

  /**
   * Compose querystring to append to req.url
   *
   * @api private
   */
  RequestBase.prototype._finalizeQueryString = function(){
    const query = this._query.join('&');
    if (query) {
      this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
    }
    this._query.length = 0; // Makes the call idempotent

    if (this._sort) {
      const index = this.url.indexOf('?');
      if (index >= 0) {
        const queryArr = this.url.substring(index + 1).split('&');
        if ('function' === typeof this._sort) {
          queryArr.sort(this._sort);
        } else {
          queryArr.sort();
        }
        this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
      }
    }
  };

  // For backwards compat only
  RequestBase.prototype._appendQueryString = () => {console.trace("Unsupported");};

  /**
   * Invoke callback with timeout error.
   *
   * @api private
   */

  RequestBase.prototype._timeoutError = function(reason, timeout, errno){
    if (this._aborted) {
      return;
    }
    const err = new Error(`${reason + timeout}ms exceeded`);
    err.timeout = timeout;
    err.code = 'ECONNABORTED';
    err.errno = errno;
    this.timedout = true;
    this.abort();
    this.callback(err);
  };

  RequestBase.prototype._setTimeouts = function() {
    const self = this;

    // deadline
    if (this._timeout && !this._timer) {
      this._timer = setTimeout(() => {
        self._timeoutError('Timeout of ', self._timeout, 'ETIME');
      }, this._timeout);
    }
    // response timeout
    if (this._responseTimeout && !this._responseTimeoutTimer) {
      this._responseTimeoutTimer = setTimeout(() => {
        self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
      }, this._responseTimeout);
    }
  };

  /**
   * Return the mime type for the given `str`.
   *
   * @param {String} str
   * @return {String}
   * @api private
   */

  var type = str => str.split(/ *; */).shift();

  /**
   * Return header field parameters.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */

  var params = str => str.split(/ *; */).reduce((obj, str) => {
    const parts = str.split(/ *= */);
    const key = parts.shift();
    const val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});

  /**
   * Parse Link header fields.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */

  var parseLinks = str => str.split(/ *, */).reduce((obj, str) => {
    const parts = str.split(/ *; */);
    const url = parts[0].slice(1, -1);
    const rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});

  /**
   * Strip content related fields from `header`.
   *
   * @param {Object} header
   * @return {Object} header
   * @api private
   */

  var cleanHeader = (header, changesOrigin) => {
    delete header['content-type'];
    delete header['content-length'];
    delete header['transfer-encoding'];
    delete header['host'];
    // secuirty
    if (changesOrigin) {
      delete header['authorization'];
      delete header['cookie'];
    }
    return header;
  };

  var utils = {
  	type: type,
  	params: params,
  	parseLinks: parseLinks,
  	cleanHeader: cleanHeader
  };

  /**
   * Module dependencies.
   */



  /**
   * Expose `ResponseBase`.
   */

  var responseBase = ResponseBase;

  /**
   * Initialize a new `ResponseBase`.
   *
   * @api public
   */

  function ResponseBase(obj) {
    if (obj) return mixin$1(obj);
  }

  /**
   * Mixin the prototype properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin$1(obj) {
    for (const key in ResponseBase.prototype) {
      obj[key] = ResponseBase.prototype[key];
    }
    return obj;
  }

  /**
   * Get case-insensitive `field` value.
   *
   * @param {String} field
   * @return {String}
   * @api public
   */

  ResponseBase.prototype.get = function(field) {
    return this.header[field.toLowerCase()];
  };

  /**
   * Set header related properties:
   *
   *   - `.type` the content type without params
   *
   * A response of "Content-Type: text/plain; charset=utf-8"
   * will provide you with a `.type` of "text/plain".
   *
   * @param {Object} header
   * @api private
   */

  ResponseBase.prototype._setHeaderProperties = function(header){
      // TODO: moar!
      // TODO: make this a util

      // content-type
      const ct = header['content-type'] || '';
      this.type = utils.type(ct);

      // params
      const params = utils.params(ct);
      for (const key in params) this[key] = params[key];

      this.links = {};

      // links
      try {
          if (header.link) {
              this.links = utils.parseLinks(header.link);
          }
      } catch (err) {
          // ignore
      }
  };

  /**
   * Set flags such as `.ok` based on `status`.
   *
   * For example a 2xx response will give you a `.ok` of __true__
   * whereas 5xx will be __false__ and `.error` will be __true__. The
   * `.clientError` and `.serverError` are also available to be more
   * specific, and `.statusType` is the class of error ranging from 1..5
   * sometimes useful for mapping respond colors etc.
   *
   * "sugar" properties are also defined for common cases. Currently providing:
   *
   *   - .noContent
   *   - .badRequest
   *   - .unauthorized
   *   - .notAcceptable
   *   - .notFound
   *
   * @param {Number} status
   * @api private
   */

  ResponseBase.prototype._setStatusProperties = function(status){
      const type = status / 100 | 0;

      // status / class
      this.status = this.statusCode = status;
      this.statusType = type;

      // basics
      this.info = 1 == type;
      this.ok = 2 == type;
      this.redirect = 3 == type;
      this.clientError = 4 == type;
      this.serverError = 5 == type;
      this.error = (4 == type || 5 == type)
          ? this.toError()
          : false;

      // sugar
      this.created = 201 == status;
      this.accepted = 202 == status;
      this.noContent = 204 == status;
      this.badRequest = 400 == status;
      this.unauthorized = 401 == status;
      this.notAcceptable = 406 == status;
      this.forbidden = 403 == status;
      this.notFound = 404 == status;
      this.unprocessableEntity = 422 == status;
  };

  function Agent() {
    this._defaults = [];
  }

  ["use", "on", "once", "set", "query", "type", "accept", "auth", "withCredentials", "sortQuery", "retry", "ok", "redirects",
   "timeout", "buffer", "serialize", "parse", "ca", "key", "pfx", "cert"].forEach(fn => {
    /** Default setting for all requests from this agent */
    Agent.prototype[fn] = function(...args) {
      this._defaults.push({fn, args});
      return this;
    };
  });

  Agent.prototype._setDefaults = function(req) {
      this._defaults.forEach(def => {
        req[def.fn].apply(req, def.args);
      });
  };

  var agentBase = Agent;

  var client = createCommonjsModule(function (module, exports) {
  /**
   * Root reference for iframes.
   */

  let root;
  if (typeof window !== 'undefined') { // Browser window
    root = window;
  } else if (typeof self !== 'undefined') { // Web Worker
    root = self;
  } else { // Other environments
    console.warn("Using browser-only version of superagent in non-browser environment");
    root = commonjsGlobal;
  }







  /**
   * Noop.
   */

  function noop(){}
  /**
   * Expose `request`.
   */

  const request = exports = module.exports = function(method, url) {
    // callback
    if ('function' == typeof url) {
      return new exports.Request('GET', method).end(url);
    }

    // url first
    if (1 == arguments.length) {
      return new exports.Request('GET', method);
    }

    return new exports.Request(method, url);
  };

  exports.Request = Request;

  /**
   * Determine XHR.
   */

  request.getXHR = () => {
    if (root.XMLHttpRequest
        && (!root.location || 'file:' != root.location.protocol
            || !root.ActiveXObject)) {
      return new XMLHttpRequest;
    } else {
      try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
    }
    throw Error("Browser-only version of superagent could not find XHR");
  };

  /**
   * Removes leading and trailing whitespace, added to support IE.
   *
   * @param {String} s
   * @return {String}
   * @api private
   */

  const trim = ''.trim
    ? s => s.trim()
    : s => s.replace(/(^\s*|\s*$)/g, '');

  /**
   * Serialize the given `obj`.
   *
   * @param {Object} obj
   * @return {String}
   * @api private
   */

  function serialize(obj) {
    if (!isObject_1(obj)) return obj;
    const pairs = [];
    for (const key in obj) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
    }
    return pairs.join('&');
  }

  /**
   * Helps 'serialize' with serializing arrays.
   * Mutates the pairs array.
   *
   * @param {Array} pairs
   * @param {String} key
   * @param {Mixed} val
   */

  function pushEncodedKeyValuePair(pairs, key, val) {
    if (val != null) {
      if (Array.isArray(val)) {
        val.forEach(v => {
          pushEncodedKeyValuePair(pairs, key, v);
        });
      } else if (isObject_1(val)) {
        for(const subkey in val) {
          pushEncodedKeyValuePair(pairs, `${key}[${subkey}]`, val[subkey]);
        }
      } else {
        pairs.push(encodeURIComponent(key)
          + '=' + encodeURIComponent(val));
      }
    } else if (val === null) {
      pairs.push(encodeURIComponent(key));
    }
  }

  /**
   * Expose serialization method.
   */

  request.serializeObject = serialize;

  /**
    * Parse the given x-www-form-urlencoded `str`.
    *
    * @param {String} str
    * @return {Object}
    * @api private
    */

  function parseString(str) {
    const obj = {};
    const pairs = str.split('&');
    let pair;
    let pos;

    for (let i = 0, len = pairs.length; i < len; ++i) {
      pair = pairs[i];
      pos = pair.indexOf('=');
      if (pos == -1) {
        obj[decodeURIComponent(pair)] = '';
      } else {
        obj[decodeURIComponent(pair.slice(0, pos))] =
          decodeURIComponent(pair.slice(pos + 1));
      }
    }

    return obj;
  }

  /**
   * Expose parser.
   */

  request.parseString = parseString;

  /**
   * Default MIME type map.
   *
   *     superagent.types.xml = 'application/xml';
   *
   */

  request.types = {
    html: 'text/html',
    json: 'application/json',
    xml: 'text/xml',
    urlencoded: 'application/x-www-form-urlencoded',
    'form': 'application/x-www-form-urlencoded',
    'form-data': 'application/x-www-form-urlencoded'
  };

  /**
   * Default serialization map.
   *
   *     superagent.serialize['application/xml'] = function(obj){
   *       return 'generated xml here';
   *     };
   *
   */

  request.serialize = {
    'application/x-www-form-urlencoded': serialize,
    'application/json': JSON.stringify
  };

  /**
    * Default parsers.
    *
    *     superagent.parse['application/xml'] = function(str){
    *       return { object parsed from str };
    *     };
    *
    */

  request.parse = {
    'application/x-www-form-urlencoded': parseString,
    'application/json': JSON.parse
  };

  /**
   * Parse the given header `str` into
   * an object containing the mapped fields.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */

  function parseHeader(str) {
    const lines = str.split(/\r?\n/);
    const fields = {};
    let index;
    let line;
    let field;
    let val;

    for (let i = 0, len = lines.length; i < len; ++i) {
      line = lines[i];
      index = line.indexOf(':');
      if (index === -1) { // could be empty line, just skip it
        continue;
      }
      field = line.slice(0, index).toLowerCase();
      val = trim(line.slice(index + 1));
      fields[field] = val;
    }

    return fields;
  }

  /**
   * Check if `mime` is json or has +json structured syntax suffix.
   *
   * @param {String} mime
   * @return {Boolean}
   * @api private
   */

  function isJSON(mime) {
    // should match /json or +json
    // but not /json-seq
    return /[\/+]json($|[^-\w])/.test(mime);
  }

  /**
   * Initialize a new `Response` with the given `xhr`.
   *
   *  - set flags (.ok, .error, etc)
   *  - parse header
   *
   * Examples:
   *
   *  Aliasing `superagent` as `request` is nice:
   *
   *      request = superagent;
   *
   *  We can use the promise-like API, or pass callbacks:
   *
   *      request.get('/').end(function(res){});
   *      request.get('/', function(res){});
   *
   *  Sending data can be chained:
   *
   *      request
   *        .post('/user')
   *        .send({ name: 'tj' })
   *        .end(function(res){});
   *
   *  Or passed to `.send()`:
   *
   *      request
   *        .post('/user')
   *        .send({ name: 'tj' }, function(res){});
   *
   *  Or passed to `.post()`:
   *
   *      request
   *        .post('/user', { name: 'tj' })
   *        .end(function(res){});
   *
   * Or further reduced to a single call for simple cases:
   *
   *      request
   *        .post('/user', { name: 'tj' }, function(res){});
   *
   * @param {XMLHTTPRequest} xhr
   * @param {Object} options
   * @api private
   */

  function Response(req) {
    this.req = req;
    this.xhr = this.req.xhr;
    // responseText is accessible only if responseType is '' or 'text' and on older browsers
    this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
       ? this.xhr.responseText
       : null;
    this.statusText = this.req.xhr.statusText;
    let status = this.xhr.status;
    // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    if (status === 1223) {
      status = 204;
    }
    this._setStatusProperties(status);
    this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
    // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
    // getResponseHeader still works. so we get content-type even if getting
    // other headers fails.
    this.header['content-type'] = this.xhr.getResponseHeader('content-type');
    this._setHeaderProperties(this.header);

    if (null === this.text && req._responseType) {
      this.body = this.xhr.response;
    } else {
      this.body = this.req.method != 'HEAD'
        ? this._parseBody(this.text ? this.text : this.xhr.response)
        : null;
    }
  }

  responseBase(Response.prototype);

  /**
   * Parse the given body `str`.
   *
   * Used for auto-parsing of bodies. Parsers
   * are defined on the `superagent.parse` object.
   *
   * @param {String} str
   * @return {Mixed}
   * @api private
   */

  Response.prototype._parseBody = function(str) {
    let parse = request.parse[this.type];
    if (this.req._parser) {
      return this.req._parser(this, str);
    }
    if (!parse && isJSON(this.type)) {
      parse = request.parse['application/json'];
    }
    return parse && str && (str.length || str instanceof Object)
      ? parse(str)
      : null;
  };

  /**
   * Return an `Error` representative of this response.
   *
   * @return {Error}
   * @api public
   */

  Response.prototype.toError = function(){
    const req = this.req;
    const method = req.method;
    const url = req.url;

    const msg = `cannot ${method} ${url} (${this.status})`;
    const err = new Error(msg);
    err.status = this.status;
    err.method = method;
    err.url = url;

    return err;
  };

  /**
   * Expose `Response`.
   */

  request.Response = Response;

  /**
   * Initialize a new `Request` with the given `method` and `url`.
   *
   * @param {String} method
   * @param {String} url
   * @api public
   */

  function Request(method, url) {
    const self = this;
    this._query = this._query || [];
    this.method = method;
    this.url = url;
    this.header = {}; // preserves header name case
    this._header = {}; // coerces header names to lowercase
    this.on('end', () => {
      let err = null;
      let res = null;

      try {
        res = new Response(self);
      } catch(e) {
        err = new Error('Parser is unable to parse the response');
        err.parse = true;
        err.original = e;
        // issue #675: return the raw response if the response parsing fails
        if (self.xhr) {
          // ie9 doesn't have 'response' property
          err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
          // issue #876: return the http status code if the response parsing fails
          err.status = self.xhr.status ? self.xhr.status : null;
          err.statusCode = err.status; // backwards-compat only
        } else {
          err.rawResponse = null;
          err.status = null;
        }

        return self.callback(err);
      }

      self.emit('response', res);

      let new_err;
      try {
        if (!self._isResponseOK(res)) {
          new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
        }
      } catch(custom_err) {
        new_err = custom_err; // ok() callback can throw
      }

      // #1000 don't catch errors from the callback to avoid double calling it
      if (new_err) {
        new_err.original = err;
        new_err.response = res;
        new_err.status = res.status;
        self.callback(new_err, res);
      } else {
        self.callback(null, res);
      }
    });
  }

  /**
   * Mixin `Emitter` and `RequestBase`.
   */

  componentEmitter(Request.prototype);
  requestBase(Request.prototype);

  /**
   * Set Content-Type to `type`, mapping values from `request.types`.
   *
   * Examples:
   *
   *      superagent.types.xml = 'application/xml';
   *
   *      request.post('/')
   *        .type('xml')
   *        .send(xmlstring)
   *        .end(callback);
   *
   *      request.post('/')
   *        .type('application/xml')
   *        .send(xmlstring)
   *        .end(callback);
   *
   * @param {String} type
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.type = function(type){
    this.set('Content-Type', request.types[type] || type);
    return this;
  };

  /**
   * Set Accept to `type`, mapping values from `request.types`.
   *
   * Examples:
   *
   *      superagent.types.json = 'application/json';
   *
   *      request.get('/agent')
   *        .accept('json')
   *        .end(callback);
   *
   *      request.get('/agent')
   *        .accept('application/json')
   *        .end(callback);
   *
   * @param {String} accept
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.accept = function(type){
    this.set('Accept', request.types[type] || type);
    return this;
  };

  /**
   * Set Authorization field value with `user` and `pass`.
   *
   * @param {String} user
   * @param {String} [pass] optional in case of using 'bearer' as type
   * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.auth = function(user, pass, options){
    if (1 === arguments.length) pass = '';
    if (typeof pass === 'object' && pass !== null) { // pass is optional and can be replaced with options
      options = pass;
      pass = '';
    }
    if (!options) {
      options = {
        type: 'function' === typeof btoa ? 'basic' : 'auto',
      };
    }

    const encoder = string => {
      if ('function' === typeof btoa) {
        return btoa(string);
      }
      throw new Error('Cannot use basic auth, btoa is not a function');
    };

    return this._auth(user, pass, options, encoder);
  };

  /**
   * Add query-string `val`.
   *
   * Examples:
   *
   *   request.get('/shoes')
   *     .query('size=10')
   *     .query({ color: 'blue' })
   *
   * @param {Object|String} val
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.query = function(val){
    if ('string' != typeof val) val = serialize(val);
    if (val) this._query.push(val);
    return this;
  };

  /**
   * Queue the given `file` as an attachment to the specified `field`,
   * with optional `options` (or filename).
   *
   * ``` js
   * request.post('/upload')
   *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
   *   .end(callback);
   * ```
   *
   * @param {String} field
   * @param {Blob|File} file
   * @param {String|Object} options
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.attach = function(field, file, options){
    if (file) {
      if (this._data) {
        throw Error("superagent can't mix .send() and .attach()");
      }

      this._getFormData().append(field, file, options || file.name);
    }
    return this;
  };

  Request.prototype._getFormData = function(){
    if (!this._formData) {
      this._formData = new root.FormData();
    }
    return this._formData;
  };

  /**
   * Invoke the callback with `err` and `res`
   * and handle arity check.
   *
   * @param {Error} err
   * @param {Response} res
   * @api private
   */

  Request.prototype.callback = function(err, res){
    if (this._shouldRetry(err, res)) {
      return this._retry();
    }

    const fn = this._callback;
    this.clearTimeout();

    if (err) {
      if (this._maxRetries) err.retries = this._retries - 1;
      this.emit('error', err);
    }

    fn(err, res);
  };

  /**
   * Invoke callback with x-domain error.
   *
   * @api private
   */

  Request.prototype.crossDomainError = function(){
    const err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
    err.crossDomain = true;

    err.status = this.status;
    err.method = this.method;
    err.url = this.url;

    this.callback(err);
  };

  // This only warns, because the request is still likely to work
  Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
    console.warn("This is not supported in browser version of superagent");
    return this;
  };

  // This throws, because it can't send/receive data as expected
  Request.prototype.pipe = Request.prototype.write = () => {
    throw Error("Streaming is not supported in browser version of superagent");
  };

  /**
   * Check if `obj` is a host object,
   * we don't want to serialize these :)
   *
   * @param {Object} obj
   * @return {Boolean}
   * @api private
   */
  Request.prototype._isHost = function _isHost(obj) {
    // Native objects stringify to [object File], [object Blob], [object FormData], etc.
    return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
  };

  /**
   * Initiate request, invoking callback `fn(res)`
   * with an instanceof `Response`.
   *
   * @param {Function} fn
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.end = function(fn){
    if (this._endCalled) {
      console.warn("Warning: .end() was called twice. This is not supported in superagent");
    }
    this._endCalled = true;

    // store callback
    this._callback = fn || noop;

    // querystring
    this._finalizeQueryString();

    this._end();
  };

  Request.prototype._end = function() {
    if (this._aborted) return this.callback(Error("The request has been aborted even before .end() was called"));

    const self = this;
    const xhr = (this.xhr = request.getXHR());
    let data = this._formData || this._data;

    this._setTimeouts();

    // state change
    xhr.onreadystatechange = () => {
      const readyState = xhr.readyState;
      if (readyState >= 2 && self._responseTimeoutTimer) {
        clearTimeout(self._responseTimeoutTimer);
      }
      if (4 != readyState) {
        return;
      }

      // In IE9, reads to any property (e.g. status) off of an aborted XHR will
      // result in the error "Could not complete the operation due to error c00c023f"
      let status;
      try { status = xhr.status; } catch(e) { status = 0; }

      if (!status) {
        if (self.timedout || self._aborted) return;
        return self.crossDomainError();
      }
      self.emit('end');
    };

    // progress
    const handleProgress = (direction, e) => {
      if (e.total > 0) {
        e.percent = e.loaded / e.total * 100;
      }
      e.direction = direction;
      self.emit('progress', e);
    };
    if (this.hasListeners('progress')) {
      try {
        xhr.onprogress = handleProgress.bind(null, 'download');
        if (xhr.upload) {
          xhr.upload.onprogress = handleProgress.bind(null, 'upload');
        }
      } catch(e) {
        // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
        // Reported here:
        // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
      }
    }

    // initiate request
    try {
      if (this.username && this.password) {
        xhr.open(this.method, this.url, true, this.username, this.password);
      } else {
        xhr.open(this.method, this.url, true);
      }
    } catch (err) {
      // see #1149
      return this.callback(err);
    }

    // CORS
    if (this._withCredentials) xhr.withCredentials = true;

    // body
    if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
      // serialize stuff
      const contentType = this._header['content-type'];
      let serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
      if (!serialize && isJSON(contentType)) {
        serialize = request.serialize['application/json'];
      }
      if (serialize) data = serialize(data);
    }

    // set header fields
    for (const field in this.header) {
      if (null == this.header[field]) continue;

      if (this.header.hasOwnProperty(field))
        xhr.setRequestHeader(field, this.header[field]);
    }

    if (this._responseType) {
      xhr.responseType = this._responseType;
    }

    // send stuff
    this.emit('request', this);

    // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
    // We need null here if data is undefined
    xhr.send(typeof data !== 'undefined' ? data : null);
  };

  request.agent = () => new agentBase();

  ["GET", "POST", "OPTIONS", "PATCH", "PUT", "DELETE"].forEach(method => {
    agentBase.prototype[method.toLowerCase()] = function(url, fn) {
      const req = new request.Request(method, url);
      this._setDefaults(req);
      if (fn) {
        req.end(fn);
      }
      return req;
    };
  });

  agentBase.prototype.del = agentBase.prototype['delete'];

  /**
   * GET `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed|Function} [data] or fn
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  request.get = (url, data, fn) => {
    const req = request('GET', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.query(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * HEAD `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed|Function} [data] or fn
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  request.head = (url, data, fn) => {
    const req = request('HEAD', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.query(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * OPTIONS query to `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed|Function} [data] or fn
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  request.options = (url, data, fn) => {
    const req = request('OPTIONS', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * DELETE `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} [data]
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  function del(url, data, fn) {
    const req = request('DELETE', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  }

  request['del'] = del;
  request['delete'] = del;

  /**
   * PATCH `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} [data]
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  request.patch = (url, data, fn) => {
    const req = request('PATCH', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * POST `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} [data]
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  request.post = (url, data, fn) => {
    const req = request('POST', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * PUT `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed|Function} [data] or fn
   * @param {Function} [fn]
   * @return {Request}
   * @api public
   */

  request.put = (url, data, fn) => {
    const req = request('PUT', url);
    if ('function' == typeof data) (fn = data), (data = null);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };
  });
  var client_1 = client.Request;

  function blobToBuffer(blob, cb) {
    if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
      throw new Error('first argument must be a Blob');
    }

    if (typeof cb !== 'function') {
      throw new Error('second argument must be a function');
    }

    var reader = new FileReader();

    function onLoadEnd(e) {
      reader.removeEventListener('loadend', onLoadEnd, false);
      if (e.error) cb(e.error);else cb(null, new Buffer(reader.result));
    }

    reader.addEventListener('loadend', onLoadEnd, false);
    reader.readAsArrayBuffer(blob);
  }

  function _req(opts, resolve, reject) {
    var r = null;

    if ('GET' === opts.method) {
      r = client.get(opts.uri);
    } else if ('PUT' === opts.method) {
      r = client.put(opts.uri);
    } else {
      r = client.post(opts.uri);
    }

    if (undefined !== opts.headers) {
      var keys = Object.keys(opts.headers);
      keys.forEach(function (element) {
        r.set(element, opts.headers[element]);
      });
    }

    if (undefined !== opts.body) r.send(opts.body);
    r.end(function (error, res) {
      if (null != error) {
        //console.log("httprequest error", error.message);
        reject(error);
      } else {
        //console.log("httprequest response" , res.statusCode);
        var statusCode = res.status;

        if (res.status >= 200 && res.status < 300) {
          resolve({
            response: res,
            body: res.body
          });
        } else {
          var _error = new Error('Request Failed.\n' + "Status Code: ".concat(statusCode));

          _error['body'] = res.body;
          _error['statusCode'] = statusCode;
          _error['headers'] = res.headers;
          reject(_error);
        }
      }
    });
  }

  function req(opts) {
    return new Promise(function (resolve, reject) {
      var def = true;

      try {
      } catch (err) {
        def = false;
      }

      if (!def || !(opts.body instanceof Blob)) {
        _req(opts, resolve, reject);
      } else {
        blobToBuffer(opts.body, function (err, buffer) {
          if (null != err) reject(err);else {
            opts.body = buffer;

            _req(opts, resolve, reject);
          }
        });
      }
    });
  }

  var httprequest =
  /*#__PURE__*/
  function () {
    function httprequest() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      _classCallCheck(this, httprequest);

      this._opt = {};

      if (null != options) {
        _extends(this._opt, options);
      }
    }

    _createClass(httprequest, [{
      key: "get",
      value: function get(url) {
        this._opt.method = 'GET';
        this._opt.uri = url;
        return req(this._opt);
      }
    }, {
      key: "put",
      value: function put(url, body) {
        this._opt.method = 'PUT';
        this._opt.uri = url;
        this._opt.body = body;
        return req(this._opt);
      }
    }]);

    return httprequest;
  }();

  var httprequest_1 = httprequest;

  //import httprequest from './core/httprequest';

  /**
  * Utility method to format bytes into the most logical magnitude (KB, MB,
  * or GB).
  */

  /*function formatBytes(number) {
          var units = ['B', 'KB', 'MB', 'GB', 'TB'],
              //bytes = this,
              i;

          for (i = 0; bytes >= 1024 && i < 4; i++) {
              bytes /= 1024;
          }

          return bytes.toFixed(2) + units[i];
  }*/

  function upload(upl) {
    upl._started = true;
    var self = upl;
    setTimeout(function () {
      try {
        // Prevent range overflow
        if (self._range_end > self._file.size) {
          //self.range_end = self.file_size;
          throw 'Invalid Range On Upload!';
        } //console.log("re2 " + self._range_end + " " + self._range_start + " " + self._opt.chunk_size);


        var chunk = self._file[self._slice_method](self._range_start, self._range_end);

        var chunk_id = Math.ceil(self._range_start / self._opt.chunk_size);
        var opt = {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Range': 'bytes ' + self._range_start + '-' + self._range_end + '/' + self._file.size,
            'file-name': self._opt.name,
            'chunkid': chunk_id.toString()
          }
        };

        if (null != self._opt.owner) {
          opt.headers['owner'] = self._opt.owner;
        }

        if (null != self._opt.id) {
          opt.headers['fileid'] = self._opt.id;
        }

        var http = self.http_request(opt);
        http.put(self._opt.url, chunk).then(function ()
        /*res*/
        {
          //console.log("re3 " + self._range_end + " " + self._range_start + " " + self._opt.chunk_size);
          var n = new Number(self._range_start / self._opt.chunk_size / (self._file.size / self._opt.chunk_size) * 100);
          var sn = n.toFixed(2); // If the end range is already the same size as our file, we
          // can assume that our last chunk has been processed and exit
          // out of the function.

          if (self._range_end === self._file.size) {
            //console.log("upload completed"); 
            self._onUploadComplete();
          } else {
            // Update our ranges
            self._range_start = self._range_end;
            self._range_end = self._range_start + self._opt.chunk_size; // Prevent range overflow

            if (self._range_end > self._file.size) {
              self._range_end = self._file.size;
            } // Continue as long as we aren't paused


            if (!self._is_paused) {
              upload(self);
            }
          }

          self._onProgress(sn);
        }, function (err) {
          self._raise_error(err);
        });
      } catch (err) {
        self._raise_error(err);
      }
    }, 20);
  }

  var Uploader =
  /*#__PURE__*/
  function (_EventEmitter) {
    _inherits(Uploader, _EventEmitter);

    function Uploader(file, options) {
      var _this;

      _classCallCheck(this, Uploader);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Uploader).call(this));
      _this._file = file;
      _this._started = false;
      _this._range_end = 0;
      _this._range_start = 0;
      _this._is_paused = true;
      var opt = {
        url: '/upload',
        id: null,
        tag: null,
        name: file.name,
        owner: null,
        chunk_size: 1024 * 8 * 10,
        start_position: 0
      };
      if (null != options) _this._opt = _extends(opt, options);else _this._opt = opt;

      if ('mozSlice' in _this._file) {
        _this._slice_method = 'mozSlice';
      } else if ('webkitSlice' in _this._file) {
        _this._slice_method = 'webkitSlice';
      } else {
        _this._slice_method = 'slice';
      }

      _this._range_start = _this._opt.start_position;
      _this._range_end = _this._range_start + _this._opt.chunk_size;
      if (_this._range_end > _this._file.size) _this._range_end = _this._file.size; //console.log("re1 " + this._range_end + " " + this._range_start + " " + this._opt.chunk_size);
      //

      _this.status = 'initialized';
      return _this;
    }

    _createClass(Uploader, [{
      key: "http_request",
      value: function http_request(request_options) {
        if (undefined === this._opt.http_request) {
          return new httprequest_1(request_options);
        } else {
          return this._opt.http_request(request_options);
        }
      }
    }, {
      key: "name",
      value: function name() {
        return this._opt.name;
      }
    }, {
      key: "_raise_error",
      value: function _raise_error(err) {
        //console.log("uploader error: " + err.message);
        this._is_paused = true;
        this.status = 'error';
        this.emit('error', err);
      }
    }, {
      key: "_onProgress",
      value: function _onProgress(sn) {
        this.emit('progress', sn);
      }
    }, {
      key: "_onUploadComplete",
      value: function _onUploadComplete() {
        this.status = 'completed';
        this.emit('completed');
      }
    }, {
      key: "start",
      value: function start() {
        this._is_paused = false;
        this.emit('start');
        this.status = 'started';
        upload(this);
      }
    }, {
      key: "pause",
      value: function pause() {
        this._is_paused = true;
        this.status = 'paused';
      }
    }, {
      key: "paused",
      value: function paused() {
        return this._is_paused;
      }
    }, {
      key: "resume",
      value: function resume() {
        this._is_paused = false;
        this.status = 'started';
        upload(this);
      }
    }]);

    return Uploader;
  }(EventEmitter);

  var UploadManager =
  /*#__PURE__*/
  function (_EventEmitter2) {
    _inherits(UploadManager, _EventEmitter2);

    function UploadManager(options) {
      var _this2;

      _classCallCheck(this, UploadManager);

      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(UploadManager).call(this));
      var opt = {
        url: '/upload',
        chunk_size: 1024 * 8 * 10,
        start_position: 0
      };
      if (null != options) _this2._opt = _extends(opt, options);else _this2._opt = opt;
      _this2.uploader = {};
      return _this2;
    }

    _createClass(UploadManager, [{
      key: "setOptions",
      value: function setOptions(options) {
        this._opt = _extends(this._opt, options);
      }
    }, {
      key: "_raise_error",
      value: function _raise_error(err, kid) {
        this.emit('error', err, kid);
      }
    }, {
      key: "_onProgress",
      value: function _onProgress(sn, kid) {
        this.emit('progress', sn, kid);
      }
    }, {
      key: "_onUploadComplete",
      value: function _onUploadComplete(kid) {
        this.emit('completed', kid);
      }
    }, {
      key: "add",
      value: function add(file, id, options) {
        var _this3 = this;

        if (null != this.uploader[id]) {
          throw 'uploader already exist';
        }

        var op = _extends(this._opt, options);

        var kid = id;
        var up = new Uploader(file, op);
        up.on('completed', function () {
          _this3._onUploadComplete(kid);
        });
        up.on('error', function (err) {
          _this3._raise_error(err, kid);
        });
        up.on('progress', function (n) {
          _this3._onProgress(n, kid);
        });
        this.uploader[id] = up;
        return up;
      }
    }, {
      key: "start",
      value: function start(id) {
        if (null != this.uploader[id]) {
          throw 'invalid id';
        }

        this.uploader[id].start();
      }
    }, {
      key: "pause",
      value: function pause(id) {
        if (null != this.uploader[id]) {
          throw 'invalid id';
        }

        this.uploader[id].pause();
      }
    }, {
      key: "resume",
      value: function resume(id) {
        if (null != this.uploader[id]) {
          throw 'invalid id';
        }

        this.uploader[id].resume();
      }
    }, {
      key: "status",
      value: function status(id) {
        if (null != this.uploader[id]) {
          throw 'invalid id';
        }

        return this.uploader[id].status;
      }
    }, {
      key: "selectFiles",
      value: function selectFiles(e) {
        var files = e.files;

        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          var id = file.name;
          id = id.replace('.', '_');
          id = id.replace(' ', '_');
          id = id.replace('&', '_');
          id = id.replace(' ', '_');
          this.add(file, id);
          this.emit('new', id);
        }
      }
    }]);

    return UploadManager;
  }(EventEmitter);

  var client$1 = {
    default: Uploader,
    UploadManager: UploadManager
  };
  var client_1$1 = client$1.UploadManager;

  exports.default = client$1;
  exports.UploadManager = client_1$1;

  return exports;

}({}));
//# sourceMappingURL=chunk-uploader.js.map
