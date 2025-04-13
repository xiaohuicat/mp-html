"use strict";

/**
 * 根据nodes 获取 html
 * @param {Array} nodes 
 * @returns 
 */
function getHtmlByNodes(nodes) {
  var html = '';
  // 递归遍历nodes获取html
  (function traversal(nodes, table) {
    for (var i = 0; i < nodes.length; i++) {
      var item = nodes[i];
      if (item.type === 'text') {
        // 编码实体
        html += item.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/\xa0/g, '&nbsp;');
      } else {
        // 还原被转换的 svg
        if (item.name === 'img' && (item.attrs.src || '').includes('data:image/svg+xml;utf8,')) {
          html += item.attrs.src.substr(24).replace(/%23/g, '#').replace('<svg', '<svg style="' + (item.attrs.style || '') + '"');
          continue;
        } else if (item.name === 'video' || item.name === 'audio') {
          // 还原 video 和 audio 的 source
          if (item.src.length > 1) {
            item.children = [];
            for (var j = 0; j < item.src.length; j++) {
              item.children.push({
                name: 'source',
                attrs: {
                  src: item.src[j]
                }
              });
            }
          } else {
            item.attrs.src = item.src[0];
          }
        } else if (item.name === 'div' && (item.attrs.style || '').includes('overflow:auto') && (item.children[0] || {}).name === 'table') {
          // 还原滚动层
          item = item.children[0];
        }
        // 还原 table
        if (item.name === 'table') {
          table = item.attrs;
          if ((item.attrs.style || '').includes('display:grid')) {
            item.attrs.style = item.attrs.style.split('display:grid')[0];
            var children = [{
              name: 'tr',
              attrs: {},
              children: []
            }];
            for (var _j = 0; _j < item.children.length; _j++) {
              item.children[_j].attrs.style = item.children[_j].attrs.style.replace(/grid-[^;]+;*/g, '');
              if (item.children[_j].r !== children.length) {
                children.push({
                  name: 'tr',
                  attrs: {},
                  children: [item.children[_j]]
                });
              } else {
                children[children.length - 1].children.push(item.children[_j]);
              }
            }
            item.children = children;
          }
        }
        html += '<' + item.name;
        for (var attr in item.attrs) {
          var val = item.attrs[attr];
          if (!val) continue;
          // bool 型省略值
          if (val === 'T' || val === true) {
            html += ' ' + attr;
            continue;
          } else if (item.name[0] === 't' && attr === 'style' && table) {
            // 取消为了显示 table 添加的 style
            val = val.replace(/;*display:table[^;]*/, '');
            if (table.border) {
              val = val.replace(/border[^;]+;*/g, function ($) {
                return $.includes('collapse') ? $ : '';
              });
            }
            if (table.cellpadding) {
              val = val.replace(/padding[^;]+;*/g, '');
            }
            if (!val) continue;
          }
          html += ' ' + attr + '="' + val.replace(/"/g, '&quot;') + '"';
        }
        html += '>';
        if (item.children) {
          traversal(item.children, table);
          html += '</' + item.name + '>';
        }
      }
    }
  })(nodes);
  return html;
}
module.exports = {
  getHtmlByNodes: getHtmlByNodes
};