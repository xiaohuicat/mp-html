"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * @fileoverview html 解析器
 */

// 配置
var config = {
  // 信任的标签（保持标签名不变）
  trustTags: makeMap('a,abbr,ad,audio,b,blockquote,br,code,col,colgroup,dd,del,dl,dt,div,em,fieldset,h1,h2,h3,h4,h5,h6,hr,i,img,ins,label,legend,li,ol,p,q,ruby,rt,source,span,strong,sub,sup,table,tbody,td,tfoot,th,thead,tr,title,ul,video'),
  // 块级标签（转为 div，其他的非信任标签转为 span）
  blockTags: makeMap('address,article,aside,body,caption,center,cite,footer,header,html,nav,pre,section'),
  // 要移除的标签
  ignoreTags: makeMap('area,base,canvas,embed,frame,head,iframe,input,link,map,meta,param,rp,script,source,style,textarea,title,track,wbr'),
  // 自闭合标签
  voidTags: makeMap('area,base,br,col,circle,ellipse,embed,frame,hr,img,input,line,link,meta,param,path,polygon,rect,source,track,use,wbr'),
  // html 实体
  entities: {
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    ensp: "\u2002",
    emsp: "\u2003",
    nbsp: '\xA0',
    semi: ';',
    ndash: '–',
    mdash: '—',
    middot: '·',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”',
    bull: '•',
    hellip: '…',
    larr: '←',
    uarr: '↑',
    rarr: '→',
    darr: '↓'
  },
  // 默认的标签样式
  tagStyle: {
    address: 'font-style:italic',
    big: 'display:inline;font-size:1.2em',
    caption: 'display:table-caption;text-align:center',
    center: 'text-align:center',
    cite: 'font-style:italic',
    dd: 'margin-left:40px',
    mark: 'background-color:yellow',
    pre: 'font-family:monospace;white-space:pre',
    s: 'text-decoration:line-through',
    small: 'display:inline;font-size:0.8em',
    strike: 'text-decoration:line-through',
    u: 'text-decoration:underline'
  },
  // svg 大小写对照表
  svgDict: {
    animatetransform: 'animateTransform',
    lineargradient: 'linearGradient',
    viewbox: 'viewBox',
    attributename: 'attributeName',
    repeatcount: 'repeatCount',
    repeatdur: 'repeatDur',
    foreignobject: 'foreignObject'
  }
};
var tagSelector = {};
var _wx$getSystemInfoSync = wx.getSystemInfoSync(),
  windowWidth = _wx$getSystemInfoSync.windowWidth,
  system = _wx$getSystemInfoSync.system;
var blankChar = makeMap(' ,\r,\n,\t,\f');
var idIndex = 0;

/**
 * @description 创建 map
 * @param {String} str 逗号分隔
 */
function makeMap(str) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = list.length; i--;) {
    map[list[i]] = true;
  }
  return map;
}

/**
 * @description 解码 html 实体
 * @param {String} str 要解码的字符串
 * @param {Boolean} amp 要不要解码 &amp;
 * @returns {String} 解码后的字符串
 */
function decodeEntity(str, amp) {
  var i = str.indexOf('&');
  while (i !== -1) {
    var j = str.indexOf(';', i + 3);
    var code = void 0;
    if (j === -1) break;
    if (str[i + 1] === '#') {
      // &#123; 形式的实体
      code = parseInt((str[i + 2] === 'x' ? '0' : '') + str.substring(i + 2, j));
      if (!isNaN(code)) {
        str = str.substr(0, i) + String.fromCharCode(code) + str.substr(j + 1);
      }
    } else {
      // &nbsp; 形式的实体
      code = str.substring(i + 1, j);
      if (config.entities[code] || code === 'amp' && amp) {
        str = str.substr(0, i) + (config.entities[code] || '&') + str.substr(j + 1);
      }
    }
    i = str.indexOf('&', i + 1);
  }
  return str;
}

/**
 * @description 合并多个块级标签，加快长内容渲染
 * @param {Array} nodes 要合并的标签数组
 */
function mergeNodes(nodes) {
  var i = nodes.length - 1;
  for (var j = i; j >= -1; j--) {
    if (j === -1 || nodes[j].c || !nodes[j].name || nodes[j].name !== 'div' && nodes[j].name !== 'p' && nodes[j].name[0] !== 'h' || (nodes[j].attrs.style || '').includes('inline')) {
      if (i - j >= 5) {
        nodes.splice(j + 1, i - j, {
          name: 'div',
          attrs: {},
          children: nodes.slice(j + 1, i + 1)
        });
      }
      i = j - 1;
    }
  }
}

/**
 * @description html 解析器
 * @param {Object} vm 组件实例
 */
function Parser(vm) {
  this.options = vm.data || {};
  this.tagStyle = Object.assign({}, config.tagStyle, this.options.tagStyle);
  this.imgList = vm.imgList || [];
  this.imgList._unloadimgs = 0;
  this.plugins = vm.plugins || [];
  this.attrs = Object.create(null);
  this.stack = [];
  this.nodes = [];
  this.pre = (this.options.containerStyle || '').includes('white-space') && this.options.containerStyle.includes('pre') ? 2 : 0;
}

/**
 * @description 执行解析
 * @param {String} content 要解析的文本
 */
Parser.prototype.parse = function (content) {
  // 插件处理
  for (var i = this.plugins.length; i--;) {
    if (this.plugins[i].onUpdate) {
      content = this.plugins[i].onUpdate(content, config) || content;
    }
  }
  new Lexer(this).parse(content);
  // 出栈未闭合的标签
  while (this.stack.length) {
    this.popNode();
  }
  if (this.nodes.length > 50) {
    mergeNodes(this.nodes);
  }
  return this.nodes;
};

/**
 * @description 将标签暴露出来（不被 rich-text 包含）
 */
Parser.prototype.expose = function () {
  for (var i = this.stack.length; i--;) {
    var item = this.stack[i];
    if (item.c || item.name === 'a' || item.name === 'video' || item.name === 'audio') return;
    item.c = 1;
  }
};

/**
 * @description 处理插件
 * @param {Object} node 要处理的标签
 * @returns {Boolean} 是否要移除此标签
 */
Parser.prototype.hook = function (node) {
  for (var i = this.plugins.length; i--;) {
    if (this.plugins[i].onParse && this.plugins[i].onParse(node, this) === false) return false;
  }
  return true;
};

/**
 * @description 将链接拼接上主域名
 * @param {String} url 需要拼接的链接
 * @returns {String} 拼接后的链接
 */
Parser.prototype.getUrl = function (url) {
  var domain = this.options.domain;
  if (url[0] === '/') {
    if (url[1] === '/') {
      // // 开头的补充协议名
      url = (domain ? domain.split('://')[0] : 'http') + ':' + url;
    } else if (domain) {
      // 否则补充整个域名
      url = domain + url;
    }
  } else if (domain && !url.includes('data:') && !url.includes('://')) {
    url = domain + '/' + url;
  }
  return url;
};

/**
 * @description 解析样式表
 * @param {Object} node 标签
 * @returns {Object}
 */
Parser.prototype.parseStyle = function (node) {
  var attrs = node.attrs;
  var list = (this.tagStyle[node.name] || '').split(';').concat((attrs.style || '').split(';'));
  var styleObj = {};
  var tmp = '';
  if (attrs.id && !this.xml) {
    // 暴露锚点
    if (this.options.useAnchor) {
      this.expose();
    } else if (node.name !== 'img' && node.name !== 'a' && node.name !== 'video' && node.name !== 'audio') {
      attrs.id = undefined;
    }
  }

  // 转换 width 和 height 属性
  if (attrs.width) {
    styleObj.width = parseFloat(attrs.width) + (attrs.width.includes('%') ? '%' : 'px');
    attrs.width = undefined;
  }
  if (attrs.height) {
    styleObj.height = parseFloat(attrs.height) + (attrs.height.includes('%') ? '%' : 'px');
    attrs.height = undefined;
  }
  for (var i = 0, len = list.length; i < len; i++) {
    var info = list[i].split(':');
    if (info.length < 2) continue;
    var key = info.shift().trim().toLowerCase();
    var value = info.join(':').trim();
    if (value[0] === '-' && value.lastIndexOf('-') > 0 || value.includes('safe')) {
      // 兼容性的 css 不压缩
      tmp += ";".concat(key, ":").concat(value);
    } else if (!styleObj[key] || value.includes('import') || !styleObj[key].includes('import')) {
      // 重复的样式进行覆盖
      if (value.includes('url')) {
        // 填充链接
        var j = value.indexOf('(') + 1;
        if (j) {
          while (value[j] === '"' || value[j] === "'" || blankChar[value[j]]) {
            j++;
          }
          value = value.substr(0, j) + this.getUrl(value.substr(j));
        }
      } else if (value.includes('rpx')) {
        // 转换 rpx（rich-text 内部不支持 rpx）
        value = value.replace(/[0-9.]+\s*rpx/g, function ($) {
          return parseFloat($) * windowWidth / 750 + 'px';
        });
      }
      styleObj[key] = value;
    }
  }
  node.attrs.style = tmp;
  return styleObj;
};

/**
 * @description 解析到标签名
 * @param {String} name 标签名
 * @private
 */
Parser.prototype.onTagName = function (name) {
  this.tagName = this.xml ? name : name.toLowerCase();
  if (this.tagName === 'svg') {
    this.xml = (this.xml || 0) + 1; // svg 标签内大小写敏感
    config.ignoreTags.style = undefined; // svg 标签内 style 可用
  }
};

/**
 * @description 解析到属性名
 * @param {String} name 属性名
 * @private
 */
Parser.prototype.onAttrName = function (name) {
  name = this.xml ? name : name.toLowerCase();
  if (name.substr(0, 5) === 'data-') {
    if (name === 'data-src' && !this.attrs.src) {
      // data-src 自动转为 src
      this.attrName = 'src';
    } else if (this.tagName === 'img' || this.tagName === 'a') {
      // a 和 img 标签保留 data- 的属性，可以在 imgtap 和 linktap 事件中使用
      this.attrName = name;
    } else {
      // 剩余的移除以减小大小
      this.attrName = undefined;
    }
  } else {
    this.attrName = name;
    this.attrs[name] = 'T'; // boolean 型属性缺省设置
  }
};

/**
 * @description 解析到属性值
 * @param {String} val 属性值
 * @private
 */
Parser.prototype.onAttrVal = function (val) {
  var name = this.attrName || '';
  if (name === 'style' || name === 'href') {
    // 部分属性进行实体解码
    this.attrs[name] = decodeEntity(val, true);
  } else if (name.includes('src')) {
    // 拼接主域名
    this.attrs[name] = this.getUrl(decodeEntity(val, true));
  } else if (name) {
    this.attrs[name] = val;
  }
};

/**
 * @description 解析到标签开始
 * @param {Boolean} selfClose 是否有自闭合标识 />
 * @private
 */
Parser.prototype.onOpenTag = function (selfClose) {
  // 拼装 node
  var node = Object.create(null);
  node.name = this.tagName;
  node.attrs = this.attrs;
  this.attrs = Object.create(null);
  var attrs = node.attrs;
  var parent = this.stack[this.stack.length - 1];
  var siblings = parent ? parent.children : this.nodes;
  var close = this.xml ? selfClose : config.voidTags[node.name];

  // 替换标签名选择器
  if (tagSelector[node.name]) {
    attrs["class"] = tagSelector[node.name] + (attrs["class"] ? ' ' + attrs["class"] : '');
  }

  // 转换 embed 标签
  if (node.name === 'embed') {
    var src = attrs.src || '';
    // 按照后缀名和 type 将 embed 转为 video 或 audio
    if (src.includes('.mp4') || src.includes('.3gp') || src.includes('.m3u8') || (attrs.type || '').includes('video')) {
      node.name = 'video';
    } else if (src.includes('.mp3') || src.includes('.wav') || src.includes('.aac') || src.includes('.m4a') || (attrs.type || '').includes('audio')) {
      node.name = 'audio';
    }
    if (attrs.autostart) {
      attrs.autoplay = 'T';
    }
    attrs.controls = 'T';
  }

  // 处理音视频
  if (node.name === 'video' || node.name === 'audio') {
    // 设置 id，用于获取 context
    if (node.name === 'video' && !attrs.id) {
      attrs.id = 'v' + idIndex++;
    }
    // 没有设置 controls 也没有设置 autoplay 的自动设置 controls
    if (!attrs.controls && !attrs.autoplay) {
      attrs.controls = 'T';
    }
    // 用数组存储所有可用的 source
    node.src = [];
    if (attrs.src) {
      node.src.push(attrs.src);
      attrs.src = undefined;
    }
    this.expose();
  }

  // 处理自闭合标签
  if (close) {
    // 要被移除的标签
    if (!this.hook(node) || config.ignoreTags[node.name]) {
      if (node.name === 'base' && !this.options.domain) {
        // 通过 base 标签设置主域名
        this.options.domain = attrs.href;
      } else if (node.name === 'source' && parent && (parent.name === 'video' || parent.name === 'audio') && attrs.src) {
        // 设置 source 标签（仅父节点为 video 或 audio 时有效）
        parent.src.push(attrs.src);
      }
      return;
    }

    // 解析 style
    var styleObj = this.parseStyle(node);

    // 处理图片
    if (node.name === 'img') {
      if (attrs.src) {
        // 标记 webp
        if (attrs.src.includes('webp')) {
          node.webp = 'T';
        }
        // data url 图片如果没有设置 original-src 默认为不可预览的小图片
        if (attrs.src.includes('data:') && this.options.previewImg !== 'all' && !attrs['original-src']) {
          attrs.ignore = 'T';
        }
        if (!attrs.ignore || node.webp || attrs.src.includes('cloud://')) {
          for (var i = this.stack.length; i--;) {
            var item = this.stack[i];
            if (item.name === 'table' && !node.webp && !attrs.src.includes('cloud://')) {
              if (!styleObj.display || styleObj.display.includes('inline')) {
                node.t = 'inline-block';
              } else {
                node.t = styleObj.display;
              }
              styleObj.display = undefined;
            }
            var style = item.attrs.style || '';
            if (style.includes('flex:') && !style.includes('flex:0') && !style.includes('flex: 0') && (!styleObj.width || parseInt(styleObj.width) > 100)) {
              styleObj.width = '100% !important';
              styleObj.height = '';
              for (var j = i + 1; j < this.stack.length; j++) {
                this.stack[j].attrs.style = (this.stack[j].attrs.style || '').replace('inline-', '');
              }
            } else if (style.includes('flex') && styleObj.width === '100%') {
              for (var _j = i + 1; _j < this.stack.length; _j++) {
                var _style = this.stack[_j].attrs.style || '';
                if (!_style.includes(';width') && !_style.includes(' width') && _style.indexOf('width') !== 0) {
                  styleObj.width = '';
                  break;
                }
              }
            } else if (style.includes('inline-block')) {
              if (styleObj.width && styleObj.width[styleObj.width.length - 1] === '%') {
                item.attrs.style += ';max-width:' + styleObj.width;
                styleObj.width = '';
              } else {
                item.attrs.style += ';max-width:100%';
              }
            }
            if (item.name === 'a') {
              node.a = item.attrs;
            } else {
              item.c = 1;
            }
          }
          node.i = this.imgList.length;
          var _src = attrs['original-src'] || attrs.src;
          // #ifndef MP-ALIPAY
          if (this.imgList.includes(_src)) {
            // 如果有重复的链接则对域名进行随机大小写变换避免预览时错位
            var _i = _src.indexOf('://');
            if (_i !== -1) {
              _i += 3;
              var newSrc = _src.substr(0, _i);
              for (; _i < _src.length; _i++) {
                if (_src[_i] === '/') break;
                newSrc += Math.random() > 0.5 ? _src[_i].toUpperCase() : _src[_i];
              }
              newSrc += _src.substr(_i);
              _src = newSrc;
            }
          }
          // #endif
          this.imgList.push(_src);
          if (!node.t) {
            this.imgList._unloadimgs += 1;
          }
        }
      }
      if (styleObj.display === 'inline') {
        styleObj.display = '';
      }
      if (attrs.ignore) {
        styleObj['max-width'] = styleObj['max-width'] || '100%';
        attrs.style += ';-webkit-touch-callout:none';
      }
      // 设置的宽度超出屏幕，为避免变形，高度转为自动
      if (parseInt(styleObj.width) > windowWidth) {
        styleObj.height = undefined;
      }
      // 记录是否设置了宽高
      if (!isNaN(parseInt(styleObj.width))) {
        node.w = 'T';
      }
      if (!isNaN(parseInt(styleObj.height)) && (!styleObj.height.includes('%') || parent && (parent.attrs.style || '').includes('height'))) {
        node.h = 'T';
      }
      if (node.w && node.h && styleObj['object-fit']) {
        if (styleObj['object-fit'] === 'contain') {
          node.m = 'aspectFit';
        } else if (styleObj['object-fit'] === 'cover') {
          node.m = 'aspectFill';
        }
      }
    } else if (node.name === 'svg') {
      siblings.push(node);
      this.stack.push(node);
      this.popNode();
      return;
    }
    for (var key in styleObj) {
      if (styleObj[key]) {
        attrs.style += ";".concat(key, ":").concat(styleObj[key].replace(' !important', ''));
      }
    }
    attrs.style = attrs.style.substr(1) || undefined;
    // #ifdef MP-BAIDU

    // #endif
  } else {
    if ((node.name === 'pre' || (attrs.style || '').includes('white-space') && attrs.style.includes('pre')) && this.pre !== 2) {
      this.pre = node.pre = 1;
    }
    node.children = [];
    this.stack.push(node);
  }
  // 加入节点树
  siblings.push(node);
};

/**
 * @description 解析到标签结束
 * @param {String} name 标签名
 * @private
 */
Parser.prototype.onCloseTag = function (name) {
  // 依次出栈到匹配为止
  name = this.xml ? name : name.toLowerCase();
  var i;
  for (i = this.stack.length; i--;) {
    if (this.stack[i].name === name) break;
  }
  if (i !== -1) {
    while (this.stack.length > i) {
      this.popNode();
    }
  } else if (name === 'p' || name === 'br') {
    var siblings = this.stack.length ? this.stack[this.stack.length - 1].children : this.nodes;
    siblings.push({
      name: name,
      attrs: {
        "class": tagSelector[name],
        style: this.tagStyle[name]
      }
    });
  }
};

/**
 * @description 处理标签出栈
 * @private
 */
Parser.prototype.popNode = function () {
  var editable = this.options.editable;
  var node = this.stack.pop();
  var attrs = node.attrs;
  var children = node.children;
  var parent = this.stack[this.stack.length - 1];
  var siblings = parent ? parent.children : this.nodes;
  if (!this.hook(node) || config.ignoreTags[node.name]) {
    // 获取标题
    if (node.name === 'title' && children.length && children[0].type === 'text' && this.options.setTitle) {
      wx.setNavigationBarTitle({
        title: children[0].text
      });
    }
    siblings.pop();
    return;
  }
  if (node.pre && this.pre !== 2) {
    // 是否合并空白符标识
    this.pre = node.pre = undefined;
    for (var i = this.stack.length; i--;) {
      if (this.stack[i].pre) {
        this.pre = 1;
      }
    }
  }

  // 转换 svg
  if (node.name === 'svg') {
    if (this.xml > 1) {
      // 多层 svg 嵌套
      this.xml--;
      return;
    }
    var src = '';
    var style = attrs.style;
    attrs.style = '';
    attrs.xmlns = 'http://www.w3.org/2000/svg';
    (function traversal(node) {
      if (node.type === 'text') {
        src += node.text;
        return;
      }
      var name = config.svgDict[node.name] || node.name;
      if (name === 'foreignObject') {
        var _iterator = _createForOfIteratorHelper(node.children || []),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var child = _step.value;
            if (child.attrs && !child.attrs.xmlns) {
              child.attrs.xmlns = 'http://www.w3.org/1999/xhtml';
              break;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      src += '<' + name;
      for (var item in node.attrs) {
        var val = node.attrs[item];
        if (val) {
          src += " ".concat(config.svgDict[item] || item, "=\"").concat(val.replace(/"/g, ''), "\"");
        }
      }
      if (!node.children) {
        src += '/>';
      } else {
        src += '>';
        for (var _i2 = 0; _i2 < node.children.length; _i2++) {
          traversal(node.children[_i2]);
        }
        src += '</' + name + '>';
      }
    })(node);
    node.name = 'img';
    node.attrs = {
      src: 'data:image/svg+xml;utf8,' + src.replace(/#/g, '%23'),
      style: style,
      ignore: 'T'
    };
    node.children = undefined;
    this.xml = false;
    config.ignoreTags.style = true;
    return;
  }
  var styleObj = {};

  // 转换 align 属性
  if (attrs.align) {
    if (node.name === 'table') {
      if (attrs.align === 'center') {
        styleObj['margin-inline-start'] = styleObj['margin-inline-end'] = 'auto';
      } else {
        styleObj["float"] = attrs.align;
      }
    } else {
      styleObj['text-align'] = attrs.align;
    }
    attrs.align = undefined;
  }

  // 转换 dir 属性
  if (attrs.dir) {
    styleObj.direction = attrs.dir;
    attrs.dir = undefined;
  }

  // 转换 font 标签的属性
  if (node.name === 'font') {
    if (attrs.color) {
      styleObj.color = attrs.color;
      attrs.color = undefined;
    }
    if (attrs.face) {
      styleObj['font-family'] = attrs.face;
      attrs.face = undefined;
    }
    if (attrs.size) {
      var size = parseInt(attrs.size);
      if (!isNaN(size)) {
        if (size < 1) {
          size = 1;
        } else if (size > 7) {
          size = 7;
        }
        styleObj['font-size'] = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large'][size - 1];
      }
      attrs.size = undefined;
    }
  }

  // 一些编辑器的自带 class
  if ((attrs["class"] || '').includes('align-center')) {
    styleObj['text-align'] = 'center';
  }
  Object.assign(styleObj, this.parseStyle(node));
  if (node.name !== 'table' && parseInt(styleObj.width) > windowWidth) {
    styleObj['max-width'] = '100%';
    styleObj['box-sizing'] = 'border-box';
  }
  if (config.blockTags[node.name]) {
    if (!editable) {
      node.name = 'div';
    }
  } else if (!config.trustTags[node.name] && !this.xml) {
    // 未知标签转为 span，避免无法显示
    node.name = 'span';
  } else if (node.name === 'a' || node.name === 'ad') {
    this.expose();
  } else if (node.name === 'video' || node.name === 'audio') {
    if ((styleObj.height || '').includes('auto')) {
      styleObj.height = undefined;
    }
    node.children = undefined;
  } else if ((node.name === 'ul' || node.name === 'ol') && (node.c || editable)) {
    // 列表处理
    var types = {
      a: 'lower-alpha',
      A: 'upper-alpha',
      i: 'lower-roman',
      I: 'upper-roman'
    };
    if (types[attrs.type]) {
      attrs.style += ';list-style-type:' + types[attrs.type];
      attrs.type = undefined;
    }
    node.c = 1;
    for (var _i3 = children.length; _i3--;) {
      if (children[_i3].name === 'li') {
        children[_i3].c = 1;
      }
    }
  } else if (node.name === 'table') {
    // 表格处理
    // cellpadding、cellspacing、border 这几个常用表格属性需要通过转换实现
    var padding = parseFloat(attrs.cellpadding);
    var spacing = parseFloat(attrs.cellspacing);
    var border = parseFloat(attrs.border);
    var bordercolor = styleObj['border-color'];
    var borderstyle = styleObj['border-style'];
    if (node.c || editable) {
      // padding 和 spacing 默认 2
      if (isNaN(padding)) {
        padding = 2;
      }
      if (isNaN(spacing)) {
        spacing = 2;
      }
    }
    if (border) {
      attrs.style += ";border:".concat(border, "px ").concat(borderstyle || 'solid', " ").concat(bordercolor || 'gray');
    }
    if (node.flag && (node.c || editable)) {
      node.flag = undefined;
      // 有 colspan 或 rowspan 且含有链接的表格通过 grid 布局实现
      styleObj.display = 'grid';
      if (styleObj['border-collapse'] === 'collapse') {
        styleObj['border-collapse'] = undefined;
        spacing = 0;
      }
      if (spacing) {
        styleObj['grid-gap'] = spacing + 'px';
        styleObj.padding = spacing + 'px';
      } else if (border) {
        // 无间隔的情况下避免边框重叠
        attrs.style += ';border-left:0;border-top:0';
      }
      var width = []; // 表格的列宽
      var trList = []; // tr 列表
      var cells = []; // 保存新的单元格
      var map = {}; // 被合并单元格占用的格子

      (function traversal(nodes) {
        for (var _i4 = 0; _i4 < nodes.length; _i4++) {
          if (nodes[_i4].name === 'tr') {
            trList.push(nodes[_i4]);
          } else if (nodes[_i4].name === 'colgroup') {
            var colI = 1;
            var _iterator2 = _createForOfIteratorHelper(nodes[_i4].children || []),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var col = _step2.value;
                if (col.name === 'col') {
                  var _style2 = col.attrs.style || '';
                  var start = _style2.indexOf('width') ? _style2.indexOf(';width') : 0;
                  // 提取出宽度
                  if (start !== -1) {
                    var end = _style2.indexOf(';', start + 6);
                    if (end === -1) {
                      end = _style2.length;
                    }
                    width[colI] = _style2.substring(start ? start + 7 : 6, end);
                  }
                  colI += 1;
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          } else {
            traversal(nodes[_i4].children || []);
          }
        }
      })(children);
      for (var row = 1; row <= trList.length; row++) {
        var col = 1;
        for (var j = 0; j < trList[row - 1].children.length; j++) {
          var td = trList[row - 1].children[j];
          if (td.name === 'td' || td.name === 'th') {
            // 这个格子被上面的单元格占用，则列号++
            while (map[row + '.' + col]) {
              col++;
            }
            if (editable) {
              td.r = row;
            }
            td.c = 1;
            var _style3 = td.attrs.style || '';
            var start = _style3.indexOf('width') ? _style3.indexOf(';width') : 0;
            // 提取出 td 的宽度
            if (start !== -1) {
              var end = _style3.indexOf(';', start + 6);
              if (end === -1) {
                end = _style3.length;
              }
              if (!td.attrs.colspan) {
                width[col] = _style3.substring(start ? start + 7 : 6, end);
              }
              _style3 = _style3.substr(0, start) + _style3.substr(end);
            }
            // 设置竖直对齐
            _style3 += ';display:flex;flex-direction:column';
            start = _style3.indexOf('vertical-align');
            if (start !== -1) {
              var val = _style3.substr(start + 15, 10);
              if (val.includes('middle')) {
                _style3 += ';justify-content:center';
              } else if (val.includes('bottom')) {
                _style3 += ';justify-content:flex-end';
              }
            } else {
              _style3 += ';justify-content:center';
            }
            // 设置水平对齐
            start = _style3.indexOf('text-align');
            if (start !== -1) {
              var _val = _style3.substr(start + 11, 10);
              if (_val.includes('center')) {
                _style3 += ';justify-content: center';
              } else if (_val.includes('right')) {
                _style3 += ';justify-content: right';
              }
            }
            _style3 = (border ? ";border:".concat(border, "px ").concat(borderstyle || 'solid', " ").concat(bordercolor || 'gray') + (spacing ? '' : ';border-right:0;border-bottom:0') : '') + (padding ? ";padding:".concat(padding, "px") : '') + ';' + _style3;
            // 处理列合并
            if (td.attrs.colspan) {
              _style3 += ";grid-column-start:".concat(col, ";grid-column-end:").concat(col + parseInt(td.attrs.colspan));
              if (!td.attrs.rowspan) {
                _style3 += ";grid-row-start:".concat(row, ";grid-row-end:").concat(row + 1);
              }
              col += parseInt(td.attrs.colspan) - 1;
            }
            // 处理行合并
            if (td.attrs.rowspan) {
              _style3 += ";grid-row-start:".concat(row, ";grid-row-end:").concat(row + parseInt(td.attrs.rowspan));
              if (!td.attrs.colspan) {
                _style3 += ";grid-column-start:".concat(col, ";grid-column-end:").concat(col + 1);
              }
              // 记录下方单元格被占用
              for (var rowspan = 1; rowspan < td.attrs.rowspan; rowspan++) {
                for (var colspan = 0; colspan < (td.attrs.colspan || 1); colspan++) {
                  map[row + rowspan + '.' + (col - colspan)] = 1;
                }
              }
            }
            if (_style3) {
              td.attrs.style = _style3;
            }
            cells.push(td);
            col++;
          }
        }
        if (row === 1) {
          var temp = '';
          for (var _i5 = 1; _i5 < col; _i5++) {
            temp += (width[_i5] ? width[_i5] : 'auto') + ' ';
          }
          styleObj['grid-template-columns'] = temp;
        }
      }
      node.children = cells;
    } else {
      // 没有使用合并单元格的表格通过 table 布局实现
      if (node.c || editable) {
        styleObj.display = 'table';
      }
      if (!isNaN(spacing)) {
        styleObj['border-spacing'] = spacing + 'px';
      }
      if (border || padding || node.c || editable) {
        // 遍历
        (function traversal(nodes) {
          for (var _i6 = 0; _i6 < nodes.length; _i6++) {
            var _td = nodes[_i6];
            if (node.c || editable) {
              _td.c = 1;
            }
            if (_td.name === 'th' || _td.name === 'td') {
              if (border) {
                _td.attrs.style = "border:".concat(border, "px ").concat(borderstyle || 'solid', " ").concat(bordercolor || 'gray', ";").concat(_td.attrs.style || '');
              }
              if (padding) {
                _td.attrs.style = "padding:".concat(padding, "px;").concat(_td.attrs.style || '');
              }
            } else if (_td.children) {
              traversal(_td.children);
            }
          }
        })(children);
      }
    }
    // 给表格添加一个单独的横向滚动层
    if (this.options.scrollTable && !(attrs.style || '').includes('inline')) {
      var table = Object.assign({}, node);
      node.name = 'div';
      node.attrs = {
        style: 'overflow-x:auto;padding:1px'
      };
      node.children = [table];
      attrs = table.attrs;
    }
  } else if ((node.name === 'tbody' || node.name === 'tr') && node.flag && (node.c || editable)) {
    node.flag = undefined;
    (function traversal(nodes) {
      for (var _i7 = 0; _i7 < nodes.length; _i7++) {
        if (nodes[_i7].name === 'td') {
          // 颜色样式设置给单元格避免丢失
          for (var _i8 = 0, _arr = ['color', 'background', 'background-color']; _i8 < _arr.length; _i8++) {
            var _style4 = _arr[_i8];
            if (styleObj[_style4]) {
              nodes[_i7].attrs.style = _style4 + ':' + styleObj[_style4] + ';' + (nodes[_i7].attrs.style || '');
            }
          }
        } else {
          traversal(nodes[_i7].children || []);
        }
      }
    })(children);
  } else if ((node.name === 'td' || node.name === 'th') && (attrs.colspan || attrs.rowspan)) {
    for (var _i9 = this.stack.length; _i9--;) {
      if (this.stack[_i9].name === 'table' || this.stack[_i9].name === 'tbody' || this.stack[_i9].name === 'tr') {
        this.stack[_i9].flag = 1; // 指示含有合并单元格
      }
    }
  } else if (node.name === 'ruby') {
    // 转换 ruby
    node.name = 'span';
    for (var _i10 = 0; _i10 < children.length - 1; _i10++) {
      if (children[_i10].type === 'text' && children[_i10 + 1].name === 'rt') {
        children[_i10] = {
          name: 'span',
          attrs: {
            style: 'display:inline-block;text-align:center'
          },
          children: [{
            name: 'div',
            attrs: {
              style: 'font-size:50%;' + (children[_i10 + 1].attrs.style || '')
            },
            children: children[_i10 + 1].children
          }, children[_i10]]
        };
        children.splice(_i10 + 1, 1);
      }
    }
  }
  if ((styleObj.display || '').includes('flex') && !(node.c || editable)) {
    for (var _i11 = children.length; _i11--;) {
      var item = children[_i11];
      if (item.f) {
        item.attrs.style = (item.attrs.style || '') + item.f;
        item.f = undefined;
      }
    }
  }

  // flex 布局时部分样式需要提取到 rich-text 外层
  var flex = parent && ((parent.attrs.style || '').includes('flex') || (parent.attrs.style || '').includes('grid')) && !(node.c || editable)
  // #ifdef MP-WEIXIN || MP-QQ
  && !(styleObj.display || '').includes('inline'); // eslint-disable-line
  // #endif
  if (flex) {
    node.f = ';max-width:100%';
  }
  if (children.length >= 50 && (node.c || editable) && !(styleObj.display || '').includes('flex')) {
    mergeNodes(children);
  }
  for (var key in styleObj) {
    if (styleObj[key]) {
      var _val2 = ";".concat(key, ":").concat(styleObj[key].replace(' !important', ''));
      if (flex && (key.includes('flex') && key !== 'flex-direction' || key === 'align-self' || key.includes('grid') || styleObj[key][0] === '-' || key.includes('width') && _val2.includes('%'))) {
        node.f += _val2;
        if (key === 'width') {
          attrs.style += ';width:100%';
        }
      } else {
        attrs.style += _val2;
      }
    }
  }
  attrs.style = attrs.style.substr(1) || undefined;
  // #ifdef MP-BAIDU

  // #endif
};

/**
 * @description 解析到文本
 * @param {String} text 文本内容
 */
Parser.prototype.onText = function (text) {
  if (!this.pre) {
    // 合并空白符
    var trim = '';
    var flag;
    for (var i = 0, len = text.length; i < len; i++) {
      if (!blankChar[text[i]]) {
        trim += text[i];
      } else {
        if (trim[trim.length - 1] !== ' ') {
          trim += ' ';
        }
        if (text[i] === '\n' && !flag) {
          flag = true;
        }
      }
    }
    // 去除含有换行符的空串
    if (trim === ' ' && flag) return;
    text = trim;
  }
  var node = Object.create(null);
  node.type = 'text';
  node.text = decodeEntity(text);
  if (this.hook(node)) {
    // #ifdef MP-WEIXIN
    if (this.options.selectable === 'force' && system.includes('iOS') && !wx.canIUse('rich-text.user-select')) {
      this.expose();
    }
    // #endif
    var siblings = this.stack.length ? this.stack[this.stack.length - 1].children : this.nodes;
    siblings.push(node);
  }
};

/**
 * @description html 词法分析器
 * @param {Object} handler 高层处理器
 */
function Lexer(handler) {
  this.handler = handler;
}

/**
 * @description 执行解析
 * @param {String} content 要解析的文本
 */
Lexer.prototype.parse = function (content) {
  this.content = content || '';
  this.i = 0; // 标记解析位置
  this.start = 0; // 标记一个单词的开始位置
  this.state = this.text; // 当前状态
  for (var len = this.content.length; this.i !== -1 && this.i < len;) {
    this.state();
  }
};

/**
 * @description 检查标签是否闭合
 * @param {String} method 如果闭合要进行的操作
 * @returns {Boolean} 是否闭合
 * @private
 */
Lexer.prototype.checkClose = function (method) {
  var selfClose = this.content[this.i] === '/';
  if (this.content[this.i] === '>' || selfClose && this.content[this.i + 1] === '>') {
    if (method) {
      this.handler[method](this.content.substring(this.start, this.i));
    }
    this.i += selfClose ? 2 : 1;
    this.start = this.i;
    this.handler.onOpenTag(selfClose);
    if (this.handler.tagName === 'script') {
      this.i = this.content.indexOf('</', this.i);
      if (this.i !== -1) {
        this.i += 2;
        this.start = this.i;
      }
      this.state = this.endTag;
    } else {
      this.state = this.text;
    }
    return true;
  }
  return false;
};

/**
 * @description 文本状态
 * @private
 */
Lexer.prototype.text = function () {
  this.i = this.content.indexOf('<', this.i); // 查找最近的标签
  if (this.i === -1) {
    // 没有标签了
    if (this.start < this.content.length) {
      this.handler.onText(this.content.substring(this.start, this.content.length));
    }
    return;
  }
  var c = this.content[this.i + 1];
  if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') {
    // 标签开头
    if (this.start !== this.i) {
      this.handler.onText(this.content.substring(this.start, this.i));
    }
    this.start = ++this.i;
    this.state = this.tagName;
  } else if (c === '/' || c === '!' || c === '?') {
    if (this.start !== this.i) {
      this.handler.onText(this.content.substring(this.start, this.i));
    }
    var next = this.content[this.i + 2];
    if (c === '/' && (next >= 'a' && next <= 'z' || next >= 'A' && next <= 'Z')) {
      // 标签结尾
      this.i += 2;
      this.start = this.i;
      this.state = this.endTag;
      return;
    }
    // 处理注释
    var end = '-->';
    if (c !== '!' || this.content[this.i + 2] !== '-' || this.content[this.i + 3] !== '-') {
      end = '>';
    }
    this.i = this.content.indexOf(end, this.i);
    if (this.i !== -1) {
      this.i += end.length;
      this.start = this.i;
    }
  } else {
    this.i++;
  }
};

/**
 * @description 标签名状态
 * @private
 */
Lexer.prototype.tagName = function () {
  if (blankChar[this.content[this.i]]) {
    // 解析到标签名
    this.handler.onTagName(this.content.substring(this.start, this.i));
    while (blankChar[this.content[++this.i]]);
    if (this.i < this.content.length && !this.checkClose()) {
      this.start = this.i;
      this.state = this.attrName;
    }
  } else if (!this.checkClose('onTagName')) {
    this.i++;
  }
};

/**
 * @description 属性名状态
 * @private
 */
Lexer.prototype.attrName = function () {
  var c = this.content[this.i];
  if (blankChar[c] || c === '=') {
    // 解析到属性名
    this.handler.onAttrName(this.content.substring(this.start, this.i));
    var needVal = c === '=';
    var len = this.content.length;
    while (++this.i < len) {
      c = this.content[this.i];
      if (!blankChar[c]) {
        if (this.checkClose()) return;
        if (needVal) {
          // 等号后遇到第一个非空字符
          this.start = this.i;
          this.state = this.attrVal;
          return;
        }
        if (this.content[this.i] === '=') {
          needVal = true;
        } else {
          this.start = this.i;
          this.state = this.attrName;
          return;
        }
      }
    }
  } else if (!this.checkClose('onAttrName')) {
    this.i++;
  }
};

/**
 * @description 属性值状态
 * @private
 */
Lexer.prototype.attrVal = function () {
  var c = this.content[this.i];
  var len = this.content.length;
  if (c === '"' || c === "'") {
    // 有冒号的属性
    this.start = ++this.i;
    this.i = this.content.indexOf(c, this.i);
    if (this.i === -1) return;
    this.handler.onAttrVal(this.content.substring(this.start, this.i));
  } else {
    // 没有冒号的属性
    for (; this.i < len; this.i++) {
      if (blankChar[this.content[this.i]]) {
        this.handler.onAttrVal(this.content.substring(this.start, this.i));
        break;
      } else if (this.checkClose('onAttrVal')) return;
    }
  }
  while (blankChar[this.content[++this.i]]);
  if (this.i < len && !this.checkClose()) {
    this.start = this.i;
    this.state = this.attrName;
  }
};

/**
 * @description 结束标签状态
 * @returns {String} 结束的标签名
 * @private
 */
Lexer.prototype.endTag = function () {
  var c = this.content[this.i];
  if (blankChar[c] || c === '>' || c === '/') {
    this.handler.onCloseTag(this.content.substring(this.start, this.i));
    if (c !== '>') {
      this.i = this.content.indexOf('>', this.i);
      if (this.i === -1) return;
    }
    this.start = ++this.i;
    this.state = this.text;
  } else {
    this.i++;
  }
};
module.exports = Parser;