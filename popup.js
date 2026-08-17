// ===== Popup 仪表板 =====

// 点击面板按钮 → 切换（显示/隐藏）当前页面的悬浮面板
document.getElementById('btn-panel').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) { window.close(); return; }
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' }, () => {
      chrome.runtime.lastError;
    });
    window.close();
  });
});

// 打开完整管理页
document.getElementById('btn-options').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  window.close();
});

// 打开岗位清单页
document.getElementById('btn-jobs').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('jobs.html') });
  window.close();
});

// 打开材料库管理页
document.getElementById('btn-materials').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('materials.html') });
  window.close();
});

// ===== 统计各板块填写率 =====
function countFilled(obj) {
  if (!obj || typeof obj !== 'object') return { filled: 0, total: 0 };
  let filled = 0, total = 0;
  for (const v of Object.values(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') { total++; if (v.trim()) filled++; }
    else if (typeof v === 'number') { total++; if (v) filled++; }
  }
  return { filled, total };
}

function pct(filled, total) {
  return total === 0 ? 0 : Math.round(filled / total * 100);
}

function setBar(id, p) {
  const bar = document.getElementById('bar-' + id);
  const label = document.getElementById('pct-' + id);
  if (bar) bar.style.width = p + '%';
  if (label) label.textContent = p + '%';
  if (bar) bar.style.background = p >= 80 ? 'linear-gradient(90deg,#276749,#38a169)' : p >= 40 ? 'linear-gradient(90deg,#3b82f6,#60a5fa)' : 'linear-gradient(90deg,#e2e8f0,#cbd5e0)';
}

async function initDashboard() {
  // 查询当前页面面板可见状态，动态更新按钮文字
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'QUERY_PANEL' }, resp => {
      chrome.runtime.lastError; // 忽略无法注入的页面
      const btn = document.getElementById('btn-panel');
      if (resp?.visible === false) {
        btn.textContent = '📋 显示填写面板';
        btn.style.background = 'linear-gradient(135deg,#276749,#38a169)';
      } else {
        btn.textContent = '🙈 隐藏填写面板';
        btn.style.background = 'linear-gradient(135deg,#744210,#c05621)';
      }
    });
  }

  const { resumeData: d } = await chrome.storage.local.get('resumeData');

  if (!d || !d.personal?.name) {
    document.getElementById('profile-empty').style.display = '';
    document.getElementById('profile-content').style.display = 'none';
    setBar('personal', 0); setBar('intention', 0);
    setBar('education', 0); setBar('work', 0); setBar('skills', 0);
    document.getElementById('footer-total').textContent = '未填写简历';
    return;
  }

  // 个人信息摘要
  document.getElementById('profile-empty').style.display = 'none';
  document.getElementById('profile-content').style.display = '';
  const p = d.personal || {};
  document.getElementById('pf-name').textContent = p.name || '—';
  const edu0 = (d.education || [])[0] || {};
  const it = d.intention || {};
  const badge = it.type || (edu0.degree ? edu0.degree + '生' : '');
  document.getElementById('pf-badge').textContent = badge || '求职者';
  document.getElementById('pf-phone').textContent = p.phone || '未填写';
  document.getElementById('pf-email').textContent = p.email || '未填写';
  const eduText = [edu0.school, edu0.major, edu0.degree].filter(Boolean).join(' · ') || '未填写';
  document.getElementById('pf-edu').textContent = eduText;
  document.getElementById('pf-intention').textContent = it.position || '未设置意向岗位';

  // 各板块进度
  // 安全取值：undefined/null/非字符串都视为空
  const hasVal = v => v !== null && v !== undefined && String(v).trim() !== '';

  const personalKeys = ['name','gender','birthday','phone','email','current_city','political'];
  const pPersonal = pct(personalKeys.filter(k => hasVal(p[k])).length, personalKeys.length);

  const intentionKeys = ['status','type','position','city','salary','available'];
  const pIntention = pct(intentionKeys.filter(k => hasVal(it[k])).length, intentionKeys.length);

  const hasEdu = (d.education?.length ?? 0) > 0;
  const eduKeys = ['school','major','degree','start','end'];
  const pEdu = hasEdu ? pct(eduKeys.filter(k => hasVal(edu0[k])).length, eduKeys.length) : 0;

  const work0 = (d.work || [])[0] || (d.internship || [])[0] || {};
  const workKeys = ['company','position','start','end','desc'];
  const hasWork = (d.work?.length ?? 0) > 0 || (d.internship?.length ?? 0) > 0;
  const pWork = hasWork ? pct(workKeys.filter(k => hasVal(work0[k])).length, workKeys.length) : 0;

  const s = d.skills || {};
  const pSkills = pct([hasVal(s.tech), hasVal(d.intro), hasVal(s.certificates)].filter(Boolean).length, 3);

  setBar('personal', pPersonal);
  setBar('intention', pIntention);
  setBar('education', pEdu);
  setBar('work', pWork);
  setBar('skills', pSkills);

  const overall = Math.round((pPersonal + pIntention + pEdu + pWork + pSkills) / 5);
  document.getElementById('footer-total').textContent = `整体完整度 ${overall}%`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

initDashboard();
