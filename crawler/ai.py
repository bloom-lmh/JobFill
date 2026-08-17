# crawler/ai.py — OpenAI 兼容接口调用（纯标准库，无需 pip）
import json
import os
import urllib.request
import urllib.error

_DIR = os.path.dirname(os.path.abspath(__file__))


def load_config():
    with open(os.path.join(_DIR, 'config.json'), encoding='utf-8') as f:
        return json.load(f)


def chat(messages, max_tokens=2048, temperature=0):
    """调用 OpenAI 兼容接口，返回首个 choice 的文本内容。"""
    cfg = load_config()
    url = cfg['baseUrl'].rstrip('/') + '/v1/chat/completions'
    body = {
        'model': cfg['model'],
        'messages': messages,
        'temperature': temperature,
        'max_tokens': max_tokens,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + cfg['apiKey'],
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', 'replace')
        raise RuntimeError('HTTP %s: %s' % (e.code, err))
    except urllib.error.URLError as e:
        raise RuntimeError('网络错误: %s' % e.reason)

    choices = data.get('choices') or []
    if not choices:
        raise RuntimeError('无 choices: %s' % json.dumps(data, ensure_ascii=False)[:500])
    return choices[0]['message']['content']
