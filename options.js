// ===== 模板生成函数 =====

function eduTemplate(d = {}) {
  return `
  <div class="grid g3">
    <div class="field"><label>学校名称</label><input data-key="school" value="${d.school||''}"/></div>
    <div class="field"><label>专业</label><input data-key="major" value="${d.major||''}"/></div>
    <div class="field"><label>学历</label>
      <select data-key="degree">
        ${['','博士','硕士','本科','大专'].map(v=>`<option${v===d.degree?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>入学时间</label><input data-key="start" value="${d.start||''}" placeholder="2020-09"/></div>
    <div class="field"><label>毕业时间</label><input data-key="end" value="${d.end||''}" placeholder="2024-06"/></div>
    <div class="field"><label>学校类型</label>
      <select data-key="school_type">
        ${['','985/211','985','211','双一流','普通本科','专科'].map(v=>`<option${v===d.school_type?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>GPA</label><input data-key="gpa" value="${d.gpa||''}"/></div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    <div class="field"><label>成绩排名（如 30/90）</label><input data-key="rank" value="${d.rank||''}"/></div>
    <div class="field"><label>荣誉奖项</label><input data-key="honors" value="${d.honors||''}"/></div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    <div class="field"><label>课外活动</label><input data-key="activities" value="${d.activities||''}"/></div>
    <div class="field"><label>研究方向</label><input data-key="research" value="${d.research||''}"/></div>
  </div>
  <div class="field" style="margin-top:12px"><label>毕业论文题目</label><input data-key="thesis" value="${d.thesis||''}"/></div>`;
}

function internTemplate(d = {}) {
  return `
  <div class="grid g2">
    <div class="field"><label>实习公司</label><input data-key="company" value="${d.company||''}"/></div>
    <div class="field"><label>职位</label><input data-key="position" value="${d.position||''}"/></div>
  </div>
  <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>开始时间</label><input data-key="start" value="${d.start||''}" placeholder="2024-09"/></div>
    <div class="field"><label>结束时间</label><input data-key="end" value="${d.end||''}" placeholder="2025-06"/></div>
    <div class="field"><label>工作地点</label><input data-key="location" value="${d.location||''}"/></div>
    <div class="field"><label>薪资</label><input data-key="salary" value="${d.salary||''}"/></div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    <div class="field"><label>公司规模</label><input data-key="company_size" value="${d.company_size||''}"/></div>
    <div class="field"><label>汇报人</label><input data-key="manager" value="${d.manager||''}"/></div>
  </div>
  <div class="field" style="margin-top:12px"><label>工作描述</label><textarea data-key="desc">${d.desc||''}</textarea></div>
  <div class="field" style="margin-top:12px"><label>离职原因（选填）</label><input data-key="leave_reason" value="${d.leave_reason||''}"/></div>`;
}

function workTemplate(d = {}) {
  return internTemplate(d); // 结构相同
}

function projTemplate(d = {}) {
  return `
  <div class="grid g2">
    <div class="field"><label>项目名称</label><input data-key="name" value="${d.name||''}"/></div>
    <div class="field"><label>担任角色</label><input data-key="role" value="${d.role||''}"/></div>
  </div>
  <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>开始时间</label><input data-key="start" value="${d.start||''}" placeholder="2024-12"/></div>
    <div class="field"><label>结束时间</label><input data-key="end" value="${d.end||''}" placeholder="2025-06"/></div>
    <div class="field"><label>项目链接</label><input data-key="url" value="${d.url||''}"/></div>
    <div class="field"><label>团队人数</label><input data-key="team_size" value="${d.team_size||''}"/></div>
  </div>
  <div class="field" style="margin-top:12px"><label>项目描述</label><textarea data-key="desc">${d.desc||''}</textarea></div>`;
}

function langTemplate(d = {}) {
  return `
  <div class="grid g3">
    <div class="field"><label>语言</label><input data-key="language" value="${d.language||''}"/></div>
    <div class="field"><label>证书/考试</label><input data-key="certificate" value="${d.certificate||''}" placeholder="CET-6"/></div>
    <div class="field"><label>考试时间</label><input data-key="exam_date" value="${d.exam_date||''}"/></div>
  </div>
  <div class="grid g3" style="margin-top:12px">
    <div class="field"><label>分数</label><input data-key="score" value="${d.score||''}"/></div>
    <div class="field"><label>听说能力</label>
      <select data-key="listening_speaking">
        ${['','优秀','良好','一般'].map(v=>`<option${v===d.listening_speaking?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>读写能力</label>
      <select data-key="reading_writing">
        ${['','优秀','良好','一般'].map(v=>`<option${v===d.reading_writing?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
  </div>`;
}

function paperTemplate(d = {}) {
  return `
  <div class="field"><label>论文标题</label><input data-key="title" value="${d.title||''}"/></div>
  <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>期刊/会议</label><input data-key="journal" value="${d.journal||''}"/></div>
    <div class="field"><label>作者排名</label><input data-key="author_rank" value="${d.author_rank||''}" placeholder="一作"/></div>
    <div class="field"><label>状态</label>
      <select data-key="status">
        ${['','已发表','审稿中','录用待刊'].map(v=>`<option${v===d.status?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>论文链接</label><input data-key="url" value="${d.url||''}"/></div>
  </div>`;
}

// ===== 渲染多条目列表 =====
function renderList(containerId, items, templateFn, labelFn) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  (items || []).forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'multi-item';
    div.dataset.index = i;
    div.innerHTML = `
      <div class="multi-item-header">
        <span class="multi-item-title">${labelFn(item, i)}</span>
        <button class="btn-remove" data-container="${containerId}">删除</button>
      </div>
      ${templateFn(item)}`;
    container.appendChild(div);
  });
}

function getLabelFn(type) {
  const fns = {
    edu:    (d, i) => `第 ${i+1} 条 · ${d.school||''}  ${d.degree||''}`,
    intern: (d, i) => `第 ${i+1} 条 · ${d.company||''}  ${d.position||''}`,
    work:   (d, i) => `第 ${i+1} 条 · ${d.company||''}  ${d.position||''}`,
    proj:   (d, i) => `第 ${i+1} 条 · ${d.name||''}`,
    lang:   (d, i) => `第 ${i+1} 条 · ${d.language||''}  ${d.certificate||''}`,
    paper:  (d, i) => `第 ${i+1} 条 · ${(d.title||'').slice(0,30)}...`,
  };
  return fns[type];
}

// ===== 从 DOM 收集某个 multi-item 的数据 =====
function collectItem(itemEl) {
  const data = {};
  itemEl.querySelectorAll('[data-key]').forEach(el => {
    data[el.dataset.key] = el.value.trim();
  });
  return data;
}

// ===== 收集整个表单 =====
function collectAll() {
  const v = id => document.getElementById(id)?.value.trim() || '';
  return {
    personal: {
      name: v('p_name'), gender: v('p_gender'), birthday: v('p_birthday'), age: v('p_age'),
      phone: v('p_phone'), email: v('p_email'), wechat: v('p_wechat'), qq: v('p_qq'),
      id_number: v('p_id_number'), political: v('p_political'), ethnicity: v('p_ethnicity'),
      nationality: v('p_nationality'), hometown_province: v('p_hometown_province'),
      hometown_city: v('p_hometown_city'), current_city: v('p_current_city'),
      address: v('p_address'), marital: v('p_marital'), height: v('p_height'), weight: v('p_weight'),
    },
    intention: {
      status: v('i_status'), type: v('i_type'), industry: v('i_industry'),
      position: v('i_position'), city: v('i_city'), salary: v('i_salary'), available: v('i_available'),
    },
    education:   [...document.querySelectorAll('#edu-list .multi-item')].map(collectItem),
    internship:  [...document.querySelectorAll('#intern-list .multi-item')].map(collectItem),
    work:        [...document.querySelectorAll('#work-list .multi-item')].map(collectItem),
    projects:    [...document.querySelectorAll('#proj-list .multi-item')].map(collectItem),
    skills: {
      tech: v('s_tech'), workplace: v('s_workplace'), interests: v('s_interests'),
      career_plan: v('s_career_plan'), certificates: v('s_certificates'), cover_letter: v('s_cover_letter'),
    },
    languages:   [...document.querySelectorAll('#lang-list .multi-item')].map(collectItem),
    papers:      [...document.querySelectorAll('#paper-list .multi-item')].map(collectItem),
    intro: v('intro'), github: v('github'), homepage: v('homepage'), family: v('family'),
  };
}

// ===== 填充表单 =====
function fillForm(data) {
  if (!data) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  const p = data.personal || {};
  Object.keys(p).forEach(k => set('p_'+k, p[k]));
  const it = data.intention || {};
  Object.keys(it).forEach(k => set('i_'+k, it[k]));
  const s = data.skills || {};
  Object.keys(s).forEach(k => set('s_'+k, s[k]));
  set('intro', data.intro); set('github', data.github);
  set('homepage', data.homepage); set('family', data.family);

  renderList('edu-list',    data.education,  eduTemplate,   getLabelFn('edu'));
  renderList('intern-list', data.internship, internTemplate, getLabelFn('intern'));
  renderList('work-list',   data.work,       workTemplate,  getLabelFn('work'));
  renderList('proj-list',   data.projects,   projTemplate,  getLabelFn('proj'));
  renderList('lang-list',   data.languages,  langTemplate,  getLabelFn('lang'));
  renderList('paper-list',  data.papers,     paperTemplate, getLabelFn('paper'));
}

// ===== 初始化 =====
async function init() {
  const { resumeData } = await chrome.storage.local.get('resumeData');
  if (resumeData && resumeData.personal) {
    fillForm(resumeData);
  } else {
    try {
      const res = await fetch(chrome.runtime.getURL('resume-data.json'));
      const data = await res.json();
      fillForm(data);
      await chrome.storage.local.set({ resumeData: data });
    } catch (e) { console.warn('读取默认数据失败', e); }
  }
}

// ===== 删除条目（事件委托）=====
document.addEventListener('click', e => {
  if (!e.target.classList.contains('btn-remove')) return;
  e.target.closest('.multi-item').remove();
});

// ===== 添加按钮 =====
const addConfigs = [
  { btn: 'edu-add',    list: 'edu-list',    tpl: eduTemplate,   label: getLabelFn('edu'),   def: {} },
  { btn: 'intern-add', list: 'intern-list', tpl: internTemplate,label: getLabelFn('intern'),def: {} },
  { btn: 'work-add',   list: 'work-list',   tpl: workTemplate,  label: getLabelFn('work'),  def: {} },
  { btn: 'proj-add',   list: 'proj-list',   tpl: projTemplate,  label: getLabelFn('proj'),  def: {} },
  { btn: 'lang-add',   list: 'lang-list',   tpl: langTemplate,  label: getLabelFn('lang'),  def: {} },
  { btn: 'paper-add',  list: 'paper-list',  tpl: paperTemplate, label: getLabelFn('paper'), def: {} },
];

addConfigs.forEach(({ btn, list, tpl, label }) => {
  document.getElementById(btn).addEventListener('click', () => {
    const container = document.getElementById(list);
    const i = container.querySelectorAll('.multi-item').length;
    const div = document.createElement('div');
    div.className = 'multi-item';
    div.dataset.index = i;
    div.innerHTML = `
      <div class="multi-item-header">
        <span class="multi-item-title">第 ${i+1} 条</span>
        <button class="btn-remove">删除</button>
      </div>
      ${tpl({})}`;
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// ===== 保存 =====
document.getElementById('btn-save').addEventListener('click', async () => {
  const data = collectAll();
  await chrome.storage.local.set({ resumeData: data });
  showToast('✅ 保存成功');
});

// ===== 导出 =====
document.getElementById('btn-export').addEventListener('click', () => {
  const data = collectAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: 'resume-data.json'
  });
  a.click();
  showToast('⬇ 已导出 resume-data.json');
});

// ===== 导入 =====
document.getElementById('btn-import').addEventListener('click', () =>
  document.getElementById('importFile').click());

document.getElementById('importFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    fillForm(data);
    await chrome.storage.local.set({ resumeData: data });
    showToast('✅ 导入成功');
  } catch { showToast('❌ 文件格式错误'); }
  e.target.value = '';
});

// ===== 左侧导航高亮 =====
const navLinks = document.querySelectorAll('.sidenav a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+e.target.id));
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });
document.querySelectorAll('.card[id]').forEach(s => observer.observe(s));

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

init();
