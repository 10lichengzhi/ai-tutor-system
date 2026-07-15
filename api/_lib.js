/**
 * Vercel Serverless API 共享库
 * 从 proxy-server.js 提取核心逻辑，适配 Vercel 运行时
 */
const https = require('https');

// ========== 配置（从环境变量读取） ==========
const AGNES_BASE_URL = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const AGNES_API_KEY = process.env.AGNES_API_KEY || '';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'agnes-2.0-flash';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

// ========== AI模型配置 ==========
const AI_MODELS = [
  { id: 'agnes-2.0-flash', name: 'Agnes 2.0 Flash', description: '最新最快的文本模型', recommended: true, type: 'text' },
  { id: 'agnes-1.5-flash', name: 'Agnes 1.5 Flash', description: '稳定可靠的文本模型', recommended: false, type: 'text' }
];

// ========== CORS头 ==========
function getCORSHeaders(req) {
  const origin = (req.headers && req.headers.origin) || '';
  let allowOrigin = '*';
  if (!ALLOWED_ORIGINS.includes('*')) {
    allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

// ========== 发送JSON响应 ==========
function sendJSON(res, statusCode, data, req) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCORSHeaders(req || {}),
  });
  res.end(JSON.stringify(data));
}

// ========== 代理HTTPS请求 ==========
function proxyHttpRequest(targetUrl, options, body, res, isStream = false, req) {
  const url = new URL(targetUrl);
  const requestOptions = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const proxyReq = https.request(requestOptions, (proxyRes) => {
    if (isStream) {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...getCORSHeaders(req || {}),
      });
      proxyRes.pipe(res);
    } else {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (targetUrl.includes('/chat/completions')) {
            const content = parsed.choices?.[0]?.message?.content || '';
            sendJSON(res, 200, { code: 0, message: 'success', data: { content } }, req);
          } else if (targetUrl.includes('/models')) {
            const availableModels = (parsed.data || [])
              .filter(m => m.supported_endpoint_types?.includes('openai') && m.id.startsWith('agnes-') && !m.id.includes('image') && !m.id.includes('video'))
              .map(m => ({
                id: m.id,
                name: m.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: 'Agnes AI 文本模型',
                recommended: m.id === DEFAULT_MODEL,
                type: 'text',
              }));
            sendJSON(res, 200, {
              code: 0, message: '连接成功',
              data: {
                success: true, provider: 'agnes', provider_name: 'Agnes AI',
                model: DEFAULT_MODEL,
                models: availableModels.length > 0 ? availableModels : AI_MODELS,
                models_count: availableModels.length || AI_MODELS.length,
              }
            }, req);
          } else {
            sendJSON(res, 200, { code: 0, message: 'success', data: parsed }, req);
          }
        } catch (e) {
          sendJSON(res, 500, { code: -1, message: '解析响应失败' }, req);
        }
      });
    }
  });

  proxyReq.on('error', (e) => {
    if (!res.headersSent) {
      sendJSON(res, 500, { code: -1, message: '代理请求失败: ' + e.message }, req);
    }
  });

  if (body) {
    proxyReq.write(typeof body === 'string' ? body : JSON.stringify(body));
  }
  proxyReq.end();
}

// ========== 思维策略配置 ==========
const THINKING_STRATEGIES = {
  occam: { name: '奥卡姆剃刀', prompt: '【思维方式：奥卡姆剃刀】优先考虑最简单的解释，用最简洁直接的方式讲解。' },
  first_principles: { name: '第一性原理', prompt: '【思维方式：第一性原理】从最基本的概念和原理出发思考，帮助学生理解"为什么"。' },
  feynman: { name: '费曼学习法', prompt: '【思维方式：费曼学习法】用最简单的语言解释概念，就像在给一个12岁孩子讲解一样。' },
  structured: { name: '结构化思维', prompt: '【思维方式：结构化思维】将知识组织成清晰的层次结构，使用列表、分类、步骤等方式呈现。' },
  reverse: { name: '逆向思维', prompt: '【思维方式：逆向思维】反过来思考问题，分析常见误区和反例。' }
};

// ========== 学习模式配置 ==========
const LEARNING_MODES = {
  goal_oriented: { name: '目标型', prompt: '【学习模式：目标导向】以最终目标为导向，直接教最实用的内容，快速上手。' },
  deep_learning: { name: '深度学习', prompt: '【学习模式：深度学习】注重底层原理和系统性理解，循序渐进，打好基础。' }
};

// ========== 导师人格配置 ==========
const TUTOR_PERSONALITIES = {
  socratic: { name: '苏格拉底型', temperature: 0.8, systemPrompt: `你是一位苏格拉底式AI导师。核心教学原则：不直接给出答案，通过层层递进的提问引导学生自己思考。每次回复都要包含至少一个引导性问题。用中文回答。` },
  patient: { name: '耐心细致型', temperature: 0.6, systemPrompt: `你是一位耐心细致的AI导师。讲解非常细致，一步一步来，不跳步。多用生活化的类比帮助理解抽象概念。用中文回答。` },
  strict: { name: '严谨学术型', temperature: 0.3, systemPrompt: `你是一位严谨的学术型AI导师。概念准确，逻辑严密，用词规范。注重知识体系的完整性。用中文回答。` },
  humorous: { name: '幽默风趣型', temperature: 0.9, systemPrompt: `你是一位幽默风趣的AI导师。用有趣的故事、段子来解释知识，让学习过程轻松愉快。用中文回答。` }
};

// ========== 处理AI对话 ==========
function handleChat(bodyData, res, isStream = false, isTutor = false, req) {
  try {
    let messages = bodyData.messages || [];
    const model = bodyData.model || DEFAULT_MODEL;
    const personality = bodyData.personality || 'socratic';
    const learningMode = bodyData.learningMode;
    const thinkingStrategy = bodyData.thinkingStrategy;

    if (isTutor) {
      const personaConfig = TUTOR_PERSONALITIES[personality] || TUTOR_PERSONALITIES.socratic;
      let systemContent = personaConfig.systemPrompt;
      if (learningMode && LEARNING_MODES[learningMode]) systemContent += '\n\n' + LEARNING_MODES[learningMode].prompt;
      if (thinkingStrategy && THINKING_STRATEGIES[thinkingStrategy]) systemContent += '\n\n' + THINKING_STRATEGIES[thinkingStrategy].prompt;
      messages = [{ role: 'system', content: systemContent }, ...messages];
      if (!bodyData.temperature) bodyData.temperature = personaConfig.temperature;
    }

    const requestBody = {
      model, messages,
      temperature: bodyData.temperature || 0.7,
      max_tokens: bodyData.max_tokens || 4096,
      stream: isStream,
    };

    proxyHttpRequest(`${AGNES_BASE_URL}/chat/completions`, { method: 'POST' }, requestBody, res, isStream, req);
  } catch (e) {
    sendJSON(res, 400, { code: -1, message: '请求格式错误: ' + e.message }, req);
  }
}

// ========== 调用AI（非流式） ==========
function callAI(systemPrompt, userPrompt, model = DEFAULT_MODEL, temperature = 0.4, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature, max_tokens: maxTokens, stream: false,
    };
    const aiUrl = new URL(`${AGNES_BASE_URL}/chat/completions`);
    const aiReq = https.request({
      hostname: aiUrl.hostname, port: 443, path: aiUrl.pathname, method: 'POST',
      timeout: 55000,
      headers: { 'Authorization': `Bearer ${AGNES_API_KEY}`, 'Content-Type': 'application/json' },
    }, (aiRes) => {
      let data = '';
      aiRes.on('data', (chunk) => { data += chunk; });
      aiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { reject(new Error(parsed.error.message || 'AI调用失败')); return; }
          resolve(parsed.choices?.[0]?.message?.content || '');
        } catch (e) { reject(new Error('解析AI响应失败: ' + e.message)); }
      });
    });
    aiReq.on('error', (e) => reject(new Error('AI服务调用失败: ' + e.message)));
    aiReq.on('timeout', () => { aiReq.destroy(); reject(new Error('AI请求超时')); });
    aiReq.write(JSON.stringify(requestBody));
    aiReq.end();
  });
}

// ========== 清理AI返回的JSON ==========
function cleanAndParseJSON(content) {
  if (!content || typeof content !== 'string') throw new Error('AI返回内容为空');
  content = content.trim().replace(/\uFFFD/g, '').replace(/[\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  if (content.startsWith('```json')) content = content.slice(7);
  else if (content.startsWith('```')) content = content.slice(3);
  if (content.endsWith('```')) content = content.slice(0, -3);
  content = content.trim();
  try { return JSON.parse(content); } catch (e1) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) {
        let fixed = match[0].replace(/,\s*([\]}])/g, '$1').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3').replace(/'/g, '"');
        try { return JSON.parse(fixed); } catch (e3) { throw new Error('AI返回格式错误'); }
      }
    }
    throw new Error('AI返回格式错误');
  }
}

// ========== 读取请求体（适配Vercel） ==========
function readBody(req) {
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  if (req.body && typeof req.body === 'string') return req.body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

module.exports = {
  AGNES_BASE_URL, AGNES_API_KEY, DEFAULT_MODEL, ALLOWED_ORIGINS, AI_MODELS,
  THINKING_STRATEGIES, LEARNING_MODES, TUTOR_PERSONALITIES,
  getCORSHeaders, sendJSON, proxyHttpRequest, handleChat, callAI, cleanAndParseJSON, readBody,
};
