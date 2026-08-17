# crawler/crawl.py — 爬虫编排入口：列表 → 详情 → AI 清洗 → 输出结构化岗位
# 用法：PYTHONIOENCODING=utf-8 python crawler/crawl.py [--days 7] [--limit 50] [--dry]
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

DATED_HREF = re.compile(r'/(\d{4})/(\d{1,2})/(\d{1,2})/[^/]+\.shtml')


def today():
    return datetime.date.today()


def parse_date(s):
    if not s:
        return None
    m = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})', s)
    if m:
        return datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    m = re.match(r'(\d{4})年(\d{1,2})月(\d{1,2})日', s)
    if m:
        return datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def parse_list_rst(html, base):
    """人社厅风格列表：抓所有 /YYYY/M/D/xxx.shtml 链接，日期从 URL 解析。"""
    soup = BeautifulSoup(html, 'html.parser')
    items = []
    seen = set()
    for a in soup.find_all('a', href=True):
        m = DATED_HREF.search(a['href'])
        if not m:
            continue
        link = urljoin(base, a['href'])
        if link in seen:
            continue
        seen.add(link)
        d = datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        items.append({
            'title': a.get_text(strip=True),
            'link': link,
            'date': d,
        })
    return items


def parse_detail_rst(html, link):
    """人社厅风格详情：标题 + 发布时间 + 来源 + 正文。"""
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style']):
        t.decompose()

    title = ''
    h1 = soup.find('h1')
    if h1:
        title = h1.get_text(strip=True)
    if not title and soup.title:
        title = soup.title.get_text(strip=True).split('-')[0].split('_')[0].strip()

    text = soup.get_text('\n', strip=True)
    published = ''
    m = re.search(r'发布时间[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)', text)
    if m:
        published = m.group(1).replace('年', '-').replace('月', '-').replace('日', '')
    src = ''
    m = re.search(r'来源[：:]\s*([^\n|】]+)', text)
    if m:
        src = m.group(1).strip()

    return {
        'title': title,
        'link': link,
        'publishedAt': published,
        'source': src,
        'body': text,
    }


def fetch_announcements(src, days_back):
    """抓某个源最近 days_back 天的公告列表 + 详情。"""
    r = get(src['list_url'])
    r.encoding = 'utf-8'
    items = parse_list_rst(r.text, src['base'])
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
