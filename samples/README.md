# 测试样例文件

用于测试「简历管理」页面的导入功能。

## 文件列表

| 文件 | 格式 | 导入方式 | 是否需要 AI |
|------|------|---------|------------|
| `sample-resume.json` | JSON | 直接解析，无需 AI | 否 |
| `sample-resume.md` | Markdown | AI 解析提取结构化字段 | 是 |

## 使用方法

1. 打开插件的「管理简历」页面（点击插件图标 → 管理简历）
2. 将文件拖放到右侧「📂 导入资料」区域，或点击区域选择文件

### 测试 JSON 导入

直接拖入 `sample-resume.json`，无需 AI 配置，应立即填充所有字段。

**预期结果**：
- 姓名：张三
- 手机：13800138000
- 学校：复旦大学（本科，GPA 3.8）
- 实习：阿里巴巴大模型应用实习生
- 导航栏各节的填写计数更新

### 测试 Markdown 导入

拖入 `sample-resume.md`，需要先在右侧 AI 设置中配置 API Key。

**预期结果**：AI 解析后自动填充，与 JSON 导入结果基本一致（字段名依赖 AI 理解，可能有细微差异）。

## 调试

导入过程中打开 options.html 的 DevTools → Console，可看到：

```
[Import] 文件: sample-resume.json，大小: xxxx 字节，格式: json
```

```
[Import] 文件: sample-resume.md，大小: xxxx 字节，格式: md
[Import] PDF 提取结果长度: ...   ← 仅 PDF 有此行
```

如果 AI 解析失败，错误详情会打印在 Console 中，API 请求错误在 Service Worker Console 中查看。
