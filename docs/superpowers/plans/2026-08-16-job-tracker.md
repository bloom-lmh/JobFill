# 岗位清单追踪 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 JobFill 扩展中新增一个独立的「岗位清单」页面，导入约 700 条岗位、追踪六态投递状态、点击直达官网。

**Architecture:** 纯逻辑抽到 `jobs-core.js`（UMD 导出，Node 可单测），页面逻辑在 `jobs.js`（Vanilla JS，与 options.js 同风格），数据存 `chrome.storage.local.jobList`。xlsx 归一用一次性 Node 脚本（SheetJS）。

**Tech Stack:** Vanilla JS + HTML/CSS（MV3 扩展，零运行时依赖）；测试用 Node 22 内置 `node:test`；xlsx 解析用 SheetJS（仅一次性转换，不进运行时）。

---

## 文件结构

- **创建** `jobs-core.js` —— 纯逻辑（校验/归一/过滤/排序/截止标红/状态流转），UMD 导出 `window.JobCore` + `module.exports`
- **创建** `jobs-core.test.js` —— `node:test` 单测
- **创建** `jobs.html` —— 页面骨架 + 编辑弹窗
- **创建** `jobs.css` —— 样式（复用现有配色，简洁表格）
- **创建** `jobs.js` —— 页面逻辑（存储/渲染/筛选/导入导出/增改删/投递）
- **创建** `tools/convert.mjs` + `tools/package.json` —— 一次性 xlsx→JSON 脚本（gitignore `tools/node_modules`）
- **修改** `popup.html` / `popup.js` —— 加「岗位清单」入口
- **创建**（产物）`岗位清单.json` —— 转换结果（gitignore）

---

## Task 1: xlsx → 岗位清单.json（数据准备）

**Files:**
- Create: `tools/package.json`
- Create: `tools/convert.mjs`
- Create: `岗位清单.json`（产物）
- Modify: `.gitignore`（追加 `岗位清单.json` 和 `tools/node_modules/`）

- [ ] **Step 1: 准备转换环境**

创建 `tools/package.json`：

```json
{
  "name": "jobfill-tools",
  "private": true,
  "type": "module",
  "dependencies": { "xlsx": "^0.18.5" }
}
```

Run:
```bash
cd "C:/Users/13575/Desktop/job2/JobFill/tools" && npm install
```
Expected: 生成 `node_modules`，无报错。

- [ ] **Step 2: 写转换脚本**

创建 `tools/convert.mjs`（列名→标准字段映射，未识别列折叠进 note）：

```js
import XLSX from 'xlsx';
import fs from 'fs';

const BASE = 'F:/找工作/岗位清单/';

// 每张表：文件 + 表索引(0基) + 分类 + 标题行所在行(0基，通常第1行是表头)
const SHEET_CFG = [
  { file: '岗位清单1.xlsx', sheet: 1, category: '私企', headerRow: 0 },
  { file: '岗位清单1.xlsx', sheet: 2, category: '编制', headerRow: 0 },
  { file: '岗位清单1.xlsx', sheet: 3, category: '考编', headerRow: 0 },
  { file: '岗位清单1.xlsx', sheet: 4, category: '考公', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 1, category: '编制', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 2, category: '考编', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 3, category: '考公', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 0, category: '私企', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 1, category: '编制', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 2, category: '考编', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 3, category: '考公', headerRow: 0 },
];

// 列名（去掉空白/括号后缀后）→ 标准字段
const FIELD_MAP = {
  '序号': null, '地区': 'region', '省市': 'region', '省/市': 'region', '区县/地区': 'region', '区县': 'region', '地区分类': 'note',
  '岗位名称': 'position', '岗位方向': 'position', '推荐岗位方向': 'position', '目标方向': 'advantage', '岗位类别': 'note', '岗位层级': 'note',
  '目标单位（示例）': 'company', '目标单位': 'company', '招聘单位示例': 'company', '代表单位': 'company', '招录单位': 'company', '单位类型': 'note', '单位类型/行业': 'note', '编制类型': 'note',
  '薪资区间(万/年)': 'salary', '薪资区间': 'salary', '年薪范围(万)': 'salary', '年薪/待遇(万)': 'salary',
  '工作强度': 'note', '加班强度': 'note', '社交强度': 'note', '社交应酬强度': 'note', '出差频率': 'note', '是否出差': 'note', '值班情况': 'note', '是否值班': 'note', '稳定度': 'note',
  '竞争程度': 'competition', '竞争难度': 'competition', '上岸难度评估': 'competition', '进面难度': 'competition',
  '匹配优势': 'advantage',
  '投递渠道': 'channel', '招聘渠道/公告来源': 'channel', '报考渠道': 'channel', '官方入口': 'channel',
  '投递链接': 'link', '直达公告链接': 'link', '直达公告/入口': 'link', '直达公告': 'link', '近期公告直达': 'link',
  '招聘批次': 'note', '资格提示': 'note', '资格风险': 'note', '退役定向核验': 'note', '退役军人政策': 'note', '退役军人定向': 'note', '退役定向': 'note', '笔试科目': 'note', '学历/专业要求': 'note', '生活成本': 'note', '交通便利度': 'note', '推荐指数': 'note', '备注': 'note', '备注/建议': 'note', '备注(建议)': 'note',
};

const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, '').replace(/[（(（【].*$/, '');
const clean = (s) => String(s == null ? '' : s).trim();

let all = [];
for (const cfg of SHEET_CFG) {
  const wb = XLSX.readFile(BASE + cfg.file);
  const ws = wb.Sheets[wb.SheetNames[cfg.sheet]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length <= cfg.headerRow) continue;
  const headers = rows[cfg.headerRow].map(norm);
  const colToField = headers.map((h) => FIELD_MAP[h] || '_unknown_' + h);

  for (const row of rows.slice(cfg.headerRow + 1)) {
    if (row.length === 0) continue;
    const job = { category: cfg.category, region: '', position: '', company: '', salary: '', competition: '', advantage: '', channel: '', link: '', note: '' };
    const notes = [];
    row.forEach((cell, i) => {
      const field = colToField[i];
      const v = clean(cell);
      if (!v) return;
      if (!field || field === null) return;
      if (field.startsWith('_unknown_')) { if (v) notes.push(headers[i] + '：' + v); return; }
      if (field === 'note') { notes.push(v); return; }
      if (!job[field]) job[field] = v;
    });
    job.note = notes.join('；');
    if (!job.position) continue; // 无岗位名的空行跳过
    all.push(job);
  }
}

fs.writeFileSync(new URL('../岗位清单.json', import.meta.url), JSON.stringify(all, null, 2), 'utf8');
console.log('总条数:', all.length);
console.log('分类分布:', all.reduce((m, j) => { m[j.category] = (m[j.category] || 0) + 1; return m; }, {}));
console.log('含链接条数:', all.filter((j) => j.link).length);
console.log('样例:', JSON.stringify(all[0], null, 2));
```

Run:
```bash
cd "C:/Users/13575/Desktop/job2/JobFill/tools" && node convert.mjs
```

- [ ] **Step 3: 核对输出并修正 sheet 配置**

检查打印的分类分布是否合理（私企/编制/考编/考公四类都有、总条数接近 700）。若某张表分类错位（如某 sheet 其实是空表或说明页），改 `SHEET_CFG` 里对应的 `sheet` 索引重跑，直到：
- 总条数 ≈ 600–750
- 四类均非空
- `含链接条数` > 0

- [ ] **Step 4: 校验 JSON 合法并入库目录**

Run:
```bash
node -e "const d=require('C:/Users/13575/Desktop/job2/JobFill/岗位清单.json'); console.log('合法，条数', d.length, '首条', d[0].position, d[0].category)"
```
Expected: 打印合法 + 条数 + 首条岗位名与分类。

- [ ] **Step 5: 更新 .gitignore 并提交**

`.gitignore` 追加：
```
岗位清单.json
tools/node_modules/
```
```bash
cd "C:/Users/13575/Desktop/job2/JobFill" && git add tools/convert.mjs tools/package.json .gitignore && git commit -m "feat: 岗位清单 xlsx 转 JSON 脚本"
```
（`岗位清单.json` 与 `tools/node_modules` 被忽略，不提交。）

---

## Task 2: jobs-core.js 纯逻辑 + node:test 单测（TDD）

**Files:**
- Create: `jobs-core.js`
- Test: `jobs-core.test.js`

- [ ] **Step 1: 写失败测试**

创建 `jobs-core.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('./jobs-core.js');

test('normalizeJob 补全默认值', () => {
  const j = C.normalizeJob({ position: '前端', status: '已投递' }, '私企');
  assert.strictEqual(j.position, '前端');
  assert.strictEqual(j.status, '已投递');
  assert.strictEqual(j.category, '私企');
  assert.strictEqual(j.region, '');
  assert.ok(j.id.startsWith('job_'));
});

test('normalizeJob 非法状态回退待投递', () => {
  const j = C.normalizeJob({ position: 'x', status: '随便' }, '');
  assert.strictEqual(j.status, '待投递');
});

test('normalizeJob 非法 deadline 清空', () => {
  assert.strictEqual(C.normalizeJob({ position: 'x', deadline: '8月20日' }).deadline, '');
  assert.strictEqual(C.normalizeJob({ position: 'x', deadline: '2026-08-20' }).deadline, '2026-08-20');
});

test('validateJobList 检出非法数据', () => {
  const r = C.validateJobList([{ position: '' }]);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.length, 1);
});

test('filterJobs 按分类+状态+关键词过滤', () => {
  const list = [
    C.normalizeJob({ position: '前端工程师', company: 'A', category: '私企', status: '待投递' }),
    C.normalizeJob({ position: '运维', company: 'B', category: '编制', status: '已投递' }),
  ];
  assert.strictEqual(C.filterJobs(list, { category: '私企', keyword: '前端' }).length, 1);
  assert.strictEqual(C.filterJobs(list, { status: '已投递' })[0].position, '运维');
});

test('sortJobs 按 deadline 升序，空值排后', () => {
  const list = [{ id: '1', deadline: '' }, { id: '2', deadline: '2026-08-20' }, { id: '3', deadline: '2026-08-18' }];
  assert.deepStrictEqual(C.sortJobs(list, 'deadline').map((x) => x.id), ['3', '2', '1']);
});

test('isDeadlineSoon 仅待投递且3天内为真', () => {
  const j = { deadline: '2026-08-18', status: '待投递' };
  assert.strictEqual(C.isDeadlineSoon(j, '2026-08-16', 3), true);
  assert.strictEqual(C.isDeadlineSoon({ ...j, status: '已投递' }, '2026-08-16', 3), false);
  assert.strictEqual(C.isDeadlineSoon({ ...j, deadline: '2026-09-01' }, '2026-08-16', 3), false);
  assert.strictEqual(C.isDeadlineSoon({ ...j, deadline: '' }, '2026-08-16', 3), false);
});

test('applyStatus 切到已投递自动记 appliedAt', () => {
  const r = C.applyStatus({ id: '1', status: '待投递', appliedAt: '' }, '已投递');
  assert.strictEqual(r.status, '已投递');
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.appliedAt));
});

test('applyStatus 非法状态原样返回', () => {
  const j = { id: '1', status: '待投递' };
  assert.strictEqual(C.applyStatus(j, '随便'), j);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd "C:/Users/13575/Desktop/job2/JobFill" && node --test jobs-core.test.js`
Expected: FAIL —— `Cannot find module './jobs-core.js'`

- [ ] **Step 3: 写最小实现**

创建 `jobs-core.js`：

```js
(function (root) {
  'use strict';
  var STATUSES = ['待投递', '已投递', '已笔试', '已面试', '已offer', '已拒'];
  var CATEGORIES = ['私企', '编制', '考编', '考公'];

  function isValidStatus(s) { return STATUSES.indexOf(s) !== -1; }
  function isValidCategory(c) { return CATEGORIES.indexOf(c) !== -1; }

  function genId() { return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function validateJob(j) {
    if (!j || typeof j !== 'object') return '不是对象';
    if (typeof j.position !== 'string' || !j.position.trim()) return '缺少岗位名称';
    if (typeof j.status !== 'string' || !isValidStatus(j.status)) return '状态非法: ' + j.status;
    if (j.category && !isValidCategory(j.category)) return '分类非法: ' + j.category;
    return null;
  }

  function validateJobList(data) {
    if (!Array.isArray(data)) return { ok: false, errors: ['顶层不是数组'] };
    var errors = [];
    data.forEach(function (j, i) { var e = validateJob(j); if (e) errors.push('第 ' + (i + 1) + ' 条: ' + e); });
    return { ok: errors.length === 0, errors: errors };
  }

  function normalizeJob(raw, category) {
    raw = raw || {};
    var dl = String(raw.deadline == null ? '' : raw.deadline);
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : genId(),
      category: isValidCategory(raw.category) ? raw.category : (category || ''),
      region: String(raw.region || ''),
      position: String(raw.position || ''),
      company: String(raw.company || ''),
      salary: String(raw.salary || ''),
      competition: String(raw.competition || ''),
      advantage: String(raw.advantage || ''),
      channel: String(raw.channel || ''),
      link: String(raw.link || ''),
      status: isValidStatus(raw.status) ? raw.status : '待投递',
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(dl) ? dl : '',
      appliedAt: String(raw.appliedAt || ''),
      note: String(raw.note || '')
    };
  }

  function filterJobs(list, f) {
    f = f || {};
    var kw = String(f.keyword || '').trim().toLowerCase();
    var region = String(f.region || '').trim();
    return list.filter(function (j) {
      if (f.category && f.category !== '全部' && j.category !== f.category) return false;
      if (f.status && f.status !== '全部' && j.status !== f.status) return false;
      if (region && j.region.indexOf(region) === -1) return false;
      if (kw) {
        var hay = (j.position + ' ' + j.company + ' ' + j.note).toLowerCase();
        if (hay.indexOf(kw) === -1) return false;
      }
      return true;
    });
  }

  function sortJobs(list, by) {
    var arr = list.slice();
    if (by === 'deadline') {
      arr.sort(function (a, b) {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline < b.deadline ? -1 : (a.deadline > b.deadline ? 1 : 0);
      });
    } else if (by === 'region') {
      arr.sort(function (a, b) { return a.region.localeCompare(b.region, 'zh'); });
    }
    return arr;
  }

  function isDeadlineSoon(j, today, days) {
    if (!j.deadline || j.status !== '待投递') return false;
    var d = new Date(j.deadline + 'T00:00:00');
    var t = new Date(today + 'T00:00:00');
    if (isNaN(d.getTime()) || isNaN(t.getTime())) return false;
    var diff = (d - t) / 86400000;
    return diff >= 0 && diff <= (days == null ? 3 : days);
  }

  function applyStatus(j, newStatus) {
    if (!isValidStatus(newStatus)) return j;
    var next = Object.assign({}, j, { status: newStatus });
    if (newStatus === '已投递' && !next.appliedAt) next.appliedAt = todayStr();
    return next;
  }

  var api = { STATUSES: STATUSES, CATEGORIES: CATEGORIES, genId: genId, todayStr: todayStr, validateJob: validateJob, validateJobList: validateJobList, normalizeJob: normalizeJob, filterJobs: filterJobs, sortJobs: sortJobs, isDeadlineSoon: isDeadlineSoon, applyStatus: applyStatus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JobCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd "C:/Users/13575/Desktop/job2/JobFill" && node --test jobs-core.test.js`
Expected: PASS（9 个测试全绿）

- [ ] **Step 5: 提交**

```bash
cd "C:/Users/13575/Desktop/job2/JobFill" && git add jobs-core.js jobs-core.test.js && git commit -m "feat: 岗位清单纯逻辑与单测"
```

---

## Task 3: jobs.html + jobs.css 骨架

**Files:**
- Create: `jobs.html`
- Create: `jobs.css`

- [ ] **Step 1: 写页面骨架**

创建 `jobs.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>岗位清单 - JobFill</title>
  <link rel="stylesheet" href="jobs.css">
</head>
<body>
  <header class="topbar">
    <h1>岗位清单</h1>
    <div class="top-actions">
      <button id="btn-import">导入 JSON</button>
      <button id="btn-export">导出 JSON</button>
      <button id="btn-add">+ 新增岗位</button>
    </div>
  </header>

  <div id="stats" class="stats"></div>

  <div class="filters">
    <select id="f-category"><option>全部</option></select>
    <select id="f-status"><option>全部</option></select>
    <input id="f-region" placeholder="地区">
    <input id="f-keyword" placeholder="搜索岗位/单位">
    <select id="f-sort">
      <option value="deadline">按截止日期</option>
      <option value="region">按地区</option>
      <option value="">原顺序</option>
    </select>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>地区</th><th>分类</th><th>岗位</th><th>单位</th><th>薪资</th><th>状态</th><th>截止</th><th>操作</th></tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>

  <div class="pager">
    <button id="prev">上一页</button>
    <span id="pager-info"></span>
    <button id="next">下一页</button>
  </div>

  <div id="modal" class="modal" hidden>
    <div class="modal-box">
      <h2 id="modal-title">新增岗位</h2>
      <label>岗位名称<input id="m-position"></label>
      <label>目标单位<input id="m-company"></label>
      <label>地区<input id="m-region"></label>
      <label>分类<select id="m-category"></select></label>
      <label>薪资区间<input id="m-salary" placeholder="如 9-14"></label>
      <label>投递渠道<input id="m-channel" placeholder="如 BOSS直聘"></label>
      <label>投递链接<input id="m-link" placeholder="https://..."></label>
      <label>截止日期<input id="m-deadline" type="date"></label>
      <label>备注<textarea id="m-note" rows="2"></textarea></label>
      <div class="modal-actions">
        <button id="m-cancel">取消</button>
        <button id="m-save">保存</button>
      </div>
    </div>
  </div>

  <input type="file" id="file-input" accept=".json,application/json" hidden>
  <div id="toast" class="toast"></div>

  <script src="jobs-core.js"></script>
  <script src="jobs.js"></script>
</body>
</html>
```

- [ ] **Step 2: 写样式**

创建 `jobs.css`：

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif; color: #1f2937; background: #f5f7fa; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; }
.topbar h1 { font-size: 18px; margin: 0; }
.top-actions button, .pager button { padding: 6px 12px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; }
#btn-add { background: #2563eb; color: #fff; border-color: #2563eb; }
.stats { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 20px; }
.chip { background: #eef2ff; color: #4338ca; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
.chip-warn { background: #fef3c7; color: #92400e; }
.filters { display: flex; gap: 8px; padding: 0 20px 12px; }
.filters select, .filters input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; }
.table-wrap { background: #fff; border: 1px solid #e5e7eb; margin: 0 20px; border-radius: 8px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
th { background: #f9fafb; color: #6b7280; font-weight: 600; white-space: nowrap; }
.cell-pos { max-width: 260px; }
.tag { padding: 1px 8px; border-radius: 4px; font-size: 12px; }
.tag-私企 { background: #dbeafe; color: #1d4ed8; }
.tag-编制 { background: #dcfce7; color: #15803d; }
.tag-考编 { background: #fef9c3; color: #a16207; }
.tag-考公 { background: #fee2e2; color: #b91c1c; }
.status-select { border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 4px; }
.deadline.soon { color: #dc2626; font-weight: 700; }
.btn-act { border: none; background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-act-danger { background: #fef2f2; color: #dc2626; }
.btn-act-muted { background: #f3f4f6; color: #6b7280; }
.pager { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 14px; }
.empty { text-align: center; color: #9ca3af; padding: 30px; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; }
.modal[hidden] { display: none; }
.modal-box { background: #fff; border-radius: 10px; padding: 20px; width: 440px; max-height: 90vh; overflow: auto; }
.modal-box h2 { margin: 0 0 12px; font-size: 16px; }
.modal-box label { display: block; margin-bottom: 8px; font-size: 13px; color: #374151; }
.modal-box input, .modal-box select, .modal-box textarea { width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 3px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.modal-actions button { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
#m-save { background: #2563eb; color: #fff; border-color: #2563eb; }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #111827; color: #fff; padding: 8px 16px; border-radius: 8px; opacity: 0; transition: opacity .2s; font-size: 13px; }
.toast.show { opacity: 1; }
```

- [ ] **Step 3: 手工验证**

在 Chrome `chrome://extensions` 刷新 JobFill 扩展，浏览器地址栏直接打开 `chrome-extension://<扩展ID>/jobs.html`（扩展 ID 从扩展卡片查看）。
Expected: 页面显示标题「岗位清单」、统计条、筛选栏、空表格（提示「暂无岗位」）、分页条。无控制台报错。

---

## Task 4: jobs.js 页面逻辑

**Files:**
- Create: `jobs.js`

- [ ] **Step 1: 写完整页面逻辑**

创建 `jobs.js`：

```js
(function () {
  'use strict';
  var C = window.JobCore;

  var state = { list: [], category: '全部', status: '全部', region: '', keyword: '', sort: 'deadline', page: 1, pageSize: 50, editingId: null };

  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function load() { return new Promise(function (res) { chrome.storage.local.get('jobList', function (d) { res(Array.isArray(d.jobList) ? d.jobList : []); }); }); }
  function save(list) { return new Promise(function (res) { chrome.storage.local.set({ jobList: list }, res); }); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(function () { t.className = 'toast'; }, 2000); }

  function filtered() { return C.filterJobs(state.list, { category: state.category, status: state.status, region: state.region, keyword: state.keyword }); }
  function sorted() { return C.sortJobs(filtered(), state.sort); }
  function pageItems() { var s = sorted(); var start = (state.page - 1) * state.pageSize; return s.slice(start, start + state.pageSize); }

  function render() {
    var s = sorted(); var total = s.length; var maxPage = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > maxPage) state.page = maxPage;
    renderStats(); renderTable(pageItems()); renderPager(total, maxPage);
  }

  function renderStats() {
    function cnt(f) { return state.list.filter(f).length; }
    var html = C.CATEGORIES.map(function (c) { return '<span class="chip">' + esc(c) + ' ' + cnt(function (j) { return j.category === c; }) + '</span>'; }).join('');
    html += '<span class="chip chip-warn">待投递 ' + cnt(function (j) { return j.status === '待投递'; }) + '</span>';
    $('stats').innerHTML = html;
  }

  function renderTable(items) {
    var rows = items.map(function (j) {
      var soon = C.isDeadlineSoon(j, C.todayStr(), 3);
      var dl = soon ? '<span class="deadline soon">' + esc(j.deadline) + '</span>' : '<span class="deadline">' + esc(j.deadline || '—') + '</span>';
      var openBtn = j.link
        ? '<button class="btn-act" data-act="open" data-id="' + esc(j.id) + '">投递</button>'
        : '<button class="btn-act btn-act-muted" data-act="channel" data-id="' + esc(j.id) + '">渠道</button>';
      var catCls = 'tag tag-' + esc(j.category);
      return '<tr>' +
        '<td>' + esc(j.region) + '</td>' +
        '<td><span class="' + catCls + '">' + esc(j.category) + '</span></td>' +
        '<td class="cell-pos">' + esc(j.position) + '</td>' +
        '<td>' + esc(j.company) + '</td>' +
        '<td>' + esc(j.salary) + '</td>' +
        '<td><select class="status-select" data-id="' + esc(j.id) + '">' + C.STATUSES.map(function (s) { return '<option' + (s === j.status ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></td>' +
        '<td>' + dl + '</td>' +
        '<td>' + openBtn + '<button class="btn-act" data-act="edit" data-id="' + esc(j.id) + '">编辑</button><button class="btn-act btn-act-danger" data-act="del" data-id="' + esc(j.id) + '">删</button></td>' +
        '</tr>';
    }).join('');
    $('tbody').innerHTML = rows || '<tr><td colspan="8" class="empty">暂无岗位，点右上角「导入 JSON」或「+ 新增」</td></tr>';
  }

  function renderPager(total, maxPage) {
    $('pager-info').textContent = '共 ' + total + ' 条 · 第 ' + state.page + '/' + maxPage + ' 页';
    $('prev').disabled = state.page <= 1;
    $('next').disabled = state.page >= maxPage;
  }

  function findById(id) { return state.list.find(function (j) { return j.id === id; }); }

  function openModal(job) {
    state.editingId = job ? job.id : null;
    $('modal-title').textContent = job ? '编辑岗位' : '新增岗位';
    $('m-position').value = job ? job.position : '';
    $('m-company').value = job ? job.company : '';
    $('m-region').value = job ? job.region : '';
    $('m-category').value = job ? job.category : '私企';
    $('m-salary').value = job ? job.salary : '';
    $('m-channel').value = job ? job.channel : '';
    $('m-link').value = job ? job.link : '';
    $('m-deadline').value = job ? job.deadline : '';
    $('m-note').value = job ? job.note : '';
    $('modal').hidden = false;
  }
  function closeModal() { $('modal').hidden = true; }

  function saveModal() {
    var raw = { position: $('m-position').value, company: $('m-company').value, region: $('m-region').value, category: $('m-category').value, salary: $('m-salary').value, channel: $('m-channel').value, link: $('m-link').value, deadline: $('m-deadline').value, note: $('m-note').value };
    var err = C.validateJob(raw);
    if (err) { toast(err); return; }
    if (state.editingId) {
      var idx = state.list.findIndex(function (j) { return j.id === state.editingId; });
      if (idx !== -1) state.list[idx] = Object.assign({}, state.list[idx], raw, { category: raw.category || state.list[idx].category });
    } else {
      state.list.push(C.normalizeJob(raw, raw.category));
    }
    save(state.list).then(function () { closeModal(); render(); toast('已保存'); });
  }

  function delJob(id) {
    var j = findById(id); if (!j) return;
    if (!confirm('删除「' + j.position + '」？')) return;
    state.list = state.list.filter(function (x) { return x.id !== id; });
    save(state.list).then(function () { render(); toast('已删除'); });
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var v = C.validateJobList(data);
        if (!v.ok) { toast('导入失败：' + v.errors[0]); return; }
        state.list = data.map(function (j) { return C.normalizeJob(j); });
        save(state.list).then(function () { render(); toast('导入成功 ' + state.list.length + ' 条'); });
      } catch (e) { toast('JSON 解析失败'); }
    };
    reader.readAsText(file);
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(state.list, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '岗位清单.json'; a.click();
    toast('已导出');
  }

  function bind() {
    $('btn-import').addEventListener('click', function () { $('file-input').click(); });
    $('file-input').addEventListener('change', function (e) { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
    $('btn-export').addEventListener('click', exportJson);
    $('btn-add').addEventListener('click', function () { openModal(null); });
    $('m-save').addEventListener('click', saveModal);
    $('m-cancel').addEventListener('click', closeModal);

    $('f-category').addEventListener('change', function (e) { state.category = e.target.value; state.page = 1; render(); });
    $('f-status').addEventListener('change', function (e) { state.status = e.target.value; state.page = 1; render(); });
    $('f-region').addEventListener('input', function (e) { state.region = e.target.value; state.page = 1; render(); });
    $('f-keyword').addEventListener('input', function (e) { state.keyword = e.target.value; state.page = 1; render(); });
    $('f-sort').addEventListener('change', function (e) { state.sort = e.target.value; state.page = 1; render(); });
    $('prev').addEventListener('click', function () { if (state.page > 1) { state.page--; render(); } });
    $('next').addEventListener('click', function () { state.page++; render(); });

    $('tbody').addEventListener('change', function (e) {
      if (e.target.classList.contains('status-select')) {
        var id = e.target.getAttribute('data-id'); var j = findById(id); if (!j) return;
        var next = C.applyStatus(j, e.target.value);
        var idx = state.list.indexOf(j); state.list[idx] = next;
        save(state.list).then(function () { render(); toast('状态已更新'); });
      }
    });
    $('tbody').addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act'); var id = e.target.getAttribute('data-id'); if (!act || !id) return;
      var j = findById(id); if (!j) return;
      if (act === 'open') chrome.tabs.create({ url: j.link });
      else if (act === 'channel') toast('渠道：' + (j.channel || '未填写'));
      else if (act === 'edit') openModal(j);
      else if (act === 'del') delJob(id);
    });
  }

  function initFilters() {
    C.CATEGORIES.forEach(function (c) { var o = document.createElement('option'); o.textContent = c; $('f-category').appendChild(o); });
    C.STATUSES.forEach(function (s) { var o = document.createElement('option'); o.textContent = s; $('f-status').appendChild(o); });
    C.CATEGORIES.forEach(function (c) { var o = document.createElement('option'); o.textContent = c; $('m-category').appendChild(o); });
  }

  async function init() { initFilters(); bind(); state.list = await load(); render(); }
  init();
})();
```

- [ ] **Step 2: 手工验证导入 + 展示**

刷新扩展后打开 `jobs.html`，点「导入 JSON」→ 选 `C:\Users\13575\Desktop\job2\JobFill\岗位清单.json`。
Expected: 提示「导入成功 N 条」，统计条显示四类数量，表格渲染第一页 50 条，分页显示总条数。无报错。

- [ ] **Step 3: 手工验证筛选/排序/分页**

Expected: 切分类下拉只显示对应分类；地区输入即时过滤；关键词搜索岗位/单位；切「按截止日期」排序后，有截止日期的排前面、空值排后；翻页正常。

- [ ] **Step 4: 手工验证增改删与投递**

Expected:
- 点「+ 新增」填表保存 → 列表新增一条、统计更新。
- 点某行「编辑」改字段保存 → 生效。
- 点「删」二次确认后删除。
- 点有链接行的「投递」→ 新标签打开官网；点无链接行的「渠道」→ toast 显示渠道名。

- [ ] **Step 5: 提交**

```bash
cd "C:/Users/13575/Desktop/job2/JobFill" && git add jobs.html jobs.css jobs.js && git commit -m "feat: 岗位清单页面（导入/筛选/状态/投递）"
```

---

## Task 5: popup 入口

**Files:**
- Modify: `popup.html`
- Modify: `popup.js`

- [ ] **Step 1: 加按钮**

在 `popup.html` 的 `btn-options` 按钮附近加：

```html
<button id="btn-jobs">📋 岗位清单</button>
```

- [ ] **Step 2: 绑事件**

在 `popup.js` 末尾加：

```js
document.getElementById('btn-jobs').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('jobs.html') });
  window.close();
});
```

- [ ] **Step 3: 手工验证**

点扩展图标 → 点「📋 岗位清单」→ 新标签打开 jobs.html。

- [ ] **Step 4: 提交**

```bash
cd "C:/Users/13575/Desktop/job2/JobFill" && git add popup.html popup.js && git commit -m "feat: popup 增加岗位清单入口"
```

---

## Task 6: 集成验证与收尾

**Files:** 无新增

- [ ] **Step 1: 全流程回归**

1. `chrome://extensions` 刷新 JobFill。
2. popup 点「岗位清单」→ 打开页面 → 导入 `岗位清单.json`。
3. 验证：四类统计正确、状态可切换、切换「已投递」后 appliedAt 有值（可在 `chrome.storage.local` 里确认）、投递按钮打开链接、截止日期 3 天内待投递的标红。
4. 关闭重开页面，数据仍在（持久化正常）。

- [ ] **Step 2: 单测终检**

Run: `cd "C:/Users/13575/Desktop/job2/JobFill" && node --test jobs-core.test.js`
Expected: 全绿。

- [ ] **Step 3: 收尾提交（如有未提交变更）**

```bash
cd "C:/Users/13575/Desktop/job2/JobFill" && git status --short && git add -A && git commit -m "chore: 岗位清单集成收尾"
```

---

## 自审记录（已检查）

- **Spec 覆盖**：独立页面（Task 3）、导入标准 JSON + 手动增改（Task 1/4）、六态状态（Task 2 core + Task 4 下拉）、截止日期排序标红（Task 2 `isDeadlineSoon`/`sortJobs` + Task 4）、投递跳官网 + 链接为空降级（Task 4 `open`/`channel`）、popup 入口（Task 5）、边界处理（Task 2 `normalizeJob`/`validateJobList`）。全部有对应任务。
- **占位符**：无 TBD/TODO。
- **类型/命名一致**：`JobCore` 各函数名在 core/test/page 三处一致；`jobList` 存储 key 一致；字段名与设计文档 schema 一致。
