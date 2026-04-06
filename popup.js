// 所有字段 id
const FIELDS = [
  'name','gender','phone','email','birthday','city','salary','available','intention',
  'degree','school','major','edu_start','edu_end','gpa',
  'company','position','work_start','work_end','work_desc',
  'intro','skills','github','homepage'
];

// Tab 切换
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// 打开管理页
document.getElementById('btn-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// 加载已保存的数据（优先 storage，没有则读 resume-data.json）
async function initPopup() {
  const { resumeData } = await chrome.storage.local.get('resumeData');
  if (resumeData && Object.keys(resumeData).length > 0) {
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && resumeData[id]) el.value = resumeData[id];
    });
    return;
  }
  try {
    const res = await fetch(chrome.runtime.getURL('resume-data.json'));
    const data = await res.json();
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id]) el.value = data[id];
    });
    await chrome.storage.local.set({ resumeData: data });
  } catch (e) {}
}
initPopup();


// 保存
document.getElementById('btn-save').addEventListener('click', () => {
  const data = {};
  FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value.trim();
  });
  chrome.storage.local.set({ resumeData: data }, () => showToast('✓ 保存成功'));
});

// 自动填写
document.getElementById('btn-fill').addEventListener('click', () => {
  const data = {};
  FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value.trim();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillForms,
      args: [data]
    }, (results) => {
      if (chrome.runtime.lastError) {
        showToast('❌ 无法在此页面填写');
        return;
      }
      const count = results?.[0]?.result ?? 0;
      const resultEl = document.getElementById('result');
      document.getElementById('result-count').textContent = count;
      resultEl.style.display = count > 0 ? 'block' : 'none';
      showToast(count > 0 ? `✓ 已填写 ${count} 个字段` : '未找到可填写的字段');
    });
  });
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ======= 注入到页面执行的填写函数 =======
function fillForms(data) {
  // 字段关键词映射
  const matchers = {
    name:       { keys: ['姓名','name','realname','full.?name','真实姓名','您的姓名'] },
    phone:      { keys: ['手机','mobile','phone','tel','电话','联系方式'] },
    email:      { keys: ['邮箱','email','mail','电子邮件'] },
    birthday:   { keys: ['出生','birth','生日','年龄'] },
    city:       { keys: ['城市','city','所在地','居住','籍贯','现居'] },
    salary:     { keys: ['薪资','salary','薪酬','期望薪','工资'] },
    available:  { keys: ['到岗','入职','available','onboard','上班'] },
    intention:  { keys: ['求职意向','岗位意向','应聘岗位','intention','职位意向','目标岗位'] },
    degree:     { keys: ['学历','degree','education.?level','最高学历'] },
    school:     { keys: ['学校','school','university','college','院校'] },
    major:      { keys: ['专业','major','subject'] },
    edu_start:  { keys: ['入学','edu.*start','start.*edu','开始.*学','学.*开始'] },
    edu_end:    { keys: ['毕业','graduation','graduate','edu.*end','end.*edu'] },
    gpa:        { keys: ['gpa','绩点','成绩','排名'] },
    company:    { keys: ['公司','company','employer','单位','机构'] },
    position:   { keys: ['职位','position','title','岗位','工作名称'] },
    work_start: { keys: ['工作.*开始','入职时间','work.*start','start.*work'] },
    work_end:   { keys: ['工作.*结束','离职时间','work.*end','end.*work','在职'] },
    work_desc:  { keys: ['工作描述','工作内容','job.*desc','work.*desc','职责','岗位描述'] },
    intro:      { keys: ['自我介绍','自我评价','个人简介','intro','about.?me','自我'] },
    skills:     { keys: ['技能','skill','特长','专业技能','掌握'] },
    github:     { keys: ['github'] },
    homepage:   { keys: ['主页','homepage','website','个人网站','博客'] },
  };

  let filled = 0;

  // 获取字段的「标识文本」：label + placeholder + name + id + aria-label
  function getFieldHint(el) {
    const parts = [];
    // label
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) parts.push(label.textContent);
    }
    // 父级 label
    const parentLabel = el.closest('label');
    if (parentLabel) parts.push(parentLabel.textContent);
    // 前面兄弟节点文字（很多平台把 label 放在 input 同级）
    let prev = el.previousElementSibling;
    while (prev) {
      const text = prev.textContent.trim();
      if (text) { parts.push(text); break; }
      prev = prev.previousElementSibling;
    }
    // 父容器文字（取前60字符）
    const parent = el.parentElement;
    if (parent) parts.push(parent.textContent.slice(0, 60));

    parts.push(el.placeholder || '', el.name || '', el.id || '',
               el.getAttribute('aria-label') || '');
    return parts.join(' ').toLowerCase();
  }

  function matchField(hint) {
    for (const [key, { keys }] of Object.entries(matchers)) {
      for (const pattern of keys) {
        if (new RegExp(pattern, 'i').test(hint)) return key;
      }
    }
    return null;
  }

  function setValue(el, value) {
    if (!value) return false;
    const proto = Object.getPrototypeOf(el);
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      el.value = value;
    }
    ['input', 'change', 'blur'].forEach(evt =>
      el.dispatchEvent(new Event(evt, { bubbles: true }))
    );
    return true;
  }

  function setSelect(el, value) {
    if (!value) return false;
    for (const opt of el.options) {
      if (opt.text.includes(value) || opt.value === value) {
        el.value = opt.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // 处理所有 input / textarea / select
  const inputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), textarea, select');

  inputs.forEach(el => {
    if (el.disabled || el.readOnly) return;
    const hint = getFieldHint(el);
    const key = matchField(hint);
    if (!key || !data[key]) return;

    let ok = false;
    if (el.tagName === 'SELECT') {
      ok = setSelect(el, data[key]);
    } else {
      ok = setValue(el, data[key]);
    }
    if (ok) filled++;
  });

  return filled;
}
