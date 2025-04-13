"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*!
 * mp-html v2.5.0
 * https://github.com/jin-yufeng/mp-html
 *
 * Released under the MIT license
 * Author: Jin Yufeng
 */
var Parser = require('./parser');
var _require = require('./mpEvent'),
  mpEventWatch = _require.mpEventWatch,
  mpEventSend = _require.mpEventSend;
var plugins = [require('./editable/index.js')];
Component({
  data: {
    nodes: []
  },
  properties: {
    editable: {
      type: null,
      observer: function observer(val) {
        if (this.data.content) {
          this.setContent(val ? this.data.content : this.getContent());
        } else if (val) {
          this.setData({
            nodes: [{
              name: 'p',
              attrs: {},
              children: [{
                type: 'text',
                text: ''
              }]
            }]
          });
          // #ifdef MP-TOUTIAO

          // #endif
        }
        if (!val) {
          this._maskTap();
        }
      }
    },
    placeholder: String,
    /**
     * @description 容器的样式
     * @type {String}
     */
    containerStyle: String,
    /**
     * @description 用于渲染的 html 字符串
     * @type {String}
     */
    content: {
      type: String,
      value: '',
      observer: function observer(content) {
        this.setContent(content);
      }
    },
    /**
     * @description 是否允许外部链接被点击时自动复制
     * @type {Boolean}
     * @default true
     */
    copyLink: {
      type: Boolean,
      value: true
    },
    /**
     * @description 主域名，用于拼接链接
     * @type {String}
     */
    domain: String,
    /**
     * @description 图片出错时的占位图链接
     * @type {String}
     */
    errorImg: String,
    /**
     * @description 是否开启图片懒加载
     * @type {Boolean}
     * @default false
     */
    lazyLoad: Boolean,
    /**
     * @description 图片加载过程中的占位图链接
     * @type {String}
     */
    loadingImg: String,
    /**
     * @description 是否在播放一个视频时自动暂停其他视频
     * @type {Boolean}
     * @default true
     */
    pauseVideo: {
      type: Boolean,
      value: true
    },
    /**
     * @description 是否允许图片被点击时自动预览
     * @type {Boolean | String}
     * @default true
     */
    previewImg: {
      type: null,
      value: true
    },
    /**
     * @description 是否给每个表格添加一个滚动层使其能单独横向滚动
     * @type {Boolean}
     * @default false
     */
    scrollTable: Boolean,
    /**
     * @description 是否开启长按复制
     * @type {Boolean | String}
     * @default false
     */
    selectable: null,
    /**
     * @description 是否将 title 标签的内容设置到页面标题
     * @type {Boolean}
     * @default true
     */
    setTitle: {
      type: Boolean,
      value: true
    },
    /**
     * @description 是否允许图片被长按时显示菜单
     * @type {Boolean}
     * @default true
     */
    showImgMenu: {
      type: Boolean,
      value: true
    },
    /**
     * @description 标签的默认样式
     * @type {Object}
     */
    tagStyle: Object,
    /**
     * @description 是否使用锚点链接
     * @type {Boolean | Number}
     * @default false
     */
    useAnchor: null
  },
  created: function created() {
    var _this = this;
    this.plugins = [];
    for (var i = plugins.length; i--;) {
      this.plugins.push(new plugins[i](this));
    }

    // #ifdef MP-ALIPAY

    // #endif

    // 监听事件
    mpEventWatch(function (data) {
      if (data.name === 'tool-tap') {
        _this._tooltipcb(data.data.i);
      }
      _this.triggerEvent('mp-event', data);
    });
    setTimeout(function () {
      // 发送事件
      mpEventSend({
        name: 'created',
        data: {
          mpEventSend: mpEventSend
        }
      });
    }, 0);
  },
  // #ifdef MP-ALIPAY
  // #endif
  detached: function detached() {
    // 注销插件
    this._hook('onDetached');
  },
  methods: {
    _containTap: function _containTap() {
      if (!this._lock && !this.data.slider && !this.data.color) {
        this._edit = undefined;
        this._maskTap();
      }
    },
    _tooltipTap: function _tooltipTap(e) {
      this._tooltipcb(e.currentTarget.dataset.i);
      this.setData({
        tooltip: null
      });
      mpEventSend({
        name: 'tooltipTap',
        data: {
          i: e.currentTarget.dataset.i
        }
      });
    },
    _sliderChanging: function _sliderChanging(e) {
      this._slideringcb(e.detail.value);
    },
    _sliderChange: function _sliderChange(e) {
      this._slidercb(e.detail.value);
    },
    _colorTap: function _colorTap(e) {
      this._colorcb(e.currentTarget.dataset.i);
      this.setData({
        color: null
      });
    },
    /**
     * @description 将锚点跳转的范围限定在一个 scroll-view 内
     * @param {Object} page scroll-view 所在页面的示例
     * @param {String} selector scroll-view 的选择器
     * @param {String} scrollTop scroll-view scroll-top 属性绑定的变量名
     */
    "in": function _in(page, selector, scrollTop) {
      if (page && selector && scrollTop) {
        this._in = {
          page: page,
          selector: selector,
          scrollTop: scrollTop
        };
      }
    },
    /**
     * @description 锚点跳转
     * @param {String} id 要跳转的锚点 id
     * @param {Number} offset 跳转位置的偏移量
     * @returns {Promise}
     */
    navigateTo: function navigateTo(id, offset) {
      var _this2 = this;
      return new Promise(function (resolve, reject) {
        if (!_this2.data.useAnchor) {
          reject(Error('Anchor is disabled'));
          return;
        }
        // 跨组件选择器
        var deep =
        // #ifdef MP-WEIXIN || MP-QQ || MP-TOUTIAO
        '>>>';
        // #endif
        // #ifdef MP-BAIDU || MP-ALIPAY

        // #endif
        var selector = wx.createSelectorQuery()
        // #ifndef MP-ALIPAY
        ["in"](_this2._in ? _this2._in.page : _this2)
        // #endif
        .select((_this2._in ? _this2._in.selector : '._root') + (id ? "".concat(deep, "#").concat(id) : '')).boundingClientRect();
        if (_this2._in) {
          selector.select(_this2._in.selector).scrollOffset().select(_this2._in.selector).boundingClientRect();
        } else {
          // 获取 scroll-view 的位置和滚动距离
          selector.selectViewport().scrollOffset(); // 获取窗口的滚动距离
        }
        selector.exec(function (res) {
          if (!res[0]) {
            reject(Error('Label not found'));
            return;
          }
          var scrollTop = res[1].scrollTop + res[0].top - (res[2] ? res[2].top : 0) + (offset || parseInt(_this2.data.useAnchor) || 0);
          if (_this2._in) {
            // scroll-view 跳转
            _this2._in.page.setData(_defineProperty({}, _this2._in.scrollTop, scrollTop));
          } else {
            // 页面跳转
            wx.pageScrollTo({
              scrollTop: scrollTop,
              duration: 300
            });
          }
          resolve();
        });
      });
    },
    /**
     * @description 获取文本内容
     * @returns {String}
     */
    getText: function getText(nodes) {
      var text = '';
      (function traversal(nodes) {
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (node.type === 'text') {
            text += node.text.replace(/&amp;/g, '&');
          } else if (node.name === 'br') {
            text += '\n';
          } else {
            // 块级标签前后加换行
            var isBlock = node.name === 'p' || node.name === 'div' || node.name === 'tr' || node.name === 'li' || node.name[0] === 'h' && node.name[1] > '0' && node.name[1] < '7';
            if (isBlock && text && text[text.length - 1] !== '\n') {
              text += '\n';
            }
            // 递归获取子节点的文本
            if (node.children) {
              traversal(node.children);
            }
            if (isBlock && text[text.length - 1] !== '\n') {
              text += '\n';
            } else if (node.name === 'td' || node.name === 'th') {
              text += '\t';
            }
          }
        }
      })(nodes || this.data.nodes);
      return text;
    },
    /**
     * @description 获取内容大小
     * @returns {Promise}
     */
    getRect: function getRect() {
      var _this3 = this;
      return new Promise(function (resolve, reject) {
        wx.createSelectorQuery()
        // #ifndef MP-ALIPAY
        ["in"](_this3)
        // #endif
        .select('._root').boundingClientRect().exec(function (res) {
          return res[0] ? resolve(res[0]) : reject(Error('Root label not found'));
        });
      });
    },
    /**
     * @description 暂停播放媒体
     */
    pauseMedia: function pauseMedia() {
      for (var i = (this._videos || []).length; i--;) {
        this._videos[i].pause();
      }
    },
    /**
     * @description 设置媒体播放速率
     * @param {Number} rate 播放速率
     */
    setPlaybackRate: function setPlaybackRate(rate) {
      this.playbackRate = rate;
      for (var i = (this._videos || []).length; i--;) {
        this._videos[i].playbackRate(rate);
      }
    },
    /**
     * @description 设置富文本内容
     * @param {string} content 要渲染的 html 字符串
     * @param {boolean} append 是否在尾部追加
     */
    setContent: function setContent(content, append) {
      var _this4 = this;
      if (!this.imgList || !append) {
        this.imgList = [];
      }
      this._videos = [];
      var data = {};
      var nodes = new Parser(this).parse(content);
      // 尾部追加内容
      if (append) {
        for (var i = this.data.nodes.length, j = nodes.length; j--;) {
          data["nodes[".concat(i + j, "]")] = nodes[j];
        }
      } else {
        data.nodes = nodes;
      }
      this.setData(data,
      // #ifndef MP-TOUTIAO
      function () {
        _this4._hook('onLoad');
        _this4.triggerEvent('load');
      }
      // #endif
      );

      // #ifdef MP-TOUTIAO

      // #endif

      if (this.data.lazyLoad || this.imgList._unloadimgs < this.imgList.length / 2) {
        // 设置懒加载，每 350ms 获取高度，不变则认为加载完毕
        var height = 0;
        var _callback = function callback(rect) {
          if (!rect || !rect.height) rect = {};
          // 350ms 总高度无变化就触发 ready 事件
          if (rect.height === height) {
            _this4.triggerEvent('ready', rect);
          } else {
            height = rect.height;
            setTimeout(function () {
              _this4.getRect().then(_callback)["catch"](_callback);
            }, 350);
          }
        };
        this.getRect().then(_callback)["catch"](_callback);
      } else {
        // 未设置懒加载，等待所有图片加载完毕
        if (!this.imgList._unloadimgs) {
          this.getRect().then(function (rect) {
            _this4.triggerEvent('ready', rect);
          })["catch"](function () {
            _this4.triggerEvent('ready', {});
          });
        }
      }
    },
    /**
     * @description 调用插件的钩子函数
     * @private
     */
    _hook: function _hook(name) {
      for (var i = plugins.length; i--;) {
        if (this.plugins[i][name]) {
          this.plugins[i][name]();
        }
      }
    },
    // #ifndef MP-TOUTIAO
    /**
     * @description 添加子组件
     * @private
     */
    _add: function _add(e) {
      e
      // #ifndef MP-ALIPAY
      .detail
      // #endif
      .root = this;
    } // #endif
  }
});