"use strict";function e(e){var r="";return function e(t,l){for(var a=0;a<t.length;a++){var s=t[a];if("text"===s.type)r+=s.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/\xa0/g,"&nbsp;");else{if("img"===s.name&&(s.attrs.src||"").includes("data:image/svg+xml;utf8,")){r+=s.attrs.src.substr(24).replace(/%23/g,"#").replace("<svg",'<svg style="'+(s.attrs.style||"")+'"');continue}if("video"===s.name||"audio"===s.name)if(s.src.length>1){s.children=[];for(var n=0;n<s.src.length;n++)s.children.push({name:"source",attrs:{src:s.src[n]}})}else s.attrs.src=s.src[0];else"div"===s.name&&(s.attrs.style||"").includes("overflow:auto")&&"table"===(s.children[0]||{}).name&&(s=s.children[0]);if("table"===s.name&&(l=s.attrs,(s.attrs.style||"").includes("display:grid"))){s.attrs.style=s.attrs.style.split("display:grid")[0];for(var c=[{name:"tr",attrs:{},children:[]}],i=0;i<s.children.length;i++)s.children[i].attrs.style=s.children[i].attrs.style.replace(/grid-[^;]+;*/g,""),s.children[i].r!==c.length?c.push({name:"tr",attrs:{},children:[s.children[i]]}):c[c.length-1].children.push(s.children[i]);s.children=c}for(var d in r+="<"+s.name,s.attrs){var g=s.attrs[d];g&&("T"!==g&&!0!==g?"t"===s.name[0]&&"style"===d&&l&&(g=g.replace(/;*display:table[^;]*/,""),l.border&&(g=g.replace(/border[^;]+;*/g,(function(e){return e.includes("collapse")?e:""}))),l.cellpadding&&(g=g.replace(/padding[^;]+;*/g,"")),!g)||(r+=" "+d+'="'+g.replace(/"/g,"&quot;")+'"'):r+=" "+d)}r+=">",s.children&&(e(s.children,l),r+="</"+s.name+">")}}}(e),r}module.exports={getHtmlByNodes:e};