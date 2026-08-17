# 材料/证书/简历 自动上传 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在招聘页一键把材料库里的本地文件（证书/成绩单/学位毕业证/身份证/头像/简历）自动附加到对应的 `<input type="file">` 上传框。

**Architecture:** 与「岗位清单」同款模式——纯逻辑 `materials-core.js`（UMD，可 `node:test` 单测）+ 独立管理页 `materials.html` + content script 侧边栏加「上传材料」按钮。文件以 base64 存入 `chrome.storage.local`（`material:<id>`），content script 按需取单个文件用 DataTransfer 附加。

**Tech Stack:** 原生 JS（MV3，零依赖、无构建）；Node 22 内置 `node:test` 做单测。

**设计文档：** `docs/superpowers/specs/2026-08-17-material-upload-design.md`

---

## 文件清单

| 操作 | 文件 | 职责 |
|---|---|---|
| 新增 | `materials-core.js` | UMD 纯逻辑：分类/匹配/选默认/accept 过滤 |
| 新增 | `materials-core.test.js` | `node:test` 单测 |
| 新增 | `materials.html` | 材料库管理页骨架 |
| 新增 | `materials.css` | 管理页样式 |
| 新增 | `materials.js` | 管理页逻辑（导入/分类/默认/删除） |
| 修改 | `content.js` | 加「上传材料」「材料库」按钮 + 扫描 + 附加 + 手动兜底 |
| 修改 | `background.js` | 加 `OPEN_MATERIALS` 路由 |
| 修改 | `popup.html` / `popup.js` | 加「材料库」入口 |
| 修改 | `manifest.json` | 加 `unlimitedStorage` + content_scripts 引入 `materials-core.js` |

---

### Task 1: `materials-core.js` 纯逻辑（TDD）

**Files:**
- Create: `materials-core.js`
- Create: `materials-core.test.js`

- [ ] **Step 1: 写失败测试**

创建 `materials-core.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('./materials-core.js');

test('classifyMaterialByFilename 按文件名归类', () => {
  assert.strictEqual(C.classifyMaterialByFilename('兰茂豪的简历.pdf'), '简历');
  assert.strictEqual(C.classifyMaterialByFilename('本科成绩单.jpg'), '成绩单');
  assert.strictEqual(C.classifyMaterialByFilename('研一绩点_专硕.png'), '成绩单');
  assert.strictEqual(C.classifyMaterialByFilename('学位证书_500K.jpg'), '学位证');
  assert.strictEqual(C.classifyMaterialByFilename('毕业证书_500K.jpg'), '毕业证');
  assert.strictEqual(C.classifyMaterialByFilename('研究生-教育部学籍在线验证报告_兰茂豪.pdf'), '学籍报告');
  assert.strictEqual(C.classifyMaterialByFilename('身份证.jpg'), '身份证');
  assert.strictEqual(C.classifyMaterialByFilename('头像512k.jpg'), '头像');
  assert.strictEqual(C.classifyMaterialByFilename('计算机二级C语言证.png'), '证书');
  assert.strictEqual(C.classifyMaterialByFilename('优秀义务兵.jpg'), '证书');
  assert.strictEqual(C.classifyMaterialByFilename('unknown.xyz'), '其他');
});

test('matchMaterialCategory hint→分类 有序匹配', () => {
  assert.strictEqual(C.matchMaterialCategory('请上传学位证书'), '学位证');
  assert.strictEqual(C.matchMaterialCategory('毕业证书'), '毕业证');
  assert.strictEqual(C.matchMaterialCategory('学历证书'), '毕业证');
  assert.strictEqual(C.matchMaterialCategory('请上传个人简历'), '简历');
  assert.strictEqual(C.matchMaterialCategory('本科成绩单'), '成绩单');
  assert.strictEqual(C.matchMaterialCategory('教育部学籍在线验证报告'), '学籍报告');
  assert.strictEqual(C.matchMaterialCategory('身份证'), '身份证');
  assert.strictEqual(C.matchMaterialCategory('上传头像'), '头像');
  assert.strictEqual(C.matchMaterialCategory('四六级证书'), '证书');
  assert.strictEqual(C.matchMaterialCategory(''), null);
  assert.strictEqual(C.matchMaterialCategory('无所谓的内容'), null);
});

test('pickDefaultMaterial 优先 isDefault → 500k → 最小', () => {
  const compressed = [
    { id: 'a', name: '学位证.jpg', size: 5000000, category: '学位证', isDefault: false },
    { id: 'b', name: '学位证_500K.jpg', size: 400000, category: '学位证', isDefault: false },
  ];
  assert.strictEqual(C.pickDefaultMaterial(compressed, '学位证').id, 'b');

  const withDefault = [
    { id: 'a', name: '学位证.jpg', size: 5000000, category: '学位证', isDefault: false },
    { id: 'b', name: '学位证_500K.jpg', size: 400000, category: '学位证', isDefault: false },
    { id: 'c', name: '学位证2.jpg', size: 300000, category: '学位证', isDefault: true },
  ];
  assert.strictEqual(C.pickDefaultMaterial(withDefault, '学位证').id, 'c');

  const smallest = [
    { id: 'a', name: '证书A.jpg', size: 5000, category: '证书', isDefault: false },
    { id: 'b', name: '证书B.jpg', size: 3000, category: '证书', isDefault: false },
  ];
  assert.strictEqual(C.pickDefaultMaterial(smallest, '证书').id, 'b');

  assert.strictEqual(C.pickDefaultMaterial([], '简历'), null);
  assert.strictEqual(C.pickDefaultMaterial(compressed, '不存在的分类'), null);
});

test('filterByAccept 按 accept 过滤', () => {
  const list = [
    { id: 'a', name: '简历.pdf', mime: 'application/pdf', category: '简历' },
    { id: 'b', name: '简历.jpg', mime: 'image/jpeg', category: '简历' },
    { id: 'c', name: '头像.png', mime: 'image/png', category: '头像' },
  ];
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '.pdf').map(m => m.id), ['a']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '.jpg,.png').map(m => m.id), ['b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', 'image/*').map(m => m.id), ['b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', 'application/pdf').map(m => m.id), ['a']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '').map(m => m.id), ['a', 'b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', null).map(m => m.id), ['a', 'b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '*/*').map(m => m.id), ['a', 'b']);
});

test('inferMime 扩展名→MIME', () => {
  assert.strictEqual(C.inferMime('a.pdf'), 'application/pdf');
  assert.strictEqual(C.inferMime('a.JPG'), 'image/jpeg');
  assert.strictEqual(C.inferMime('a.png'), 'image/png');
  assert.strictEqual(C.inferMime('a.xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.strictEqual(C.inferMime('a.unknown'), 'application/octet-stream');
});

test('normalizeMaterial 补全字段', () => {
  const m = C.normalizeMaterial({ name: '简历.pdf', size: 123 }, '简历');
  assert.ok(m.id.startsWith('mat_'));
  assert.strictEqual(m.name, '简历.pdf');
  assert.strictEqual(m.size, 123);
  assert.strictEqual(m.mime, 'application/pdf');
  assert.strictEqual(m.category, '简历');
  assert.strictEqual(m.isDefault, false);
  assert.ok(typeof m.createdAt === 'number');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test materials-core.test.js`
Expected: FAIL（`Cannot find module './materials-core.js'`）

- [ ] **Step 3: 写实现**

创建 `materials-core.js`：

```js
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
    if (/证书|四级|六级|四六级|计算机|数据库|奖学金|奖状|荣誉|英语|cet/i.test(n)) return '证书';
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
          if (mime.slice(0, p.length - 1) === p.slice(0, -2)) return true;
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test materials-core.test.js`
Expected: PASS（6 个 test 全过）

- [ ] **Step 5: 提交**

```bash
git add materials-core.js materials-core.test.js
git commit -m "feat: 材料库纯逻辑（分类/匹配/选默认/accept过滤）"
```

---

### Task 2: 管理页骨架 `materials.html` + `materials.css`

**Files:**
- Create: `materials.html`
- Create: `materials.css`

- [ ] **Step 1: 创建 `materials.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <title>材料库管理</title>
  <link rel="stylesheet" href="materials.css"/>
</head>
<body>

<div class="topbar">
  <h1>📁 材料库</h1>
  <div class="top-actions">
    <button id="btn-import">导入文件</button>
    <input type="file" id="file-input" multiple hidden/>
  </div>
</div>

<div class="stats" id="stats"></div>

<div class="drop-zone" id="drop-zone">
  <div class="drop-hint">把文件拖到这里，或点右上角「导入文件」（可一次多选/整目录）</div>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr><th style="width:40%">文件名</th><th>分类</th><th>大小</th><th style="width:60px">默认</th><th style="width:70px">操作</th></tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
</div>

<div class="toast" id="toast"></div>

<script src="materials-core.js"></script>
<script src="materials.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `materials.css`**

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif; color: #1f2937; background: #f5f7fa; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10; }
.topbar h1 { font-size: 18px; margin: 0; }
#btn-import { padding: 7px 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
#btn-import:hover { opacity: .88; }
.stats { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 20px 0; }
.chip { background: #eef2ff; color: #4338ca; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
.drop-zone { margin: 12px 20px 0; padding: 22px; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #94a3b8; font-size: 13px; background: #fff; transition: border-color .2s, background .2s; }
.drop-zone.drag-over { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.table-wrap { background: #fff; border: 1px solid #e5e7eb; margin: 12px 20px 20px; border-radius: 8px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
th { background: #f9fafb; color: #6b7280; font-weight: 600; white-space: nowrap; }
.cell-name { word-break: break-all; }
.cat-select { border: 1px solid #d1d5db; border-radius: 4px; padding: 3px 4px; font-size: 12px; }
.def-radio { cursor: pointer; }
.btn-del { border: none; background: #fef2f2; color: #dc2626; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.empty { text-align: center; color: #9ca3af; padding: 30px; }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #111827; color: #fff; padding: 8px 16px; border-radius: 8px; opacity: 0; transition: opacity .2s; font-size: 13px; }
.toast.show { opacity: 1; }
```

- [ ] **Step 3: 语法/ID 校验（先只验 HTML 结构，逻辑下一步写）**

Run: `node -e "JSON.stringify(require('fs').readFileSync('materials.html','utf8'))" `（确认文件可读、无乱码）
Expected: 无报错输出

- [ ] **Step 4: 提交**

```bash
git add materials.html materials.css
git commit -m "feat: 材料库管理页骨架"
```

---

### Task 3: 管理页逻辑 `materials.js`

**Files:**
- Create: `materials.js`

- [ ] **Step 1: 创建 `materials.js`**

```js
(function () {
  'use strict';
  var C = window.MaterialsCore;

  var state = { list: [] };

  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function findById(id) { return state.list.find(function (m) { return m.id === id; }); }
  function fmtSize(n) {
    n = n || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }
  function toast(m) { var t = $('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(function () { t.className = 'toast'; }, 2000); }

  function load() {
    return new Promise(function (res) {
      chrome.storage.local.get('materials', function (d) {
        state.list = Array.isArray(d.materials) ? d.materials : [];
        res();
      });
    });
  }
  function saveMeta() {
    return new Promise(function (res) { chrome.storage.local.set({ materials: state.list }, res); });
  }

  function render() { renderStats(); renderTable(); }

  function renderStats() {
    var total = state.list.length;
    var bytes = state.list.reduce(function (s, m) { return s + (m.size || 0); }, 0);
    var html = '<span class="chip">文件 ' + total + '</span>';
    html += '<span class="chip">总大小 ' + fmtSize(bytes) + '</span>';
    C.CATEGORIES.forEach(function (c) {
      var n = state.list.filter(function (m) { return m.category === c; }).length;
      if (n) html += '<span class="chip">' + esc(c) + ' ' + n + '</span>';
    });
    $('stats').innerHTML = html;
  }

  function renderTable() {
    if (!state.list.length) {
      $('tbody').innerHTML = '<tr><td colspan="5" class="empty">暂无材料，点右上角「导入文件」或拖入文件</td></tr>';
      return;
    }
    var rows = state.list.map(function (m) {
      var catSel = '<select class="cat-select" data-id="' + esc(m.id) + '">' +
        C.CATEGORIES.map(function (c) { return '<option' + (c === m.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
        '</select>';
      var defRadio = '<input type="radio" class="def-radio" name="def-' + esc(m.category) + '" data-id="' + esc(m.id) + '"' + (m.isDefault ? ' checked' : '') + '>';
      return '<tr>' +
        '<td class="cell-name">' + esc(m.name) + '</td>' +
        '<td>' + catSel + '</td>' +
        '<td>' + fmtSize(m.size) + '</td>' +
        '<td>' + defRadio + '</td>' +
        '<td><button class="btn-del" data-act="del" data-id="' + esc(m.id) + '">删除</button></td>' +
        '</tr>';
    }).join('');
    $('tbody').innerHTML = rows;
  }

  function importFiles(fileList) {
    var files = Array.prototype.slice.call(fileList);
    if (!files.length) return;
    var remaining = files.length;
    var ok = 0;
    files.forEach(function (f) {
      var reader = new FileReader();
      reader.onload = function () {
        var b64 = String(reader.result).split(',')[1]; // dataURL 去掉 "data:...;base64," 头
        var meta = C.normalizeMaterial({ name: f.name, size: f.size, mime: f.type || '' }, null);
        chrome.storage.local.set({ ['material:' + meta.id]: b64 }, function () {
          state.list.push(meta);
          ok++;
          if (--remaining === 0) { saveMeta().then(function () { render(); toast('导入成功 ' + ok + ' 个文件'); }); }
        });
      };
      reader.onerror = function () {
        if (--remaining === 0) { saveMeta().then(function () { render(); toast('导入失败'); }); }
      };
      reader.readAsDataURL(f);
    });
  }

  function delMaterial(id) {
    var m = findById(id); if (!m) return;
    if (!confirm('删除「' + m.name + '」？')) return;
    state.list = state.list.filter(function (x) { return x.id !== id; });
    chrome.storage.local.remove('material:' + id, function () {
      saveMeta().then(function () { render(); toast('已删除'); });
    });
  }

  function bind() {
    $('btn-import').addEventListener('click', function () { $('file-input').click(); });
    $('file-input').addEventListener('change', function (e) { importFiles(e.target.files); e.target.value = ''; });

    var dz = $('drop-zone');
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', function () { dz.classList.remove('drag-over'); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault(); dz.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
    });

    $('tbody').addEventListener('change', function (e) {
      if (e.target.classList.contains('cat-select')) {
        var m = findById(e.target.getAttribute('data-id')); if (!m) return;
        m.category = e.target.value;
        saveMeta().then(render);
      } else if (e.target.classList.contains('def-radio')) {
        var id = e.target.getAttribute('data-id');
        var m = findById(id); if (!m) return;
        state.list.forEach(function (x) { if (x.category === m.category) x.isDefault = (x.id === id); });
        saveMeta().then(render);
      }
    });
    $('tbody').addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'del') delMaterial(e.target.getAttribute('data-id'));
    });
  }

  async function init() { bind(); await load(); render(); }
  init();
})();
```

- [ ] **Step 2: 语法检查**

Run: `node --check materials.js`
Expected: 无输出（语法通过）

- [ ] **Step 3: 提交**

```bash
git add materials.js
git commit -m "feat: 材料库管理页逻辑（导入/分类/默认/删除）"
```

---

### Task 4: content.js 集成（按钮 + 扫描 + 附加 + 手动兜底）

**Files:**
- Modify: `content.js`

- [ ] **Step 1: 面板 HTML 加两个按钮**

在 `content.js` 面板模板里，把：

```html
      <button id="__rf_clear_hl__" style="display:none">🧹 清除高亮</button>
      <button id="__rf_manage__">⚙ 管理简历</button>
```

改为：

```html
      <button id="__rf_clear_hl__" style="display:none">🧹 清除高亮</button>
      <button id="__rf_upload__">📁 上传材料</button>
      <button id="__rf_materials__">📁 材料库</button>
      <button id="__rf_manage__">⚙ 管理简历</button>
```

- [ ] **Step 2: 加按钮样式**

在 `content.js` 的 style 块里，把：

```css
    #__rf_manage__   { background: #6b46c1; color: #e9d8fd; font-size: 12px; }
    #__rf_clear_hl__ { background: #718096; color: #fff; font-size: 12px; }
```

改为：

```css
    #__rf_upload__    { background: #d97706; color: #fff; }
    #__rf_materials__ { background: #4a5568; color: #fff; font-size: 12px; }
    #__rf_manage__    { background: #6b46c1; color: #e9d8fd; font-size: 12px; }
    #__rf_clear_hl__  { background: #718096; color: #fff; font-size: 12px; }
    #__rf_file_picker__ { padding: 6px 12px 10px; }
    .__rf_pick_row__ { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .__rf_pick_label__ { flex: 0 0 90px; font-size: 11px; color: #a0c4e8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .__rf_pick_row__ select { flex: 1; min-width: 0; background: #2d3748; color: #e2e8f0; border: 1px solid #4a5568; border-radius: 4px; font-size: 11px; padding: 3px 4px; }
```

- [ ] **Step 3: 加材料上传逻辑（插在「接收 popup 消息」监听器之前）**

在 `content.js` 里，`// ===== 接收 popup 消息 =====` 这一行**之前**插入：

```js
  // ===== 材料上传 =====
  const C = window.MaterialsCore;

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function scanFileInputs() {
    return [...document.querySelectorAll('input[type=file]')]
      .filter(el => !el.disabled && !el.closest('#__rf_panel__'));
  }

  function clearFilePicker() {
    const old = document.getElementById('__rf_file_picker__');
    if (old) old.remove();
  }

  function b64ToFile(b64, name, mime) {
    const bytes = atob(b64);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
    return new File([buf], name, { type: mime });
  }

  async function attachFileToInput(input, meta) {
    try {
      const key = `material:${meta.id}`;
      const data = await new Promise(r => chrome.storage.local.get(key, r));
      const b64 = data[key];
      if (!b64) return false;
      const file = b64ToFile(b64, meta.name, meta.mime);
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.classList.remove('__rf_matched__', '__rf_unmatched__');
      input.classList.add('__rf_filled__');
      hlDone(input);
      return true;
    } catch (e) {
      hlFailed(input);
      return false;
    }
  }

  function renderManualPicker(pending, materials) {
    clearFilePicker();
    if (!pending.length) return;
    const box = document.createElement('div');
    box.id = '__rf_file_picker__';
    box.innerHTML = pending.map(function (p, i) {
      const options = C.CATEGORIES.flatMap(function (c) {
        return materials.filter(function (m) { return m.category === c; })
          .map(function (m) { return '<option value="' + escHtml(m.id) + '">' + escHtml(c) + '：' + escHtml(m.name) + '</option>'; });
      }).join('');
      const label = p.hint ? p.hint.slice(0, 16) : ('上传框' + (i + 1));
      return '<div class="__rf_pick_row__">' +
        '<span class="__rf_pick_label__" title="' + escHtml(p.hint || '') + '">' + escHtml(label) + '</span>' +
        '<select data-idx="' + i + '"><option value="">— 选择材料 —</option>' + options + '</select>' +
        '</div>';
    }).join('');
    document.getElementById('__rf_body__').appendChild(box);

    box.querySelectorAll('select').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        const meta = materials.find(function (m) { return m.id === sel.value; });
        if (!meta) return;
        const ok = await attachFileToInput(pending[Number(sel.dataset.idx)].el, meta);
        sel.closest('.__rf_pick_row__').style.opacity = ok ? '0.4' : '';
      });
    });
  }

  async function runMaterialUpload() {
    clearLog();
    clearFilePicker();
    document.querySelectorAll('.__rf_matched__, .__rf_filled__, .__rf_unmatched__').forEach(el => {
      el.classList.remove('__rf_matched__', '__rf_filled__', '__rf_unmatched__');
    });

    const { materials } = await new Promise(r => chrome.storage.local.get('materials', r));
    if (!Array.isArray(materials) || materials.length === 0) {
      log('⚠ 材料库为空');
      log('  → 点下方「材料库」先导入文件');
      return;
    }

    const inputs = scanFileInputs();
    if (inputs.length === 0) {
      log('未找到文件上传框（input[type=file]）');
      return;
    }

    const matched = [];
    const pending = [];
    inputs.forEach(function (el) {
      const hint = getHint(el);
      const category = C.matchMaterialCategory(hint);
      const accept = el.getAttribute('accept') || '';
      if (!category) {
        pending.push({ el: el, hint: hint });
        el.classList.add('__rf_unmatched__');
        return;
      }
      const candidates = C.filterByAccept(materials, category, accept);
      const meta = C.pickDefaultMaterial(candidates, category);
      if (meta) {
        matched.push({ el: el, meta: meta });
        el.classList.add('__rf_matched__');
      } else {
        pending.push({ el: el, hint: hint });
        el.classList.add('__rf_unmatched__');
      }
    });

    log(`识别到 ${inputs.length} 个上传框：`);
    log(`  ✅ 已匹配 ${matched.length} 个`);

    let ok = 0;
    for (const { el, meta } of matched) {
      if (await attachFileToInput(el, meta)) ok++;
    }

    if (pending.length) {
      log(`  ⚠ ${pending.length} 个待手动处理（下方选择）：`);
      pending.slice(0, 5).forEach(({ hint }) => log(`  ? "${(hint || '').slice(0, 35)}"`));
      renderManualPicker(pending, materials);
    }

    clearLog();
    if (ok) {
      log(`✅ 已上传 ${ok}/${matched.length} 个文件`);
      log('蓝色=已上传，请检查后提交！');
      document.getElementById('__rf_clear_hl__').style.display = '';
    } else if (!pending.length) {
      log('没有可上传的文件');
    }
    if (!pending.length) log('黄色=未能自动匹配，请手动点击文件框选择');
  }

  document.getElementById('__rf_upload__').addEventListener('click', runMaterialUpload);
  document.getElementById('__rf_materials__').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_MATERIALS' });
  });
```

- [ ] **Step 4: 语法检查**

Run: `node --check content.js`
Expected: 无输出（语法通过）

- [ ] **Step 5: 提交**

```bash
git add content.js
git commit -m "feat: 内容脚本材料上传（扫描/自动匹配/DataTransfer/手动兜底）"
```

---

### Task 5: background 路由 + popup 入口 + manifest

**Files:**
- Modify: `background.js`
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `manifest.json`

- [ ] **Step 1: background.js 加 OPEN_MATERIALS 路由**

在 `background.js` 的 `OPEN_OPTIONS` 分支后加：

```js
  if (msg.type === 'OPEN_MATERIALS') {
    chrome.tabs.create({ url: chrome.runtime.getURL('materials.html') });
    return;
  }
```

- [ ] **Step 2: popup.html 加「材料库」按钮**

在 `popup.html` 的「岗位清单」按钮后加：

```html
  <button class="btn btn-secondary" id="btn-materials">📁 材料库</button>
```

- [ ] **Step 3: popup.js 加点击处理**

在 `popup.js` 的 `btn-jobs` 处理块后加：

```js
// 打开材料库管理页
document.getElementById('btn-materials').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('materials.html') });
  window.close();
});
```

- [ ] **Step 4: manifest.json 加权限 + content_scripts 引入 materials-core.js**

把 `manifest.json` 的：

```json
  "permissions": ["storage", "activeTab", "scripting", "tabs"],
```

改为：

```json
  "permissions": ["storage", "activeTab", "scripting", "tabs", "unlimitedStorage"],
```

并把 `content_scripts` 的：

```json
      "js": ["content.js"],
```

改为：

```json
      "js": ["materials-core.js", "content.js"],
```

- [ ] **Step 5: 校验 manifest JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest OK')"`
Expected: `manifest OK`

- [ ] **Step 6: 提交**

```bash
git add background.js popup.html popup.js manifest.json
git commit -m "feat: 材料库入口（popup/面板）+ unlimitedStorage 权限"
```

---

### Task 6: 集成验证与收尾

**Files:** 无新增，验证 + 收尾

- [ ] **Step 1: 跑全部单测**

Run: `node --test materials-core.test.js jobs-core.test.js`
Expected: 全部 PASS（材料 6 个 + 岗位 11 个）

- [ ] **Step 2: 语法检查所有改动 JS**

Run: `node --check materials-core.js && node --check materials.js && node --check content.js && node --check background.js && node --check popup.js`
Expected: 无输出（全部通过）

- [ ] **Step 3: 交叉校验 materials.html 与 materials.js 的元素 ID**

逐个确认 materials.js 用到的 `$('...')` ID（`btn-import` `file-input` `drop-zone` `stats` `tbody` `toast`）都在 materials.html 中存在，且 `materials.html` 的 `<script>` 顺序为 `materials-core.js` → `materials.js`。

- [ ] **Step 4: 确认 content.js 与 manifest 的 materials-core.js 加载顺序**

确认 `manifest.json` content_scripts `js` 为 `["materials-core.js", "content.js"]`，且 content.js 里 `window.MaterialsCore` 在使用前已由前一个脚本设置。

- [ ] **Step 5: 提交收尾（如有遗漏文件）**

```bash
git status
git add -A
git commit -m "chore: 材料上传功能集成收尾" || echo "无改动可提交"
```

---

## 自审记录

- **Spec 覆盖**：§2 存储（Task 3 导入 + Task 4 按需读取）✓；§4 分类匹配（Task 1）✓；§5 纯逻辑 API（Task 1 全部函数）✓；§6 管理页（Task 2/3）✓；§7 content 集成（Task 4）✓；§8 manifest（Task 5）✓；§10 测试（Task 1 + Task 6）✓。
- **占位符扫描**：无 TBD/TODO；所有代码完整。
- **类型/命名一致性**：`MaterialsCore` 全局名、`material:<id>` key、`materials` 元数据数组、`matchMaterialCategory`/`pickDefaultMaterial`/`filterByAccept` 签名在 core 与 content/页面间一致。
- **转义一致性**：content.js 的材料上传代码自带 `escHtml()` 转义（面板原代码无 `esc`），不依赖外部函数。

---

## 完成后的手工验证清单（交给用户）

1. `chrome://extensions` 重新加载扩展（manifest 改了权限，必须 reload）。
2. 打开 popup →「📁 材料库」→ 拖入 `F:\找工作\材料` 里的常用文件 + 简历 + 头像 + 身份证（优先拖 `_500K`/`小于500K` 压缩版）。
3. 在材料库页给每个分类勾选「默认」（或直接靠 500k/最小 规则）。
4. 打开一个招聘申请页 → 点悬浮面板「📁 上传材料」→ 看是否自动附加、未匹配的用黄色标出并可用下拉手动指定。
5. 重点验证：学位证 vs 毕业证 不串、accept 过滤不塞错格式、个别强校验网站是否需手动点选。
