(function () {
  'use strict';
  var C = window.MaterialsCore;

  var state = { list: [] };

  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function findById(id) { return state.list.find(function (m) { return m.id === id; }); }
  function fmtSize(n) {
    n = n || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }
  function toast(m) { var t = $('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(function () { t.className = 'toast'; }, 2000); }

  function load() {
    return new Promise(function (res) {
      chrome.storage.local.get('materials', function (d) {
        state.list = Array.isArray(d.materials) ? d.materials : [];
        res();
      });
    });
  }
  function saveMeta() {
    return new Promise(function (res) { chrome.storage.local.set({ materials: state.list }, res); });
  }

  function render() { renderStats(); renderTable(); }

  function renderStats() {
    var total = state.list.length;
    var bytes = state.list.reduce(function (s, m) { return s + (m.size || 0); }, 0);
    var html = '<span class="chip">文件 ' + total + '</span>';
    html += '<span class="chip">总大小 ' + fmtSize(bytes) + '</span>';
    C.CATEGORIES.forEach(function (c) {
      var n = state.list.filter(function (m) { return m.category === c; }).length;
      if (n) html += '<span class="chip">' + esc(c) + ' ' + n + '</span>';
    });
    $('stats').innerHTML = html;
  }

  function renderTable() {
    if (!state.list.length) {
      $('tbody').innerHTML = '<tr><td colspan="5" class="empty">暂无材料，点右上角「导入文件」或拖入文件</td></tr>';
      return;
    }
    var rows = state.list.map(function (m) {
      var catSel = '<select class="cat-select" data-id="' + esc(m.id) + '">' +
        C.CATEGORIES.map(function (c) { return '<option' + (c === m.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
        '</select>';
      var defRadio = '<input type="radio" class="def-radio" name="def-' + esc(m.category) + '" data-id="' + esc(m.id) + '"' + (m.isDefault ? ' checked' : '') + '>';
      return '<tr>' +
        '<td class="cell-name">' + esc(m.name) + '</td>' +
        '<td>' + catSel + '</td>' +
        '<td>' + fmtSize(m.size) + '</td>' +
        '<td>' + defRadio + '</td>' +
        '<td><button class="btn-del" data-act="del" data-id="' + esc(m.id) + '">删除</button></td>' +
        '</tr>';
    }).join('');
    $('tbody').innerHTML = rows;
  }

  function importFiles(fileList) {
    var files = Array.prototype.slice.call(fileList);
    if (!files.length) return;
    var remaining = files.length;
    var ok = 0;
    files.forEach(function (f) {
      var reader = new FileReader();
      reader.onload = function () {
        var b64 = String(reader.result).split(',')[1]; // dataURL 去掉 "data:...;base64," 头
        var meta = C.normalizeMaterial({ name: f.name, size: f.size, mime: f.type || '' }, null);
        chrome.storage.local.set({ ['material:' + meta.id]: b64 }, function () {
          state.list.push(meta);
          ok++;
          if (--remaining === 0) { saveMeta().then(function () { render(); toast('导入成功 ' + ok + ' 个文件'); }); }
        });
      };
      reader.onerror = function () {
        if (--remaining === 0) { saveMeta().then(function () { render(); toast('导入失败'); }); }
      };
      reader.readAsDataURL(f);
    });
  }

  function delMaterial(id) {
    var m = findById(id); if (!m) return;
    if (!confirm('删除「' + m.name + '」？')) return;
    state.list = state.list.filter(function (x) { return x.id !== id; });
    chrome.storage.local.remove('material:' + id, function () {
      saveMeta().then(function () { render(); toast('已删除'); });
    });
  }

  function bind() {
    $('btn-import').addEventListener('click', function () { $('file-input').click(); });
    $('file-input').addEventListener('change', function (e) { importFiles(e.target.files); e.target.value = ''; });

    var dz = $('drop-zone');
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', function () { dz.classList.remove('drag-over'); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault(); dz.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
    });

    $('tbody').addEventListener('change', function (e) {
      if (e.target.classList.contains('cat-select')) {
        var m = findById(e.target.getAttribute('data-id')); if (!m) return;
        m.category = e.target.value;
        saveMeta().then(render);
      } else if (e.target.classList.contains('def-radio')) {
        var id = e.target.getAttribute('data-id');
        var m = findById(id); if (!m) return;
        state.list.forEach(function (x) { if (x.category === m.category) x.isDefault = (x.id === id); });
        saveMeta().then(render);
      }
    });
    $('tbody').addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'del') delMaterial(e.target.getAttribute('data-id'));
    });
  }

  async function init() { bind(); await load(); render(); }
  init();
})();
