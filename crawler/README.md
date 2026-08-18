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

## 已接入源（9 个，覆盖 6 类）

| 源 | 分类 | 范围 | list_type |
|----|------|------|-----------|
| 四川省人社厅·公示公告 | 公务员 | 四川 | `rst-dated-links` |
| 四川省人社厅·市县动态 | 事业编 | 四川 | `rst-dated-links` |
| 四川省人社厅·招考录用 | 事业编 | 四川 | `rst-dated-links` |
| 四川人事考试网·公务员 | 公务员 | 四川 | `span-date` |
| 四川人事考试网·事业单位 | 事业编 | 四川 | `span-date` |
| 四川省教育厅·高校招聘 | 教师 | 四川 | `span-date` |
| 国家公务员局·招考公告 | 公务员 | 全国 | `json-scs` |
| 建设银行·社会招聘 | 银行 | 全国 | `json-ccb` |
| 军队人才网·文职公告 | 军队文职 | 全国 | `span-date` |

> 说明：
> - 公务员/事业编/教师为季节性招聘，7 天窗口内可能只有 0~3 条属正常，可用 `--days 30` 拉更长区间。
> - **军队人才网（81rc.81.cn）偶发 502**，已加重试（5 次指数退避）；失败时该源自动跳过，不影响其它源。
> - **四川省国资委**未接入：其「招考录用」栏目最新一条停在 2022 年，国企招聘多发布在微信公众号（mp.weixin.qq.com），官网无可抓栏目，建议手动。
> - **银行/央企/私企/其它** 大多无官网公告源，靠「岗位清单」里的「一键批量打开」招聘站 + 手动导入。

## 添加新源

在 `sources.json` 的 `sources` 数组里加一条即可，`list_type` 三选一：

**1. `rst-dated-links`** —— 日期在 URL 路径 `/YYYY/M/D/xxx.shtml` 里，标题取链接文字。

```json
{
  "name": "某单位·栏目",
  "base": "http://xxx.gov.cn",
  "list_url": "http://xxx.gov.cn/col/xxx.shtml",
  "list_type": "rst-dated-links",
  "category_hint": "事业编",
  "enabled": true
}
```

**2. `span-date`** —— 日期在 `<span>` 里（列表条目 = 一个 `<a>` + 一个含日期的 `<span>`）。需指定 `item_selector`（条目 CSS 选择器），必要时加 `link_contains` 过滤链接。

```json
{
  "name": "某单位·栏目",
  "base": "https://xxx.cn",
  "list_url": "https://xxx.cn/News/List/56",
  "list_type": "span-date",
  "item_selector": "li",
  "link_contains": "News/info",
  "category_hint": "公务员",
  "enabled": true
}
```

**3. JSON 接口** —— `json-scs`（国家公务员局，`list_url` 含 `{page}` 占位符）与 `json-ccb`（建设银行，`TXCODE=NHR105` 列表 + `NHR106` 详情）已写死解析逻辑，接入同类需改 `crawl.py`。

只要目标网站列表页是服务端渲染，就能复用以上解析器。SPA 纯前端渲染（列表靠 JS 加载且无 JSON 接口）的站无法直接抓。

## Windows 任务计划（每天自动拉取）

1. 打开「任务计划程序」（Win + R 输入 `taskschd.msc`）
2. 「创建基本任务」→ 名称填「JobFill 每日拉取岗位」
3. 触发器选「每天」，时间选你方便的时间（如上午 9 点）
4. 操作选「启动程序」，程序填 `run_daily.bat` 的完整路径
5. 完成即可。之后每天自动生成 `output/jobs.json`，你只需在扩展里点「导入 JSON」。

> 建议导入后勾选扩展里「🗑 删除过期」，自动清理截止日期已过的岗位。
