(function () {
  'use strict';
  var C = window.JobCore;

  var state = { list: [], category: '全部', status: '全部', region: '', keyword: '', sort: 'deadline', page: 1, pageSize: 50, editingId: null };

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

  function bind() {
    $('btn-import').addEventListener('click', function () { $('file-input').click(); });
    $('file-input').addEventListener('change', function (e) { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
    $('btn-export').addEventListener('click', exportJson);
    $('btn-add').addEventListener('click', function () { openModal(null); });
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

  async function init() { initFilters(); bind(); state.list = await load(); render(); }
  init();
})();
