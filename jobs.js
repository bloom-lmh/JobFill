(function () {
  'use strict';
  var C = window.JobCore;

  var state = { list: [], category: '全部', status: '全部', region: '', keyword: '', sort: 'deadline', page: 1, pageSize: 50, editingId: null };

  var REGION_BASE = ['成都', '成都周边', '绵阳', '德阳', '眉山', '宜宾', '南充', '乐山', '泸州', '达州', '广元', '内江', '自贡', '遂宁', '巴中', '广安', '雅安', '资阳', '攀枝花', '凉山', '甘孜', '阿坝', '四川', '北京', '重庆', '上海', '广州', '深圳'];

  var PULL_SOURCES = [
    { key: 'boss', name: 'BOSS直聘', url: function (kw) { return 'https://www.zhipin.com/web/geek/job?query=' + encodeURIComponent(kw); } },
    { key: 'zhilian', name: '智联招聘', url: function (kw) { return 'https://sou.zhaopin.com/?kw=' + encodeURIComponent(kw); } },
    { key: 'job51', name: '前程无忧', url: function (kw) { return 'https://we.51job.com/pc/search?keyword=' + encodeURIComponent(kw) + '&searchType=2&sortType=0'; } },
    { key: 'gongkao', name: '考公雷达', url: function () { return 'https://www.gongkaoleida.com/'; } }
  ];

  var DEFAULT_PULL_CONFIG = {
    keywords: ['软件测试工程师', '测试开发工程师'],
    region: '成都',
    sources: ['boss', 'zhilian', 'job51'],
    pullCount: 50
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function load() { return new Promise(function (res) { chrome.storage.local.get('jobList', function (d) { res(Array.isArray(d.jobList) ? d.jobList : []); }); }); }
  function save(list) { return new Promise(function (res) { chrome.storage.local.set({ jobList: list }, res); }); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(function () { t.className = 'toast'; }, 2000); }

  function filtered() { return C.filterJobs(state.list, { category: state.category, status: state.status, region: state.region, keyword: state.keyword }); }
  function sorted() { return C.sortJobs(filtered(), state.sort); }
  function pageItems() { var s = sorted(); var start = (state.page - 1) * state.pageSize; return s.slice(start, start + state.pageSize); }

  function render() {
    var s = sorted(); var total = s.length; var maxPage = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > maxPage) state.page = maxPage;
    renderStats(); renderTable(pageItems()); renderPager(total, maxPage);
  }

  function renderStats() {
    function cnt(f) { return state.list.filter(f).length; }
    var html = C.CATEGORIES.map(function (c) { return '<span class="chip">' + esc(c) + ' ' + cnt(function (j) { return j.category === c; }) + '</span>'; }).join('');
    html += '<span class="chip chip-warn">待投递 ' + cnt(function (j) { return j.status === '待投递'; }) + '</span>';
    $('stats').innerHTML = html;
  }

  function renderTable(items) {
    var rows = items.map(function (j) {
      var soon = C.isDeadlineSoon(j, C.todayStr(), 3);
      var dl = soon ? '<span class="deadline soon">' + esc(j.deadline) + '</span>' : '<span class="deadline">' + esc(j.deadline || '—') + '</span>';
      var openBtn = j.link
        ? '<button class="btn-act" data-act="open" data-id="' + esc(j.id) + '">投递</button>'
        : '<button class="btn-act btn-act-muted" data-act="channel" data-id="' + esc(j.id) + '">渠道</button>';
      var catCls = 'tag tag-' + esc(j.category);
      return '<tr>' +
        '<td>' + esc(j.region) + '</td>' +
        '<td><span class="' + catCls + '">' + esc(j.category) + '</span></td>' +
        '<td class="cell-pos">' + esc(j.position) + '</td>' +
        '<td>' + esc(j.company) + '</td>' +
        '<td>' + esc(j.salary) + '</td>' +
        '<td><select class="status-select" data-id="' + esc(j.id) + '">' + C.STATUSES.map(function (s) { return '<option' + (s === j.status ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></td>' +
        '<td>' + dl + '</td>' +
        '<td>' + openBtn + '<button class="btn-act" data-act="edit" data-id="' + esc(j.id) + '">编辑</button><button class="btn-act btn-act-danger" data-act="del" data-id="' + esc(j.id) + '">删</button></td>' +
        '</tr>';
    }).join('');
    $('tbody').innerHTML = rows || '<tr><td colspan="8" class="empty">暂无岗位，点右上角「导入 JSON」或「+ 新增」</td></tr>';
  }

  function renderPager(total, maxPage) {
    $('pager-info').textContent = '共 ' + total + ' 条 · 第 ' + state.page + '/' + maxPage + ' 页';
    $('prev').disabled = state.page <= 1;
    $('next').disabled = state.page >= maxPage;
  }

  function findById(id) { return state.list.find(function (j) { return j.id === id; }); }

  function openModal(job) {
    state.editingId = job ? job.id : null;
    $('modal-title').textContent = job ? '编辑岗位' : '新增岗位';
    $('m-position').value = job ? job.position : '';
    $('m-company').value = job ? job.company : '';
    $('m-region').value = job ? job.region : '';
    $('m-category').value = job ? job.category : '私企';
    $('m-salary').value = job ? job.salary : '';
    $('m-channel').value = job ? job.channel : '';
    $('m-link').value = job ? job.link : '';
    $('m-deadline').value = job ? job.deadline : '';
    $('m-note').value = job ? job.note : '';
    $('modal').hidden = false;
  }
  function closeModal() { $('modal').hidden = true; }

  function saveModal() {
    var raw = { position: $('m-position').value, company: $('m-company').value, region: $('m-region').value, category: $('m-category').value, salary: $('m-salary').value, channel: $('m-channel').value, link: $('m-link').value, deadline: $('m-deadline').value, note: $('m-note').value };
    if (!raw.position.trim()) { toast('请填写岗位名称'); return; }
    if (state.editingId) {
      var idx = state.list.findIndex(function (j) { return j.id === state.editingId; });
      if (idx !== -1) state.list[idx] = Object.assign({}, state.list[idx], raw, { category: raw.category || state.list[idx].category });
    } else {
      state.list.push(C.normalizeJob(raw, raw.category));
    }
    save(state.list).then(function () { closeModal(); render(); toast('已保存'); });
  }

  function delJob(id) {
    var j = findById(id); if (!j) return;
    if (!confirm('删除「' + j.position + '」？')) return;
    state.list = state.list.filter(function (x) { return x.id !== id; });
    save(state.list).then(function () { render(); toast('已删除'); });
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) { toast('导入失败：JSON 顶层不是数组'); return; }
        var list = data.map(function (j) { return C.normalizeJob(j); });
        var v = C.validateJobList(list);
        if (!v.ok) { toast('导入失败：' + v.errors[0]); return; }
        state.list = list;
        save(state.list).then(function () { render(); toast('导入成功 ' + state.list.length + ' 条'); });
      } catch (e) { toast('JSON 解析失败'); }
    };
    reader.readAsText(file);
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(state.list, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '岗位清单.json'; a.click();
    toast('已导出');
  }

  function initRegionDatalist() {
    var set = {};
    REGION_BASE.forEach(function (r) { set[r] = 1; });
    state.list.forEach(function (j) { if (j.region) set[j.region] = 1; });
    var opts = Object.keys(set).map(function (r) { return '<option value="' + esc(r) + '">'; }).join('');
    $('region-list').innerHTML = opts;
  }

  function delExpired() {
    var today = C.todayStr();
    var expired = state.list.filter(function (j) { return C.isExpired(j, today); });
    if (expired.length === 0) { toast('没有过期岗位'); return; }
    if (!confirm('将删除 ' + expired.length + ' 条截止日期已过的岗位，确定？')) return;
    state.list = C.removeExpired(state.list, today);
    save(state.list).then(function () { render(); toast('已删除 ' + expired.length + ' 条过期岗位'); });
  }

  // ===== 拉取设置 + 批量打开 =====
  function loadConfig() {
    return new Promise(function (res) {
      chrome.storage.local.get('jobPullConfig', function (d) {
        var cfg = Object.assign({}, DEFAULT_PULL_CONFIG, d.jobPullConfig || {});
        res(cfg);
      });
    });
  }
  function saveConfig(cfg) { return new Promise(function (res) { chrome.storage.local.set({ jobPullConfig: cfg }, res); }); }

  async function pullJobs() {
    var btn = $('btn-pull');
    if (btn.disabled) return;
    var stored = await new Promise(function (res) { chrome.storage.local.get('aiConfig', res); });
    var aiConfig = stored.aiConfig;
    if (!aiConfig || !aiConfig.apiKey) {
      toast('请先在「设置」页配置 AI（API Key / 模型 / 接口地址）');
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
      return;
    }
    if (aiConfig.provider === 'claude') {
      toast('拉取岗位目前仅支持 OpenAI 兼容接口（opencode / DeepSeek 等）');
      return;
    }
    var cfg = await loadConfig();
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ 拉取中…';
    try {
      var jobs = await JobPuller.pull(aiConfig, {
        days: 7,
        limit: cfg.pullCount || 50,
        onProgress: function (m) { toast(m); }
      });
      if (!jobs.length) { toast('拉取完成：最近 7 天无新岗位'); return; }
      var list = jobs.map(function (j) { return C.normalizeJob(j); });
      var v = C.validateJobList(list);
      if (!v.ok) { toast('拉取结果异常：' + v.errors[0]); return; }
      var existing = await load();
      var seen = {};
      existing.forEach(function (j) { if (j.link) seen[j.link] = 1; });
      var fresh = list.filter(function (j) { return !j.link || !seen[j.link]; });
      var merged = existing.concat(fresh);
      await save(merged);
      state.list = merged;
      initRegionDatalist();
      render();
      toast('✅ 拉取完成：新增 ' + fresh.length + ' 条，共 ' + merged.length + ' 条');
    } catch (e) {
      toast('❌ 拉取失败：' + (e && e.message ? e.message : e));
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  function openBatch() {
    loadConfig().then(function (cfg) {
      var region = (cfg.region || '').trim();
      var urls = [];
      PULL_SOURCES.forEach(function (s) {
        if (cfg.sources.indexOf(s.key) === -1) return;
        if (s.key === 'gongkao') { urls.push(s.url()); return; }
        (cfg.keywords || []).forEach(function (kw) {
          if (!kw || !kw.trim()) return;
          var q = kw.trim() + (region ? ' ' + region : '');
          urls.push(s.url(q));
        });
      });
      if (urls.length === 0) { toast('没有可打开的链接，请先在「拉取设置」里配置关键词和来源'); return; }
      if (!confirm('将打开 ' + urls.length + ' 个招聘网站标签页，确定？')) return;
      urls.forEach(function (u, i) {
        // 错开打开，避免浏览器拦截批量弹窗
        setTimeout(function () { chrome.tabs.create({ url: u }); }, i * 350);
      });
      toast('已打开 ' + urls.length + ' 个标签页');
    });
  }

  function renderSourceChecks(checkedKeys) {
    $('pc-sources').innerHTML = PULL_SOURCES.map(function (s) {
      return '<label><input type="checkbox" value="' + esc(s.key) + '"' + (checkedKeys.indexOf(s.key) !== -1 ? ' checked' : '') + '>' + esc(s.name) + '</label>';
    }).join('');
  }

  function openPullModal() {
    loadConfig().then(function (cfg) {
      $('pc-keywords').value = (cfg.keywords || []).join('\n');
      $('pc-region').value = cfg.region || '';
      $('pc-count').value = cfg.pullCount || 50;
      renderSourceChecks(cfg.sources || []);
      $('pull-modal').hidden = false;
    });
  }

  function savePullModal() {
    var keywords = $('pc-keywords').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var sources = Array.prototype.map.call($('pc-sources').querySelectorAll('input:checked'), function (c) { return c.value; });
    var cfg = {
      keywords: keywords,
      region: $('pc-region').value.trim(),
      sources: sources,
      pullCount: parseInt($('pc-count').value, 10) || 50
    };
    saveConfig(cfg).then(function () { $('pull-modal').hidden = true; toast('拉取设置已保存'); });
  }

  function bind() {
    $('btn-import').addEventListener('click', function () { $('file-input').click(); });
    $('file-input').addEventListener('change', function (e) { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
    $('btn-export').addEventListener('click', exportJson);
    $('btn-add').addEventListener('click', function () { openModal(null); });
    $('btn-del-expired').addEventListener('click', delExpired);
    $('btn-pull').addEventListener('click', pullJobs);
    $('btn-batch-open').addEventListener('click', openBatch);
    $('btn-pull-config').addEventListener('click', openPullModal);
    $('pc-save').addEventListener('click', savePullModal);
    $('pc-cancel').addEventListener('click', function () { $('pull-modal').hidden = true; });
    $('m-save').addEventListener('click', saveModal);
    $('m-cancel').addEventListener('click', closeModal);

    $('f-category').addEventListener('change', function (e) { state.category = e.target.value; state.page = 1; render(); });
    $('f-status').addEventListener('change', function (e) { state.status = e.target.value; state.page = 1; render(); });
    $('f-region').addEventListener('input', function (e) { state.region = e.target.value; state.page = 1; render(); });
    $('f-keyword').addEventListener('input', function (e) { state.keyword = e.target.value; state.page = 1; render(); });
    $('f-sort').addEventListener('change', function (e) { state.sort = e.target.value; state.page = 1; render(); });
    $('prev').addEventListener('click', function () { if (state.page > 1) { state.page--; render(); } });
    $('next').addEventListener('click', function () { state.page++; render(); });

    $('tbody').addEventListener('change', function (e) {
      if (e.target.classList.contains('status-select')) {
        var id = e.target.getAttribute('data-id'); var j = findById(id); if (!j) return;
        var next = C.applyStatus(j, e.target.value);
        var idx = state.list.indexOf(j); state.list[idx] = next;
        save(state.list).then(function () { render(); toast('状态已更新'); });
      }
    });
    $('tbody').addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act'); var id = e.target.getAttribute('data-id'); if (!act || !id) return;
      var j = findById(id); if (!j) return;
      if (act === 'open') chrome.tabs.create({ url: j.link });
      else if (act === 'channel') toast('渠道：' + (j.channel || '未填写'));
      else if (act === 'edit') openModal(j);
      else if (act === 'del') delJob(id);
    });
  }

  function initFilters() {
    C.CATEGORIES.forEach(function (c) { var o = document.createElement('option'); o.textContent = c; $('f-category').appendChild(o); });
    C.STATUSES.forEach(function (s) { var o = document.createElement('option'); o.textContent = s; $('f-status').appendChild(o); });
    C.CATEGORIES.forEach(function (c) { var o = document.createElement('option'); o.textContent = c; $('m-category').appendChild(o); });
  }

  async function init() { initFilters(); bind(); state.list = await load(); initRegionDatalist(); render(); }
  init();
})();
