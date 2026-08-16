(function (root) {
  'use strict';
  var STATUSES = ['待投递', '已投递', '已笔试', '已面试', '已offer', '已拒'];
  var CATEGORIES = ['私企', '编制', '考编', '考公'];

  function isValidStatus(s) { return STATUSES.indexOf(s) !== -1; }
  function isValidCategory(c) { return CATEGORIES.indexOf(c) !== -1; }

  function genId() { return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function validateJob(j) {
    if (!j || typeof j !== 'object') return '不是对象';
    if (typeof j.position !== 'string' || !j.position.trim()) return '缺少岗位名称';
    if (typeof j.status !== 'string' || !isValidStatus(j.status)) return '状态非法: ' + j.status;
    if (j.category && !isValidCategory(j.category)) return '分类非法: ' + j.category;
    return null;
  }

  function validateJobList(data) {
    if (!Array.isArray(data)) return { ok: false, errors: ['顶层不是数组'] };
    var errors = [];
    data.forEach(function (j, i) { var e = validateJob(j); if (e) errors.push('第 ' + (i + 1) + ' 条: ' + e); });
    return { ok: errors.length === 0, errors: errors };
  }

  function normalizeJob(raw, category) {
    raw = raw || {};
    var dl = String(raw.deadline == null ? '' : raw.deadline);
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : genId(),
      category: isValidCategory(raw.category) ? raw.category : (category || ''),
      region: String(raw.region || ''),
      position: String(raw.position || ''),
      company: String(raw.company || ''),
      salary: String(raw.salary || ''),
      competition: String(raw.competition || ''),
      advantage: String(raw.advantage || ''),
      channel: String(raw.channel || ''),
      link: String(raw.link || ''),
      status: isValidStatus(raw.status) ? raw.status : '待投递',
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(dl) ? dl : '',
      appliedAt: String(raw.appliedAt || ''),
      note: String(raw.note || '')
    };
  }

  function filterJobs(list, f) {
    f = f || {};
    var kw = String(f.keyword || '').trim().toLowerCase();
    var region = String(f.region || '').trim();
    return list.filter(function (j) {
      if (f.category && f.category !== '全部' && j.category !== f.category) return false;
      if (f.status && f.status !== '全部' && j.status !== f.status) return false;
      if (region && j.region.indexOf(region) === -1) return false;
      if (kw) {
        var hay = (String(j.position || '') + ' ' + String(j.company || '') + ' ' + String(j.note || '')).toLowerCase();
        if (hay.indexOf(kw) === -1) return false;
      }
      return true;
    });
  }

  function sortJobs(list, by) {
    var arr = list.slice();
    if (by === 'deadline') {
      arr.sort(function (a, b) {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline < b.deadline ? -1 : (a.deadline > b.deadline ? 1 : 0);
      });
    } else if (by === 'region') {
      arr.sort(function (a, b) { return String(a.region || '').localeCompare(String(b.region || ''), 'zh'); });
    }
    return arr;
  }

  function isDeadlineSoon(j, today, days) {
    if (!j || !j.deadline || j.status !== '待投递') return false;
    var d = new Date(j.deadline + 'T00:00:00');
    var t = new Date(today + 'T00:00:00');
    if (isNaN(d.getTime()) || isNaN(t.getTime())) return false;
    var diff = (d - t) / 86400000;
    return diff >= 0 && diff <= (days == null ? 3 : days);
  }

  function applyStatus(j, newStatus) {
    if (!isValidStatus(newStatus)) return j;
    var next = Object.assign({}, j, { status: newStatus });
    if (newStatus === '已投递' && !next.appliedAt) next.appliedAt = todayStr();
    return next;
  }

  var api = { STATUSES: STATUSES, CATEGORIES: CATEGORIES, genId: genId, todayStr: todayStr, validateJob: validateJob, validateJobList: validateJobList, normalizeJob: normalizeJob, filterJobs: filterJobs, sortJobs: sortJobs, isDeadlineSoon: isDeadlineSoon, applyStatus: applyStatus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JobCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
