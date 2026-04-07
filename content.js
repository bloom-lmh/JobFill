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
    <div id="__rf_mode__">
      <button id="__rf_mode_basic__" class="__rf_mode_active__">正则</button>
      <button id="__rf_mode_ai__">🤖 AI</button>
    </div>
    <div id="__rf_body__">
      <button id="__rf_scan__">🔍 扫描字段</button>
      <button id="__rf_fill__" disabled>✅ 开始填写</button>
      <button id="__rf_jd_extract__" style="display:none">📋 提取 JD</button>
      <button id="__rf_ai_fill__" style="display:none">🤖 AI 填写</button>
      <button id="__rf_clear_hl__" style="display:none">🧹 清除高亮</button>
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
      width: 210px;
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
    #__rf_mode__ {
      display: none;
      gap: 4px;
      background: #0f2540;
      padding: 6px 10px;
    }
    #__rf_mode__.visible { display: flex; }
    #__rf_mode__ button {
      flex: 1;
      padding: 5px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      background: transparent;
      color: #7fb3d9;
      font-family: inherit;
      transition: all .2s;
    }
    #__rf_mode__ button.__rf_mode_active__ {
      background: #2b5282;
      color: #fff;
    }
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
    #__rf_scan__     { background: #4a90d9; color: #fff; }
    #__rf_fill__     { background: #38a169; color: #fff; }
    #__rf_ai_fill__  { background: #7b2ff7; color: #fff; }
    #__rf_jd_extract__ { background: #2c7a7b; color: #fff; font-size: 12px; }
    #__rf_jd_extract__.jd-saved { background: #276749; }
    #__rf_manage__   { background: #6b46c1; color: #e9d8fd; font-size: 12px; }
    #__rf_clear_hl__ { background: #718096; color: #fff; font-size: 12px; }
    #__rf_log__ {
      padding: 0 12px 10px;
      font-size: 11px;
      color: #a0c4e8;
      line-height: 1.6;
      max-height: 130px;
      overflow-y: auto;
    }
    .__rf_matched__ {
      outline: 2px solid #38a169 !important;
      background: #f0fff4 !important;
      transition: outline .3s;
    }
    .__rf_unmatched__ {
      outline: 2px solid #d69e2e !important;
      background: #fffff0 !important;
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

  // ===== 关闭（隐藏而非销毁，可通过插件弹窗恢复）=====
  document.getElementById('__rf_close__').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  // ===== 清除高亮 =====
  document.getElementById('__rf_clear_hl__').addEventListener('click', () => {
    document.querySelectorAll('.__rf_matched__, .__rf_filled__, .__rf_unmatched__').forEach(el => {
      el.classList.remove('__rf_matched__', '__rf_filled__', '__rf_unmatched__');
      el.style.outline = ''; el.style.outlineOffset = ''; el.style.boxShadow = ''; el.style.transition = '';
    });
    scannedPairs = [];
    document.getElementById('__rf_fill__').disabled = true;
    document.getElementById('__rf_clear_hl__').style.display = 'none';
    clearLog(); log('已清除所有高亮');
  });

  // ===== 管理简历 =====
  document.getElementById('__rf_manage__').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  });

  // ===== key → 中文标签 =====
  const KEY_ZH = {
    name:'姓名', gender:'性别', birthday:'出生日期', age:'年龄',
    phone:'手机号', email:'邮箱', wechat:'微信', qq:'QQ号',
    id_number:'身份证', political:'政治面貌', ethnicity:'民族',
    nationality:'国籍', hometown:'籍贯', city:'现居城市',
    address:'地址', marital:'婚姻状况', height:'身高', weight:'体重',
    driving:'驾照',
    job_status:'求职状态', job_type:'求职类型', industry:'期望行业',
    intention:'求职意向', job_city:'期望城市', salary:'期望薪资', available:'到岗时间',
    school:'学校', major:'专业', degree:'学历',
    edu_start:'入学时间', edu_end:'毕业时间', gpa:'GPA', edu_rank:'成绩排名',
    company:'公司', position:'职位', work_start:'入职时间',
    work_end:'离职时间', work_desc:'工作描述',
    skills:'技能特长', certificates:'证书', cover_letter:'求职信',
    intro:'自我介绍', github:'GitHub', homepage:'个人主页',
  };

  // ===== 字段关键词映射（改良版）=====
  const MATCHERS = {
    // 个人基本
    name:         ['姓名','name','realname','full.?name','真实姓名','您的姓名','用户名称','申请人姓名','候选人姓名','您的名字'],
    gender:       ['性别','gender','sex'],
    birthday:     ['出生日期','birth.*date','生日','出生年月'],
    age:          ['^年龄$','\\bage\\b'],
    phone:        ['手机','mobile','phone','tel(?!e)','电话','联系方式','手机号码','联系电话','移动电话'],
    email:        ['邮箱','email','e-mail','电子邮件','邮件地址','电子邮箱'],
    wechat:       ['微信','wechat','weixin'],
    qq:           ['qq号','qq'],
    id_number:    ['身份证','id.?card','idcard'],
    political:    ['政治面貌','政治','party'],
    ethnicity:    ['民族','ethnic','nation'],
    nationality:  ['国籍','nationality','国家.*地区','country','国家$'],
    hometown:     ['籍贯','户籍','hometown','户口所在'],
    city:         ['现居.*城市','所在城市','目前所在','current.*city','工作地点','work.*location','居住地','居住城市'],
    address:      ['现居.*地址','详细地址','address','住址','通讯地址'],
    marital:      ['婚姻','婚育','marital'],
    height:       ['身高','height'],
    weight:       ['体重','weight'],
    driving:      ['驾照','驾驶证','driving.*license'],
    // 求职意向
    job_status:   ['求职状态','在职','离职','就业状态'],
    job_type:     ['求职类型','工作类型','全职.*实习','实习.*全职','就业类型'],
    industry:     ['期望行业','目标行业','行业','所属行业'],
    intention:    ['求职意向','期望岗位','应聘岗位','目标岗位','职位意向','应聘职位','意向岗位'],
    job_city:     ['期望城市','工作城市','意向城市','期望工作地'],
    salary:       ['期望薪资','薪资','salary','薪酬','工资','月薪','年薪','薪资范围','ctc','期望月薪','薪酬期望','薪资要求'],
    available:    ['到岗时间','入职时间','available','何时到岗','notice.*period','多久到岗','最早到岗'],
    // 教育
    school:       ['学校','school','university','college','院校','毕业院校','就读院校','学校名称','所在院校'],
    major:        ['专业','major','subject','所学专业'],
    degree:       ['学历','degree','education.*level','最高学历','学位','文凭','学历层次','最终学历'],
    edu_start:    ['入学时间','入学年份','入学'],
    edu_end:      ['毕业时间','毕业年份','graduation','预计毕业'],
    gpa:            ['gpa','绩点','gpa成绩','学业成绩'],
    edu_rank:       ['成绩排名','班级排名','专业排名'],
    edu_department: ['院系','所在院系','所在学院','学院名称','department','faculty'],
    advisor:        ['导师','指导老师','指导教授','supervisor','advisor','mentor'],
    lab:            ['实验室','研究室','lab(?:oratory)?','研究所'],
    scholarship:    ['奖学金','scholarship','是否获得.*奖','国家奖学金'],
    exchange_student: ['交换生','是否.*交换','exchange.*stud'],
    // 工作/实习
    company:      ['公司','company','employer','单位','工作单位','任职单位','就职公司','企业名称'],
    position:     ['职位','岗位','position','title(?!s)','担任','职务','担任职务','工作职称','任职岗位'],
    work_start:   ['入职','工作开始','work.*start','实习开始'],
    work_end:     ['离职','工作结束','work.*end','实习结束'],
    work_desc:    ['工作描述','工作内容','工作职责','岗位职责','job.*desc','实习描述'],
    // 其他
    skills:       ['技能','skill','专业技能','技术栈','掌握技能'],
    certificates: ['证书','certificate','资质','获奖'],
    cover_letter: ['求职信','自荐信','cover.*letter'],
    intro:        ['自我介绍','自我评价','个人简介','个人总结','about.*me','个人优势','summary','个人说明','自我说明','个人亮点'],
    github:       ['github'],
    homepage:     ['个人主页','个人网站','homepage','website','博客','portfolio'],
  };

  // ===== 提取最清晰的单个标签文本 =====
  function extractBestLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    const parentLbl = el.closest('label');
    if (parentLbl) {
      // 克隆后移除 input 自身，得到纯文本
      const clone = parentLbl.cloneNode(true);
      clone.querySelectorAll('input,select,textarea,button').forEach(c => c.remove());
      const t = clone.textContent.trim();
      if (t) return t;
    }
    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-placeholder');
    if (ariaLabel) return ariaLabel;
    if (el.placeholder) return el.placeholder;
    return el.getAttribute('name') || el.id || '';
  }

  // ===== 字段提示文本（多来源合并，用于正则匹配）=====
  function getHint(el) {
    const parts = [];

    // 1. for 绑定的 label
    if (el.id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl) parts.push(lbl.textContent);
      } catch (e) { /* CSS.escape 失败时忽略 */ }
    }

    // 2. 祖先 label
    const parentLbl = el.closest('label');
    if (parentLbl) parts.push(parentLbl.textContent);

    // 3. 前兄弟节点（最多5层，文字 < 50 字才采用）
    let prev = el.previousElementSibling;
    for (let i = 0; i < 5 && prev; i++) {
      const t = prev.textContent.trim();
      if (t && t.length < 50) { parts.push(t); break; }
      prev = prev.previousElementSibling;
    }

    // 4. 向上遍历3层父元素，提取属性和直接文本节点
    let ancestor = el.parentElement;
    for (let depth = 0; depth < 3 && ancestor; depth++) {
      // 属性
      ['data-label','data-name','data-field','data-field-name','data-field-label','title'].forEach(attr => {
        const v = ancestor.getAttribute(attr);
        if (v) parts.push(v);
      });
      // 直接子文本节点（不包含子元素的文字）
      for (const node of ancestor.childNodes) {
        if (node.nodeType === 3) {
          const t = node.textContent.trim();
          if (t && t.length < 30) parts.push(t);
        }
      }
      // 第一个非输入类子元素的文字（如 span/div 标签）
      const firstTextEl = [...ancestor.children].find(
        c => !['INPUT','SELECT','TEXTAREA','BUTTON'].includes(c.tagName) && !c.closest('#__rf_panel__')
      );
      if (firstTextEl) parts.push(firstTextEl.textContent.slice(0, 40));

      ancestor = ancestor.parentElement;
    }

    // 5. 元素自身属性
    parts.push(
      el.placeholder || '',
      el.name || '',
      el.id || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('aria-placeholder') || '',
      el.getAttribute('data-placeholder') || '',
    );

    return parts.join(' ').toLowerCase().replace(/\s+/g, ' ').slice(0, 500);
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

  // ===== 自定义下拉框检测 =====
  function getCustomSelects() {
    const candidates = document.querySelectorAll(
      '[role="combobox"], [role="listbox"], [class*="select"]:not(select), [class*="dropdown"], [class*="picker"]'
    );
    const results = [];
    candidates.forEach(el => {
      if (el.tagName === 'SELECT') return;
      if (el.closest('#__rf_panel__')) return;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      if (el.offsetWidth < 60) return;
      results.push(el);
    });
    return results;
  }

  // ===== Phoenix (BOSS直聘) React Fiber 支持 =====
  function getReactFiber(el) {
    const key = Object.keys(el).find(k =>
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    );
    return key ? el[key] : null;
  }

  function triggerPhoenixSelect(el, value) {
    // 在元素本身及其子元素上都尝试找 Fiber（有些平台 fiber 挂在子节点上）
    const targets = [el, ...el.querySelectorAll('*')].slice(0, 10);
    for (const target of targets) {
      const fiber = getReactFiber(target);
      if (!fiber) continue;
      let node = fiber;
      for (let i = 0; i < 30 && node; i++) {
        const props = node.memoizedProps || node.pendingProps;
        if (props) {
          if (typeof props.onClickLabel === 'function') {
            try { props.onClickLabel({ label: value, value }); return true; } catch (e) { /* continue */ }
          }
          if (typeof props.onChangeCheck === 'function') {
            try { props.onChangeCheck(value, true); return true; } catch (e) { /* continue */ }
          }
          if (typeof props.onClick === 'function' && typeof props.label === 'string') {
            try { props.onClick({ target: { value }, value }); return true; } catch (e) { /* continue */ }
          }
          if (typeof props.onChange === 'function' && props.onChange.length <= 1) {
            try { props.onChange({ target: { value }, value }); return true; } catch (e) { /* continue */ }
          }
        }
        node = node.return;
      }
    }
    return false;
  }

  // ===== 填写动画高亮（参考竞品 focusEnhancer.highlightElement）=====
  function hlFilling(el) {
    el.style.transition = 'outline 0.15s ease, box-shadow 0.15s ease';
    el.style.outline = '2px solid #3b82f6';
    el.style.outlineOffset = '2px';
    el.style.boxShadow = '0 0 6px rgba(59,130,246,0.45)';
  }
  function hlDone(el) {
    el.style.outline = '2px solid #22c55e';
    el.style.boxShadow = '0 0 6px rgba(34,197,94,0.4)';
    setTimeout(() => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.boxShadow = '';
      el.style.transition = '';
    }, 900);
  }
  function hlFailed(el) {
    el.style.outline = '2px solid #f97316';
    el.style.boxShadow = '0 0 6px rgba(249,115,22,0.4)';
    setTimeout(() => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.boxShadow = '';
      el.style.transition = '';
    }, 1500);
  }

  // ===== 独立填写函数（基础模式 + AI 模式共用）=====
  function fillInput(el, value) {
    // 对 readonly（日历 picker 控制的日期框）临时解除后再恢复
    const wasReadOnly = el.readOnly;
    if (wasReadOnly) el.removeAttribute('readonly');
    // 1. 原型链 setter，绕过 React/Vue/Angular 数据劫持
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value); else el.value = value;
    // 2. InputEvent（带 inputType，React 合成事件必须）
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true, cancelable: true, inputType: 'insertText', data: String(value)
    }));
    // 3. composition events（CJK 输入法兼容）
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: String(value) }));
    // 4. change + blur 触发表单校验
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    if (wasReadOnly) el.setAttribute('readonly', ''); // 恢复 readonly
    return true;
  }

  function fillSelect(el, value, key) {
    const v = String(value).trim();
    const match =
      [...el.options].find(o => o.text.trim() === v || o.value === v) ||
      [...el.options].find(o => o.text.trim().includes(v) || o.value.includes(v)) ||
      [...el.options].find(o => v.includes(o.text.trim()) && o.text.trim().length > 0);
    if (match) {
      el.value = match.value;
      ['change', 'input'].forEach(e => el.dispatchEvent(new Event(e, { bubbles: true })));
      return true;
    }
    const opts = [...el.options].map(o => o.text.trim()).filter(Boolean).slice(0, 5).join(' / ');
    log(`⚠ ${key ? (KEY_ZH[key]||key) : '下拉框'}: 无匹配（值="${v}"，可选：${opts}）`);
    return false;
  }

  // 常见 UI 框架的选项选择器（Element UI / Ant Design / Arco / iView / BOSS Phoenix 等）
  const OPTION_SELECTORS = [
    '[role="option"]',
    '.el-select-dropdown__item',          // Element UI (Vue)
    '.ant-select-item-option-content',    // Ant Design (React)
    '.ant-select-item',
    '.arco-select-option',                // Arco Design
    '.ivu-select-item',                   // iView / ViewUI
    '.n-option',                          // Naive UI
    '.van-picker__option',                // Vant (mobile)
    '.phoenix-selectList__listItem',      // BOSS直聘 Phoenix
    '.phoenix-select__option',
    '[class*="selectList__item"]',
    '[class*="dropdown-item"]:not(#__rf_panel__ *)',
    '[class*="option-item"]:not(#__rf_panel__ *)',
    '[class*="select-item"]:not(#__rf_panel__ *)',
    '[class*="select-option"]:not(#__rf_panel__ *)',
  ].join(', ');

  function findMatchingOption(v) {
    const optEls = document.querySelectorAll(OPTION_SELECTORS);
    // 三轮匹配：精确 → 包含 → 反向包含
    for (const o of optEls) {
      const t = o.textContent.trim();
      if (t === v) return o;
    }
    for (const o of optEls) {
      const t = o.textContent.trim();
      if (t.includes(v)) return o;
    }
    for (const o of optEls) {
      const t = o.textContent.trim();
      if (v.includes(t) && t.length > 0) return o;
    }
    return null;
  }

  // combobox 内部 input 注入（触发 autocomplete 筛选）
  function injectInnerInput(container, v) {
    // 找容器内的可写 input（排除隐藏/只读）
    const inner = [...container.querySelectorAll('input')]
      .find(i => !i.disabled && !i.readOnly &&
                 getComputedStyle(i).display !== 'none' &&
                 getComputedStyle(i).visibility !== 'hidden');
    if (!inner) return false;
    // 用原型链 setter 绕过框架数据劫持，再触发 input 事件
    const proto = Object.getPrototypeOf(inner);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(inner, v); else inner.value = v;
    inner.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: v }));
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function fillCustomSelect(el, value, key) {
    // 1. 优先尝试 Phoenix Fiber 方式（BOSS直聘 React 组件）
    if (triggerPhoenixSelect(el, value)) return;

    const v = String(value).trim();
    let done = false;

    const finish = (opt) => {
      if (done) return;
      done = true;
      observer.disconnect();
      ['mousedown', 'mouseup', 'click'].forEach(type =>
        opt.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }))
      );
      el.classList.remove('__rf_matched__', '__rf_unmatched__');
      el.classList.add('__rf_filled__');
    };

    const trySelect = () => {
      const opt = findMatchingOption(v);
      if (opt) { finish(opt); return true; }
      return false;
    };

    // 2. MutationObserver 监听选项出现
    const observer = new MutationObserver(() => trySelect());
    observer.observe(document.body, { childList: true, subtree: true });

    // 3. 触发展开
    ['mousedown', 'mouseup', 'click'].forEach(type =>
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }))
    );

    // 4. 已有选项则直接命中
    if (trySelect()) return;

    // 5. combobox 模式：展开后往内部 input 注字触发筛选，再等选项
    setTimeout(() => {
      if (done) return;
      injectInnerInput(el, v);
      // 再等一轮选项渲染（最多 2.5s）
      setTimeout(() => {
        observer.disconnect();
        if (!done) {
          if (!trySelect()) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            console.warn(`[ResumeFiller] 自定义下拉无匹配选项 key=${key} value="${v}"`);
            log(`⚠ ${key ? (KEY_ZH[key]||key) : '自定义下拉'}: 无匹配选项（值="${v}"）`);
          }
        }
      }, 2500);
    }, 250); // 等下拉动画展开
  }

  // ===== 扫描 =====
  let scannedPairs = []; // [{el, key, type}]

  document.getElementById('__rf_scan__').addEventListener('click', () => {
    clearLog();
    scannedPairs = [];
    document.querySelectorAll('.__rf_matched__, .__rf_filled__, .__rf_unmatched__').forEach(el => {
      el.classList.remove('__rf_matched__', '__rf_filled__', '__rf_unmatched__');
    });

    const unmatched = [];

    // 这些字段一定是文本输入框，不可能是 <select>（防止 getHint 把周边 label 文字带进来误匹配）
    const TEXT_ONLY_KEYS = new Set([
      'name','phone','email','birthday','age','wechat','qq','id_number',
      'hometown','address','height','weight',
      'school','major','gpa','edu_rank','edu_department','advisor','lab',
      'company','work_start','work_end','work_desc',
      'skills','intro','cover_letter','github','homepage',
    ]);

    // 原生输入框 / textarea / select
    const inputs = document.querySelectorAll(
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]):not([type=checkbox]):not([type=radio]), textarea, select'
    );
    inputs.forEach(el => {
      if (el.disabled || el.closest('#__rf_panel__')) return;
      // 只读字段：只允许日期/时间相关（日历picker产生的 readonly input）
      if (el.readOnly && !/(日期|时间|date|time)/i.test(getHint(el))) return;
      const hint = getHint(el);
      const key = matchKey(hint);
      if (key) {
        // 纯文本字段不匹配 select，避免误匹配周边同名 label 导致重复警告
        if (el.tagName === 'SELECT' && TEXT_ONLY_KEYS.has(key)) {
          unmatched.push({ el, hint });
          el.classList.add('__rf_unmatched__');
          return;
        }
        scannedPairs.push({ el, key, type: el.tagName === 'SELECT' ? 'select' : 'input' });
        el.classList.add('__rf_matched__');
      } else {
        unmatched.push({ el, hint });
        el.classList.add('__rf_unmatched__');
      }
    });

    // 自定义下拉框（同样跳过纯文本字段，避免误匹配）
    getCustomSelects().forEach(el => {
      if (scannedPairs.some(p => p.el === el)) return;
      const hint = getHint(el);
      const key = matchKey(hint);
      if (key && !TEXT_ONLY_KEYS.has(key)) {
        scannedPairs.push({ el, key, type: 'custom' });
        el.classList.add('__rf_matched__');
      }
    });

    // F12 控制台详细调试（折叠组，不影响面板）
    console.groupCollapsed(`[ResumeFiller] 扫描结果：匹配 ${scannedPairs.length} 个，未识别 ${unmatched.length} 个`);
    if (scannedPairs.length) {
      console.log('✅ 已匹配字段：');
      scannedPairs.forEach(({ key, el }) => {
        console.log(`  ${KEY_ZH[key]||key}  ←  hint="${getHint(el).slice(0,60)}"`, el);
      });
    }
    if (unmatched.length) {
      console.log('❓ 未识别字段（hint 不在 MATCHERS 中）：');
      unmatched.forEach(({ hint, el }) => {
        console.log(`  hint="${hint.slice(0,80)}"`, el);
      });
    }
    console.groupEnd();

    if (scannedPairs.length === 0) {
      log('未找到可识别的字段');
      document.getElementById('__rf_fill__').disabled = true;
    } else {
      log(`识别到 ${scannedPairs.length} 个字段：`);
      const summary = {};
      scannedPairs.forEach(({ key }) => summary[key] = (summary[key] || 0) + 1);
      Object.entries(summary).forEach(([k, n]) => {
        log(`  · ${KEY_ZH[k]||k}${n > 1 ? ` ×${n}` : ''}`);
      });
      if (unmatched.length > 0) {
        log(`⚠ ${unmatched.length} 个字段未识别（黄色）：`);
        unmatched.slice(0, 3).forEach(({ hint }) => log(`  ? "${hint.slice(0, 35)}"`));
      }
      document.getElementById('__rf_fill__').disabled = false;
    }
  });

  // ===== 把嵌套数据展平为 key→value =====
  function flattenData(d) {
    if (!d) return {};
    const p   = d.personal   || {};
    const it  = d.intention  || {};
    const edu = (d.education  || [])[0] || {};
    const wrk = (d.work       || [])[0] || (d.internship || [])[0] || {};
    const itn = (d.internship || [])[0] || {};
    const s   = d.skills     || {};
    // 安全转字符串：防止 AI 解析出数组/对象导致 .trim() 崩溃
    const str = v => (v == null ? '' : Array.isArray(v) ? v.join('、') : String(v));
    return {
      name: str(p.name), gender: str(p.gender), birthday: str(p.birthday), age: str(p.age),
      phone: str(p.phone), email: str(p.email), wechat: str(p.wechat), qq: str(p.qq),
      id_number: str(p.id_number), political: str(p.political), ethnicity: str(p.ethnicity),
      nationality: str(p.nationality),
      hometown: [p.hometown_province, p.hometown_city].filter(Boolean).join(''),
      city: str(p.current_city), address: str(p.address), marital: str(p.marital),
      height: str(p.height), weight: str(p.weight),
      job_status: str(it.status), job_type: str(it.type), industry: str(it.industry),
      intention: str(it.position), job_city: str(it.city), salary: str(it.salary), available: str(it.available),
      school: str(edu.school), major: str(edu.major), degree: str(edu.degree),
      edu_start: str(edu.start), edu_end: str(edu.end), gpa: str(edu.gpa), edu_rank: str(edu.rank),
      edu_department: str(edu.department), advisor: str(edu.advisor), lab: str(edu.lab),
      scholarship: str(edu.honors), exchange_student: str(edu.exchange),
      company:    str(itn.company   || wrk.company),
      position:   str(itn.position  || wrk.position),
      work_start: str(itn.start     || wrk.start),
      work_end:   str(itn.end       || wrk.end),
      work_desc:  str(itn.desc      || wrk.desc),
      skills: str(s.tech), certificates: str(s.certificates), cover_letter: str(s.cover_letter),
      intro: str(d.intro), github: str(d.github), homepage: str(d.homepage),
    };
  }

  // ===== 基础模式填写 =====
  document.getElementById('__rf_fill__').addEventListener('click', () => {
    chrome.storage.local.get('resumeData', async ({ resumeData }) => {
      if (!resumeData) { log('⚠ 请先保存简历信息'); return; }
      const flat = flattenData(resumeData);
      let filled = 0;
      const failNoData = [], failFill = [];

      for (const { el, key, type } of scannedPairs) {
        const value = flat[key];
        if (!value) {
          failNoData.push(KEY_ZH[key] || key);
          hlFailed(el);
          continue;
        }

        // 滚动到视口 + 蓝色高亮提示"正在填"
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hlFilling(el);
        await new Promise(r => setTimeout(r, 120));

        let ok = false;
        if (type === 'select') {
          ok = fillSelect(el, value, key);
        } else if (type === 'custom') {
          fillCustomSelect(el, value, key);
          ok = true;
        } else {
          ok = fillInput(el, value);
        }

        if (ok) {
          el.classList.remove('__rf_matched__', '__rf_unmatched__');
          el.classList.add('__rf_filled__');
          hlDone(el);
          filled++;
        } else {
          hlFailed(el);
          failFill.push(KEY_ZH[key] || key);
        }
      }

      clearLog();
      log(`✅ 已填写 ${filled} / ${scannedPairs.length} 个字段`);
      if (failNoData.length) {
        log(`─────────────────`);
        log(`📋 ${failNoData.length} 个字段简历无数据（未填）：`);
        failNoData.forEach(k => log(`  · ${k}`));
        log(`  → 去「管理简历」补充后重试`);
      }
      if (failFill.length) {
        log(`─────────────────`);
        log(`⚠ ${failFill.length} 个字段触发失败（框架兼容问题）：`);
        failFill.forEach(k => log(`  · ${k}`));
        log(`  → 可尝试切换 AI 模式`);
      }
      if (filled > 0) {
        log('蓝色=已填写，请检查后提交！');
        document.getElementById('__rf_clear_hl__').style.display = '';
      }
      document.getElementById('__rf_fill__').disabled = true;
    });
  });

  // ===== AI 模式：构建元素字典 =====
  function buildElementDict() {
    // 清除旧 token
    document.querySelectorAll('[data-rf-token]').forEach(el =>
      el.removeAttribute('data-rf-token')
    );

    const dict = [];
    let idx = 0;

    const inputs = document.querySelectorAll(
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]):not([type=checkbox]):not([type=radio]), textarea, select'
    );
    inputs.forEach(el => {
      if (el.disabled || el.readOnly || el.closest('#__rf_panel__')) return;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;

      const token = `rf_${idx++}`;
      el.setAttribute('data-rf-token', token);
      dict.push({
        token,
        tag: el.tagName.toLowerCase(),
        type: el.type || el.tagName.toLowerCase(),
        label: extractBestLabel(el),
        placeholder: el.placeholder || '',
        name: el.name || '',
        id: el.id || '',
        aria_label: el.getAttribute('aria-label') || '',
        context: getHint(el).slice(0, 200),
        options: el.tagName === 'SELECT'
          ? [...el.options].map(o => o.text.trim()).filter(Boolean)
          : null,
        value: (el.value || '').slice(0, 30),
      });
    });

    // 自定义下拉框
    getCustomSelects().forEach(el => {
      if (el.hasAttribute('data-rf-token')) return;
      const token = `rf_${idx++}`;
      el.setAttribute('data-rf-token', token);
      dict.push({
        token,
        tag: 'div',
        type: 'custom_select',
        label: extractBestLabel(el),
        placeholder: el.getAttribute('placeholder') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        aria_label: el.getAttribute('aria-label') || '',
        context: getHint(el).slice(0, 200),
        options: null,
        value: el.textContent.trim().slice(0, 30),
      });
    });

    return dict;
  }

  // ===== AI 模式：构建简历上下文 =====
  // ===== 自定义字段分类（按关键词匹配到对应简历模块）=====
  function categorizeCustomField(label) {
    const l = label;
    if (/奖|荣誉|获奖|竞赛|比赛|竞奖/.test(l)) return 'skills';
    if (/证书|资格|等级|考试|执照|资质/.test(l)) return 'skills';
    if (/技能|能力|熟练|掌握|编程|工具/.test(l)) return 'skills';
    if (/项目|工程|作品|案例/.test(l)) return 'projects';
    if (/实习|工作|职责|成就|业绩|工龄|在职/.test(l)) return 'internship';
    if (/语言|英语|日语|韩语|口语|听力|外语/.test(l)) return 'languages';
    if (/论文|发表|专利|著作|期刊/.test(l)) return 'papers';
    if (/家庭|父母|兄弟|紧急联系|成员/.test(l)) return 'family';
    if (/意向|行业|薪资|到岗/.test(l)) return 'intention';
    return 'skills'; // 默认归入技能
  }

  function buildResumeContext(resumeData) {
    const flat = flattenData(resumeData);
    // 补充 flattenData 未覆盖的字段
    const edu = (resumeData.education || [])[0] || {};
    flat.school_type = edu.school_type || '';
    flat.honors = edu.honors || '';
    flat.activities = edu.activities || '';
    const langs = resumeData.languages || [];
    if (langs[0]) {
      flat.language = `${langs[0].language||''} ${langs[0].certificate||''} ${langs[0].score||''}`.trim();
    }
    flat.workplace_skills = (resumeData.skills || {}).workplace || '';
    // 补充自定义字段（用标签名作 key，方便 AI 识别）
    (resumeData.customFields || []).forEach(f => {
      if (f.value) flat[f.label] = f.value;
    });
    // 移除空值，节省 token
    Object.keys(flat).forEach(k => { if (!flat[k]) delete flat[k]; });
    return flat;
  }

  // ===== AI 模式：应用 AI 返回结果 =====
  async function applyAIResult(aiText, elementDict) {
    let pairs;
    try {
      const cleaned = aiText
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      pairs = JSON.parse(cleaned);
      if (!Array.isArray(pairs)) throw new Error('不是数组');
    } catch (e) {
      log(`❌ AI 返回格式错误: ${e.message}`);
      log(`原始内容: ${aiText.slice(0, 80)}...`);
      return 0;
    }

    const filledTokens = new Set(pairs.map(p => p.token));
    let filled = 0;

    for (const { token, value } of pairs) {
      if (!token || value === undefined || value === null || value === '') continue;
      const el = document.querySelector(`[data-rf-token="${token}"]`);
      if (!el) continue;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hlFilling(el);
      await new Promise(r => setTimeout(r, 100));

      const tagName = el.tagName;
      let ok = false;
      if (tagName === 'SELECT') {
        ok = fillSelect(el, String(value), null);
      } else if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        ok = fillInput(el, String(value));
      } else {
        fillCustomSelect(el, String(value), null);
        ok = true;
      }

      if (ok) {
        el.classList.remove('__rf_matched__', '__rf_unmatched__');
        el.classList.add('__rf_filled__');
        hlDone(el);
        filled++;
      } else {
        hlFailed(el);
      }
    }

    // ===== 问题3：检测未匹配字段，自动添加到简历模板 =====
    if (elementDict) {
      const skipKeywords = ['password','captcha','code','验证码','密码','confirm','agree','协议'];
      const unmatched = elementDict.filter(item =>
        !filledTokens.has(item.token) &&
        item.label && item.label.length > 0 &&
        !skipKeywords.some(k => (item.context || '').toLowerCase().includes(k))
      );
      if (unmatched.length > 0) {
        log(`─────────────────`);
        log(`📋 ${unmatched.length} 个字段简历中无数据`);
        unmatched.slice(0, 5).forEach(item => {
          log(`  · ${item.label || item.placeholder}`);
        });
        if (unmatched.length > 5) log(`  ... 共 ${unmatched.length} 个`);

        // 将未匹配字段归类并合并到 resumeData.customFields
        chrome.storage.local.get(['resumeData'], ({ resumeData }) => {
          const data = resumeData || {};
          const existing = data.customFields || [];
          const existLabels = new Set(existing.map(f => f.label));
          const toAdd = unmatched
            .map(item => ({
              key: `cf_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
              label: item.label || item.placeholder || '未知字段',
              section: categorizeCustomField(item.label || item.placeholder || ''),
              value: '',
            }))
            .filter(f => !existLabels.has(f.label));

          if (toAdd.length > 0) {
            chrome.storage.local.set({
              resumeData: { ...data, customFields: [...existing, ...toAdd] }
            });
            log(`🆕 已新增 ${toAdd.length} 个字段到简历模板`);
            log(`→ 前往「管理简历」填写，下次 AI 可使用`);
          } else {
            log(`→ 可在「管理简历」补充后重新 AI 填写`);
          }
        });
      }
    }

    return filled;
  }

  // ===== AI 模式：按钮 loading 状态 =====
  function setAILoading(loading) {
    const btn = document.getElementById('__rf_ai_fill__');
    btn.disabled = loading;
    btn.textContent = loading ? '⏳ AI 分析中...' : '🤖 AI 填写';
  }

  // ===== AI 模式：主流程 =====
  async function runAIMode() {
    clearLog();
    const { aiConfig, resumeData, currentJD } = await chrome.storage.local.get(['aiConfig', 'resumeData', 'currentJD']);

    if (!aiConfig || !aiConfig.apiKey) {
      log('❌ 未配置 API Key');
      log('  → 请前往「管理简历」→「AI 设置」配置');
      return;
    }
    if (!resumeData) {
      log('❌ 未找到简历数据，请先保存简历');
      return;
    }

    log('AI 模式：正在提取字段...');
    const elementDict = buildElementDict();
    if (elementDict.length === 0) {
      log('未找到可填写的字段');
      return;
    }
    log(`提取到 ${elementDict.length} 个字段，发送给 AI...`);
    setAILoading(true);

    const resumeFlat = buildResumeContext(resumeData);

    try {
      const response = await new Promise((resolve, reject) => {
        if (currentJD?.text) {
          log(`📋 已载入 JD「${currentJD.jobTitle||''}」，AI 将定制填写内容`);
        } else {
          log(`⚠ 未导入 JD，AI 将按简历原文填写`);
          log(`  → 建议先在职位页点「📋 提取 JD」以获得定制化内容`);
        }
        chrome.runtime.sendMessage({
          type: 'AI_FILL',
          provider: aiConfig.provider || 'openai_compat',
          apiKey: aiConfig.apiKey,
          model: aiConfig.model || '',
          baseUrl: aiConfig.baseUrl || '',
          elementDict,
          resumeFlat,
          jdText: currentJD?.text || '',
        }, resp => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(resp);
          }
        });
      });

      if (response.error) throw new Error(response.error);

      const filled = await applyAIResult(response.text, elementDict);
      clearLog();
      log(`✅ AI 已填写 ${filled} 个字段`);
      log('蓝色=已填写，请检查后提交！');

    } catch (err) {
      log(`❌ AI 填写失败: ${err.message}`);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) log('  → API Key 无效或已过期');
      else if (err.message.includes('429')) log('  → 请求频率限制或余额不足');
      else if (err.message.includes('fetch') || err.message.includes('network')) log('  → 网络连接失败，请检查代理');
    } finally {
      setAILoading(false);
    }
  }

  document.getElementById('__rf_ai_fill__').addEventListener('click', runAIMode);

  // ===== JD 结构化解析 =====
  function parseJDStructure(text, url, pageTitle) {
    // ===== 噪声行检测（页脚 / 导航 / 其他插件 UI）=====
    const NOISE_PATTERNS = [
      /powered\s*by/i,
      /©\s*\d{4}/,
      /版权所有/,
      /联系我们[\s\S]{0,20}\d{7,}/,
      /官网使用体验反馈/,
      /招聘官网$/,
      /阿里巴巴集团$|淘天集团$|淘宝$|高德地图$|阿里云$|阿里健康$|虎鲸/,  // 阿里系页脚导航
      /烫水|网申.*工具|秋招工具/i,   // 其他插件 UI
      /^(关注我们|下一个|显示|×|▾)$/,
    ];
    const isNoise = line => NOISE_PATTERNS.some(p => p.test(line.trim()));

    // ===== 拆分职位描述 vs 职位要求 =====
    const descRe = /职位描述|工作职责|岗位职责|工作内容|主要工作|job\s*desc|responsibilities/i;
    const reqRe  = /职位要求|任职要求|岗位要求|技能要求|requirements|qualifications/i;
    const lines = text.split(/\n/);
    let desc = [], req = [], section = 'desc';
    for (const line of lines) {
      if (isNoise(line)) break;       // 遇到噪声行 → 停止采集
      if (descRe.test(line)) { section = 'desc'; continue; }
      if (reqRe.test(line))  { section = 'req';  continue; }
      if (section === 'desc') desc.push(line);
      else req.push(line);
    }
    const description  = desc.join('\n').trim() || text;
    const requirements = req.join('\n').trim();

    // 提取技术关键词
    const techList = [
      'Python','JavaScript','TypeScript','Java','Go','C\\+\\+','Rust','Swift','Kotlin',
      'React','Vue','Angular','Node\\.js','Next\\.js','Spring','Django','FastAPI','Flask','Express',
      'Docker','Kubernetes','K8s','Git','Linux','Nginx','MySQL','PostgreSQL','Redis','MongoDB','Elasticsearch',
      'AWS','Azure','GCP','微服务','分布式','高并发','REST','GraphQL','gRPC','WebSocket',
      'CI/CD','DevOps','敏捷','Scrum',
      '机器学习','深度学习','NLP','LLM','RAG','BERT','GPT','LoRA','微调','Prompt',
      'LangChain','PyTorch','TensorFlow','Transformers',
      '数据分析','Pandas','NumPy','Spark','Hadoop',
    ];
    const chineseSkills = ['沟通能力','团队协作','项目管理','架构设计','性能优化',
      '用户体验','产品思维','独立开发','跨团队','开源'];
    const keywords = [];
    for (const t of techList) {
      if (new RegExp(t, 'i').test(text)) keywords.push(t.replace(/\\\./g,'.').replace(/\\\+/g,'+'));
    }
    for (const s of chineseSkills) {
      if (text.includes(s)) keywords.push(s);
    }

    // 从页面标题提取岗位名
    const jobTitle = pageTitle
      .replace(/[-|_–—|·].*$/, '')
      .replace(/招聘|职位详情|应聘.*$/, '')
      .trim()
      .slice(0, 40) || '未知岗位';

    // 提取公司名/网站
    let site = '';
    try { site = new URL(url).hostname.replace(/^www\./, ''); } catch {}

    return { jobTitle, site, description, requirements, keywords };
  }

  // ===== JD 提取 =====
  function extractPageJD(maxChars = 8000) {
    const selectors = [
      '[class*="job-description"]','[class*="jd-content"]','[id*="job-detail"]',
      '[class*="job-detail"]','[class*="position-detail"]','[class*="job_description"]',
      '[class*="jobDetail"]','[class*="detailContent"]','[class*="job-info"]',
      'article','[role="main"]','main'
    ];
    let best = null;
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim().length > (best?.innerText.trim().length || 100))
          best = el;
      } catch {}
    }

    const root = best || document.body;

    // 从 root 的直接子树收集文字，跳过：页脚/导航/固定定位元素/其他插件面板
    const SKIP_TAGS = new Set(['NAV','FOOTER','HEADER','SCRIPT','STYLE','NOSCRIPT']);
    const SKIP_ROLES = new Set(['navigation','banner','contentinfo']);

    function collectText(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const tag = node.tagName;
      if (SKIP_TAGS.has(tag)) return '';
      const role = node.getAttribute('role') || '';
      if (SKIP_ROLES.has(role)) return '';
      // 跳过固定/绝对定位元素（其他插件面板、浮层）
      try {
        const cs = window.getComputedStyle(node);
        if (cs.position === 'fixed' || cs.position === 'absolute') return '';
      } catch {}
      // 跳过我们自己的面板
      if (node.id === '__rf_panel__') return '';
      return [...node.childNodes].map(collectText).join('');
    }

    const raw = collectText(root);
    return raw.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, maxChars);
  }

  document.getElementById('__rf_jd_extract__').addEventListener('click', async () => {
    const btn = document.getElementById('__rf_jd_extract__');
    btn.disabled = true;
    btn.textContent = '⏳ 提取中...';
    const text = extractPageJD();
    if (!text || text.length < 50) {
      log('⚠ 未检测到 JD 内容，请在职位详情页操作');
      btn.disabled = false;
      btn.textContent = '📋 提取 JD';
      return;
    }
    const parsed = parseJDStructure(text, location.href, document.title);
    const jd = { text, url: location.href, title: document.title, time: Date.now(), ...parsed };
    await chrome.storage.local.set({ currentJD: jd });
    btn.disabled = false;
    btn.textContent = `✅ JD已存(${text.length}字)`;
    btn.classList.add('jd-saved');
    // 面板内显示提示条
    const tip = document.createElement('div');
    tip.style.cssText = 'background:#276749;color:#c6f6d5;font-size:11px;padding:6px 10px;border-radius:6px;margin:4px 0;line-height:1.5';
    tip.textContent = `✅ JD 已保存（${text.length} 字）\n点「🤖 AI 填写」将自动定制内容`;
    tip.style.whiteSpace = 'pre';
    const body = document.getElementById('__rf_body__');
    const existing = body.querySelector('.jd-tip');
    if (existing) existing.remove();
    tip.className = 'jd-tip';
    body.insertBefore(tip, document.getElementById('__rf_ai_fill__'));
    setTimeout(() => tip.remove(), 5000);
  });

  // ===== 模式切换 =====
  let currentMode = 'basic';

  document.getElementById('__rf_mode_basic__').addEventListener('click', () => {
    currentMode = 'basic';
    document.getElementById('__rf_mode_basic__').classList.add('__rf_mode_active__');
    document.getElementById('__rf_mode_ai__').classList.remove('__rf_mode_active__');
    document.getElementById('__rf_scan__').style.display = '';
    document.getElementById('__rf_fill__').style.display = '';
    document.getElementById('__rf_ai_fill__').style.display = 'none';
    document.getElementById('__rf_jd_extract__').style.display = 'none';
  });

  document.getElementById('__rf_mode_ai__').addEventListener('click', () => {
    currentMode = 'ai';
    document.getElementById('__rf_mode_ai__').classList.add('__rf_mode_active__');
    document.getElementById('__rf_mode_basic__').classList.remove('__rf_mode_active__');
    document.getElementById('__rf_scan__').style.display = 'none';
    document.getElementById('__rf_fill__').style.display = 'none';
    document.getElementById('__rf_ai_fill__').style.display = '';
    document.getElementById('__rf_jd_extract__').style.display = '';
    // 初始化 JD 按钮状态
    chrome.storage.local.get('currentJD', ({ currentJD }) => {
      const btn = document.getElementById('__rf_jd_extract__');
      if (currentJD?.text) {
        btn.textContent = `✅ JD已存(${currentJD.text.length}字)`;
        btn.classList.add('jd-saved');
      }
    });
  });

  // ===== 初始化：始终显示模式切换 =====
  document.getElementById('__rf_mode__').classList.add('visible');

  // ===== 接收 popup 消息 =====
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'PING') return true;

    if (msg.type === 'QUERY_PANEL') {
      sendResponse({ visible: panel.style.display !== 'none' });
      return true;
    }

    if (msg.type === 'SHOW_PANEL') {
      panel.style.display = '';
      panel.style.left = 'auto'; panel.style.top = 'auto';
      panel.style.right = '24px'; panel.style.bottom = '24px';
      sendResponse({ visible: true });
      return true;
    }

    if (msg.type === 'TOGGLE_PANEL') {
      const wasVisible = panel.style.display !== 'none';
      panel.style.display = wasVisible ? 'none' : '';
      if (!wasVisible) {
        panel.style.left = 'auto'; panel.style.top = 'auto';
        panel.style.right = '24px'; panel.style.bottom = '24px';
      }
      sendResponse({ visible: !wasVisible });
      return true;
    }
  });

})();
