# crawler/clean.py — 用 AI 把公告原文清洗成结构化岗位
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ai import chat

CATEGORIES = ['公务员', '事业编', '教师', '银行', '国企', '央企', '军队文职', '其它', '私企']


def _build_prompt(ann):
    body = ann.get('body') or ''
    if len(body) > 3000:
        body = body[:3000]
    return (
        '你是招聘公告信息抽取助手。从下面这条公告里判断它是不是招聘（招考/招聘/选调/遴选/引进人才）公告，'
        '并提取关键字段。输出一个 JSON 对象。\n'
        '字段：\n'
        'is_recruitment: 布尔，是否为招聘公告（采购/中标/表彰/新闻等非招聘内容填 false）。\n'
        'category: 从 [' + '、'.join(CATEGORIES) + '] 中选一个最贴切的分类。\n'
        'position: 招聘的岗位名称（多个岗位用顿号连接，最多 40 字）。\n'
        'company: 招聘单位全称（多个用顿号连接）。\n'
        'region: 工作地区（四川的写具体市/州，不是四川的写省名）。\n'
        'deadline: 报名/投递截止日期，格式 YYYY-MM-DD，公告没有明确截止日期就填空字符串。\n'
        'salary: 薪资，公告没写就填空字符串。\n'
        'note: 一句话备注（岗位数量、报名方式等关键信息，最多 50 字）。\n'
        '只输出 JSON 对象，不要输出其它文字。\n'
        '公告标题：%s\n'
        '发布时间：%s\n'
        '来源：%s\n'
        '链接：%s\n'
        '正文：\n%s\n' % (ann.get('title') or '', ann.get('publishedAt') or '', ann.get('source') or '', ann.get('link') or '', body)
    )


def _parse(text):
    text = (text or '').strip()
    if text.startswith('```'):
        text = text.strip('`')
        if text.lower().startswith('json'):
            text = text[4:]
    return json.loads(text)


def clean_one(ann, max_retries=3):
    """把单条公告清洗成结构化岗位。非招聘公告返回 None。"""
    import time
    prompt = _build_prompt(ann)
    for attempt in range(max_retries):
        try:
            reply = chat([{'role': 'user', 'content': prompt}], max_tokens=2000, temperature=0)
            d = _parse(reply)
            if not isinstance(d, dict):
                raise ValueError('not dict')
            if not d.get('is_recruitment'):
                return None
            return {
                'category': d.get('category') if d.get('category') in CATEGORIES else '其它',
                'region': str(d.get('region') or ''),
                'position': str(d.get('position') or ''),
                'company': str(d.get('company') or ''),
                'salary': str(d.get('salary') or ''),
                'channel': ann.get('source') or '官网公告',
                'link': ann.get('link') or '',
                'status': '待投递',
                'deadline': str(d.get('deadline') or ''),
                'publishedAt': ann.get('publishedAt') or '',
                'note': str(d.get('note') or ''),
            }
        except Exception:
            time.sleep(2 * (attempt + 1))
    return None
