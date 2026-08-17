# 爬虫（crawler）使用说明

把四川官方招聘公告源抓取下来，用 AI 清洗成结构化岗位，再导入 JobFill 扩展的「岗位清单」。

## 目录结构

| 文件 | 作用 |
|------|------|
| `ai.py` | OpenAI 兼容接口调用（含浏览器 UA，规避 Cloudflare 拦截） |
| `fetch.py` | 反封禁抓取：浏览器 UA + 重试 + 指数退避 + 随机间隔 |
| `clean.py` | AI 清洗：公告原文 → 结构化岗位（9 分类 / 地区 / 截止日期） |
| `crawl.py` | 编排入口：列表 → 详情 → AI 清洗 → 输出 |
| `sources.json` | 抓取源配置（源名称 / 列表页 / 解析方式 / 是否启用） |
| `config.json` | AI 配置（apiKey / baseUrl / model，**gitignored，不上传**） |
| `run_daily.bat` | 一键运行（Windows 双击） |
| `output/jobs.json` | 抓取结果，导入扩展用 |

## 使用方法

```bash
# 首次安装依赖（用清华镜像）
python -m pip install requests beautifulsoup4 -i https://pypi.tuna.tsinghua.edu.cn/simple

# 一键抓取（最近 7 天，最多 50 条）
python crawler/crawl.py

# 只抓列表+详情、不调 AI（调试用）
python crawler/crawl.py --dry

# 自定义天数和数量
python crawler/crawl.py --days 14 --limit 100
```

抓完后，在扩展「岗位清单」页点 **「导入 JSON」**，选择 `crawler/output/jobs.json`。

## 反封禁策略

- 浏览器 User-Agent（避免被识别为脚本）
- 串行抓取 + 每次请求间隔 0.7~2.3 秒随机抖动
- 403/429/超时按指数退避自动重试（最多 4 次）
- 每天只跑一次，只抓列表页第一屏的最新公告
- 只抓公开的官方公告页，不做高频全量爬取

## 添加新源（Task #6 铺满全部源）

在 `sources.json` 的 `sources` 数组里加一条即可，例如：

```json
{
  "name": "四川省教育厅",
  "base": "http://edu.sc.gov.cn",
  "list_url": "http://edu.sc.gov.cn/xxx/list.shtml",
  "list_type": "rst-dated-links",
  "category_hint": "教师",
  "enabled": true
}
```

`list_type: "rst-dated-links"` 是通用解析器：抓列表页里所有形如
`/YYYY/M/D/xxx.shtml` 的链接，日期从 URL 解析，标题取链接文字。
只要目标网站列表页是服务端渲染、且日期在链接路径里，就能直接复用。

> 注意：四川人事考试网（scpta.com.cn）是 SPA 单页应用，列表靠 JS 加载，
> 无法用 `rst-dated-links` 直接抓，需要单独解析其 JSON 接口（后续源接入时处理）。

## Windows 任务计划（每天自动拉取）

1. 打开「任务计划程序」（Win + R 输入 `taskschd.msc`）
2. 「创建基本任务」→ 名称填「JobFill 每日拉取岗位」
3. 触发器选「每天」，时间选你方便的时间（如上午 9 点）
4. 操作选「启动程序」，程序填 `run_daily.bat` 的完整路径
5. 完成即可。之后每天自动生成 `output/jobs.json`，你只需在扩展里点「导入 JSON」。

> 建议导入后勾选扩展里「🗑 删除过期」，自动清理截止日期已过的岗位。
