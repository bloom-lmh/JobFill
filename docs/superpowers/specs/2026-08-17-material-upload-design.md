# 材料/证书/简历 自动上传 — 设计文档

> 日期：2026-08-17
> 目标：在招聘网站的表单里，自动把本地材料（证书、成绩单、学位/毕业证、身份证、头像、简历 PDF 等）附加到对应的 `input[type=file]` 上传框，省去每次手动打开 `F:\找工作` 目录翻找文件。

## 1. 背景与硬边界

浏览器有个不可绕过的安全边界：**扩展无法自动读取任意本地磁盘路径**（如 `F:\找工作`）。要"自动"只有三条路，本方案采用「**导入材料库**」——用户一次性把材料导入扩展存储，之后填表时扩展从库里取文件附加，纯扩展、无需装任何本地助手。

用户已确认的三项决策：

| 决策点 | 选择 |
|---|---|
| 文件来源 | 导入材料库（一次性导入） |
| 匹配方式 | 自动匹配 + 手动兜底 |
| 触发方式 | 独立按钮（不并入「一键填表」） |
| 管理界面 | 独立页面 `materials.html` |
| 首次导入规模 | 只导入常用 + ≤500K 压缩版（约 10–15 个文件、约 10MB） |

## 2. 存储方案

文件存储在 **`chrome.storage.local`**，二进制转 **base64** 存字符串，新增 **`unlimitedStorage`** 权限免除默认 10MB 配额。

**为什么不用 IndexedDB：** content script 运行在网页自身 origin 上，读不到扩展 origin 的 IndexedDB（跨域隔离）。若用 IndexedDB，在扩展管理页导入的文件，招聘页 content script 取不到，方案直接失效。而 `chrome.storage.local` 是 options 页 / content script / background **三方都能直接读**，与现有代码（`resumeData`、`aiConfig`、`currentJD` 均存于此）一致。

**代价与对策：** base64 膨胀约 33%。对策——(1) 加 `unlimitedStorage` 免配额；(2) **每个文件单独一个 key**，填表时按需只读目标文件，绝不一次性全量加载；(3) 用户只导常用 + 压缩版，总量约 10MB（base64 约 13MB），很轻。

### 存储布局

```
chrome.storage.local:
  materials            → 元数据数组（不含文件内容）：[{ id, name, size, mime, category, isDefault, createdAt }]
  material:<id>        → base64 文件内容字符串（每个文件一个 key）
```

- 列表读取：`chrome.storage.local.get('materials')` → 拿到元数据（轻量）。
- 取文件内容：`chrome.storage.local.get('material:<id>')` → 只读这一个文件。

## 3. 数据模型

```js
// material 元数据对象（存于 materials 数组）
{
  id: string,        // 生成 id（如 'mat_' + 时间戳 + 随机）
  name: string,      // 原文件名（含扩展名）
  size: number,      // 字节数
  mime: string,      // MIME 类型（由 File.type 或扩展名推断）
  category: string,  // 分类，见 §4 MATERIAL_CATEGORIES
  isDefault: boolean,// 该分类内是否作为默认自动填文件
  createdAt: number  // 时间戳
}
```

## 4. 材料分类与匹配

### 分类（`MATERIAL_CATEGORIES`）

```
'简历' | '成绩单' | '学位证' | '毕业证' | '学籍报告' | '身份证' | '头像' | '证书' | '其他'
```

说明：学位证（degree）与毕业证（diploma）是不同材料，招聘表常有独立上传框；「学籍报告」对应学信网验证报告；「证书」覆盖四六级/计算机/奖学金/奖状等荣誉类。

### hint → 分类匹配（`matchMaterialCategory(hint)`）

复用 content.js 现有 `getHint(el)` 得到的 hint（label + name + placeholder + aria-label + context 拼接），按**有序**正则匹配（先「学位证」后「毕业证」，先「学籍报告」后「证书」，避免交叉吞并）：

```js
const MATERIAL_MATCHERS = [
  { category: '简历',   re: /简历|resume|cv|个人简历|附件简历/i },
  { category: '成绩单', re: /成绩单|transcript|成绩/i },
  { category: '学位证', re: /学位|degree/i },
  { category: '毕业证', re: /毕业|diploma|graduation|学历证书/i },
  { category: '学籍报告', re: /学籍|学信网|验证报告|学历认证|教育部/i },
  { category: '身份证', re: /身份证|id.?card|证件|身份/i },
  { category: '头像',   re: /头像|照片|证件照|avatar|photo|一寸|二寸|近照/i },
  { category: '证书',   re: /证书|奖|荣誉|certificate|技能|等级|考试|英语|四级|六级|奖状/i },
];
```

### 文件名 → 分类（`classifyMaterialByFilename(name)`，导入时用）

按文件名关键词归类，供管理页自动分类，用户可手动改：

```
简历 → /简历|resume|CV/i
成绩单 → /成绩|绩点|transcript/i
学位证 → /学位/i
毕业证 → /毕业证|毕业证书|diploma/i
学籍报告 → /学籍|验证报告|学信/i
身份证 → /身份证|证件照.*身|id.?card/i
头像 → /头像|证件照|照片|avatar|photo|一寸|二寸/i
证书 → /证书|四六级|四级|六级|计算机|数据库|奖学金|奖状|荣誉|英语|CET/i
```

## 5. `materials-core.js`（UMD 纯逻辑，可 node:test）

与 `jobs-core.js` 同款 UMD 尾（`module.exports` + `root.MaterialsCore`）。导出：

```js
{
  CATEGORIES: [...],                    // 分类数组
  DEFAULT_MATCHERS: [...],              // hint→分类 有序匹配规则
  genId(),                              // 'mat_' + 时间戳 + 随机
  inferMime(filename),                  // 扩展名 → MIME（pdf/jpg/png/xlsx/docx...）
  classifyMaterialByFilename(name),     // 文件名 → 分类
  matchMaterialCategory(hint, matchers),// hint → 分类（有序正则，null=未匹配）
  normalizeMaterial(raw, category),     // 补全 id/createdAt/isDefault/mime
  pickDefaultMaterial(materials, category), // 分类内选默认：优先 isDefault，否则优先文件名含 500k/小于500k，否则最小 size
  filterByAccept(materials, category, accept), // 按 accept 属性过滤（如 ".pdf,.jpg"）
}
```

**`pickDefaultMaterial` 的 ≤500K 优先规则**（用户已备压缩版）：
1. 该分类内有 `isDefault === true` 的 → 用它；
2. 否则文件名匹配 `/500k|小于500k|500kb|_500/i` 的优先（用户为学位证/毕业证/计算机证/奖学金备了 `_500K`/`小于500K` 版）；
3. 否则取 `size` 最小的。

**`filterByAccept`**：解析 `accept` 属性（如 `.jpg,.png,image/*,application/pdf`），只保留扩展名或 MIME 匹配的材料；`accept` 为空则不过滤。

## 6. 管理页 `materials.html`

独立页面（仿 `jobs.html`），入口：

- 悬浮面板按钮「📁 材料库」；
- popup 加「📁 材料库」按钮。

页面功能：

- **导入**：`<input type="file" multiple>` + 拖拽区（可一次拖整个目录），读 `File.arrayBuffer()` → base64 → 写 `material:<id>` + 元数据。
- **自动分类**：`classifyMaterialByFilename`，结果可在每行的分类下拉里手动改。
- **列表**：文件名、分类（下拉可改）、大小、格式、是否默认（radio，每分类至多一个）。
- **删除**：移除元数据 + `chrome.storage.local.remove('material:<id>')`。
- **统计**：文件总数、总大小。

## 7. content.js 集成

### 7.1 面板加按钮

在 `#__rf_body__` 内、`__rf_manage__` 之前加：

```html
<button id="__rf_upload__">📁 上传材料</button>
```

### 7.2 扫描文件上传框（与文字扫描分开，独立触发）

点「📁 上传材料」→ 扫描：

```js
const fileInputs = [...document.querySelectorAll('input[type=file]')]
  .filter(el => !el.disabled && !el.closest('#__rf_panel__'));
```

**关键差异**：文件框经常被 `display:none` 或 0 尺寸隐藏（真实 input 藏起来、用样式按钮触发），所以**不能**像文字扫描那样跳过零尺寸元素。只跳过 `disabled` 和面板自身。

### 7.3 自动匹配 + 手动兜底流程

1. 读 `chrome.storage.local.get(['materials'])` 拿元数据（无文件则 log 提示「请先在材料库导入」）。
2. 对每个 file input：`hint = getHint(el)` → `matchMaterialCategory(hint)`。
3. 命中分类 → `filterByAccept` 过滤 → `pickDefaultMaterial` 选文件：
   - 唯一确定 → 标记「已匹配」；
   - 分类内多个文件且无明确默认 → 列入「待选择」。
4. 未命中 → 列入「待手动分配」。
5. 面板 log 展示结果（`已匹配 N · 待选择 M · 未识别 K`），未识别的用黄色高亮文件框（复用 `__rf_unmatched__`）。
6. **手动兜底交互**：对「待选择/未识别」的文件框，在 log 区渲染成可点击行；点击一行弹出该分类（或全部）材料的下拉，选一个即记为已选择。
7. 用户点「✅ 确认上传」→ 对已匹配/已选择的依次附加。

### 7.4 附加文件（DataTransfer 技巧）

```js
async function attachFileToInput(input, materialId) {
  const { [`material:${materialId}`]: b64 } = await chrome.storage.local.get(`material:${materialId}`);
  if (!b64) return false;
  const meta = /* 从 materials 数组查 */;
  const bytes = atob(b64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  const file = new File([buf], meta.name, { type: meta.mime });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}
```

附加后给该 input 加 `__rf_filled__` 高亮。

## 8. manifest.json 变更

```json
"permissions": ["storage", "activeTab", "scripting", "tabs", "unlimitedStorage"]
```

（只加 `unlimitedStorage`，其余不变。）

## 9. 已知限制（诚实声明）

1. **不能自动读 `F:\找工作`**：只能靠一次性导入，文件更新后需重新导入。
2. **个别强校验网站**（React/Vue 受控文件上传、或对 `input.files` 做框架级拦截）可能不认 DataTransfer 附加，仍需手动点一下选文件——与现有「框架兼容问题」同类，尽量兜底但无法保证 100%。

## 10. 测试

`materials-core.js` 走 `node:test`（与 `jobs-core.test.js` 一致，零 npm 依赖），覆盖：

- `classifyMaterialByFilename`：简历/成绩单/学位证/毕业证/学籍报告/身份证/头像/证书 各举样例；
- `matchMaterialCategory`：学位证 vs 毕业证 不交叉、学籍报告优先于证书、未匹配返回 null；
- `pickDefaultMaterial`：isDefault 优先 → 500k 文件名优先 → 最小 size；
- `filterByAccept`：`.pdf,.jpg` 过滤、`image/*` 通配、空 accept 不过滤；
- `inferMime`、`normalizeMaterial` 补全字段。

## 11. 文件清单

| 操作 | 文件 |
|---|---|
| 新增 | `materials-core.js` |
| 新增 | `materials-core.test.js` |
| 新增 | `materials.html` |
| 新增 | `materials.css` |
| 新增 | `materials.js` |
| 修改 | `content.js`（加按钮 + 扫描 + 附加逻辑） |
| 修改 | `popup.html` / `popup.js`（加「材料库」入口） |
| 修改 | `manifest.json`（加 `unlimitedStorage`） |
