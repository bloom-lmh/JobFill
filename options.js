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
    <div class="field"><label>所在院系</label><input data-key="department" value="${d.department||''}" placeholder="计算机学院"/></div>
    <div class="field"><label>导师</label><input data-key="advisor" value="${d.advisor||''}" placeholder="张三教授"/></div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    <div class="field"><label>实验室</label><input data-key="lab" value="${d.lab||''}" placeholder="智能感知实验室"/></div>
    <div class="field"><label>研究方向</label><input data-key="research" value="${d.research||''}"/></div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    <div class="field"><label>课外活动</label><input data-key="activities" value="${d.activities||''}"/></div>
    <div class="field"><label>是否获得国家奖学金</label>
      <select data-key="scholarship">
        ${['','是','否'].map(v=>`<option${v===(d.scholarship||'')?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    <div class="field"><label>是否交换生</label>
      <select data-key="exchange">
        ${['','是','否'].map(v=>`<option${v===(d.exchange||'')?' selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>毕业论文题目</label><input data-key="thesis" value="${d.thesis||''}"/></div>
  </div>`;
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
    customFields: collectCustomFields(),
  };
}

// ===== 导入合并：新有值则更新，新无值则保留旧值 =====
function mergeResumeData(oldData, newData) {
  if (!oldData) return newData;
  if (!newData) return oldData;
  const result = { ...oldData };
  for (const key of Object.keys(newData)) {
    const nv = newData[key];
    const ov = oldData[key];
    if (nv === null || nv === undefined || nv === '') continue; // 新值为空，保留旧值
    if (Array.isArray(nv)) {
      if (nv.length === 0) continue;
      const oldArr = Array.isArray(ov) ? ov : [];
      // 按索引合并：新条目更新旧条目对应字段，旧有而新无的条目保留
      const len = Math.max(nv.length, oldArr.length);
      result[key] = Array.from({ length: len }, (_, i) => {
        if (i >= nv.length) return oldArr[i];
        if (i >= oldArr.length) return nv[i];
        return typeof nv[i] === 'object' && nv[i] !== null
          ? mergeResumeData(oldArr[i], nv[i])
          : (nv[i] !== '' && nv[i] !== null && nv[i] !== undefined ? nv[i] : oldArr[i]);
      });
    } else if (typeof nv === 'object') {
      result[key] = mergeResumeData(ov || {}, nv);
    } else {
      result[key] = nv; // 基本类型：新值覆盖
    }
  }
  return result;
}

// 导入统一入口：读旧数据 → 合并 → 保存 → 刷新表单
async function importMergeAndSave(newData) {
  const { resumeData: existing } = await chrome.storage.local.get('resumeData');
  const merged = mergeResumeData(existing || {}, newData);
  fillForm(merged);
  await chrome.storage.local.set({ resumeData: merged });
  return merged;
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
  if (data.customFields) renderCustomFields(data.customFields);
}

// ===== 初始化 =====
async function init() {
  const { resumeData } = await chrome.storage.local.get('resumeData');
  if (resumeData && resumeData.personal) {
    fillForm(resumeData);
  } else {
    try {
      const res = await fetch(chrome.runtime.getURL('resume-data.example.json'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      fillForm(data);
    } catch (e) { console.warn('读取示例数据失败', e); }
  }
  // 延迟一帧确保 DOM 渲染完毕后再统计
  requestAnimationFrame(updateNavCounts);
}

// ===== 删除条目（事件委托）=====
document.addEventListener('click', e => {
  // 删除多条目
  if (e.target.classList.contains('btn-remove')) {
    e.target.closest('.multi-item').remove();
    updateNavCounts();
    return;
  }
  // 删除自定义字段
  if (e.target.classList.contains('btn-del-custom') || e.target.dataset.delKey) {
    const key = e.target.dataset.delKey;
    document.querySelector(`.custom-field-row[data-custom-key="${key}"]`)?.remove();
    document.querySelectorAll('.custom-fields-wrap').forEach(w => {
      if (!w.querySelector('.custom-field-row')) w.remove();
    });
    updateNavCounts();
  }
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
  updateNavCounts();
});

// ===== 导出 JSON =====
document.getElementById('btn-export').addEventListener('click', () => {
  const data = collectAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: 'resume-data.json'
  });
  a.click();
  showToast('⬇ 已导出 resume-data.json');
});

// ===== 导出 Markdown =====
document.getElementById('btn-export-md').addEventListener('click', () => {
  const d = collectAll();
  const p = d.personal || {};
  const lines = [];
  lines.push(`# ${p.name || '简历'}`);
  lines.push('');
  lines.push('## 个人信息');
  const pFields = [
    ['性别', p.gender], ['出生日期', p.birthday], ['手机', p.phone],
    ['邮箱', p.email], ['微信', p.wechat], ['政治面貌', p.political],
    ['民族', p.ethnicity], ['籍贯', `${p.hometown_province||''}${p.hometown_city||''}`],
    ['现居城市', p.current_city], ['婚姻状况', p.marital],
  ];
  pFields.forEach(([k, v]) => { if (v) lines.push(`- **${k}**：${v}`); });
  lines.push('');

  const it = d.intention || {};
  if (Object.values(it).some(Boolean)) {
    lines.push('## 求职意向');
    [['求职类型', it.type], ['期望岗位', it.position], ['期望城市', it.city],
     ['期望薪资', it.salary], ['到岗时间', it.available]].forEach(([k, v]) => {
      if (v) lines.push(`- **${k}**：${v}`);
    });
    lines.push('');
  }

  if (d.education?.length) {
    lines.push('## 教育背景');
    d.education.forEach(e => {
      lines.push(`### ${e.school || ''}（${e.degree || ''}）`);
      lines.push(`${e.start || ''} ~ ${e.end || ''}　专业：${e.major || ''}`);
      if (e.gpa) lines.push(`GPA：${e.gpa}${e.rank ? `　排名：${e.rank}` : ''}`);
      if (e.honors) lines.push(`荣誉：${e.honors}`);
      lines.push('');
    });
  }

  const expSections = [
    ['实习经历', d.internship], ['工作经历', d.work],
  ];
  expSections.forEach(([title, list]) => {
    if (!list?.length) return;
    lines.push(`## ${title}`);
    list.forEach(e => {
      lines.push(`### ${e.company || ''}　${e.position || ''}`);
      lines.push(`${e.start || ''} ~ ${e.end || ''}${e.location ? `　${e.location}` : ''}`);
      if (e.desc) lines.push(`\n${e.desc}`);
      lines.push('');
    });
  });

  if (d.projects?.length) {
    lines.push('## 项目经历');
    d.projects.forEach(e => {
      lines.push(`### ${e.name || ''}（${e.role || ''}）`);
      lines.push(`${e.start || ''} ~ ${e.end || ''}`);
      if (e.url) lines.push(`链接：${e.url}`);
      if (e.desc) lines.push(`\n${e.desc}`);
      lines.push('');
    });
  }

  const s = d.skills || {};
  if (s.tech || s.workplace || s.certificates) {
    lines.push('## 技能专长');
    if (s.tech) lines.push(s.tech);
    if (s.certificates) lines.push(`\n**证书**：${s.certificates}`);
    lines.push('');
  }

  if (d.intro) {
    lines.push('## 自我评价');
    lines.push(d.intro);
    lines.push('');
  }

  if (d.github || d.homepage) {
    lines.push('## 链接');
    if (d.github) lines.push(`- GitHub：${d.github}`);
    if (d.homepage) lines.push(`- 主页：${d.homepage}`);
    lines.push('');
  }

  const md = lines.join('\n');
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: 'resume.md'
  });
  a.click();
  showToast('⬇ 已导出 resume.md');
});

// ===== 导入 - 拖放区域 =====
const importZone = document.getElementById('import-zone');
const importFileEl = document.getElementById('importFile');

importZone.addEventListener('click', () => importFileEl.click());

importZone.addEventListener('dragover', e => {
  e.preventDefault();
  importZone.classList.add('drag-over');
});
importZone.addEventListener('dragleave', () => importZone.classList.remove('drag-over'));
importZone.addEventListener('drop', e => {
  e.preventDefault();
  importZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleImportFile(file);
});

importFileEl.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleImportFile(file);
  e.target.value = '';
});

async function handleImportFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  console.log(`[Import] 文件: ${file.name}，大小: ${file.size} 字节，格式: ${ext}`);

  if (ext === 'json') {
    try {
      const data = JSON.parse(await file.text());
      await importMergeAndSave(data);
      showToast('✅ JSON 导入成功');
      updateNavCounts();
    } catch { showToast('❌ JSON 格式错误'); }
    return;
  }

  // 提取文本
  let text = '';
  if (ext === 'md' || ext === 'txt') {
    text = await file.text();
  } else if (ext === 'docx') {
    text = await extractDocxText(file);
    if (!text) { showToast('❌ DOCX 解析失败，请转换为 Markdown 后导入'); return; }
  } else if (ext === 'pdf') {
    text = await extractPdfText(file);
    console.log(`[Import] PDF 提取结果长度: ${text.length}，内容预览: ${text.slice(0,80)}`);
    if (!text.trim()) { showToast('❌ PDF 文字提取失败（打开 DevTools Console 查看详情）'); return; }
  } else {
    showToast('❌ 不支持的格式，请使用 JSON / MD / TXT / DOCX / PDF');
    return;
  }

  // 先用规则解析（不消耗 AI token）
  const ruleData = parseResumeText(text);
  const ruleFieldCount = countDataFields(ruleData);
  console.log(`[Import] 规则解析字段数: ${ruleFieldCount}`);
  if (ruleFieldCount >= 3) {
    await importMergeAndSave(ruleData);
    showToast(`✅ 规则解析导入成功（${ruleFieldCount} 个字段）`);
    updateNavCounts();
    return;
  }

  // 规则解析不足 3 个字段，回退到 AI
  const { aiConfig } = await chrome.storage.local.get('aiConfig');
  if (!aiConfig?.apiKey) {
    showToast('❌ 规则解析字段不足，请在 AI 设置中配置 API Key 后重试');
    return;
  }

  importZone.classList.add('parsing');
  importZone.querySelector('.zone-text').textContent = '⏳ AI 解析中，请稍候...';

  // 模拟进度：快起步 → 慢爬 → 收到结果后跳满
  const bar = document.getElementById('parse-bar');
  let pct = 0;
  const setBar = (v) => { pct = v; bar.style.width = v + '%'; };
  setBar(0);
  // 阶段1：0→18%（0.4s）
  setTimeout(() => setBar(18), 50);
  // 阶段2：慢爬到 82%（每1.2s +5%，共约15s）
  const crawl = setInterval(() => {
    if (pct < 82) setBar(Math.min(82, pct + 5));
    else clearInterval(crawl);
  }, 1200);

  chrome.runtime.sendMessage({
    type: 'AI_PARSE_RESUME',
    provider: aiConfig.provider || 'openai_compat',
    apiKey: aiConfig.apiKey,
    model: aiConfig.model || '',
    baseUrl: aiConfig.baseUrl || '',
    text,
  }, async resp => {
    // 完成：进度跳满再收起
    clearInterval(crawl);
    setBar(100);
    await new Promise(r => setTimeout(r, 400));
    importZone.classList.remove('parsing');
    importZone.querySelector('.zone-text').textContent = '拖放简历文件到此处，或点击上传';
    setBar(0);
    if (chrome.runtime.lastError || resp?.error) {
      const errMsg = resp?.error || chrome.runtime.lastError?.message;
      console.error('[Import] AI 解析失败:', errMsg, resp);
      showToast(`❌ AI 解析失败: ${errMsg}`);
      return;
    }
    await importMergeAndSave(resp.data);
    showToast('✅ AI 解析导入成功');
    updateNavCounts();
  });
}

// ===== 解压工具（返回 ArrayBuffer，调用方自行选择编码）=====
async function tryDecompress(bytes) {
  // PDF FlateDecode 是 zlib(deflate)；DOCX ZIP 条目是 deflate-raw；两者都试
  for (const fmt of ['deflate', 'deflate-raw']) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(fmt));
      return await new Response(stream).arrayBuffer();
    } catch { /* 换下一种 */ }
  }
  return null;
}

// ===== DOCX：解析 ZIP 结构，解压 word/document.xml =====
function findZipEntry(bytes, name) {
  let i = 0;
  while (i < bytes.length - 30) {
    if (bytes[i]===0x50 && bytes[i+1]===0x4B && bytes[i+2]===0x03 && bytes[i+3]===0x04) {
      const method   = bytes[i+8]  | (bytes[i+9]  << 8);
      const compSize = bytes[i+18] | (bytes[i+19]<<8) | (bytes[i+20]<<16) | (bytes[i+21]<<24);
      const fnLen    = bytes[i+26] | (bytes[i+27] << 8);
      const exLen    = bytes[i+28] | (bytes[i+29] << 8);
      const fn       = new TextDecoder('utf-8').decode(bytes.slice(i+30, i+30+fnLen));
      const dataStart = i + 30 + fnLen + exLen;
      if (fn === name) return { method, data: bytes.slice(dataStart, dataStart + compSize) };
      i = dataStart + Math.max(compSize, 0);
    } else { i++; }
  }
  return null;
}

async function extractDocxText(file) {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) return '';

    const entry = findZipEntry(bytes, 'word/document.xml');
    if (!entry) { console.warn('[DOCX] 未找到 word/document.xml'); return ''; }

    let xmlBuf;
    if (entry.method === 0) {
      xmlBuf = entry.data.buffer;
    } else {
      xmlBuf = await tryDecompress(entry.data);
      if (!xmlBuf) { console.warn('[DOCX] 解压失败'); return ''; }
    }
    const xml = new TextDecoder('utf-8').decode(xmlBuf);
    const matches = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)];
    const text = matches.map(m => m[1]).join(' ');
    console.log(`[DOCX] 提取 ${matches.length} 段，预览: ${text.slice(0,100)}`);
    return text;
  } catch (e) { console.error('[DOCX] 提取出错:', e); return ''; }
}

// ===== 规则解析简历文本（MD/TXT/DOCX，无需 AI）=====
function parseResumeText(text) {
  const data = {
    personal: {}, intention: {}, education: [], internship: [], work: [],
    projects: [], skills: {}, languages: [], papers: [], intro: '',
    github: '', homepage: '', family: '', customFields: []
  };

  // 标签 → 字段映射
  const personalMap = {
    '姓名':'name','名字':'name','手机':'phone','电话':'phone','邮箱':'email',
    '微信':'wechat','QQ':'qq','性别':'gender','出生日期':'birthday','生日':'birthday',
    '政治面貌':'political','籍贯':'hometown_province','民族':'ethnicity','国籍':'nationality',
    '现居城市':'current_city','现居地':'current_city','地址':'address','婚姻':'marital',
    '身高':'height','体重':'weight','身份证':'id_number',
  };
  const intentionMap = {
    '求职状态':'status','求职类型':'type','工作类型':'type','期望行业':'industry',
    '期望岗位':'position','应聘岗位':'position','期望城市':'city','期望薪资':'salary',
    '薪资期望':'salary','到岗时间':'available',
  };
  const skillsMap = {
    '技能':'tech','编程语言':'tech','专业技能':'tech','技术栈':'tech',
    '职场技能':'workplace','兴趣爱好':'interests','爱好':'interests',
    '职业规划':'career_plan','专业证书':'certificates','证书':'certificates',
    '自荐信':'cover_letter',
  };

  const lines = text.split(/\r?\n/);
  let section = 'personal';
  let currentEdu = null, currentIntern = null, currentWork = null, currentProj = null;

  function flush() {
    if (currentEdu) { data.education.push(currentEdu); currentEdu = null; }
    if (currentIntern) { data.internship.push(currentIntern); currentIntern = null; }
    if (currentWork) { data.work.push(currentWork); currentWork = null; }
    if (currentProj) { data.projects.push(currentProj); currentProj = null; }
  }

  function setField(label, value) {
    const l = label.trim();
    if (personalMap[l]) { data.personal[personalMap[l]] = value; return; }
    if (intentionMap[l]) { data.intention[intentionMap[l]] = value; return; }
    if (skillsMap[l]) { data.skills[skillsMap[l]] = value; return; }
    if (l === 'GitHub' || l === 'github') { data.github = value; return; }
    if (l === '个人主页' || l === '主页') { data.homepage = value; return; }
    if (l === '自我评价' || l === '个人简介' || l === '简介') { data.intro = value; return; }

    // 教育字段
    if (currentEdu) {
      const eduMap = {'学校':'school','专业':'major','学历':'degree','学位':'degree',
        'GPA':'gpa','排名':'rank','荣誉':'honors','课外活动':'activities',
        '研究方向':'research','毕业论文':'thesis','院校类型':'school_type'};
      if (eduMap[l]) { currentEdu[eduMap[l]] = value; return; }
    }
    // 实习字段
    if (currentIntern) {
      const internMap = {'公司':'company','职位':'position','岗位':'position',
        '地点':'location','薪资':'salary','日薪':'salary','描述':'desc','工作描述':'desc',
        '离职原因':'leave_reason','直属上级':'manager','公司规模':'company_size'};
      if (internMap[l]) { currentIntern[internMap[l]] = value; return; }
    }
    // 项目字段
    if (currentProj) {
      const projMap = {'项目名称':'name','角色':'role','团队规模':'team_size',
        '链接':'url','项目链接':'url','描述':'desc','项目描述':'desc'};
      if (projMap[l]) { currentProj[projMap[l]] = value; return; }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 章节检测
    const secMatch = line.match(/^#{1,3}\s+(.+)/);
    if (secMatch) {
      flush();
      const title = secMatch[1].trim();
      if (/个人信息|基本信息/.test(title)) section = 'personal';
      else if (/求职意向|意向/.test(title)) section = 'intention';
      else if (/教育|学历/.test(title)) section = 'education';
      else if (/实习|工作经历|工作经验/.test(title)) section = 'internship';
      else if (/全职|工作/.test(title)) section = 'work';
      else if (/项目/.test(title)) section = 'projects';
      else if (/技能|专长/.test(title)) section = 'skills';
      else if (/外语|语言能力/.test(title)) section = 'languages';
      else if (/论文|成果|发表/.test(title)) section = 'papers';
      else if (/自我评价|个人简介|自我介绍/.test(title)) section = 'intro';
      else if (/家庭/.test(title)) section = 'family';
      continue;
    }

    // 子标题（### xxx — 学校/公司/项目名）
    if (section === 'education' && line.match(/^###\s+/)) {
      flush();
      const name = line.replace(/^###\s+/, '').split('（')[0].trim();
      const deg = line.match(/（(.+?)）/);
      currentEdu = { school: name, degree: deg ? deg[1] : '', major: '', start: '', end: '' };
      continue;
    }
    if ((section === 'internship' || section === 'work') && line.match(/^###\s+/)) {
      flush();
      const parts = line.replace(/^###\s+/, '').split(/[—\-–]/);
      if (section === 'internship') currentIntern = { company: parts[0].trim(), position: (parts[1]||'').trim(), start:'', end:'', desc:'' };
      else currentWork = { company: parts[0].trim(), position: (parts[1]||'').trim(), start:'', end:'', desc:'' };
      continue;
    }
    if (section === 'projects' && line.match(/^###\s+/)) {
      flush();
      const parts = line.replace(/^###\s+/, '').split(/[（(]/);
      currentProj = { name: parts[0].trim(), role: (parts[1]||'').replace(/[）)]/,'').trim(), start:'', end:'', desc:'' };
      continue;
    }

    // 时间区间行（2021-09 ~ 2025-06 | ...）
    const dateRange = line.match(/^(\d{4}-\d{2})\s*[~～至]\s*(\S+)/);
    if (dateRange) {
      const start = dateRange[1], end = dateRange[2];
      if (currentEdu) { currentEdu.start = start; currentEdu.end = end; }
      else if (currentIntern) { currentIntern.start = start; currentIntern.end = end; }
      else if (currentWork) { currentWork.start = start; currentWork.end = end; }
      else if (currentProj) { currentProj.start = start; currentProj.end = end; }
      continue;
    }

    // 标准键值行：- **label**：value 或 label：value 或 label: value
    const kvMatch = line.match(/^[-*]\s*\*{0,2}([^*：:]+?)\*{0,2}[：:]\s*(.+)/)
                 || line.match(/^([^：:\n]{1,15})[：:]\s*(.+)/);
    if (kvMatch) {
      const label = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      if (section === 'intro') { data.intro = (data.intro ? data.intro + ' ' : '') + value; continue; }
      setField(label, value);
      continue;
    }

    // 正文段落（用于 intro / desc 等）
    const plain = line.replace(/^[-*\d.]\s*/, '').trim();
    if (!plain || line.startsWith('#')) continue;
    if (section === 'intro') {
      data.intro = (data.intro ? data.intro + '\n' : '') + plain;
    } else if (section === 'skills' && !line.match(/^\|/)) {
      // 技能自由文本
      data.skills.tech = (data.skills.tech ? data.skills.tech + '\n' : '') + plain;
    } else if (currentEdu && /GPA|排名|荣誉|活动|论文|研究/.test(plain)) {
      // 子项（- GPA：3.8 / 4.0）已由 kvMatch 处理，这里处理普通描述行
    } else if (currentIntern || currentWork) {
      const target = currentIntern || currentWork;
      // 接受所有正文行（含普通段落），不只限序号/符号开头
      target.desc = (target.desc ? target.desc + '\n' : '') + plain;
    } else if (currentProj) {
      currentProj.desc = (currentProj.desc ? currentProj.desc + '\n' : '') + plain;
    }
  }
  flush();
  return data;
}

function countDataFields(data) {
  if (!data) return 0;
  let count = 0;
  function countObj(obj) {
    if (!obj) return;
    Object.values(obj).forEach(v => { if (v && typeof v === 'string' && v.trim()) count++; });
  }
  countObj(data.personal);
  countObj(data.intention);
  countObj(data.skills);
  if (data.intro) count++;
  if (data.github) count++;
  if (data.homepage) count++;
  count += (data.education||[]).length;
  count += (data.internship||[]).length;
  count += (data.work||[]).length;
  count += (data.projects||[]).length;
  count += (data.languages||[]).length;
  count += (data.papers||[]).length;
  return count;
}

// ===== PDF：CID十六进制解码 + 压缩流解压 =====
function hexToUtf16be(hex) {
  const bytes = hex.match(/.{2}/g).map(h => parseInt(h, 16));
  return new TextDecoder('utf-16be').decode(new Uint8Array(bytes));
}

async function extractPdfText(file) {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50) { console.warn('[PDF] 非 PDF 文件'); return ''; }

    const raw = new TextDecoder('latin1').decode(bytes);
    const texts = [];

    function extractTextOps(str) {
      // 1. 普通字符串 (text)Tj
      for (const m of str.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g)) {
        const t = m[1].replace(/\\n/g,' ').replace(/\\\\/g,'\\').replace(/\\(.)/g,'$1').trim();
        if (t && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(t)) texts.push(t);
      }
      // 2. CID 十六进制 <hex>Tj（中文 PDF 最常见）
      for (const m of str.matchAll(/<([0-9a-fA-F]{4,})>\s*Tj/g)) {
        try {
          const t = hexToUtf16be(m[1]).trim();
          if (t && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(t)) texts.push(t);
        } catch {}
      }
      // 3. 数组 [...] TJ（包含普通字符串和 CID 十六进制两种）
      for (const m of str.matchAll(/\[([^\]]+)\]\s*TJ/g)) {
        let combined = '';
        for (const p of m[1].matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g))
          combined += p[1].replace(/\\\\/g,'\\').replace(/\\(.)/g,'$1');
        for (const p of m[1].matchAll(/<([0-9a-fA-F]{4,})>/g)) {
          try { combined += hexToUtf16be(p[1]); } catch {}
        }
        if (combined.trim() && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(combined))
          texts.push(combined.trim());
      }
    }

    // 方法1：未压缩内容直接提取
    extractTextOps(raw);
    console.log(`[PDF] 直接提取: ${texts.length} 段`);

    // 方法2：用 /Length 精确定位流数据（避免 regex 截断二进制流）
    // 找所有含 FlateDecode 的流字典，读取精确字节数
    const lengthRe = /\/Length\s+(\d+)/g;
    let lm, count = 0, decompOk = 0;
    while ((lm = lengthRe.exec(raw)) !== null && count < 50) {
      const length = parseInt(lm[1]);
      if (length < 10) continue;
      // 检查这个字典是否含 FlateDecode（前后 600 字节范围内）
      const winStart = Math.max(0, lm.index - 300);
      const winEnd = Math.min(raw.length, lm.index + 600);
      const win = raw.slice(winStart, winEnd);
      if (!/FlateDecode/.test(win)) continue;
      // 找 stream 关键字位置（从 Length 往后）
      const streamKeyIdx = raw.indexOf('stream', lm.index);
      if (streamKeyIdx < 0 || streamKeyIdx - lm.index > 800) continue;
      // 跳过 stream 后的 \r\n 或 \n
      let dataStart = streamKeyIdx + 6;
      if (bytes[dataStart] === 0x0d) dataStart++;
      if (bytes[dataStart] === 0x0a) dataStart++;
      if (dataStart + length > bytes.length) continue;
      count++;
      const streamBytes = bytes.slice(dataStart, dataStart + length);
      const decompBuf = await tryDecompress(streamBytes);
      if (decompBuf) {
        decompOk++;
        const decompStr = new TextDecoder('latin1').decode(decompBuf);
        if (decompOk <= 3) {
          console.log(`[PDF] 流#${count} Length=${length}，解压后=${decompBuf.byteLength}，前200字:`, JSON.stringify(decompStr.slice(0, 200)));
        }
        extractTextOps(decompStr);
      } else {
        if (count <= 5) console.log(`[PDF] 流#${count} Length=${length} 解压失败`);
      }
    }
    console.log(`[PDF] 压缩流: 匹配${count}个，解压成功${decompOk}个，共提取${texts.length}段文字`);
    console.log(`[PDF] 预览:`, texts.slice(0, 5).join(' | '));
    return texts.join(' ');
  } catch (e) { console.error('[PDF] 提取出错:', e); return ''; }
}

// ===== 自定义字段（Issue 3）=====
const SECTION_CARD_IDS = {
  personal:'sec-personal', intention:'sec-intention', education:'sec-education',
  internship:'sec-internship', work:'sec-work', projects:'sec-projects',
  skills:'sec-skills', languages:'sec-languages', papers:'sec-papers',
  intro:'sec-intro', family:'sec-family',
};

function escHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderCustomFields(customFields) {
  document.querySelectorAll('.custom-fields-wrap').forEach(el => el.remove());
  if (!customFields || customFields.length === 0) return;
  const bySection = {};
  customFields.forEach(f => {
    const sec = SECTION_CARD_IDS[f.section] ? f.section : 'skills';
    (bySection[sec] = bySection[sec] || []).push(f);
  });
  Object.entries(bySection).forEach(([section, fields]) => {
    const body = document.getElementById(SECTION_CARD_IDS[section])?.querySelector('.card-body');
    if (!body) return;
    const wrap = document.createElement('div');
    wrap.className = 'custom-fields-wrap';
    wrap.innerHTML = `<div class="custom-label">🆕 AI 检测到的新字段</div>`;
    fields.forEach(f => {
      const row = document.createElement('div');
      row.className = 'custom-field-row';
      row.dataset.customKey = f.key;
      row.dataset.customSection = section;
      row.innerHTML = `
        <span class="custom-field-lbl" title="${escHtml(f.label)}">${escHtml(f.label)}</span>
        <input value="${escHtml(f.value||'')}" data-custom-key="${escHtml(f.key)}" placeholder="请填写"/>
        <button class="btn-del-custom" data-del-key="${escHtml(f.key)}" title="删除">×</button>`;
      wrap.appendChild(row);
    });
    body.appendChild(wrap);
  });
}

function collectCustomFields() {
  return [...document.querySelectorAll('.custom-field-row[data-custom-key]')].map(row => ({
    key: row.dataset.customKey,
    label: row.querySelector('.custom-field-lbl')?.title || '',
    section: row.dataset.customSection || 'skills',
    value: row.querySelector('input')?.value.trim() || '',
  }));
}

// ===== 导航填写进度 =====
function countFilled(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return { filled: 0, total: 0 };
  // 排除右侧面板 AI 设置里的 input（sec-ai 不在 .content 里，所以不影响；但保险起见排除 type=checkbox/hidden）
  const inputs = [...section.querySelectorAll('input:not([type=checkbox]):not([type=hidden]),select,textarea')];
  return { filled: inputs.filter(el => el.value.trim()).length, total: inputs.length };
}

function updateNavCounts() {
  const sections = [
    ['personal','sec-personal'],['intention','sec-intention'],['education','sec-education'],
    ['internship','sec-internship'],['work','sec-work'],['projects','sec-projects'],
    ['skills','sec-skills'],['languages','sec-languages'],['papers','sec-papers'],
    ['intro','sec-intro'],['family','sec-family'],
  ];
  let totalFilled = 0, totalCount = 0;
  sections.forEach(([key, secId]) => {
    const el = document.getElementById(`cnt-${key}`);
    if (!el) return;
    const { filled, total } = countFilled(secId);
    el.textContent = `${filled}/${total}`;
    el.style.background = filled === total && total > 0 ? '#c6f6d5' : '';
    el.style.color = filled === total && total > 0 ? '#276749' : '';
    totalFilled += filled; totalCount += total;
  });
  const navTotal = document.getElementById('nav-total');
  if (navTotal) navTotal.textContent = `已填写 ${totalFilled} / ${totalCount} 个字段`;
}

// ===== 左侧导航高亮 + 黄金比例定位 =====
const navLinks = document.querySelectorAll('.sidenav a');

// 点击导航时：section 顶部定位在视口 38.2% 处（黄金分割，视觉中间偏上）
navLinks.forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href')?.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = window.innerHeight * (1 - 0.618); // ≈ 38.2% from top
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    // 立即高亮对应导航项
    navLinks.forEach(l => l.classList.toggle('active', l === a));
  });
});

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

// ===== 通用：简历转 MD（紧凑格式，省 token）=====
function resumeToMD(d) {
  if (!d) return '';
  const lines = [];
  const p = d.personal || {};
  if (p.name) lines.push(`# ${p.name}`);
  const basicFields = [['手机',p.phone],['邮箱',p.email],['现居城市',p.current_city],['政治面貌',p.political]];
  basicFields.filter(([,v])=>v).forEach(([k,v]) => lines.push(`- **${k}**：${v}`));

  const intent = d.intention || {};
  if (Object.values(intent).some(Boolean)) {
    lines.push('\n## 求职意向');
    [['岗位',intent.position],['行业',intent.industry],['城市',intent.city],['薪资',intent.salary],['到岗',intent.available]]
      .filter(([,v])=>v).forEach(([k,v]) => lines.push(`- ${k}：${v}`));
  }

  (d.education||[]).forEach(e => {
    lines.push(`\n## 教育 — ${e.school||''} ${e.degree||''} ${e.major||''}`);
    if (e.start||e.end) lines.push(`${e.start||''}～${e.end||''}`);
    if (e.gpa) lines.push(`GPA：${e.gpa}${e.rank?`，排名 ${e.rank}`:''}`);
    if (e.honors) lines.push(`荣誉：${e.honors}`);
    if (e.thesis) lines.push(`论文：${e.thesis}`);
  });

  (d.internship||[]).forEach(e => {
    lines.push(`\n## 实习 — ${e.company||''} · ${e.position||''}`);
    if (e.start||e.end) lines.push(`${e.start||''}～${e.end||''}`);
    if (e.desc) lines.push(e.desc);
  });

  (d.work||[]).forEach(e => {
    lines.push(`\n## 工作 — ${e.company||''} · ${e.position||''}`);
    if (e.start||e.end) lines.push(`${e.start||''}～${e.end||''}`);
    if (e.desc) lines.push(e.desc);
  });

  (d.projects||[]).forEach(e => {
    lines.push(`\n## 项目 — ${e.name||''}`);
    if (e.role) lines.push(`角色：${e.role}`);
    if (e.desc) lines.push(e.desc);
  });

  const sk = d.skills || {};
  if (sk.tech||sk.workplace||sk.certificates) {
    lines.push('\n## 技能');
    if (sk.tech) lines.push(sk.tech);
    if (sk.certificates) lines.push(`证书：${sk.certificates}`);
  }

  (d.languages||[]).forEach(l => {
    if (l.language) lines.push(`外语：${l.language} ${l.certificate||''} ${l.score||''}`);
  });

  (d.papers||[]).forEach(p => {
    if (p.title) lines.push(`\n论文：${p.title} — ${p.journal||''} ${p.author_rank||''}`);
  });

  if (d.intro) lines.push(`\n## 自我评价\n${d.intro}`);
  return lines.join('\n');
}

// ===== 折叠展开（替代 inline onclick，CSP 合规）=====
document.querySelectorAll('[data-toggle-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.toggleSection);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? '' : 'none';
  });
});

// ===== JD 描述 =====
async function initJDSection() {
  const { currentJD } = await chrome.storage.local.get('currentJD');
  renderJDSection(currentJD);

  document.getElementById('btn-clear-jd').addEventListener('click', async () => {
    await chrome.storage.local.remove('currentJD');
    renderJDSection(null);
    document.getElementById('revise-result').innerHTML = '';
    document.getElementById('interview-result').innerHTML = '';
    showToast('JD 已清除');
  });
}

function renderJDSection(jd) {
  const empty = document.getElementById('jd-empty-tip');
  const content = document.getElementById('jd-content');
  if (!jd?.text) {
    empty.style.display = '';
    content.style.display = 'none';
    document.getElementById('revise-no-jd').style.display = '';
    document.getElementById('btn-ai-revise').disabled = true;
    document.getElementById('btn-gen-interview').disabled = true;
    return;
  }
  empty.style.display = 'none';
  content.style.display = '';
  document.getElementById('revise-no-jd').style.display = 'none';
  document.getElementById('btn-ai-revise').disabled = false;
  document.getElementById('btn-gen-interview').disabled = false;

  document.getElementById('jd-job-title').textContent = jd.jobTitle || jd.title || '—';
  document.getElementById('jd-site').textContent = jd.site || new URL(jd.url||'http://x').hostname.replace('www.','') || '—';
  document.getElementById('jd-time').textContent = jd.time ? new Date(jd.time).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';
  document.getElementById('jd-source-link').href = jd.url || '#';
  document.getElementById('jd-desc-body').textContent = jd.description || jd.text || '';
  document.getElementById('jd-req-body').textContent = jd.requirements || '';

  // 关键词标签
  const kwEl = document.getElementById('jd-keywords');
  const kws = jd.keywords || [];
  if (kws.length) {
    kwEl.innerHTML = kws.map(k =>
      `<span style="background:#ebf8ff;color:#2b6cb0;font-size:11px;padding:2px 8px;border-radius:10px">${escHtml(k)}</span>`
    ).join('');
  } else {
    kwEl.textContent = '（未识别到关键词）';
  }
}

// ===== AI 优化 =====
function initAIReviseSection() {
  document.getElementById('btn-ai-revise').addEventListener('click', async () => {
    const { aiConfig, resumeData, currentJD } = await chrome.storage.local.get(['aiConfig','resumeData','currentJD']);
    if (!aiConfig?.apiKey) { showToast('❌ 请先配置 AI API Key'); return; }

    const doSkills   = document.getElementById('revise-skills').checked;
    const doIntro    = document.getElementById('revise-intro').checked;
    const doProjects = document.getElementById('revise-projects').checked;
    if (!doSkills && !doIntro && !doProjects) { showToast('请至少勾选一项'); return; }

    const userInstruction = document.getElementById('revise-prompt').value.trim()
      || '提取JD中的关键词和能力要求，对照着帮我优化简历，让我看起来就是他们想要的人';

    const btn = document.getElementById('btn-ai-revise');
    btn.disabled = true; btn.textContent = '⏳ AI 优化中...';
    document.getElementById('revise-result').innerHTML = '<div style="color:#718096;font-size:13px;padding:8px 0">正在生成优化建议...</div>';

    // 收集待优化字段
    const fields = [];
    if (doSkills && resumeData?.skills?.tech) fields.push({ key:'skills_tech', label:'技能专长', current: resumeData.skills.tech });
    if (doIntro && resumeData?.intro) fields.push({ key:'intro', label:'自我评价', current: resumeData.intro });
    if (doProjects) {
      (resumeData?.projects||[]).forEach((p,i) => {
        if (p.desc) fields.push({ key:`proj_${i}_desc`, label:`项目「${p.name||i+1}」描述`, current: p.desc });
      });
    }
    if (!fields.length) { showToast('所选内容简历中暂无数据'); btn.disabled=false; btn.textContent='🤖 AI 优化内容'; return; }

    // 用 MD 格式发送简历（比 JSON 省约 40% token）
    const resumeMD = resumeToMD(resumeData);
    const jdPart = currentJD?.text ? `\n\n## 目标职位描述\n${currentJD.text.slice(0, 2000)}` : '';

    const system = `你是一位专业的简历优化顾问。
用户指令：${userInstruction}
规则：
1. 内容必须基于候选人原始简历事实，不可捏造经历。
2. 自然融入 JD 关键词，不要机械堆砌。
3. 严格输出 JSON 数组，不含其他文字：[{"key":"字段key","label":"字段名","optimized":"优化后内容"}]`;

    const user = `## 候选人简历\n${resumeMD}${jdPart}\n\n## 待优化字段\n${JSON.stringify(fields,null,2)}`;

    chrome.runtime.sendMessage({
      type: 'AI_FILL',
      provider: aiConfig.provider||'openai_compat',
      apiKey: aiConfig.apiKey, model: aiConfig.model||'', baseUrl: aiConfig.baseUrl||'',
      elementDict: [], resumeFlat: {},
      _rawPrompt: { system, user },
    }, resp => {
      btn.disabled = false; btn.textContent = '🤖 AI 优化内容';
      if (resp?.error) {
        document.getElementById('revise-result').innerHTML = `<div style="color:#c53030;font-size:13px">❌ ${escHtml(resp.error)}</div>`;
        return;
      }
      if (resp?.truncated) {
        document.getElementById('revise-result').insertAdjacentHTML('beforebegin',
          `<div style="color:#b7791f;font-size:12px;margin-bottom:6px">⚠ AI 回复已被截断，结果可能不完整。可尝试减少勾选字段数量。</div>`);
      }
      renderReviseResult(resp.text, resumeData);
    });
  });
}

function renderReviseResult(aiText, resumeData) {
  let results;
  try {
    const cleaned = aiText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
    results = JSON.parse(cleaned);
    if (!Array.isArray(results)) throw new Error();
  } catch {
    // AI 未返回 JSON，直接展示纯文本（便于用户自行参考）
    document.getElementById('revise-result').innerHTML =
      `<pre style="font-size:12px;color:#4a5568;white-space:pre-wrap;background:#f7fafc;padding:12px;border-radius:6px">${escHtml(aiText)}</pre>`;
    return;
  }

  const html = results.map(r => `
    <div style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;overflow:hidden">
      <div style="padding:8px 12px;background:#f7fafc;font-size:12px;font-weight:600;color:#2d3748">${escHtml(r.label||r.key||'字段')}</div>
      <div style="padding:10px 12px">
        <div style="font-size:11px;color:#a0aec0;margin-bottom:4px">优化后内容（可直接编辑）：</div>
        <textarea data-revise-key="${escHtml(r.key)}" style="width:100%;min-height:80px;font-size:12px;border:1px solid #bee3f8;border-radius:6px;padding:8px;resize:vertical;box-sizing:border-box;background:#ebf8ff">${escHtml(r.optimized||'')}</textarea>
        <button class="btn btn-save btn-apply-revise" data-revise-key="${escHtml(r.key)}" style="margin-top:6px;padding:5px 14px;font-size:12px">✅ 应用到简历</button>
      </div>
    </div>`).join('');
  document.getElementById('revise-result').innerHTML = html;

  document.querySelectorAll('.btn-apply-revise').forEach(applyBtn => {
    applyBtn.addEventListener('click', async () => {
      const key = applyBtn.dataset.reviseKey;
      const val = applyBtn.closest('div').querySelector('textarea').value;
      const { resumeData: rd } = await chrome.storage.local.get('resumeData');
      if (!rd) return;
      if (key === 'skills_tech') {
        rd.skills = rd.skills || {};
        rd.skills.tech = val;
        const el = document.getElementById('skills_tech');
        if (el) el.value = val;
      } else if (key === 'intro') {
        rd.intro = val;
        const el = document.getElementById('intro');
        if (el) el.value = val;
      } else if (key.startsWith('proj_')) {
        const idx = parseInt(key.split('_')[1]);
        if (rd.projects?.[idx]) rd.projects[idx].desc = val;
      }
      await chrome.storage.local.set({ resumeData: rd });
      applyBtn.textContent = '✅ 已应用';
      applyBtn.disabled = true;
      showToast('已应用到简历，记得点「保存简历」');
    });
  });
}

// ===== 模拟面试 =====
function initInterviewSection() {
  const genBtn = document.getElementById('btn-gen-interview');
  const regenBtn = document.getElementById('btn-regen-interview');

  async function generateInterview() {
    const { aiConfig, resumeData, currentJD: jd } = await chrome.storage.local.get(['aiConfig', 'resumeData', 'currentJD']);
    if (!aiConfig?.apiKey) { showToast('❌ 请先配置 AI API Key'); return; }
    if (!resumeData) { showToast('❌ 请先保存简历'); return; }

    const userInstruction = document.getElementById('interview-prompt').value.trim()
      || '你现在是一个挑剔的面试官，看完我的简历，请提出5个刁钻问题或指出哪段数据不清晰';

    genBtn.disabled = true;
    regenBtn.style.display = 'none';
    genBtn.textContent = '⏳ 面试官思考中...';
    document.getElementById('interview-result').innerHTML = '<div style="color:#718096;font-size:13px;padding:12px 0">AI 面试官正在准备问题...</div>';

    const resumeMD = resumeToMD(resumeData);
    const jdPart = jd?.text ? `\n\n## 目标职位描述\n${jd.text.slice(0, 2000)}` : '';

    // 面试用自由文本回复，不要求 JSON（问题+追问+评析）
    const system = `${userInstruction}`;
    const user = `## 候选人简历\n${resumeMD}${jdPart}\n\n请开始提问。`;

    chrome.runtime.sendMessage({
      type: 'AI_FILL',
      provider: aiConfig.provider || 'openai_compat',
      apiKey: aiConfig.apiKey, model: aiConfig.model || '', baseUrl: aiConfig.baseUrl || '',
      elementDict: [], resumeFlat: {},
      _rawPrompt: { system, user },
    }, resp => {
      genBtn.disabled = false;
      genBtn.textContent = '🤖 开始面试';
      regenBtn.style.display = '';
      if (resp?.error) {
        document.getElementById('interview-result').innerHTML = `<div style="color:#c53030;font-size:13px">❌ ${escHtml(resp.error)}</div>`;
        return;
      }
      // 面试回复是自由文本，直接渲染
      const truncWarn = resp?.truncated
        ? `<div style="color:#b7791f;font-size:12px;margin-bottom:6px">⚠ AI 回复已被截断，题目可能不完整。</div>`
        : '';
      document.getElementById('interview-result').innerHTML =
        truncWarn + `<div style="font-size:13px;color:#2d3748;line-height:1.8;background:#fffbeb;border:1px solid #f6e05e;border-radius:8px;padding:14px;white-space:pre-wrap">${escHtml(resp.text||'')}</div>`;
    });
  }

  genBtn.addEventListener('click', generateInterview);
  regenBtn.addEventListener('click', generateInterview);
}

initJDSection();
initAIReviseSection();
initInterviewSection();
init();

// ===== AI 配置 =====

// 厂商预置：provider → { baseUrl, defaultModel }
const AI_PRESETS = {
  openai:       { baseUrl: '',                                                    model: 'gpt-4o-mini' },
  claude:       { baseUrl: '',                                                    model: 'claude-3-haiku-20240307' },
  qwen:         { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',  model: 'qwen-plus' },
  kimi:         { baseUrl: 'https://api.moonshot.cn/v1',                         model: 'moonshot-v1-8k' },
  deepseek:     { baseUrl: 'https://api.deepseek.com/v1',                        model: 'deepseek-chat' },
  glm:          { baseUrl: 'https://open.bigmodel.cn/api/paas/v4',              model: 'glm-4-flash' },
  openai_compat:{ baseUrl: '',                                                    model: '' },
};

// provider 切换 → 自动填充 base_url 和推荐模型
document.getElementById('ai_provider')?.addEventListener('change', () => {
  const provider = document.getElementById('ai_provider').value;
  const preset = AI_PRESETS[provider] || {};
  const wrapEl = document.getElementById('ai_baseurl_wrap');
  const baseUrlEl = document.getElementById('ai_base_url');
  const modelEl = document.getElementById('ai_model');

  // 显示/隐藏 base_url 输入框
  const showBaseUrl = !['openai', 'claude'].includes(provider);
  wrapEl.style.display = showBaseUrl ? '' : 'none';

  // 自动填充 base_url（若用户已手动修改则跳过）
  if (preset.baseUrl !== undefined) baseUrlEl.value = preset.baseUrl;
  if (preset.model && !modelEl.value) modelEl.placeholder = preset.model;
});

async function loadAIConfig() {
  const { aiConfig } = await chrome.storage.local.get('aiConfig');
  if (!aiConfig) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  document.getElementById('ai_enabled').checked = !!aiConfig.enabled;
  set('ai_provider', aiConfig.provider);
  set('ai_model', aiConfig.model);
  set('ai_api_key', aiConfig.apiKey);
  set('ai_base_url', aiConfig.baseUrl);

  // 触发一次 change 以同步显示状态
  document.getElementById('ai_provider')?.dispatchEvent(new Event('change'));
}

document.getElementById('btn-save-ai')?.addEventListener('click', async () => {
  const provider = document.getElementById('ai_provider').value;
  const preset = AI_PRESETS[provider] || {};
  const baseUrlInput = document.getElementById('ai_base_url').value.trim();
  const config = {
    enabled:  document.getElementById('ai_enabled').checked,
    provider,
    model:    document.getElementById('ai_model').value.trim() || preset.model || '',
    apiKey:   document.getElementById('ai_api_key').value.trim(),
    baseUrl:  baseUrlInput || preset.baseUrl || '',
  };
  await chrome.storage.local.set({ aiConfig: config });
  showToast('✅ AI 配置已保存');
});

document.getElementById('btn-test-ai')?.addEventListener('click', () => {
  const resultEl = document.getElementById('ai-test-result');
  resultEl.textContent = '测试中...';
  resultEl.style.color = '#718096';

  const provider = document.getElementById('ai_provider').value;
  const preset = AI_PRESETS[provider] || {};
  const baseUrlInput = document.getElementById('ai_base_url').value.trim();

  chrome.runtime.sendMessage({
    type: 'AI_FILL',
    provider,
    apiKey: document.getElementById('ai_api_key').value.trim(),
    model: document.getElementById('ai_model').value.trim() || preset.model || '',
    baseUrl: baseUrlInput || preset.baseUrl || '',
    elementDict: [{
      token: 'test_0', tag: 'input', type: 'text',
      label: '姓名', placeholder: '请输入姓名',
      name: 'name', id: '', aria_label: '',
      context: '姓名 请输入您的姓名', options: null, value: '',
    }],
    resumeFlat: { name: '测试用户' },
  }, resp => {
    if (chrome.runtime.lastError || resp?.error) {
      resultEl.textContent = `❌ ${resp?.error || chrome.runtime.lastError?.message}`;
      resultEl.style.color = '#e53e3e';
    } else {
      resultEl.textContent = '✅ 连接成功';
      resultEl.style.color = '#38a169';
    }
  });
});

loadAIConfig();
