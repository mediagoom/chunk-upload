'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var superagent = _interopDefault(require('superagent'));
var events = _interopDefault(require('events'));

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
    r = superagent.get(opts.uri);
  } else if ('PUT' === opts.method) {
    r = superagent.put(opts.uri);
  } else {
    r = superagent.post(opts.uri);
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

    if (null != process) {
      if (null != process.env) if (null != process.env.http_proxy) this._opt.proxy = process.env.http_proxy;
    }

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
}(events);

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
}(events);

var client = {
  default: Uploader,
  UploadManager: UploadManager
};
var client_1 = client.UploadManager;

exports.default = client;
exports.UploadManager = client_1;
//# sourceMappingURL=index.js.map
