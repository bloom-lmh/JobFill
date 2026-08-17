# crawler/fetch.py — 反封禁 HTTP 抓取助手（浏览器 UA + 重试 + 退避 + 随机间隔）
import random
import time

import requests

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'


def get(url, timeout=30, max_retries=4):
    """GET 一个 URL，返回 requests.Response。403/429/超时按指数退避重试。"""
    headers = {'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}
    last_err = None
    for attempt in range(max_retries):
        try:
            r = requests.get(url, headers=headers, timeout=timeout, verify=False)
            if r.status_code in (403, 429):
                last_err = RuntimeError('HTTP %d' % r.status_code)
                time.sleep(min(30, 5 * (attempt + 1)))
                continue
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            last_err = e
            time.sleep(min(30, 2 * (attempt + 1)))
    raise RuntimeError('抓取失败 %s: %s' % (url, last_err))


def sleep_jitter(base=1.5):
    """请求间隔：base 秒附近 ±0.8 秒的随机抖动，串行抓取降低被识别为爬虫的概率。"""
    time.sleep(max(0.3, base + random.uniform(-0.8, 0.8)))
