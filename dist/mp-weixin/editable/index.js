"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * @fileoverview editable 插件
 */
var config = require('./config');
var Parser = require('../parser');
var _require = require('./utils'),
  getHtmlByNodes = _require.getHtmlByNodes;
var _require2 = require('../mpEvent'),
  mpEventSend = _require2.mpEventSend;
function Editable(vm) {
  var _this = this;
  this.vm = vm;
  this.editHistory = []; // 历史记录
  this.editI = -1; // 历史记录指针
  vm._mask = []; // 蒙版被点击时进行的操作

  /**
   * @description 移动历史记录指针
   * @param {Number} num 移动距离
   */
  var move = function move(num) {
    var item = _this.editHistory[_this.editI + num];
    if (item) {
      _this.editI += num;
      vm.setData(_defineProperty({}, item.key, item.value));
    }
  };
  vm.undo = function () {
    return move(-1);
  }; // 撤销
  vm.redo = function () {
    return move(1);
  }; // 重做

  /**
   * @description 更新记录
   * @param {String} path 路径
   * @param {*} oldVal 旧值
   * @param {*} newVal 新值
   * @param {Boolean} set 是否更新到视图
   * @private
   */
  vm._editVal = function (path, oldVal, newVal, set) {
    // 当前指针后的内容去除
    while (_this.editI < _this.editHistory.length - 1) {
      _this.editHistory.pop();
    }

    // 最多存储 30 条操作记录
    while (_this.editHistory.length > 30) {
      _this.editHistory.pop();
      _this.editI--;
    }
    var last = _this.editHistory[_this.editHistory.length - 1];
    if (!last || last.key !== path) {
      if (last) {
        // 去掉上一次的新值
        _this.editHistory.pop();
        _this.editI--;
      }
      // 存入这一次的旧值
      _this.editHistory.push({
        key: path,
        value: oldVal
      });
      _this.editI++;
    }

    // 存入本次的新值
    _this.editHistory.push({
      key: path,
      value: newVal
    });
    _this.editI++;

    // 更新到视图
    if (set) {
      vm.setData(_defineProperty({}, path, newVal));
    }

    // 触发事件
    mpEventSend({
      name: 'editVal',
      data: {
        path: path,
        oldVal: oldVal,
        newVal: newVal,
        set: set
      }
    });
  };

  /**
   * @description 获取菜单项
   * @private
   */
  vm._getItem = function (node, up, down) {
    var items;
    var i;
    if (node === 'color') {
      return config.color;
    }
    if (node.name === 'img') {
      items = config.img.slice(0);
      if (!vm.getSrc) {
        i = items.indexOf('换图');
        if (i !== -1) {
          items.splice(i, 1);
        }
        i = items.indexOf('超链接');
        if (i !== -1) {
          items.splice(i, 1);
        }
        i = items.indexOf('预览图');
        if (i !== -1) {
          items.splice(i, 1);
        }
      }
      i = items.indexOf('禁用预览');
      if (i !== -1 && node.attrs.ignore) {
        items[i] = '启用预览';
      }
    } else if (node.name === 'a') {
      items = config.link.slice(0);
      if (!vm.getSrc) {
        i = items.indexOf('更换链接');
        if (i !== -1) {
          items.splice(i, 1);
        }
      }
    } else if (node.name === 'video' || node.name === 'audio') {
      items = config.media.slice(0);
      i = items.indexOf('封面');
      if (!vm.getSrc && i !== -1) {
        items.splice(i, 1);
      }
      i = items.indexOf('循环');
      if (node.attrs.loop && i !== -1) {
        items[i] = '不循环';
      }
      i = items.indexOf('自动播放');
      if (node.attrs.autoplay && i !== -1) {
        items[i] = '不自动播放';
      }
    } else if (node.name === 'card') {
      items = config.card.slice(0);
    } else {
      items = config.node.slice(0);
    }
    if (!up) {
      i = items.indexOf('上移');
      if (i !== -1) {
        items.splice(i, 1);
      }
    }
    if (!down) {
      i = items.indexOf('下移');
      if (i !== -1) {
        items.splice(i, 1);
      }
    }
    return items;
  };

  /**
   * @description 显示 tooltip
   * @param {object} obj
   * @private
   */
  vm._tooltip = function (obj) {
    vm.setData({
      tooltip: {
        top: obj.top,
        items: obj.items
      }
    });
    vm._tooltipcb = obj.success;
  };

  /**
   * @description 显示滚动条
   * @param {object} obj
   * @private
   */
  vm._slider = function (obj) {
    vm.setData({
      slider: {
        min: obj.min,
        max: obj.max,
        value: obj.value,
        top: obj.top
      }
    });
    vm._slideringcb = obj.changing;
    vm._slidercb = obj.change;
  };

  /**
   * @description 显示颜色选择
   * @param {object} obj
   * @private
   */
  vm._color = function (obj) {
    vm.setData({
      color: {
        items: obj.items,
        top: obj.top
      }
    });
    vm._colorcb = obj.success;
  };

  /**
   * @description 点击蒙版
   * @private
   */
  vm._maskTap = function () {
    // 隐藏所有悬浮窗
    while (this._mask.length) {
      this._mask.pop()();
    }
    var data = {};
    if (this.data.tooltip) {
      data.tooltip = null;
    }
    if (this.data.slider) {
      data.slider = null;
    }
    if (this.data.color) {
      data.color = null;
    }
    if (this.data.tooltip || this.data.slider || this.data.color) {
      this.setData(data);
    }
  };

  /**
   * @description 插入节点
   * @param {Object} node
   */
  function insert(node) {
    if (vm._edit) {
      vm._edit.insert(node);
    } else {
      var nodes = vm.data.nodes.slice(0);
      nodes.push(node);
      vm._editVal('nodes', vm.data.nodes, nodes, true);
    }
  }

  /**
   * @description 在光标处插入指定 html 内容
   * @param {String} html 内容
   */
  vm.insertHtml = function (html) {
    _this.inserting = true;
    var arr = new Parser(vm).parse(html);
    _this.inserting = undefined;
    for (var i = 0; i < arr.length; i++) {
      insert(arr[i]);
    }
  };

  /**
   * @description 在光标处插入图片
   */
  vm.insertImg = function () {
    vm.getSrc && vm.getSrc('img').then(function (src) {
      if (typeof src === 'string') {
        src = [src];
      }
      var parser = new Parser(vm);
      for (var i = 0; i < src.length; i++) {
        insert({
          name: 'img',
          attrs: {
            src: parser.getUrl(src[i]),
            style: parser.tagStyle.img
          }
        });
      }
    })["catch"](function () {});
  };

  /**
   * @description 在光标处插入一个链接
   */
  vm.insertLink = function () {
    vm.getSrc && vm.getSrc('link').then(function (url) {
      insert({
        name: 'a',
        attrs: {
          href: url
        },
        children: [{
          type: 'text',
          text: url
        }]
      });
    })["catch"](function () {});
  };

  /**
   * @description 在光标处插入一个表格
   * @param {Number} rows 行数
   * @param {Number} cols 列数
   */
  vm.insertTable = function (rows, cols) {
    var table = {
      name: 'table',
      attrs: {
        style: 'display:table;width:100%;margin:10px 0;text-align:center;border-spacing:0;border-collapse:collapse;border:1px solid gray'
      },
      children: []
    };
    for (var i = 0; i < rows; i++) {
      var tr = {
        name: 'tr',
        attrs: {},
        children: []
      };
      for (var j = 0; j < cols; j++) {
        tr.children.push({
          name: 'td',
          attrs: {
            style: 'padding:2px;border:1px solid gray'
          },
          children: [{
            type: 'text',
            text: ''
          }]
        });
      }
      table.children.push(tr);
    }
    insert(table);
  };

  /**
   * @description 插入视频/音频
   * @param {Object} node
   */
  function insertMedia(node) {
    if (typeof node.src === 'string') {
      node.src = [node.src];
    }
    var parser = new Parser(vm);
    // 拼接主域名
    for (var i = 0; i < node.src.length; i++) {
      node.src[i] = parser.getUrl(node.src[i]);
    }
    insert({
      name: 'div',
      attrs: {
        style: 'text-align:center'
      },
      children: [node]
    });
  }

  /**
   * @description 在光标处插入一个视频
   */
  vm.insertVideo = function () {
    vm.getSrc && vm.getSrc('video').then(function (src) {
      insertMedia({
        name: 'video',
        attrs: {
          controls: 'T'
        },
        src: src
      });
    })["catch"](function () {});
  };

  /**
   * @description 在光标处插入一个音频
   */
  vm.insertAudio = function () {
    vm.getSrc && vm.getSrc('audio').then(function (attrs) {
      var src;
      if (attrs.src) {
        src = attrs.src;
        attrs.src = undefined;
      } else {
        src = attrs;
        attrs = {};
      }
      attrs.controls = 'T';
      insertMedia({
        name: 'audio',
        attrs: attrs,
        src: src
      });
    })["catch"](function () {});
  };

  /**
   * @description 在光标处插入一段文本
   */
  vm.insertText = function () {
    insert({
      name: 'p',
      attrs: {},
      children: [{
        type: 'text',
        text: ''
      }]
    });
  };

  /**
   * @description 清空内容
   */
  vm.clear = function () {
    vm._maskTap();
    vm._edit = undefined;
    vm.setData({
      nodes: [{
        name: 'p',
        attrs: {},
        children: [{
          type: 'text',
          text: ''
        }]
      }]
    });
  };

  /**
   * @description 获取编辑后的 html
   */
  vm.getContent = function () {
    var html = getHtmlByNodes(vm.data.nodes);
    // 其他插件处理
    for (var i = vm.plugins.length; i--;) {
      if (vm.plugins[i].onGetContent) {
        html = vm.plugins[i].onGetContent(html) || html;
      }
    }
    return html;
  };
}
Editable.prototype.onUpdate = function (content, config) {
  var _this2 = this;
  if (this.vm.data.editable) {
    this.vm._maskTap();
    config.entities.amp = '&';
    if (!this.inserting) {
      this.vm._edit = undefined;
      if (!content) {
        setTimeout(function () {
          _this2.vm.setData({
            nodes: [{
              name: 'p',
              attrs: {},
              children: [{
                type: 'text',
                text: ''
              }]
            }]
          });
        }, 0);
      }
    }
  }
};
Editable.prototype.onParse = function (node) {
  // 空白单元格可编辑
  if (this.vm.data.editable && (node.name === 'td' || node.name === 'th') && !this.vm.getText(node.children)) {
    node.children.push({
      type: 'text',
      text: ''
    });
  }
};
module.exports = Editable;