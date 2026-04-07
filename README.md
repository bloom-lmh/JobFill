# JobFill — 简历一键填写

> 在招聘平台自动识别表单字段并填写简历信息的 Chrome 插件。支持**正则模式**（离线）和 **AI 模式**（自带 API Key），并提供 JD 感知填写和模拟面试功能。

---

## ✨ 功能

- **正则模式**：无需 API Key，自动识别页面中的姓名/手机/学历等常见字段，未识别字段黄色标记
- **AI 模式**：自带 API Key，智能理解任意字段名称，自动推断陌生字段并填写
- **JD 感知填写**：提取职位描述后，AI 填写技能/自我介绍等开放字段时自动融入 JD 关键词
- **简历导入**：支持 `.json` / `.md` / `.txt` / `.docx` / `.pdf` 五种格式，新内容与已有数据智能合并
- **模拟面试**：基于 JD + 简历，AI 生成 8 道面试题（含参考答案），覆盖技术/项目/行为/开放四类

---

## 🚀 快速开始

### 安装

1. 下载本项目的压缩包，解压到本地
2. 打开 `chrome://extensions/`，右上角开启**开发者模式**
3. 点击「加载已解压的扩展程序」，选择本项目文件夹（需包含 `manifest.json`、`content.js`等文件）
4. 工具栏出现图标即安装成功

### 首次配置

1. 点击插件图标 → 「⚙ 管理简历」
2. 填写个人信息，点击「💾 保存简历」
3. 如需 AI 模式，在右侧「🤖 AI 填写设置」输入 API Key 保存并测试连接

---

## 📖 使用指南

### 正则模式（默认，无需 API Key）

1. 打开招聘平台投递页面
2. 点击右下角悬浮面板 → 「🔍 扫描字段」
   - 🟢 绿色边框 = 已识别并匹配
   - 🟡 黄色边框 = 未识别（可手动填写）
3. 确认后点「✅ 开始填写」
4. 检查结果后提交

### AI 模式

1. 先配置 API Key（管理简历 → 右侧 AI 设置）
2. 悬浮面板切换到「🤖 AI」
3. 点「🤖 AI 填写」，AI 自动分析并填写所有字段
4. 填写后若有简历未覆盖的字段，会自动添加到简历模板
5. 前往管理简历补充新字段，下次可直接使用

### JD 感知填写（AI 模式 + 简历优化）

提取当前职位 JD，让 AI 在填写技能、自我介绍、项目描述等开放性字段时，自动融入 JD 关键词，使内容更有针对性。

**步骤：**
1. 打开招聘平台的**职位详情页**（有 JD 描述的页面）
2. 切换到 AI 模式，点击「📋 提取 JD」按钮
3. 按钮变绿（显示字数）表示 JD 已保存
4. 前往投递表单页，点「🤖 AI 填写」

> JD 会持续保存直到手动清除，同一批投递无需重复提取。

### 模拟面试（AI 模式 + 管理简历页）

基于已提取的 JD 和你的简历，AI 生成 8 道针对性面试题（含参考答案）。

1. 提取 JD 后，前往管理简历页面 → 左侧「🎯 模拟面试」
2. 点击「🤖 生成面试题」
3. 题目包含：技术考察（3题）、项目深挖（2题）、行为面试 STAR（2题）、开放性问题（1题）
4. 点击「查看参考答案」展开各题答案（答案基于你的简历定制）

---

## 📂 导入简历

在「管理简历」右侧导入区拖放或点击上传：

| 格式 | 处理方式 | 需要 AI |
|------|---------|---------|
| `.json` | 直接解析（插件导出格式） | ❌ |
| `.md` / `.txt` | 规则解析优先，不足时 AI | 可选 |
| `.docx` | 提取 XML 文字 → 规则/AI | 可选 |
| `.pdf` | FlateDecode 解压 + CID 解码 → AI | 是 |

> **PDF 说明**：仅支持 Word/WPS 导出的文字型 PDF，识别性能不如其它格式。扫描件（图片型）不支持，请先 OCR 转为 TXT。

---

## 🤖 AI 配置

在「管理简历」右侧「AI 填写设置」配置：

| 厂商 | 推荐模型 | Base URL |
|------|----------|----------|
| 通义千问 | `qwen-plus` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 月之暗面 (Kimi) | `moonshot-v1-8k` | `https://api.moonshot.cn/v1` |
| DeepSeek | `deepseek-chat` | `https://api.deepseek.com/v1` |
| 智谱 GLM | `glm-4-flash`（免费） | `https://open.bigmodel.cn/api/paas/v4` |
| OpenAI | `gpt-4o-mini` | 留空 |
| Anthropic | `claude-3-haiku-20240307` | 留空 |

**对模型的要求**：上下文 ≥ 8K，能稳定输出纯 JSON。

---

## 🧪 测试示例

以下页面可用于验证插件的智能填写效果：

### 百亚招聘申请表（标准自建招聘系统）

**申请表地址：**

```
https://baiya.zhiye.com/login?goto=form%3FfromPage%3Djob%26jobAdId%3D4d856a9b-2987-4b6a-bc28-3c4c9103bf1d
```

**步骤：**
1. 打开上方链接，注册或登录账号
2. 登录后自动跳转到职位申请表单
3. 在页面右下角点击插件悬浮面板 → 「🔍 扫描字段」
4. 验证字段识别情况，点「✅ 开始填写」测试正则填写
5. 或切换 AI 模式测试 AI 填写

**该页面包含的典型字段（适合测试）：**

| 字段类型 | 测试项 |
|---------|-------|
| 文本输入 | 姓名、手机、邮箱、身份证号 |
| 下拉选框 | 国家/地区、学历、专业类别、家庭所在城市 |
| 日历控件 | 教育时间（YYYY-MM，readonly input） |
| Combobox | 学校全称（输入后弹出选项） |
| 多行文本 | 自我描述、工作经历 |

> **注意**：该页面的日历控件会弹出月份选择界面，插件会自动直接写入 `YYYY-MM` 格式值并触发框架事件。如填写后时间未显示，可尝试切换 AI 模式。

---

## 🐛 调试指南

插件有三个独立运行上下文，需分别打开 DevTools：

### 简历管理页（options.html）

适用于：导入失败、表单显示异常、导出不对

- 右键页面 → **检查**，或 `chrome://extensions` → 点「检查视图: html/options.html」

```js
// Console 里查看当前存储数据
chrome.storage.local.get(null, console.log)

// 查看已提取的 JD
chrome.storage.local.get('currentJD', console.log)

// 手动测试 AI 简历解析
chrome.runtime.sendMessage({
  type: 'AI_PARSE_RESUME',
  provider: 'qwen',
  apiKey: 'sk-xxx',
  model: 'qwen-plus',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  text: '姓名：张三\n电话：13800138000',
}, console.log)
```

### 后台脚本（background.js）

适用于：AI API 请求失败、401/429 错误、网络超时

- `chrome://extensions` → 找到插件 → 点击 **「Service Worker」**

### 招聘页面（content.js）

适用于：扫描到字段但填不进去、下拉框无法选择

- 在招聘网站页面按 **F12** → Console

### PDF 导入

```
[Import] 文件: 简历.pdf，大小: 183420 字节，格式: pdf
[PDF] 直接提取: 0 段
[PDF] 流#1 Length=11696，解压后=42310，前200字: "BT /F1 12 Tf ..."
[PDF] 压缩流: 匹配27个，解压成功27个，共提取47段文字
```

| 问题现象 | 原因 | 解决 |
|---------|------|------|
| `解压失败` | 非标准 FlateDecode 或加密 | 转为 TXT/MD 后导入 |
| 解压成功但 0 段文字 | CID 字体无 ToUnicode 映射 | 从 PDF 阅读器复制文字，存为 `.txt` |
| AI 报错 | PDF 提取成功，问题在 API | 查看 Service Worker Console |

---

## 🔒 隐私说明

- 所有简历数据**仅存储在本地**（`chrome.storage.local`），不上传任何服务器
- AI 模式下，表单字段和简历摘要发给**你自己配置的 AI 服务商**，不经过第三方中转
- JD 文本同样仅存本机，随时可在「模拟面试」区域清除
- API Key 仅保存在本机，不会导出或上传
- `resume-data.json` 已加入 `.gitignore`

---

## 💾 换电脑迁移

1. 旧电脑：管理页点「⬇ 导出 JSON」下载 `resume-data.json`
2. 新电脑：安装插件后，右侧导入区拖入该文件
3. AI 配置需重新填写 API Key（出于安全考虑不导出密钥）

---

## 📁 文件说明

```
JobFill/
├── manifest.json              # 插件配置（MV3）
├── content.js                 # 注入页面：扫描/填写/JD 提取
├── background.js              # Service Worker：AI API 代理
├── popup.html / popup.js      # 工具栏弹窗
├── options.html / options.js  # 简历管理页（三栏布局）
├── samples/
│   ├── sample-resume.json     # 测试用 JSON 简历
│   └── sample-resume.md       # 测试用 Markdown 简历
└── icons/                     # 插件图标
```

---

## 📄 License

[MIT](LICENSE)

