"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Parser = require('../parser');
function getTop(e) {
  var top;
  // #ifndef MP-ALIPAY
  top = e.detail.y;
  // #endif
  // #ifdef MP-ALIPAY

  // #endif
  if (top - e.currentTarget.offsetTop < 150 || top < 600) {
    top = e.currentTarget.offsetTop;
  }
  if (top < 30) {
    top += 70;
  }
  return top - 30;
} /**
  * @fileoverview 递归子组件，用于显示节点树
  */
Component({
  data: {
    ctrl: {},
    // 控制信号
    // #ifdef MP-WEIXIN
    isiOS: wx.getSystemInfoSync().system.includes('iOS')
    // #endif
  },
  properties: {
    childs: Array,
    // 子节点列表
    opts: Array // 设置 [是否开启懒加载, 加载中占位图, 错误占位图, 是否使用长按菜单]
  },
  options: {
    addGlobalClass: true
  },
  // #ifndef MP-TOUTIAO
  attached: function attached() {
    // #ifndef MP-ALIPAY
    this.triggerEvent('add', this, {
      bubbles: true,
      composed: true
    });
    // #endif
    // #ifdef MP-ALIPAY

    // #endif
  },
  // #endif
  detached: function detached() {
    if (this.root && this.root._edit === this) {
      this.root._edit = undefined;
    }
  },
  methods: {
    editStart: function editStart(e) {
      var _this = this;
      if (this.data.opts[5]) {
        var i = e.currentTarget.dataset.i;
        if (!this.data.ctrl['e' + i] && this.data.opts[5] !== 'simple') {
          // 显示虚线框
          this.setData(_defineProperty({}, 'ctrl.e' + i, 1));
          // 点击其他地方则取消虚线框
          setTimeout(function () {
            _this.root._mask.push(function () {
              _this.setData(_defineProperty({}, 'ctrl.e' + i, 0));
            });
          }, 50);
          this.root._edit = this;
          this.i = i;
          this.cursor = this.getNode(i).text.length;
        } else {
          if (this.data.opts[5] === 'simple') {
            this.root._edit = this;
            this.i = i;
            this.cursor = this.getNode(i).text.length;
          }
          this.root._mask.pop();
          this.root._maskTap();
          // 将 text 转为 textarea
          this.setData(_defineProperty({}, 'ctrl.e' + i, 2));
          // 延时对焦，避免高度错误
          setTimeout(function () {
            _this.setData(_defineProperty({}, 'ctrl.e' + i, 3));
          }, 50);
        }
      }
    },
    editInput: function editInput(e) {
      var i = e.target.dataset.i;
      // 替换连续空格
      var value = e.detail.value.replace(/ {2,}/, function ($) {
        var res = '\xa0';
        for (var _i = 1; _i < $.length; _i++) {
          res += '\xa0';
        }
        return res;
      });
      this.root._editVal('nodes[' + (this.data.opts[7] + i).replace(/_/g, '].children[') + '].text', this.getNode(i).text, value); // 记录编辑历史
      this.cursor = e.detail.cursor;
    },
    editEnd: function editEnd(e) {
      var i = e.target.dataset.i;
      // 更新到视图
      this.setData(_defineProperty({}, 'ctrl.e' + i, 0));
      this.root.setData(_defineProperty({}, 'nodes[' + (this.data.opts[7] + i).replace(/_/g, '].children[') + '].text', e.detail.value.replace(/ {2}/g, '\xa0 ')));
      if (e.detail.cursor !== undefined) {
        this.cursor = e.detail.cursor;
      }
    },
    insert: function insert(node) {
      var _this2 = this;
      setTimeout(function () {
        var arr = _this2.i.split('_');
        var i = parseInt(arr.pop());
        var path = arr.join('_');
        var children = path ? _this2.getNode(path).children : _this2.data.childs;
        var childs = children.slice(0);
        if (!childs[i]) {
          childs.push(node);
        } else if (childs[i].text) {
          // 在文本中插入
          var text = childs[i].text;
          if (node.type === 'text') {
            if (_this2.cursor) {
              childs[i].text = text.substring(0, _this2.cursor) + node.text + text.substring(_this2.cursor);
            } else {
              childs[i].text += node.text;
            }
          } else {
            var list = [];
            if (_this2.cursor) {
              list.push({
                type: 'text',
                text: text.substring(0, _this2.cursor)
              });
            }
            list.push(node);
            if (_this2.cursor < text.length) {
              list.push({
                type: 'text',
                text: text.substring(_this2.cursor)
              });
            }
            childs.splice.apply(childs, [i, 1].concat(list));
          }
        } else {
          childs.splice(i + 1, 0, node);
        }
        path = _this2.data.opts[7] + path;
        if (path[path.length - 1] === '_') {
          path = path.slice(0, -1);
        }
        _this2.root._editVal('nodes' + (path ? '[' + path.replace(/_/g, '].children[') + '].children' : ''), children, childs, true);
        _this2.i = arr.join('_') + '_' + (i + 1);
      }, 200);
    },
    remove: function remove(i) {
      var arr = i.split('_');
      var j = arr.pop();
      var path = arr.join('_');
      var children = path ? this.getNode(path).children : this.data.childs;
      var childs = children.slice(0);
      var delEle = childs.splice(j, 1)[0];
      if (delEle.name === 'img' || delEle.name === 'video' || delEle.name === 'audio') {
        var src = delEle.attrs.src;
        if (delEle.src) {
          src = delEle.src.length === 1 ? delEle.src[0] : delEle.src;
        }
        this.root.triggerEvent('remove', {
          type: delEle.name,
          src: src
        });
      }
      this.root._edit = undefined;
      this.root._maskTap();
      path = this.data.opts[7] + path;
      if (path[path.length - 1] === '_') {
        path = path.slice(0, -1);
      }
      this.root._editVal('nodes' + (path ? '[' + path.replace(/_/g, '].children[') + '].children' : ''), children, childs, true);
    },
    nodeTap: function nodeTap(e) {
      var _this3 = this;
      if (this.data.opts[5]) {
        var i = e.currentTarget.dataset.i;
        if (this.root._table) {
          var _node = this.getNode(i);
          if (_node.name === 'table') {
            this.root._table = undefined;
            this.root._remove_table = function () {
              _this3.remove(i);
            };
          }
        }
        if (this.root._lock) return;
        // 阻止上层出现点击态
        this.root._lock = true;
        setTimeout(function () {
          _this3.root._lock = false;
        }, 50);
        var node = this.getNode(i);
        if (node.name === 'td' || node.name === 'th') {
          this.root._table = true;
        }
        if (this.data.ctrl['e' + this.i] === 3) return;
        this.root._maskTap();
        this.root._edit = this;
        if (this.data.opts[5] === 'simple') return;
        var arr = i.split('_');
        var j = parseInt(arr.pop());
        var path = arr.join('_');
        var siblings = path ? this.getNode(path).children : this.data.childs;
        // 显示实线框
        this.setData(_defineProperty({}, 'ctrl.e' + i, 1));
        this.root._mask.push(function () {
          _this3.setData(_defineProperty({}, 'ctrl.e' + i, 0));
        });
        if (node.children.length === 1 && node.children[0].type === 'text') {
          var ii = i + '_0';
          if (!this.data.ctrl['e' + ii]) {
            this.setData(_defineProperty({}, 'ctrl.e' + ii, 1));
            this.root._mask.push(function () {
              _this3.setData(_defineProperty({}, 'ctrl.e' + ii, 0));
            });
            this.cursor = node.children[0].text.length;
          }
          this.i = ii;
        } else if (!(this.i || '').includes(i)) {
          this.i = i + '_';
        }
        var items = this.root._getItem(node, j !== 0, j !== siblings.length - 1);
        this.root._tooltip({
          top: getTop(e),
          items: items,
          success: function success(tapIndex) {
            console.log('tapIndex:', tapIndex);
            if (items[tapIndex] === '大小') {
              // 改变字体大小
              var style = node.attrs.style || '';
              var value = style.match(/;font-size:([0-9]+)px/);
              if (value) {
                value = parseInt(value[1]);
              } else {
                value = 16;
              }
              _this3.root._slider({
                min: 10,
                max: 30,
                value: value,
                top: getTop(e),
                changing: function changing(val) {
                  if (Math.abs(val - value) > 2) {
                    // 字号变换超过 2 时更新到视图
                    _this3.changeStyle('font-size', i, val + 'px', value + 'px');
                    value = e.detail.value;
                  }
                },
                change: function change(val) {
                  if (val !== value) {
                    _this3.changeStyle('font-size', i, val + 'px', value + 'px');
                  }
                  _this3.root._editVal('nodes[' + (_this3.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.style', style, _this3.getNode(i).attrs.style);
                }
              });
            } else if (items[tapIndex] === '颜色') {
              // 改变文字颜色
              var _items = _this3.root._getItem('color');
              _this3.root._color({
                top: getTop(e),
                items: _items,
                success: function success(tapIndex) {
                  var style = node.attrs.style || '';
                  var value = style.match(/;color:([^;]+)/);
                  _this3.changeStyle('color', i, _items[tapIndex], value ? value[1] : undefined);
                  _this3.root._editVal('nodes[' + (_this3.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.style', style, _this3.getNode(i).attrs.style);
                }
              });
            } else if (items[tapIndex] === '上移' || items[tapIndex] === '下移') {
              var _arr = siblings.slice(0);
              var item = _arr[j];
              if (items[tapIndex] === '上移') {
                _arr[j] = _arr[j - 1];
                _arr[j - 1] = item;
              } else {
                _arr[j] = _arr[j + 1];
                _arr[j + 1] = item;
              }
              path = _this3.data.opts[7] + path;
              if (path[path.length - 1] === '_') {
                path = path.slice(0, -1);
              }
              _this3.root._editVal('nodes' + (path ? '[' + path.replace(/_/g, '].children[') + '].children' : ''), siblings, _arr, true);
            } else if (items[tapIndex] === '删除') {
              if ((node.name === 'td' || node.name === 'th') && _this3.root._remove_table) {
                _this3.root._remove_table();
                _this3.root._remove_table = undefined;
              } else {
                _this3.remove(i);
              }
            } else {
              var _style = node.attrs.style || '';
              var newStyle = '';
              var _item = items[tapIndex];
              var name;
              var _value;
              if (_item === '斜体') {
                name = 'font-style';
                _value = 'italic';
              } else if (_item === '粗体') {
                name = 'font-weight';
                _value = 'bold';
              } else if (_item === '下划线') {
                name = 'text-decoration';
                _value = 'underline';
              } else if (_item === '居中') {
                name = 'text-align';
                _value = 'center';
              } else if (_item === '缩进') {
                name = 'text-indent';
                _value = '2em';
              }
              if (_style.includes(name + ':')) {
                // 已有则取消
                newStyle = _style.replace(new RegExp(name + ':[^;]+'), '');
              } else {
                // 没有则添加
                newStyle = _style + ';' + name + ':' + _value;
              }
              _this3.root._editVal('nodes[' + (_this3.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.style', _style, newStyle, true);
            }
          }
        });
      }
    },
    mediaTap: function mediaTap(e) {
      var _this4 = this;
      if (this.data.opts[5]) {
        var i = e.target.dataset.i;
        var node = this.getNode(i);
        var items = this.root._getItem(node);
        this.root._maskTap();
        this.root._edit = this;
        this.i = i;
        this.root._tooltip({
          top: e.target.offsetTop - 30,
          items: items,
          success: function success(tapIndex) {
            switch (items[tapIndex]) {
              case '封面':
                // 设置封面
                _this4.root.getSrc('img', node.attrs.poster || '').then(function (url) {
                  _this4.root._editVal('nodes[' + (_this4.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.poster', node.attrs.poster, url instanceof Array ? url[0] : url, true);
                })["catch"](function () {});
                break;
              case '删除':
                _this4.remove(i);
                break;
              case '循环':
              case '不循环':
                // 切换循环播放
                _this4.root.setData(_defineProperty({}, 'nodes[' + (_this4.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.loop', !node.attrs.loop));
                wx.showToast({
                  title: '成功'
                });
                break;
              case '自动播放':
              case '不自动播放':
                // 切换自动播放播放
                _this4.root.setData(_defineProperty({}, 'nodes[' + (_this4.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.autoplay', !node.attrs.autoplay));
                wx.showToast({
                  title: '成功'
                });
                break;
            }
          }
        });
        // 避免上层出现点击态
        this.root._lock = true;
        setTimeout(function () {
          _this4.root._lock = false;
        }, 50);
      }
    },
    changeStyle: function changeStyle(name, i, value, oldVal) {
      var style = this.getNode(i).attrs.style || '';
      if (style.includes(';' + name + ':' + oldVal)) {
        // style 中已经有
        style = style.replace(';' + name + ':' + oldVal, ';' + name + ':' + value);
      } else {
        // 没有则新增
        style += ';' + name + ':' + value;
      }
      this.root.setData(_defineProperty({}, 'nodes[' + (this.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.style', style));
    },
    noop: function noop() {},
    /**
     * @description 获取标签
     * @param {String} path 路径
     */
    getNode: function getNode(path) {
      try {
        var nums = path.split('_');
        var node = this.data.childs[nums[0]];
        for (var i = 1; i < nums.length; i++) {
          node = node.children[nums[i]];
        }
        return node;
      } catch (_unused) {
        return {
          text: '',
          attrs: {},
          children: []
        };
      }
    },
    /**
     * @description 播放视频事件
     * @param {Event} e
     */
    play: function play(e) {
      var i = e.target.dataset.i;
      var node = this.getNode(i);
      this.root.triggerEvent('play', {
        source: node.name,
        attrs: _objectSpread(_objectSpread({}, node.attrs), {}, {
          src: node.src[this.data.ctrl[i] || 0]
        })
      });
      if (this.root.data.pauseVideo) {
        var flag = false;
        var id = e.target.id;
        for (var _i2 = this.root._videos.length; _i2--;) {
          if (this.root._videos[_i2].id === id) {
            flag = true;
          } else {
            this.root._videos[_i2].pause(); // 自动暂停其他视频
          }
        }
        // 将自己加入列表
        if (!flag) {
          var ctx = wx.createVideoContext(id
          // #ifndef MP-BAIDU
          , this
          // #endif
          );
          ctx.id = id;
          if (this.root.playbackRate) {
            ctx.playbackRate(this.root.playbackRate);
          }
          this.root._videos.push(ctx);
        }
      }
    },
    /**
     * @description 图片点击事件
     * @param {Event} e
     */
    imgTap: function imgTap(e) {
      var _this5 = this;
      if (!this.data.opts[5]) {
        var node = this.getNode(e.target.dataset.i);
        // 父级中有链接
        if (node.a) return this.linkTap(node.a);
        if (node.attrs.ignore) return;
        this.root.triggerEvent('imgtap', node.attrs);
        if (this.root.data.previewImg) {
          var current =
          // #ifndef MP-ALIPAY
          this.root.imgList[node.i];
          // #endif
          // #ifdef MP-ALIPAY

          // #endif
          // 自动预览图片
          wx.previewImage({
            // #ifdef MP-WEIXIN
            showmenu: this.root.data.showImgMenu,
            // #endif
            // #ifdef MP-ALIPAY

            // #endif
            current: current,
            urls: this.root.imgList
          });
        }
      } else {
        var i = e.target.dataset.i;
        var _node2 = this.getNode(i);
        var items = this.root._getItem(_node2);
        this.root._edit = this;
        var parser = new Parser(this.root);
        this.i = i;
        this.root._maskTap();
        this.setData(_defineProperty({}, 'ctrl.e' + i, 1));
        this.root._mask.push(function () {
          _this5.setData(_defineProperty({}, 'ctrl.e' + i, 0));
        });
        this.root._tooltip({
          top: getTop(e),
          items: items,
          success: function success(tapIndex) {
            if (items[tapIndex] === '换图') {
              // 换图
              _this5.root.getSrc('img', _node2.attrs.src || '').then(function (url) {
                _this5.root._editVal('nodes[' + (_this5.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.src', _node2.attrs.src, parser.getUrl(url instanceof Array ? url[0] : url), true);
              })["catch"](function () {});
            } else if (items[tapIndex] === '宽度') {
              // 更改宽度
              var style = _node2.attrs.style || '';
              var value = style.match(/max-width:([0-9]+)%/);
              if (value) {
                value = parseInt(value[1]);
              } else {
                value = 100;
              }
              _this5.root._slider({
                min: 0,
                max: 100,
                value: value,
                top: getTop(e),
                changing: function changing(val) {
                  // 变化超过 5% 更新时视图
                  if (Math.abs(val - value) > 5) {
                    _this5.changeStyle('max-width', i, val + '%', value + '%');
                    value = val;
                  }
                },
                change: function change(val) {
                  if (val !== value) {
                    _this5.changeStyle('max-width', i, val + '%', value + '%');
                    value = val;
                  }
                  _this5.root._editVal('nodes[' + (_this5.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.style', style, _this5.getNode(i).attrs.style);
                }
              });
            } else if (items[tapIndex] === '超链接') {
              // 将图片设置为链接
              _this5.root.getSrc('link', _node2.a ? _node2.a.href : '').then(function (url) {
                // 如果有 a 标签则替换 href
                if (_node2.a) {
                  _this5.root._editVal('nodes[' + (_this5.data.opts[7] + i).replace(/_/g, '].children[') + '].a.href', _node2.a.href, parser.getUrl(url), true);
                } else {
                  var link = {
                    name: 'a',
                    attrs: {
                      href: parser.getUrl(url)
                    },
                    children: [_node2]
                  };
                  _node2.a = link.attrs;
                  _this5.root._editVal('nodes[' + (_this5.data.opts[7] + i).replace(/_/g, '].children[') + ']', _node2, link, true);
                }
                wx.showToast({
                  title: '成功'
                });
              })["catch"](function () {});
            } else if (items[tapIndex] === '预览图') {
              // 设置预览图链接
              _this5.root.getSrc('img', _node2.attrs['original-src'] || '').then(function (url) {
                _this5.root._editVal('nodes[' + (_this5.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.original-src', _node2.attrs['original-src'], parser.getUrl(url instanceof Array ? url[0] : url), true);
                wx.showToast({
                  title: '成功'
                });
              })["catch"](function () {});
            } else if (items[tapIndex] === '删除') {
              _this5.remove(i);
            } else {
              // 禁用 / 启用预览
              _this5.root.setData(_defineProperty({}, 'nodes[' + (_this5.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.ignore', !_node2.attrs.ignore));
              wx.showToast({
                title: '成功'
              });
            }
          }
        });
        this.root._lock = true;
        setTimeout(function () {
          _this5.root._lock = false;
        }, 50);
      }
    },
    /**
     * @description 图片加载完成事件
     * @param {Event} e
     */
    imgLoad: function imgLoad(e) {
      var _this6 = this;
      // #ifdef MP-WEIXIN || MP-QQ
      if (this.data.opts[5]) {
        setTimeout(function () {
          var id = _this6.getNode(i).attrs.id || 'n' + i;
          wx.createSelectorQuery()["in"](_this6).select('#' + id).boundingClientRect().exec(function (res) {
            _this6.setData(_defineProperty({}, 'ctrl.h' + i, res[0].height));
          });
        }, 50);
      }
      // #endif
      var i = e.target.dataset.i;
      var node = this.getNode(i);
      var val;
      if (!node.w) {
        val = e.detail.width;
        if (this.data.opts[5]) {
          var data = {};
          var path = 'nodes[' + (this.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.';
          if (val < 150) {
            data[path + 'ignore'] = 'T';
          }
          data[path + 'width'] = val.toString();
          this.root.setData(data);
        }
      } else if (this.data.opts[1] && !this.data.ctrl[i] || this.data.ctrl[i] === -1) {
        // 加载完毕，取消加载中占位图
        val = 1;
      }
      if (val
      // #ifdef MP-TOUTIAO

      // #endif
      ) {
        this.setData(_defineProperty({}, 'ctrl.' + i, val));
      }
      this.checkReady();
    },
    /**
     * @description 检查是否所有图片加载完毕
     */
    checkReady: function checkReady() {
      var _this7 = this;
      if (!this.root.data.lazyLoad) {
        this.root.imgList._unloadimgs -= 1;
        if (!this.root.imgList._unloadimgs) {
          setTimeout(function () {
            _this7.root.getRect().then(function (rect) {
              _this7.root.triggerEvent('ready', rect);
            })["catch"](function () {
              _this7.root.triggerEvent('ready', {});
            });
          }, 350);
        }
      }
    },
    /**
     * @description 链接点击事件
     * @param {Event} e
     */
    linkTap: function linkTap(e) {
      var _this8 = this;
      if (!this.data.opts[5]) {
        var node = e.currentTarget ? this.getNode(e.currentTarget.dataset.i) : {};
        var attrs = node.attrs || e;
        var href = attrs.href;
        this.root.triggerEvent('linktap', Object.assign({
          innerText: this.root.getText(node.children || []) // 链接内的文本内容
        }, attrs));
        if (href) {
          if (href[0] === '#') {
            // 跳转锚点
            this.root.navigateTo(href.substring(1))["catch"](function () {});
          } else if (href.split('?')[0].includes('://')) {
            // 复制外部链接
            if (this.root.data.copyLink) {
              wx.setClipboardData({
                data: href,
                success: function success() {
                  return wx.showToast({
                    title: '链接已复制'
                  });
                }
              });
            }
          } else {
            // 跳转页面
            wx.navigateTo({
              url: href,
              fail: function fail() {
                wx.switchTab({
                  url: href,
                  fail: function fail() {}
                });
              }
            });
          }
        }
      } else {
        var i = e.currentTarget.dataset.i;
        var _node3 = this.getNode(i);
        var items = this.root._getItem(_node3);
        this.root._tooltip({
          top: getTop(e),
          items: items,
          success: function success(tapIndex) {
            if (items[tapIndex] === '更换链接') {
              _this8.root.getSrc('link', _node3.attrs.href).then(function (url) {
                _this8.root._editVal('nodes[' + (_this8.data.opts[7] + i).replace(/_/g, '].children[') + '].attrs.href', _node3.attrs.href, url, true);
                wx.showToast({
                  title: '成功'
                });
              })["catch"](function () {});
            } else {
              _this8.remove(i);
            }
          }
        });
      }
    },
    /**
     * @description 错误事件
     * @param {Event} e
     */
    mediaError: function mediaError(e) {
      var i = e.target.dataset.i;
      var node = this.getNode(i);
      if (node.name === 'video' || node.name === 'audio') {
        // 加载其他源
        var index = (this.data.ctrl[i] || 0) + 1;
        if (index > node.src.length) {
          index = 0;
        }
        if (index < node.src.length) {
          return this.setData(_defineProperty({}, 'ctrl.' + i, index));
        }
      } else if (node.name === 'img') {
        // 显示错误占位图
        if (this.data.opts[2]) {
          this.setData(_defineProperty({}, 'ctrl.' + i, -1));
        }
        this.checkReady();
      }
      if (this.root) {
        this.root.triggerEvent('error', {
          source: node.name,
          attrs: node.attrs,
          errMsg: e.detail.errMsg
        });
      }
    }
  }
});