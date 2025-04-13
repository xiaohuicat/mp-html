"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// EventChannel.js
var EventChannel = /*#__PURE__*/function () {
  function EventChannel() {
    _classCallCheck(this, EventChannel);
    this.listeners = {};
  }

  // 绑定事件（确保每个事件只有一个回调）
  return _createClass(EventChannel, [{
    key: "on",
    value: function on(event, callback) {
      this.listeners[event] = [callback]; // 仅保存一个回调
    }

    // 触发事件
  }, {
    key: "emit",
    value: function emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(function (callback) {
          return callback(data);
        });
      }
    }

    // 解除事件监听
  }, {
    key: "off",
    value: function off(event, callback) {
      if (this.listeners[event]) {
        var index = this.listeners[event].indexOf(callback);
        if (index !== -1) {
          this.listeners[event].splice(index, 1);
        }
      }
    }
  }]);
}();
var channel = new EventChannel();
var mpEventWatch = function mpEventWatch(callback) {
  channel.on('channel', callback);
};
var mpEventSend = function mpEventSend(data) {
  channel.emit('channel', data);
};
var mpEventOff = function mpEventOff() {
  channel.off('channel');
};
module.exports = {
  mpEventSend: mpEventSend,
  mpEventWatch: mpEventWatch,
  mpEventOff: mpEventOff
};