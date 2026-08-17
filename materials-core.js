// materials-core.js — 材料库纯逻辑（UMD，浏览器 window.MaterialsCore / Node module.exports）
(function (root) {
  'use strict';

  var CATEGORIES = ['简历', '成绩单', '学位证', '毕业证', '学籍报告', '身份证', '头像', '证书', '其他'];

  // hint → 分类 有序匹配（先学位后毕业、先学籍后证书，避免交叉吞并）
  var DEFAULT_MATCHERS = [
    { category: '简历',   re: /简历|resume|cv|个人简历|附件简历/i },
    { category: '成绩单', re: /成绩单|transcript|成绩/i },
    { category: '学位证', re: /学位|degree/i },
    { category: '毕业证', re: /毕业|diploma|graduation|学历证书/i },
    { category: '学籍报告', re: /学籍|学信网|验证报告|学历认证|教育部/i },
    { category: '身份证', re: /身份证|id.?card|证件|身份/i },
    { category: '头像',   re: /头像|照片|证件照|avatar|photo|一寸|二寸|近照/i },
    { category: '证书',   re: /证书|奖|荣誉|certificate|技能|等级|考试|英语|四级|六级|奖状/i },
  ];

  var MIME_MAP = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    txt: 'text/plain',
  };

  function extOf(name) {
    var m = /\.([a-zA-Z0-9]+)$/.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }

  function inferMime(filename) {
    return MIME_MAP[extOf(filename)] || 'application/octet-stream';
  }

  function genId() {
    return 'mat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function classifyMaterialByFilename(name) {
    var n = name || '';
    if (/简历|resume|cv/i.test(n)) return '简历';
    if (/成绩单|成绩|绩点|transcript/i.test(n)) return '成绩单';
    if (/学位/i.test(n)) return '学位证';
    if (/毕业证|毕业证书|diploma|graduation/i.test(n)) return '毕业证';
    if (/学籍|验证报告|学信/i.test(n)) return '学籍报告';
    if (/身份证|id.?card/i.test(n)) return '身份证';
    if (/头像|证件照|照片|avatar|photo|一寸|二寸|近照/i.test(n)) return '头像';
    if (/证书|四级|六级|四六级|计算机|数据库|奖学金|奖状|荣誉|英语|cet|证明|义务兵|教官|纪念|军训|部队|党员/i.test(n)) return '证书';
    return '其他';
  }

  function matchMaterialCategory(hint, matchers) {
    var rules = (matchers && matchers.length) ? matchers : DEFAULT_MATCHERS;
    var h = String(hint || '');
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].re.test(h)) return rules[i].category;
    }
    return null;
  }

  function normalizeMaterial(raw, category) {
    var name = (raw && raw.name) || '未命名文件';
    return {
      id: (raw && raw.id) || genId(),
      name: name,
      size: (raw && raw.size) || 0,
      mime: (raw && raw.mime) || inferMime(name),
      category: category || (raw && raw.category) || classifyMaterialByFilename(name),
      isDefault: !!(raw && raw.isDefault),
      createdAt: (raw && raw.createdAt) || Date.now(),
    };
  }

  // 分类内选默认：isDefault → 文件名含 500k/小于500k → 最小 size
  function pickDefaultMaterial(materials, category) {
    var list = (materials || []).filter(function (m) { return m && m.category === category; });
    if (!list.length) return null;
    var def = list.find(function (m) { return m.isDefault; });
    if (def) return def;
    var compressed = list.find(function (m) { return /500k|小于500k|500kb|_500/i.test(m.name || ''); });
    if (compressed) return compressed;
    return list.slice().sort(function (a, b) { return (a.size || 0) - (b.size || 0); })[0];
  }

  // accept 过滤：accept 形如 ".pdf,.jpg" / "image/*" / "application/pdf" / "*/*"
  function filterByAccept(materials, category, accept) {
    var list = (materials || []).filter(function (m) { return m && m.category === category; });
    if (!accept || !String(accept).trim()) return list;
    var acc = String(accept).toLowerCase();
    var extPats = [];
    var mimePats = [];
    acc.split(/[,\s]+/).forEach(function (t) {
      t = t.trim();
      if (!t) return;
      if (t.charAt(0) === '.') extPats.push(t.slice(1).toLowerCase());
      else if (t.indexOf('/') !== -1) mimePats.push(t);
    });
    if (!extPats.length && !mimePats.length) return list;
    return list.filter(function (m) {
      var ext = extOf(m.name);
      var mime = (m.mime || '').toLowerCase();
      if (extPats.indexOf(ext) !== -1) return true;
      for (var i = 0; i < mimePats.length; i++) {
        var p = mimePats[i];
        if (p === '*/*') return true;
        if (p.slice(-2) === '/*') {
          if (mime.slice(0, p.length - 1) === p.slice(0, -1)) return true;
        } else if (mime === p) return true;
      }
      return false;
    });
  }

  var api = {
    CATEGORIES: CATEGORIES,
    DEFAULT_MATCHERS: DEFAULT_MATCHERS,
    genId: genId,
    inferMime: inferMime,
    classifyMaterialByFilename: classifyMaterialByFilename,
    matchMaterialCategory: matchMaterialCategory,
    normalizeMaterial: normalizeMaterial,
    pickDefaultMaterial: pickDefaultMaterial,
    filterByAccept: filterByAccept,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MaterialsCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
