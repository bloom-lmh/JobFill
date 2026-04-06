// content.js — 注入招聘页面，显示悬浮操作面板

(function () {
  if (document.getElementById('__rf_panel__')) return; // 防止重复注入

  // ===== 悬浮面板 HTML =====
  const panel = document.createElement('div');
  panel.id = '__rf_panel__';
  panel.innerHTML = `
    <div id="__rf_header__">
      <span>📄 简历填写</span>
      <button id="__rf_close__">×</button>
    </div>
    <div id="__rf_body__">
      <button id="__rf_scan__">🔍 扫描字段</button>
      <button id="__rf_fill__" disabled>✅ 开始填写</button>
      <button id="__rf_manage__">⚙ 管理简历</button>
    </div>
    <div id="__rf_log__"></div>
  `;
  document.body.appendChild(panel);

  // ===== 样式 =====
  const style = document.createElement('style');
  style.textContent = `
    #__rf_panel__ {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 200px;
      background: #1a365d;
      color: #fff;
      border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
      z-index: 2147483647;
      font-family: 'Microsoft YaHei', sans-serif;
      font-size: 13px;
      overflow: hidden;
      user-select: none;
    }
    #__rf_header__ {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #153050;
      cursor: move;
    }
    #__rf_close__ {
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      line-height: 1;
      padding: 0 2px;
      opacity: .7;
    }
    #__rf_close__:hover { opacity: 1; }
    #__rf_body__ {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #__rf_body__ button {
      padding: 8px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      font-weight: 600;
      transition: opacity .2s;
    }
    #__rf_body__ button:hover:not(:disabled) { opacity: .85; }
    #__rf_body__ button:disabled { opacity: .4; cursor: default; }
    #__rf_scan__   { background: #4a90d9; color: #fff; }
    #__rf_fill__   { background: #38a169; color: #fff; }
    #__rf_manage__ { background: #2d3748; color: #a0aec0; font-size: 12px; }
    #__rf_log__ {
      padding: 0 12px 10px;
      font-size: 11px;
      color: #a0c4e8;
      line-height: 1.6;
      max-height: 120px;
      overflow-y: auto;
    }
    .__rf_matched__ {
      outline: 2px solid #38a169 !important;
      background: #f0fff4 !important;
      transition: outline .3s;
    }
    .__rf_filled__ {
      outline: 2px solid #3182ce !important;
      background: #ebf8ff !important;
    }
  `;
  document.head.appendChild(style);

  // ===== 拖动 =====
  const header = document.getElementById('__rf_header__');
  let dragging = false, ox = 0, oy = 0;
  header.addEventListener('mousedown', e => {
    dragging = true;
    ox = e.clientX - panel.getBoundingClientRect().left;
    oy = e.clientY - panel.getBoundingClientRect().top;
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = (e.clientX - ox) + 'px';
    panel.style.top  = (e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => dragging = false);

  // ===== 关闭 =====
  document.getElementById('__rf_close__').addEventListener('click', () => panel.remove());

  // ===== 管理简历 =====
  document.getElementById('__rf_manage__').addEventListener('click', () => {
    window.open(chrome.runtime.getURL('options.html'));
  });

  // ===== key → 中文标签 =====
  const KEY_ZH = {
    name:'姓名', gender:'性别', birthday:'出生日期', age:'年龄',
    phone:'手机号', email:'邮箱', wechat:'微信', qq:'QQ号',
    id_number:'身份证', political:'政治面貌', ethnicity:'民族',
    nationality:'国籍', hometown:'籍贯', city:'现居城市',
    address:'地址', marital:'婚姻状况',
    job_status:'求职状态', job_type:'求职类型', industry:'期望行业',
    intention:'求职意向', job_city:'期望城市', salary:'期望薪资', available:'到岗时间',
    school:'学校', major:'专业', degree:'学历',
    edu_start:'入学时间', edu_end:'毕业时间', gpa:'GPA', edu_rank:'成绩排名',
    company:'公司', position:'职位', work_start:'入职时间',
    work_end:'离职时间', work_desc:'工作描述',
    skills:'技能特长', certificates:'证书', cover_letter:'求职信',
    intro:'自我介绍', github:'GitHub', homepage:'个人主页',
  };

  // ===== 字段关键词映射 =====
  const MATCHERS = {
    // 个人基本
    name:         ['姓名','name','realname','full.?name','真实姓名','您的姓名'],
    gender:       ['性别','gender','sex'],
    birthday:     ['出生日期','birth.*date','生日'],
    age:          ['^年龄$','\\bage\\b'],
    phone:        ['手机','mobile','phone','tel','电话','联系方式'],
    email:        ['邮箱','email','e-mail','电子邮件'],
    wechat:       ['微信','wechat','weixin'],
    qq:           ['qq号','qq'],
    id_number:    ['身份证','id.?card','idcard'],
    political:    ['政治面貌','政治','party'],
    ethnicity:    ['民族','ethnic','nation'],
    nationality:  ['国籍','nationality'],
    hometown:     ['籍贯','户籍','hometown'],
    city:         ['现居.*城市','所在城市','城市','city','居住地'],
    address:      ['现居.*地址','详细地址','address','住址'],
    marital:      ['婚姻','婚育','marital'],
    // 求职意向
    job_status:   ['求职状态','在职','离职'],
    job_type:     ['求职类型','工作类型','全职.*实习','实习.*全职'],
    industry:     ['期望行业','目标行业','行业'],
    intention:    ['求职意向','期望岗位','应聘岗位','目标岗位','职位意向'],
    job_city:     ['期望城市','工作城市','意向城市'],
    salary:       ['期望薪资','薪资','salary','薪酬','工资'],
    available:    ['到岗时间','入职时间','available','何时到岗'],
    // 教育
    school:       ['学校','school','university','college','院校'],
    major:        ['专业','major','subject'],
    degree:       ['学历','degree','education.*level','最高学历'],
    edu_start:    ['入学时间','入学年份'],
    edu_end:      ['毕业时间','毕业年份','graduation'],
    gpa:          ['gpa','绩点','成绩','学业成绩'],
    edu_rank:     ['成绩排名','班级排名','专业排名'],
    // 工作/实习
    company:      ['公司','company','employer','单位','工作单位'],
    position:     ['职位','岗位','position','title','担任'],
    work_start:   ['入职','工作开始','work.*start'],
    work_end:     ['离职','工作结束','work.*end'],
    work_desc:    ['工作描述','工作内容','工作职责','岗位职责','job.*desc'],
    // 其他
    skills:       ['技能','skill','专业技能','技术栈'],
    certificates: ['证书','certificate','资质'],
    cover_letter: ['求职信','自荐信','cover.*letter'],
    intro:        ['自我介绍','自我评价','个人简介','个人总结','about.*me'],
    github:       ['github'],
    homepage:     ['个人主页','个人网站','homepage','website','博客'],
  };

  function getHint(el) {
    const parts = [];
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) parts.push(lbl.textContent);
    }
    const parentLbl = el.closest('label');
    if (parentLbl) parts.push(parentLbl.textContent);
    let prev = el.previousElementSibling;
    for (let i = 0; i < 3 && prev; i++) {
      const t = prev.textContent.trim();
      if (t) { parts.push(t); break; }
      prev = prev.previousElementSibling;
    }
    if (el.parentElement) parts.push(el.parentElement.textContent.slice(0, 80));
    parts.push(el.placeholder || '', el.name || '', el.id || '',
               el.getAttribute('aria-label') || '', el.getAttribute('aria-placeholder') || '');
    return parts.join(' ').toLowerCase();
  }

  function matchKey(hint) {
    for (const [key, patterns] of Object.entries(MATCHERS)) {
      for (const p of patterns) {
        if (new RegExp(p, 'i').test(hint)) return key;
      }
    }
    return null;
  }

  // ===== 日志 =====
  const logEl = document.getElementById('__rf_log__');
  function log(msg) {
    const line = document.createElement('div');
    line.textContent = msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function clearLog() { logEl.innerHTML = ''; }

  // ===== 扫描 =====
  let scannedPairs = []; // [{el, key}]

  document.getElementById('__rf_scan__').addEventListener('click', () => {
    clearLog();
    scannedPairs = [];
    // 清除上次高亮
    document.querySelectorAll('.__rf_matched__, .__rf_filled__').forEach(el => {
      el.classList.remove('__rf_matched__', '__rf_filled__');
    });

    const inputs = document.querySelectorAll(
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]):not([type=checkbox]):not([type=radio]), textarea, select'
    );

    inputs.forEach(el => {
      if (el.disabled || el.readOnly) return;
      const hint = getHint(el);
      const key = matchKey(hint);
      if (key) {
        scannedPairs.push({ el, key });
        el.classList.add('__rf_matched__');
      }
    });

    if (scannedPairs.length === 0) {
      log('未找到可识别的字段');
      document.getElementById('__rf_fill__').disabled = true;
    } else {
      log(`识别到 ${scannedPairs.length} 个字段：`);
      const summary = {};
      scannedPairs.forEach(({ key }) => summary[key] = (summary[key] || 0) + 1);
      Object.entries(summary).forEach(([k, n]) => {
        const label = KEY_ZH[k] || k;
        log(`  · ${label}${n > 1 ? ` ×${n}` : ''}`);
      });
      document.getElementById('__rf_fill__').disabled = false;
    }
  });

  // ===== 把嵌套数据展平为 key→value 的平铺对象 =====
  function flattenData(d) {
    if (!d) return {};
    const p  = d.personal   || {};
    const it = d.intention  || {};
    const edu = (d.education  || [])[0] || {};
    const wrk = (d.work       || [])[0] || (d.internship || [])[0] || {};
    const itn = (d.internship || [])[0] || {};
    const s  = d.skills     || {};
    return {
      // 个人
      name:       p.name,
      gender:     p.gender,
      birthday:   p.birthday,
      age:        p.age,
      phone:      p.phone,
      email:      p.email,
      wechat:     p.wechat,
      qq:         p.qq,
      id_number:  p.id_number,
      political:  p.political,
      ethnicity:  p.ethnicity,
      nationality:p.nationality,
      hometown:   [p.hometown_province, p.hometown_city].filter(Boolean).join(''),
      city:       p.current_city,
      address:    p.address,
      marital:    p.marital,
      // 意向
      job_status: it.status,
      job_type:   it.type,
      industry:   it.industry,
      intention:  it.position,
      job_city:   it.city,
      salary:     it.salary,
      available:  it.available,
      // 教育（取第一条）
      school:     edu.school,
      major:      edu.major,
      degree:     edu.degree,
      edu_start:  edu.start,
      edu_end:    edu.end,
      gpa:        edu.gpa,
      edu_rank:   edu.rank,
      // 工作/实习（取第一条）
      company:    itn.company   || wrk.company,
      position:   itn.position  || wrk.position,
      work_start: itn.start     || wrk.start,
      work_end:   itn.end       || wrk.end,
      work_desc:  itn.desc      || wrk.desc,
      // 技能
      skills:     s.tech,
      certificates: s.certificates,
      cover_letter: s.cover_letter,
      // 其他
      intro:      d.intro,
      github:     d.github,
      homepage:   d.homepage,
    };
  }

  // ===== 填写 =====
  document.getElementById('__rf_fill__').addEventListener('click', () => {
    chrome.storage.local.get('resumeData', ({ resumeData }) => {
      if (!resumeData) { log('⚠ 请先在插件弹窗中保存简历信息'); return; }
      const flat = flattenData(resumeData);
      let filled = 0;

      scannedPairs.forEach(({ el, key }) => {
        const value = flat[key];
        if (!value) return;

        let ok = false;
        if (el.tagName === 'SELECT') {
          const v = value.trim();
          // 三轮匹配：精确 → 包含 → 反向包含
          const match =
            [...el.options].find(o => o.text.trim() === v || o.value === v) ||
            [...el.options].find(o => o.text.trim().includes(v) || o.value.includes(v)) ||
            [...el.options].find(o => v.includes(o.text.trim()) && o.text.trim().length > 0);
          if (match) {
            el.value = match.value;
            ['change','input'].forEach(e => el.dispatchEvent(new Event(e, { bubbles: true })));
            ok = true;
          }
        } else {
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (setter) setter.call(el, value); else el.value = value;
          ['input', 'change', 'blur'].forEach(e =>
            el.dispatchEvent(new Event(e, { bubbles: true }))
          );
          ok = true;
        }

        if (ok) {
          el.classList.remove('__rf_matched__');
          el.classList.add('__rf_filled__');
          filled++;
        }
      });

      clearLog();
      log(`✅ 已填写 ${filled} 个字段`);
      log('蓝色边框 = 已填写');
      log('请检查后再提交！');
      document.getElementById('__rf_fill__').disabled = true;
    });
  });

  // ===== 接收 popup 消息 =====
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PING') return true;
  });

})();
