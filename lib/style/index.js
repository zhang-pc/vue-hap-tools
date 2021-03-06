"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function processImport(e, t, s, a) {
  var r = e,
    n = e.match(/@import\s+((?:['"]([^()]+?)['"])|(?:(?:url\(([^()]+?)\))))\s*;/g);
  return n && n.length > 0 && (t ? n.forEach(function (e) {
    var n = e.match(/(?:['"]([^()]+?)['"])|(?:(?:url\(([^()]+?)\)))/);
    if (n.length > 1) {
      var o = _path2.default.resolve(t, n[1] || n[2]),
        l = _fs2.default.readFileSync(o);
      if (l) {
        var i = _path2.default.dirname(o);
        r = r.replace(e, "\n" + processImport(l.toString(), i, s, a) + "\n"), a.addDependency(o)
      } else s.push({
        line: 1,
        column: 1,
        reason: "ERROR: 找不到文件 `" + e + "` , 导入失败"
      })
    }
  }) : s.push({
    line: 1,
    column: 1,
    reason: "ERROR: 找不到资源路径, 无法处理@import"
  })), r
}

function parse(e, t) {
  var s = void 0,
    a = {},
    r = [],
    n = e.code || "",
    o = e.loader;
  n = processImport(n, _path2.default.dirname(o.resourcePath), r, e.loader);
  n = commentDelete(n);
  var l = _css2.default.parse(n, {
    silent: !0
  });
  l.stylesheet.parsingErrors && l.stylesheet.parsingErrors.length && (s = l.stylesheet.parsingErrors, s.forEach(function (e) {
    r.push({
      line: e.line,
      column: e.column,
      reason: e.toString()
    })
  })), l && "stylesheet" === l.type && l.stylesheet && l.stylesheet.rules && l.stylesheet.rules.length && l.stylesheet.rules.forEach(function (e) {
    var t = e.type,
      s = {};
    if ("rule" === t) {
      if (e.declarations && e.declarations.length) {
        e.declarations.forEach(function (e) {
          if ("declaration" === e.type) {
            e.value = styleProcess.convertRem(e.value);
            var t = e.property,
              a = e.value,
              n = (0, _utils.hyphenedToCamelCase)(t),
              o = (0, _validator.validate)(n, a);
            o.value.forEach(function (e) {
              (0, _utils.isValidValue)(e.v) && (s[e.n] = e.v)
            }), o.log && r.push({
              line: e.position.start.line,
              column: e.position.start.column,
              reason: o.log.reason
            })
          }
        });
        var n = /^[.#]?[A-Za-z0-9_\-:]+$/,
          o = /^([.#]?[A-Za-z0-9_-]+(\s+|\s*>\s*))+([.#]?[A-Za-z0-9_\-:]+)$/;
        e.selectors.forEach(function (t) {
          const res = styleProcess.hackSelector(t);
          var l = {
            key: res.selector,
            val: s
          };
          res.log && r.push({
            line: e.position.start.line,
            column: e.position.start.column,
            reason: res.log
          });
          if (t.match(n)) {
            if (!processPseudoClass(l, r, e)) return;
            a[l.key] ? (t !== l.key || (0, _utils.equals)(a[l.key], l.val, cssCompare) || r.push({
              line: e.position.start.line,
              column: e.position.start.column,
              reason: "WARN: 选择器 `" + l.key + "` 已经存在，后者合并前者"
            }), a[l.key] = (0, _utils.extend)({}, a[l.key], l.val)) : a[l.key] = l.val
          } else if (t.match(o)) {
            var i = processPseudoClass(l, r, e);
            if (!i) return;
            if (a[l.key]) {
              t !== l.key || (0, _utils.equals)(a[l.key], l.val, cssCompare) || r.push({
                line: e.position.start.line,
                column: e.position.start.column,
                reason: "WARN: 选择器 `" + l.key + "` 已经存在，后者合并前者"
              });
              try {
                l.val = Object.assign({}, l.val), l.val._meta = {}, l.val._meta.ruleDef = compressCss((0, _cssWhat2.default)(l.key)), a[l.key] = (0, _utils.extend)({}, a[l.key], l.val)
              } catch (t) {
                return void r.push({
                  line: e.position.start.line,
                  column: e.position.start.column,
                  reason: "ERROR: 选择器 `" + l.key + "` 不支持"
                })
              }
            } else try {
              l.val = Object.assign({}, l.val), l.val._meta = {}, l.val._meta.ruleDef = compressCss((0, _cssWhat2.default)(l.key)), a[l.key] = l.val
            } catch (t) {
              return void r.push({
                line: e.position.start.line,
                column: e.position.start.column,
                reason: "ERROR: 选择器 `" + l.key + "` 不支持"
              })
            }
          } else r.push({
            line: e.position.start.line,
            column: e.position.start.column,
            reason: "ERROR: 选择器 `" + t + "` 非法"
          })
        })
      }
    } else if ("font-face" === t) e.declarations && e.declarations.length && (e.declarations.forEach(function (e) {
      if ("declaration" === e.type) {
        var t = (0, _utils.hyphenedToCamelCase)(e.property),
          a = e.value;
        "fontFamily" === t && "'".indexOf(a[0]) > -1 && (a = a.slice(1, a.length - 1)), s[t] = a
      }
    }), a["@FONT-FACE"] || (a["@FONT-FACE"] = []), a["@FONT-FACE"].push(s));
    else if ("keyframes" === t && e.keyframes && e.keyframes.length) {
      var l = e.name,
        i = [];
      e.keyframes.forEach(function (t) {
        var s = void 0;
        if ("keyframe" === t.type && t.declarations && t.declarations.length)
          if (s = {}, t.declarations.forEach(function (e) {
              if ("declaration" === e.type) {
                var t = e.property,
                  a = e.value,
                  n = (0, _utils.hyphenedToCamelCase)(t),
                  o = (0, _validator.validate)(n, a);
                o.value.forEach(function (e) {
                  (0, _utils.isValidValue)(e.v) && (s[e.n] = e.v)
                }), o.log && r.push({
                  line: e.position.start.line,
                  column: e.position.start.column,
                  reason: o.log.reason
                })
              }
            }), (0, _utils.isEmptyObject)(s)) r.push({
            line: e.position.start.line,
            column: e.position.start.column,
            reason: "ERROR: 动画 `" + l + "` 的关键帧 `" + JSON.stringify(t.values) + "` 没有有效的属性"
          });
          else {
            var a = void 0;
            t.values.forEach(function (e) {
              a = "from" === e ? 0 : "to" === e ? 100 : parseFloat(e.replace("%", "")), s.time = a, i.push(s)
            })
          }
      }), i.sort(function (e, t) {
        return e.time - t.time
      }), a["@KEYFRAMES"] || (a["@KEYFRAMES"] = {}), a["@KEYFRAMES"][l] = i
    }
  }), t(s, {
    jsonStyle: a,
    log: r
  })
}

function processPseudoClass(e, t, s) {
  var a = e.key.indexOf(":");
  if (a > -1) {
    var r = e.key.slice(a);
    if (!(0, _validator.validatePseudoClass)(r)) return t.push({
      line: s.position.start.line,
      column: s.position.start.column,
      reason: "ERROR: 不支持伪类选择器`" + r + "`"
    }), !1;
    e.key = e.key.slice(0, a);
    var n = {};
    Object.keys(e.val).forEach(function (t) {
      n[t + r] = e.val[t]
    }), e.val = n
  }
  return !0
}

function cssCompare(e, t, s) {
  if ("_meta" === s) return !0
}

function compressCss(e) {
  e = e[0] || [];
  for (var t = 0; t < e.length; t++) ! function (t) {
    var s = e[t] || {};
    compressCssList.forEach(function (e) {
      s.hasOwnProperty(e.oldN) && (s[e.newN] = s[e.oldN], delete s[e.oldN], e.oldV && e.oldV.indexOf(s[e.newN]) > -1 && (s[e.newN] = e.newV[e.oldV.indexOf(s[e.newN])]))
    })
  }(t);
  return e
}
var _utils = require("../utils"),
  _validator = require("./validator"),
  _css = require("css"),
  _css2 = _interopRequireDefault(_css),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _cssWhat = require("css-what"),
  _cssWhat2 = _interopRequireDefault(_cssWhat),
  styleProcess = require('../../convert/pre-process/style-process'),
  commentDelete = require('../../convert/utils/comment-delete'),
  compressCssList = [{
    newN: "t",
    oldN: "type",
    newV: ["d", "a", "t", "u", "p", "pe"],
    oldV: ["descendant", "attribute", "tag", "universal", "pseudo", "pseudo-element"]
  }, {
    newN: "n",
    oldN: "name"
  }, {
    newN: "i",
    oldN: "ignoreCase"
  }, {
    newN: "a",
    oldN: "action"
  }, {
    newN: "v",
    oldN: "value"
  }];
module.exports = {
  parse: parse,
  validateDelaration: _validator.validate
};