# crawler/reclassify.py — 把 岗位清单.json 的旧 4 分类重分类为新 9 分类（AI 批量，带旧分类锚点）
# 用法：PYTHONIOENCODING=utf-8 python crawler/reclassify.py
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ai import chat

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, '岗位清单.json')
BACKUP = os.path.join(HERE, '岗位清单.bak.json')

CATEGORIES = ['公务员', '事业编', '教师', '银行', '国企', '央企', '军队文职', '其它', '私企']

# AI 失败时的兜底映射（旧 -> 新）
FALLBACK = {'编制': '事业编', '考编': '事业编', '考公': '公务员', '私企': '私企'}

BATCH = 20


def compact(j, i):
    note = (j.get('note') or '').replace('\n', ' ').strip()
    if len(note) > 50:
        note = note[:50]
    parts = [str(i), j.get('category') or '', j.get('position') or '', j.get('company') or '', j.get('channel') or '']
    if note:
        parts.append(note)
    return ' | '.join(parts)


def build_prompt(items):
    lines = '\n'.join(compact(j, i) for i, j in items)
    cats = '、'.join(CATEGORIES)
    return (
        '你是求职岗位分类助手。把下面每一行岗位归入 9 个分类之一：' + cats + '。\n'
        '每行格式：「序号 | 旧分类 | 岗位 | 单位 | 渠道 | 备注」。\n'
        '旧分类已经比较准确，默认沿用旧分类的自然映射：私企→私企、考公→公务员、编制→事业编、考编→事业编。\n'
        '只有在有非常明确的反证时才改判，改判依据如下：\n'
        '1. 单位是大学/学院/职业技术学院/高等专科学校，且岗位是教师/讲师/实训教师 → 教师。\n'
        '2. 单位是银行（中农工建交、股份制、城商行、农商行、信用社、政策性银行）→ 银行。\n'
        '3. 单位是中央企业（国家电网、中石油、中石化、中国移动、中国电信、中国联通、中建、中铁、中交、中核、航天、兵器、招商局等中央管理企业）→ 央企。\n'
        '4. 单位是地方国企/省属/市属国企 → 国企。\n'
        '5. 岗位或单位涉及军队文职/军队招聘 → 军队文职。\n'
        '6. 岗位是公务员/选调生/参照公务员法管理 → 公务员。\n'
        '特别注意：\n'
        '- 不要轻易把岗位丢进「其它」，「其它」只用于真正无法判断的极少数情况。\n'
        '- 单位为空、但岗位是软件/IT/技术/测试/运维/实施/前端/后端/数据类时，通常属于私企。\n'
        '- 「银行驻场」「银行数据治理（合同制）」「银行项目测试」等是私企外包岗，仍归私企，不是银行。\n'
        '输出：只输出一个 JSON 数组，元素个数与输入行数完全相同，按输入顺序排列，每个元素是该行对应的分类名（必须是上述 9 个词之一）。不要输出任何其它文字或解释。\n'
        '输入：\n' + lines
    )


def parse_result(text, n):
    text = text.strip()
    if text.startswith('```'):
        text = text.strip('`')
        if text.lower().startswith('json'):
            text = text[4:]
    arr = json.loads(text)
    if not isinstance(arr, list):
        raise ValueError('not a list')
    if len(arr) != n:
        raise ValueError('length %d != %d' % (len(arr), n))
    out = []
    for x in arr:
        if x not in CATEGORIES:
            raise ValueError('bad category %r' % x)
        out.append(x)
    return out


def main():
    data = json.load(open(DATA, encoding='utf-8'))
    n = len(data)
    print('总岗位数:', n)
    json.dump(data, open(BACKUP, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('已备份 ->', BACKUP)

    results = []
    for start in range(0, n, BATCH):
        batch = list(enumerate(data[start:start + BATCH], start))
        items = [(idx, j) for idx, j in batch]
        prompt = build_prompt(items)
        cats = None
        last_err = None
        for attempt in range(4):
            try:
                reply = chat([{'role': 'user', 'content': prompt}], max_tokens=16000, temperature=0)
                cats = parse_result(reply, len(items))
                break
            except Exception as e:
                last_err = e
                time.sleep(3 * (attempt + 1))
        if cats is None:
            print('!! 批次 %d-%d 失败，用兜底映射。错误: %r' % (start, start + len(items) - 1, last_err))
            cats = [FALLBACK.get(j.get('category', ''), '其它') for _, j in items]
        for (idx, j), c in zip(items, cats):
            results.append((idx, c))
        print('  [%d-%d/%d] ok' % (start, start + len(items) - 1, n))
        time.sleep(1.5)  # 串行 + 间隔，避免限流

    assert len(results) == n
    for idx, c in results:
        data[idx]['category'] = c
    json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('完成，已写回', DATA)

    from collections import Counter
    print('新分类分布:', dict(Counter(j['category'] for j in data)))


if __name__ == '__main__':
    main()
