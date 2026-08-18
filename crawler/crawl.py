# crawler/crawl.py — 爬虫编排入口：列表 → 详情 → AI 清洗 → 输出结构化岗位
# 用法：PYTHONIOENCODING=utf-8 python crawler/crawl.py [--days 7] [--limit 50] [--dry]
# 支持三类列表解析：
#   rst-dated-links  日期在 URL 路径 /YYYY/M/D/xxx.shtml（人社厅/国资委风格）
#   span-date        日期在 <span> 里（人事考试网/教育厅/军队人才网风格）
#   json-scs/json-ccb  官方 JSON 接口（国家公务员局/建设银行）
import argparse
import json
import os
import re
import sys
import datetime
from urllib.parse import urljoin

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bs4 import BeautifulSoup

from fetch import get, sleep_jitter
from clean import clean_one

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sources.json')
OUTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output')

DATED_HREF = re.compile(r'/(\d{4})/(\d{1,2})/(\d{1,2})/[^/]+\.(shtml|html)')
DATE_SPAN = re.compile(r'(\d{4})[-年.](\d{1,2})[-月.](\d{1,2})')


def today():
    return datetime.date.today()


def parse_date(s):
    if not s:
        return None
    m = DATE_SPAN.search(s)
    if m:
        return datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


# ===== HTML 列表解析 =====

def parse_list_rst(html, base, item_selector=None):
    """日期在 URL 路径 /YYYY/M/D/xxx.shtml 里。item_selector 给定时只在容器内找链接。"""
    soup = BeautifulSoup(html, 'html.parser')
    scope = soup.select(item_selector) if item_selector else soup.find_all('a', href=True)
    items = []
    seen = set()
    # 若 item_selector 是条目（而非链接），在条目内找 a；否则直接把 scope 当链接集合
    anchors = []
    for node in scope:
        if node.name == 'a':
            anchors.append(node)
        else:
            anchors.extend(node.find_all('a', href=True))
    for a in anchors:
        href = a.get('href') or ''
        m = DATED_HREF.search(href)
        if not m:
            continue
        link = urljoin(base, href)
        if link in seen:
            continue
        seen.add(link)
        d = datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        items.append({'title': a.get_text(strip=True), 'link': link, 'date': d})
    return items


def parse_list_span(html, base, item_selector, link_contains=None):
    """日期在 <span> 里：每个条目取第一个 <a>（标题+链接）和第一个含日期的 <span>。"""
    soup = BeautifulSoup(html, 'html.parser')
    items = []
    seen = set()
    for li in soup.select(item_selector):
        a = li.find('a', href=True)
        if not a:
            continue
        href = a.get('href') or ''
        if link_contains and link_contains not in href:
            continue
        link = urljoin(base, href)
        if link in seen:
            continue
        d = None
        for sp in li.find_all('span'):
            d = parse_date(sp.get_text(strip=True))
            if d:
                break
        if not d:
            continue
        seen.add(link)
        items.append({'title': a.get_text(strip=True), 'link': link, 'date': d})
    return items


# ===== HTML 详情解析（通用，兼容多站点结构） =====

DETAIL_TITLE_SELECTORS = ['h1', '.navigation span.title', '.detail h1', '.detail h2', 'h2']
DETAIL_BODY_SELECTORS = ['div.content', 'div.cont', 'div.wrap-content.news-content', '#c_body_bg', 'div.detail', 'div.content-box']


def parse_detail_rst(html, link):
    """通用详情解析：标题 + 发布时间 + 来源 + 正文。兼容 .shtml 与 .html 详情页。"""
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style']):
        t.decompose()

    title = ''
    for sel in DETAIL_TITLE_SELECTORS:
        el = soup.select_one(sel)
        if el and el.get_text(strip=True):
            title = el.get_text(strip=True)
            break
    if not title and soup.title:
        title = soup.title.get_text(strip=True).split('-')[0].split('_')[0].split('|')[0].strip()

    body = ''
    for sel in DETAIL_BODY_SELECTORS:
        el = soup.select_one(sel)
        if el:
            body = el.get_text('\n', strip=True)
            break
    if not body:
        body = soup.get_text('\n', strip=True)

    # 发布时间/来源常在正文容器之外（如 div.xgxx），故在整页文本里搜
    full = soup.get_text('\n', strip=True)
    published = ''
    m = re.search(r'(?:发布时间|发布日期|时间)[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)', full)
    if m:
        published = m.group(1).replace('年', '-').replace('月', '-').replace('日', '')
    src = ''
    m = re.search(r'来源[：:]\s*([^\n|】\s]+)', full)
    if m:
        src = m.group(1).strip()

    return {'title': title, 'link': link, 'publishedAt': published, 'source': src, 'body': body}


# ===== JSON 接口源 =====

def fetch_scs(src, days_back):
    """国家公务员局：JSON 列表 + JSON 详情。list_url 含 {page} 占位符。"""
    cutoff = today() - datetime.timedelta(days=days_back)
    anns = []
    page = 1
    fetched = 0
    total = 0
    while True:
        try:
            d = get(src['list_url'].format(page=page)).json()
        except Exception as e:
            print('  列表第 %d 页失败: %s' % (page, e))
            break
        items = d.get('articleList') or []
        if not items:
            break
        fetched += len(items)
        total = int(d.get('totalCount') or 0)
        for it in items:
            dt = datetime.datetime.fromtimestamp((it.get('pstrtime') or 0) / 1000).date()
            if dt < cutoff:
                continue
            anns.append({
                'title': it.get('articleTitle') or '',
                'link': 'http://dl.scs.gov.cn/api/article/' + it['id'],
                'date': dt,
            })
        if fetched >= total:
            break
        page += 1

    print('[%s] 最近 %d 天内 %d 条' % (src['name'], days_back, len(anns)))
    out = []
    for a in anns:
        sleep_jitter()
        try:
            dd = get(a['link']).json()
            art = dd.get('article') or {}
            content = art.get('content') or ''
            body = BeautifulSoup(content, 'html.parser').get_text('\n', strip=True)
            ct = art.get('ctime') or 0
            published = datetime.datetime.fromtimestamp(ct / 1000).strftime('%Y-%m-%d') if ct else ''
            out.append({
                'title': art.get('articleTitle') or a['title'],
                'link': a['link'],
                'publishedAt': published,
                'source': '国家公务员局',
                'body': body,
                'date': a['date'],
            })
        except Exception as e:
            print('  详情抓取失败 %s: %s' % (a['link'], e))
    return out


def fetch_ccb(src, days_back):
    """建设银行：JSON 列表（NHR105）+ JSON 详情（NHR106）。"""
    cutoff = today() - datetime.timedelta(days=days_back)
    try:
        d = get(src['list_url']).json()
    except Exception as e:
        print('[%s] 列表失败: %s' % (src['name'], e))
        return []
    items = d.get('annoList') or []
    anns = []
    for it in items:
        dt = parse_date(it.get('annoDate'))
        if not dt or dt < cutoff:
            continue
        anns.append({'title': it.get('annoTitle') or '', 'annoId': it.get('annoId'), 'date': dt})

    print('[%s] 最近 %d 天内 %d 条' % (src['name'], days_back, len(anns)))
    out = []
    for a in anns:
        sleep_jitter()
        url = ('https://job.ccb.com/tran/WCCMainPlatV5?CCB_IBSVersion=V5&isAjaxRequest=true'
               '&SERVLET_NAME=WCCMainPlatV5&TXCODE=NHR106&annoId=' + a['annoId'])
        try:
            dd = get(url).json()
            content = dd.get('annoContent') or ''
            body = BeautifulSoup(content, 'html.parser').get_text('\n', strip=True)
            out.append({
                'title': dd.get('annoTitle') or a['title'],
                'link': 'https://job.ccb.com/cn/job/plan_detail.html?annoId=' + a['annoId'],
                'publishedAt': dd.get('annoDate') or '',
                'source': dd.get('annoOrgName') or '中国建设银行',
                'body': body,
                'date': a['date'],
            })
        except Exception as e:
            print('  详情抓取失败 %s: %s' % (a['link'], e))
    return out


# ===== 编排 =====

def fetch_announcements(src, days_back):
    """按 list_type 分发，返回统一的公告字典列表 {title, link, publishedAt, source, body, date}。"""
    lt = src.get('list_type', 'rst-dated-links')
    if lt == 'json-scs':
        return fetch_scs(src, days_back)
    if lt == 'json-ccb':
        return fetch_ccb(src, days_back)

    r = get(src['list_url'])
    r.encoding = 'utf-8'
    if lt == 'span-date':
        items = parse_list_span(r.text, src['base'], src.get('item_selector', 'li'), src.get('link_contains'))
    else:
        items = parse_list_rst(r.text, src['base'], src.get('item_selector'))

    cutoff = today() - datetime.timedelta(days=days_back)
    fresh = [it for it in items if it['date'] >= cutoff]
    fresh.sort(key=lambda x: x['date'], reverse=True)
    print('[%s] 列表 %d 条，最近 %d 天内 %d 条' % (src['name'], len(items), days_back, len(fresh)))

    out = []
    for it in fresh:
        sleep_jitter()
        try:
            dr = get(it['link'])
            dr.encoding = 'utf-8'
            ann = parse_detail_rst(dr.text, it['link'])
            ann['date'] = it['date']
            if not ann['publishedAt']:
                ann['publishedAt'] = it['date'].isoformat()
            out.append(ann)
        except Exception as e:
            print('  详情抓取失败 %s: %s' % (it['link'], e))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=None)
    ap.add_argument('--limit', type=int, default=None)
    ap.add_argument('--dry', action='store_true', help='只抓列表+详情，不调 AI 清洗')
    args = ap.parse_args()

    cfg = json.load(open(CONFIG, encoding='utf-8'))
    days_back = args.days if args.days is not None else cfg.get('days_back', 7)
    limit = args.limit if args.limit is not None else cfg.get('max_results', 50)

    jobs = []
    for src in cfg['sources']:
        if not src.get('enabled', True):
            continue
        try:
            anns = fetch_announcements(src, days_back)
        except Exception as e:
            print('[%s] 失败: %s' % (src['name'], e))
            continue

        if args.dry:
            for a in anns:
                print('  DRY', a.get('publishedAt'), a.get('title')[:40])
            continue

        for a in anns:
            if len(jobs) >= limit:
                break
            try:
                job = clean_one(a)
                if job:
                    job['channel'] = src['name']
                    jobs.append(job)
                    print('  +', job['category'], '|', job['position'][:30], '|', job['company'][:20], '|', job['deadline'])
                else:
                    print('  - 非招聘:', a.get('title')[:40])
            except Exception as e:
                print('  清洗失败 %s: %s' % (a.get('link'), e))
        if len(jobs) >= limit:
            break

    os.makedirs(OUTDIR, exist_ok=True)
    outfile = os.path.join(OUTDIR, 'jobs.json')
    json.dump(jobs, open(outfile, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('完成，共 %d 条岗位 -> %s' % (len(jobs), outfile))


if __name__ == '__main__':
    main()
