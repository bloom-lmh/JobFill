// background.js — 后台 service worker

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OPEN_OPTIONS') {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    return;
  }

  if (msg.type === 'OPEN_MATERIALS') {
    chrome.tabs.create({ url: chrome.runtime.getURL('materials.html') });
    return;
  }

  if (msg.type === 'AI_FILL') {
    handleAIFill(msg).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // 异步响应
  }

  if (msg.type === 'AI_PARSE_RESUME') {
    handleAIParseResume(msg).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (msg.type === 'JD_MOCK_INTERVIEW') {
    handleMockInterview(msg).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true;
  }
});

// ===== AI 填写入口 =====
async function handleAIFill({ provider, apiKey, model, baseUrl, elementDict, resumeFlat, jdText, _rawPrompt }) {
  const prompt = _rawPrompt || buildPrompt(elementDict, resumeFlat, jdText || '');
  // 根据调用场景选择 max_tokens：面试/优化回复较长，普通填表较短
  let maxTokens = MAX_TOKENS.fill;
  if (_rawPrompt) {
    const sysText = _rawPrompt.system || '';
    maxTokens = /面试官|挑剔|刁钻|interview/i.test(sysText)
      ? MAX_TOKENS.interview
      : MAX_TOKENS.optimize;
  }
  if (provider === 'claude') {
    return await callClaude(apiKey, model, prompt, maxTokens);
  } else {
    // openai / openai_compat / 国内厂商（通义、Kimi、DeepSeek 等）全走 OpenAI 兼容格式
    return await callOpenAI(apiKey, model, baseUrl, prompt, maxTokens);
  }
}

// max_tokens 按功能区分：填表简短、优化/面试回复较长
const MAX_TOKENS = {
  fill:      2048,   // AI 填表：JSON token-value 数组，字段值短
  optimize:  4096,   // AI 优化：每个字段优化后内容可能较长
  interview: 3000,   // 模拟面试：5题+点评
  parse:     4096,   // 简历解析：完整 JSON 结构
};

// ===== 截断 JSON 修复（数组被截断时尝试补全）=====
function tryRepairJson(text) {
  const cleaned = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  // 尝试补全被截断的 JSON 数组：找最后一个完整的 } 并补 ]
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > 0) {
    try { return JSON.parse(cleaned.slice(0, lastBrace + 1) + ']'); } catch {}
  }
  return null;
}

// ===== OpenAI 兼容格式（含国内厂商）=====
async function callOpenAI(apiKey, model, baseUrl, { system, user }, maxTokens = MAX_TOKENS.fill) {
  const base = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  const resolvedModel = model || 'gpt-4o-mini';

  const body = {
    model: resolvedModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
    temperature: 0,
    max_tokens: maxTokens,
  };

  // 支持 JSON 模式的厂商（AI 填表、简历解析、AI 优化时开启）
  const supportsJsonMode = !baseUrl || base.includes('openai.com') ||
    base.includes('deepseek.com') || base.includes('dashscope');
  // 模拟面试是自由文本，不用 json_object 模式
  if (supportsJsonMode && maxTokens !== MAX_TOKENS.interview) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000); // 长回复给更多时间

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`API 错误 ${resp.status}: ${err?.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason;
    // 回复被截断时附加警告
    if (finishReason === 'length') {
      return { text, truncated: true };
    }
    return { text };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('请求超时，请检查网络或选择更快的模型');
    throw e;
  }
}

// ===== Anthropic Claude 格式 =====
async function callClaude(apiKey, model, { system, user }, maxTokens = MAX_TOKENS.fill) {
  const resolvedModel = model || 'claude-3-haiku-20240307';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Claude API 错误 ${resp.status}: ${err?.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    const stopReason = data.stop_reason;
    if (stopReason === 'max_tokens') {
      return { text, truncated: true };
    }
    return { text };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('请求超时');
    throw e;
  }
}

// ===== AI 解析简历文本 =====
async function handleAIParseResume({ provider, apiKey, model, baseUrl, text }) {
  const system = `你是简历解析助手。将用户提供的简历原文解析为结构化 JSON 对象。
字段说明（尽量填充，缺失字段留空字符串）：
personal: { name, gender, birthday, phone, email, wechat, qq, political, ethnicity, nationality, hometown_province, hometown_city, current_city, address, marital, height }
intention: { status, type, available, industry, position, city, salary }
education: [{ school, major, degree, start, end, school_type, gpa, rank, honors, activities, research, thesis }]
internship: [{ company, position, start, end, location, salary, desc }]
work: [{ company, position, start, end, location, salary, desc }]
projects: [{ name, role, start, end, url, team_size, desc }]
skills: { tech, workplace, interests, career_plan, certificates, cover_letter }
languages: [{ language, certificate, exam_date, score, speaking, writing }]
papers: [{ title, journal, author_rank, status, url }]
intro, github, homepage, family

重要原则：desc（工作/实习/项目描述）、intro（自我介绍）、thesis、activities 等所有长文本字段，必须完整照录原文，禁止压缩、改写、总结或省略任何内容。
只输出 JSON 对象，不含 Markdown 代码块或额外说明。`;

  const user = `简历原文：\n${text}`;
  let result;
  if (provider === 'claude') {
    result = await callClaude(apiKey, model, { system, user }, MAX_TOKENS.parse);
  } else {
    result = await callOpenAI(apiKey, model, baseUrl, { system, user }, MAX_TOKENS.parse);
  }
  // strip markdown code fences
  let raw = result.text.trim();
  raw = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { error: 'AI 返回格式错误，请重试' };
  }
}

// ===== 构建 Prompt =====
function buildPrompt(elementDict, resumeFlat, jdText) {
  const hasJD = jdText && jdText.trim().length > 50;

  const system = `你是一个求职表单自动填写助手。根据用户的简历数据，为网页表单字段匹配最合适的值。

规则：
1. 严格输出 JSON 数组，不含任何额外文字、Markdown 代码块或说明。
2. 只输出有把握匹配的字段，跳过验证码、密码、无关字段。
3. select 或 custom_select 类型必须从 options 列表中选取（options 为 null 时可猜测常见选项文本）。
4. 日期保留简历中原有格式（如 2024-09），不自行转换格式。
5. value 字段已有内容时可跳过（避免覆盖用户已填信息）。
6. 输出格式：[{"token":"rf_0","value":"填写值"}, ...]${hasJD ? `
7. 技能、自我介绍、工作描述、项目描述等开放性文本字段，请结合 JD 关键词定制内容，突出与 JD 匹配的技能和经历。
8. 内容必须基于候选人简历事实，不可捏造经历。` : ''}`;

  const jdSection = hasJD ? `\n职位描述 (JD)：\n${jdText.slice(0, 3000)}\n` : '';

  const user = `简历数据：
${JSON.stringify(resumeFlat, null, 2)}
${jdSection}
表单字段列表（共 ${elementDict.length} 个）：
${JSON.stringify(elementDict, null, 2)}

请为每个可匹配字段返回填写值，只输出 JSON 数组。`;

  return { system, user };
}

// ===== 模拟面试 Prompt =====
async function handleMockInterview({ provider, apiKey, model, baseUrl, jdText, resumeFlat }) {
  const system = `你是一位资深技术面试官。根据候选人的简历和目标职位描述，生成 8 道针对性面试题（含参考答案）。
覆盖：技术能力考察（3题）、项目经验深挖（2题）、行为面试 STAR（2题）、开放性问题（1题）。
严格输出 JSON 数组，不含任何额外文字。
格式：[{"q":"问题","a":"参考答案（结合候选人简历定制）","type":"技术|项目|行为|开放"}]`;

  const user = `职位描述：\n${(jdText || '').slice(0, 3000)}\n\n候选人简历摘要：\n${JSON.stringify(resumeFlat, null, 2)}`;

  const prompt = { system, user };
  if (provider === 'claude') {
    return await callClaude(apiKey, model, prompt, MAX_TOKENS.interview);
  } else {
    return await callOpenAI(apiKey, model, baseUrl, prompt, MAX_TOKENS.interview);
  }
}
