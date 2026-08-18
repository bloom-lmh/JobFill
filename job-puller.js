// job-puller.js — 官方招聘源抓取（crawler/*.py 的 JS 版，跑在扩展页面里，点「拉取」即用）
// 不依赖 chrome.*，只用 fetch + DOMParser + URL，因此也能在浏览器控制台/Node(fetch) 里单独跑。
// 对标 Python：crawl.py（编排）+ fetch.py（反封禁）+ clean.py（AI 清洗）+ sources.json（源配置）
(function (root) {
  'use strict';

  var CATEGORIES = ['公务员', '事业编', '教师', '银行', '国企', '央企', '军队文职', '其它', '私企'];
  var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

  // ===== 源配置（对应 sources.json，硬编码进扩展） =====
  // 注：建设银行(job.ccb.com)未接入 —— 该站用旧式 TLS 重协商，Chrome/BoringSSL 会拒连
  //     （ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED），浏览器 fetch 无法绕过；银行类请用 Python 爬虫或手动批量打开。
  var SOURCES = [
    { name: '四川省人社厅·公示公告', base: 'http://rst.sc.gov.cn', list_url: 'http://rst.sc.gov.cn/rst/gsgg/zfxxgkpage.shtml', list_type: 'rst', category_hint: '公务员' },
    { name: '四川省人社厅·市县动态', base: 'http://rst.sc.gov.cn', list_url: 'http://rst.sc.gov.cn/rst/sndt/zwdtlist.shtml', list_type: 'rst', category_hint: '事业编' },
    { name: '四川省人社厅·招考录用', base: 'http://rst.sc.gov.cn', list_url: 'http://rst.sc.gov.cn/rst/zkly/zfxxgkpage.shtml', list_type: 'rst', category_hint: '事业编' },
    { name: '四川人事考试网·公务员', base: 'https://www.scpta.com.cn', list_url: 'https://www.scpta.com.cn/front/News/List/56', list_type: 'span', item_selector: 'li', link_contains: 'News/info', category_hint: '公务员' },
    { name: '四川人事考试网·事业单位', base: 'https://www.scpta.com.cn', list_url: 'https://www.scpta.com.cn/front/News/List/67', list_type: 'span', item_selector: 'li', link_contains: 'News/info', category_hint: '事业编' },
    { name: '四川省教育厅·高校招聘', base: 'http://edu.sc.gov.cn', list_url: 'http://edu.sc.gov.cn/scedu/c100505/xwzx_list.shtml', list_type: 'span', item_selector: 'ul.xwzxList li', category_hint: '教师' },
    { name: '国家公务员局·招考公告', base: 'http://dl.scs.gov.cn', list_url: 'http://dl.scs.gov.cn/api/article/articlelist/all/8a81f6d9980207bb0198ab5683670008/0000000062b7b2b60162bccdd5860007/{page}', list_type: 'scs', category_hint: '公务员' },
    { name: '军队人才网·文职公告', base: 'http://81rc.81.cn', list_url: 'http://81rc.81.cn/sy/gzdt_210283/index.html', list_type: 'span', item_selector: 'ul li', category_hint: '军队文职' }
  ];

  // ===== 基础工具 =====
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function sleepJitter() { return sleep(Math.max(300, 1500 + (Math.random() - 0.5) * 1600)); }

  var DATE_RE = /(\d{4})[-年.](\d{1,2})[-月.](\d{1,2})/;
  function parseDate(s) {
    if (!s) return null;
    var m = String(s).match(DATE_RE);
    if (!m) return null;
    return { str: m[1] + '-' + pad(m[2]) + '-' + pad(m[3]) };
  }

  function blockText(el) {
    // 类似 BeautifulSoup get_text('\n')：块级元素之间插入换行，便于正则按行截断来源/发布时间
    if (!el) return '';
    var parts = [];
    (function walk(node) {
      node.childNodes.forEach(function (c) {
        if (c.nodeType === 3) { parts.push(c.nodeValue); }
        else if (c.nodeType === 1) {
          walk(c);
          if (/^(BR|P|DIV|LI|UL|OL|TR|TABLE|SECTION|H[1-6])$/.test(c.tagName)) parts.push('\n');
        }
      });
    })(el);
    return parts.join('');
  }

  function htmlToText(html) {
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    return blockText(doc.body).replace(/\n{3,}/g, '\n\n').trim();
  }

  // ===== 反封禁 fetch（对标 fetch.py） =====
  async function get(url, maxRetries) {
    maxRetries = maxRetries == null ? 5 : maxRetries;
    var lastErr = null;
    for (var attempt = 0; attempt < maxRetries; attempt++) {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 30000);
      try {
        var resp = await fetch(url, {
          headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.1' },
          signal: controller.signal,
          credentials: 'omit'
        });
        clearTimeout(timer);
        if (resp.status === 403 || resp.status === 429) {
          lastErr = new Error('HTTP ' + resp.status);
          await sleep(Math.min(30000, 5000 * (attempt + 1)));
          continue;
        }
        if (!resp.ok) {
          lastErr = new Error('HTTP ' + resp.status);
          await sleep(Math.min(30000, 2000 * (attempt + 1)));
          continue;
        }
        return resp;
      } catch (e) {
        clearTimeout(timer);
        lastErr = e.name === 'AbortError' ? new Error('超时') : e;
        await sleep(Math.min(30000, 2000 * (attempt + 1)));
      }
    }
    throw new Error('抓取失败: ' + (lastErr && lastErr.message));
  }

  // ===== HTML 列表解析（对标 crawl.py parse_list_rst / parse_list_span） =====
  var DATED_HREF_RE = /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\/[^/]+\.(shtml|html)/;

  function parseListRst(html, base, itemSelector) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var anchors = [];
    if (itemSelector) {
      doc.querySelectorAll(itemSelector).forEach(function (node) {
        if (node.tagName === 'A') anchors.push(node);
        else node.querySelectorAll('a[href]').forEach(function (a) { anchors.push(a); });
      });
    } else {
      doc.querySelectorAll('a[href]').forEach(function (a) { anchors.push(a); });
    }
    var items = [], seen = {};
    anchors.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var m = href.match(DATED_HREF_RE);
      if (!m) return;
      var link = new URL(href, base).href;
      if (seen[link]) return;
      seen[link] = true;
      items.push({ title: (a.textContent || '').trim(), link: link, date: m[1] + '-' + pad(m[2]) + '-' + pad(m[3]) });
    });
    return items;
  }

  function parseListSpan(html, base, itemSelector, linkContains) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = [], seen = {};
    doc.querySelectorAll(itemSelector).forEach(function (li) {
      var a = li.querySelector('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (linkContains && href.indexOf(linkContains) === -1) return;
      var link = new URL(href, base).href;
      if (seen[link]) return;
      var d = null;
      li.querySelectorAll('span').forEach(function (sp) {
        if (!d) d = parseDate(sp.textContent);
      });
      if (!d) return;
      seen[link] = true;
      items.push({ title: (a.textContent || '').trim(), link: link, date: d.str });
    });
    return items;
  }

  // ===== 详情解析（对标 crawl.py parse_detail_rst，多站点兼容） =====
  var TITLE_SELECTORS = ['h1', '.navigation span.title', '.detail h1', '.detail h2', 'h2'];
  var BODY_SELECTORS = ['div.content', 'div.cont', 'div.wrap-content.news-content', '#c_body_bg', 'div.detail', 'div.content-box'];

  function parseDetail(html, link) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style').forEach(function (t) { t.remove(); });

    var title = '';
    for (var i = 0; i < TITLE_SELECTORS.length; i++) {
      var el = doc.querySelector(TITLE_SELECTORS[i]);
      if (el && (el.textContent || '').trim()) { title = el.textContent.trim(); break; }
    }
    if (!title) {
      var t = doc.querySelector('title');
      if (t) title = (t.textContent || '').trim().split('-')[0].split('_')[0].split('|')[0].trim();
    }

    var body = '';
    for (var j = 0; j < BODY_SELECTORS.length; j++) {
      var b = doc.querySelector(BODY_SELECTORS[j]);
      if (b) { body = blockText(b).replace(/\n{3,}/g, '\n\n').trim(); break; }
    }
    if (!body) body = blockText(doc.body).replace(/\n{3,}/g, '\n\n').trim();

    var full = blockText(doc.body);
    var published = '';
    var m = full.match(/(?:发布时间|发布日期|时间)[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)/);
    if (m) published = m[1].replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
    var src = '';
    m = full.match(/来源[：:]\s*([^\n|】\s]+)/);
    if (m) src = m[1].trim();

    return { title: title, link: link, publishedAt: published, source: src, body: body };
  }

  // ===== JSON 接口源（对标 crawl.py fetch_scs / fetch_ccb） =====
  function tsToDate(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  async function fetchScs(src, days, onProgress) {
    var cutoff = dateStr(daysAgo(days));
    var anns = [], page = 1, fetched = 0, total = 0;
    while (true) {
      var d;
      try { d = await (await get(src.list_url.replace('{page}', page))).json(); }
      catch (e) { onProgress(src.name + ' 列表第 ' + page + ' 页失败: ' + e.message); break; }
      var items = d.articleList || [];
      if (!items.length) break;
      fetched += items.length;
      total = +d.totalCount || 0;
      items.forEach(function (it) {
        var ds = tsToDate(it.pstrtime || 0);
        if (ds < cutoff) return;
        anns.push({ title: it.articleTitle || '', link: 'http://dl.scs.gov.cn/api/article/' + it.id, date: ds });
      });
      if (fetched >= total) break;
      page++;
    }
    onProgress(src.name + ' 最近 ' + days + ' 天 ' + anns.length + ' 条');
    var out = [];
    for (var a of anns) {
      await sleepJitter();
      try {
        var dd = await (await get(a.link)).json();
        var art = dd.article || {};
        out.push({
          title: art.articleTitle || a.title, link: a.link,
          publishedAt: art.ctime ? tsToDate(art.ctime) : '', source: '国家公务员局',
          body: htmlToText(art.content || ''), date: a.date
        });
      } catch (e) { onProgress('详情失败: ' + e.message); }
    }
    return out;
  }

  // ===== 编排：列表 → 详情 =====
  async function fetchAnnouncements(src, days, onProgress) {
    if (src.list_type === 'scs') return await fetchScs(src, days, onProgress);

    var resp = await get(src.list_url);
    var html = await resp.text();
    var items;
    if (src.list_type === 'span') items = parseListSpan(html, src.base, src.item_selector, src.link_contains);
    else items = parseListRst(html, src.base, src.item_selector);

    var cutoff = dateStr(daysAgo(days));
    var fresh = items.filter(function (it) { return it.date >= cutoff; })
      .sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
    onProgress(src.name + ' 列表 ' + items.length + ' 条，最近 ' + days + ' 天 ' + fresh.length + ' 条');

    var out = [];
    for (var it of fresh) {
      await sleepJitter();
      try {
        var r2 = await get(it.link);
        var ann = parseDetail(await r2.text(), it.link);
        ann.date = it.date;
        if (!ann.publishedAt) ann.publishedAt = it.date;
        out.push(ann);
      } catch (e) { onProgress('详情失败: ' + e.message); }
    }
    return out;
  }

  // ===== AI 清洗（对标 clean.py） =====
  function buildCleanPrompt(ann) {
    var body = (ann.body || '').slice(0, 3000);
    return '你是招聘公告信息抽取助手。从下面这条公告里判断它是不是招聘（招考/招聘/选调/遴选/引进人才）公告，并提取关键字段。输出一个 JSON 对象。\n' +
      '字段：\n' +
      'is_recruitment: 布尔，是否为招聘公告（采购/中标/表彰/新闻等非招聘内容填 false）。\n' +
      'category: 从 [' + CATEGORIES.join('、') + '] 中选一个最贴切的分类。\n' +
      'position: 招聘的岗位名称（多个岗位用顿号连接，最多 40 字）。\n' +
      'company: 招聘单位全称（多个用顿号连接）。\n' +
      'region: 工作地区（四川的写具体市/州，不是四川的写省名）。\n' +
      'deadline: 报名/投递截止日期，格式 YYYY-MM-DD，公告没有明确截止日期就填空字符串。\n' +
      'salary: 薪资，公告没写就填空字符串。\n' +
      'note: 一句话备注（岗位数量、报名方式等关键信息，最多 50 字）。\n' +
      '只输出 JSON 对象，不要输出其它文字。\n' +
      '公告标题：' + (ann.title || '') + '\n' +
      '发布时间：' + (ann.publishedAt || '') + '\n' +
      '来源：' + (ann.source || '') + '\n' +
      '链接：' + (ann.link || '') + '\n' +
      '正文：\n' + body;
  }

  async function chat(aiConfig, prompt, maxTokens) {
    var base = (aiConfig.baseUrl || '').trim().replace(/\/+$/, '');
    var url;
    if (!base) url = 'https://api.openai.com/v1/chat/completions';
    else if (/\/v1$/.test(base)) url = base + '/chat/completions';
    else url = base + '/v1/chat/completions'; // opencode 等需要 /v1 前缀

    var body = {
      model: aiConfig.model || 'deepseek-v4-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: maxTokens || 4000
    };
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 120000);
    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiConfig.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        throw new Error('API 错误 ' + resp.status + ': ' + ((err.error && err.error.message) || resp.statusText));
      }
      var data = await resp.json();
      var c = data.choices && data.choices[0];
      return (c && c.message && c.message.content) || '';
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('AI 请求超时');
      throw e;
    }
  }

  function parseJson(text) {
    text = (text || '').trim();
    if (text.indexOf('```') === 0) {
      text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(text);
  }

  async function cleanOne(ann, aiConfig, maxRetries) {
    maxRetries = maxRetries == null ? 3 : maxRetries;
    var prompt = buildCleanPrompt(ann);
    for (var attempt = 0; attempt < maxRetries; attempt++) {
      try {
        var d = parseJson(await chat(aiConfig, prompt, 4000));
        if (!d || typeof d !== 'object') throw new Error('not object');
        if (!d.is_recruitment) return null;
        return {
          category: CATEGORIES.indexOf(d.category) !== -1 ? d.category : '其它',
          region: String(d.region || ''),
          position: String(d.position || ''),
          company: String(d.company || ''),
          salary: String(d.salary || ''),
          channel: ann.source || '官网公告',
          link: ann.link || '',
          status: '待投递',
          deadline: String(d.deadline || ''),
          publishedAt: ann.publishedAt || '',
          note: String(d.note || '')
        };
      } catch (e) {
        await sleep(2000 * (attempt + 1));
      }
    }
    return null;
  }

  // ===== 主编排：抓取 + 清洗 =====
  async function pull(aiConfig, opts) {
    opts = opts || {};
    var days = opts.days != null ? opts.days : 7;
    var limit = opts.limit != null ? opts.limit : 50;
    var onProgress = opts.onProgress || function () {};
    var jobs = [];

    for (var i = 0; i < SOURCES.length; i++) {
      var src = SOURCES[i];
      onProgress('正在拉取 ' + src.name + '…');
      var anns;
      try {
        anns = await fetchAnnouncements(src, days, onProgress);
      } catch (e) {
        onProgress(src.name + ' 失败：' + e.message);
        continue;
      }
      for (var j = 0; j < anns.length; j++) {
        if (jobs.length >= limit) break;
        try {
          onProgress('AI 清洗 ' + src.name + '（' + (j + 1) + '/' + anns.length + '）…');
          var job = await cleanOne(anns[j], aiConfig);
          if (job) { job.channel = src.name; jobs.push(job); }
        } catch (e) { onProgress('清洗失败：' + e.message); }
      }
      if (jobs.length >= limit) break;
    }
    return jobs;
  }

  var api = { pull: pull, SOURCES: SOURCES, CATEGORIES: CATEGORIES, parseDate: parseDate, parseListRst: parseListRst, parseListSpan: parseListSpan, parseDetail: parseDetail };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JobPuller = api;
})(typeof self !== 'undefined' ? self : this);
