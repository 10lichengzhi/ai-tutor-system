/**
 * AI API代理服务器
 * 隐藏API Key，代理前端请求到Agnes AI
 * 支持多模型选择，密钥全程藏在服务端
 * 无需额外依赖，使用Node.js内置模块
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { handleRegister, handleLogin, handleMe, getUserFromRequest } = require('./auth');

// ========== 加载 .env 文件 ==========
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) return;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // 去除引号
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
      console.log('✅ 已加载 .env 配置文件');
    } else {
      console.log('⚠️  未找到 .env 文件，使用默认配置或环境变量');
    }
  } catch (e) {
    console.warn('加载 .env 文件失败:', e.message);
  }
})();

// 全局错误处理，防止进程崩溃
process.on('uncaughtException', (e) => {
  console.error('未捕获的异常:', e);
});
process.on('unhandledRejection', (e) => {
  console.error('未处理的Promise拒绝:', e);
});

// ========== 配置（从环境变量读取，有默认值） ==========
const PORT = parseInt(process.env.PORT || '8000', 10);
const AGNES_BASE_URL = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const AGNES_API_KEY = process.env.AGNES_API_KEY || '';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'agnes-2.0-flash';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB 请求体限制（支持图片上传）
const RATE_LIMIT_WINDOW = 60 * 1000; // 60秒窗口
const RATE_LIMIT_MAX = 60; // 每窗口最多60次请求

// ========== 速率限制（内存计数器） ==========
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  let record = rateLimitMap.get(ip);
  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, record);
  }
  // 清理过期记录（简单策略：超过100个IP时全清）
  if (rateLimitMap.size > 100) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }
  record.count++;
  return record.count <= RATE_LIMIT_MAX;
}

// ========== 安全头 ==========
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// ========== CORS头（动态生成） ==========
function getCORSHeaders(req) {
  const origin = req.headers.origin || '';
  let allowOrigin = '*';
  if (!ALLOWED_ORIGINS.includes('*')) {
    allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    ...SECURITY_HEADERS,
  };
}

// ========== AI模型配置 ==========
const AI_MODELS = [
  {
    id: 'agnes-2.0-flash',
    name: 'Agnes 2.0 Flash',
    description: '最新最快的文本模型，适合日常对话和学习',
    recommended: true,
    type: 'text',
  },
  {
    id: 'agnes-1.5-flash',
    name: 'Agnes 1.5 Flash',
    description: '稳定可靠的文本模型，兼容性好',
    recommended: false,
    type: 'text',
  }
];

// ========== 工具函数：发送JSON响应 ==========
function sendJSON(res, statusCode, data, req) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCORSHeaders(req || {}),
  };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

// ========== 工具函数：代理HTTPS请求 ==========
function proxyHttpRequest(targetUrl, options, body, res, isStream = false, req) {
  const url = new URL(targetUrl);
  const apiKey = options.apiKey || AGNES_API_KEY;

  const requestOptions = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const proxyReq = https.request(requestOptions, (proxyRes) => {
    if (isStream) {
      // 流式响应：直接转发SSE
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...getCORSHeaders(req || {}),
      });
      proxyRes.pipe(res);
    } else {
      // 非流式：收集响应后返回
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // 包装成统一格式
          if (targetUrl.includes('/chat/completions')) {
            const content = parsed.choices?.[0]?.message?.content || '';
            sendJSON(res, 200, { code: 0, message: 'success', data: { content } }, req);
          } else if (targetUrl.includes('/models')) {
            // 返回模型列表
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
              code: 0,
              message: '连接成功',
              data: {
                success: true,
                provider: 'agnes',
                provider_name: 'Agnes AI',
                model: DEFAULT_MODEL,
                models: availableModels.length > 0 ? availableModels : AI_MODELS,
                models_count: availableModels.length || AI_MODELS.length,
              }
            }, req);
          } else {
            sendJSON(res, 200, { code: 0, message: 'success', data: parsed }, req);
          }
        } catch (e) {
          console.error('解析响应失败:', e, data);
          sendJSON(res, 500, { code: -1, message: '解析响应失败: ' + data.substring(0, 200) }, req);
        }
      });
    }
  });

  proxyReq.on('error', (e) => {
    console.error('代理请求错误:', e);
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
  occam: {
    name: '奥卡姆剃刀',
    prompt: '【思维方式：奥卡姆剃刀】面对问题时，优先考虑最简单的解释，剔除不必要的假设。用最简洁直接的方式讲解，避免过度复杂化。'
  },
  first_principles: {
    name: '第一性原理',
    prompt: '【思维方式：第一性原理】回到最基本的概念和原理出发思考，不依赖类比或经验。从最基础的定义/公理/事实开始推导，帮助学生理解"为什么"，而不仅是"怎么做"。'
  },
  feynman: {
    name: '费曼学习法',
    prompt: '【思维方式：费曼学习法】用最简单的语言解释概念，就像在给一个12岁孩子讲解一样。如果解释不够简单，说明理解还不够深。多用生活化类比，少用专业术语。'
  },
  structured: {
    name: '结构化思维',
    prompt: '【思维方式：结构化思维】将知识组织成清晰的层次结构：总-分、先-后、主要-次要。使用列表、分类、步骤等方式呈现，帮助学生建立知识框架。'
  },
  reverse: {
    name: '逆向思维',
    prompt: '【思维方式：逆向思维】反过来思考问题：如果想失败会怎么做？常见的错误路径是什么？从反面论证来加深理解，分析常见误区和反例。'
  }
};

// ========== 学习模式配置 ==========
const LEARNING_MODES = {
  goal_oriented: {
    name: '目标型',
    prompt: '【学习模式：目标导向】以最终目标为导向，直接教最实用的内容，快速上手做项目。"怎么做"优先于"为什么"，边做边学。'
  },
  deep_learning: {
    name: '深度学习',
    prompt: '【学习模式：深度学习】注重底层原理和系统性理解，不仅讲怎么做，更要讲为什么。循序渐进，打好基础，适合追求深度理解的学生。'
  }
};

// ========== 导师人格配置 ==========
const TUTOR_PERSONALITIES = {
  socratic: {
    name: '苏格拉底型',
    temperature: 0.8,
    systemPrompt: `你是一位苏格拉底式AI导师。你的核心教学原则：

【教学铁律】
❌ 绝对不直接给出最终答案或完整解答
✅ 永远通过层层递进的提问引导学生自己思考
✅ 当学生犯错时，不直接指出错误，而是用反问让学生自己发现问题
✅ 每次回复都要包含至少一个引导性问题

【提问层次】
1. 先问理解性问题："你对这个概念是怎么理解的？"
2. 再问假设性问题："如果...会发生什么？"
3. 然后问反思性问题："你觉得哪里可能有问题？"
4. 最后问延伸性问题："如果换个条件呢？"

【当学生卡住时】
- 给予小提示，但提示本身也是问题形式
- 把大问题拆分成小问题
- 联系学生已经学过的知识进行类比
- 鼓励学生大胆尝试，不要怕犯错

【当学生答对时】
- 给予真诚的肯定
- 追问一个更深入的问题帮助深化理解
- 总结学生思考过程中做得好的地方
- 引导学生举一反三`
  },
  patient: {
    name: '耐心细致型',
    temperature: 0.6,
    systemPrompt: `你是一位耐心细致的AI导师。你的教学风格：

【核心特点】
- 讲解非常细致，一步一步来，不跳步
- 多用生活化的类比帮助理解抽象概念
- 经常询问学生是否听懂，根据反馈调整节奏
- 对于难点会从多个角度反复解释
- 鼓励为主，即使学生答错也会肯定其思考的价值

【教学方法】
1. 先用简单例子引入，再讲一般概念
2. 讲解后马上问"这部分清楚了吗？"
3. 学生表示不懂时，换一种方式重新解释
4. 配合图示/步骤/口诀帮助记忆
5. 每个知识点后配一个简单的即时练习`
  },
  strict: {
    name: '严谨学术型',
    temperature: 0.3,
    systemPrompt: `你是一位严谨的学术型AI导师。你的教学风格：

【核心特点】
- 概念准确，逻辑严密，用词规范
- 注重知识体系的完整性和前后联系
- 强调原理理解而非死记硬背
- 会指出常见的理解误区
- 要求学生能够清晰表达推理过程

【教学方法】
1. 先给出清晰的定义和定理
2. 再讲解推导过程和证明思路
3. 分析概念之间的联系和区别
4. 指出常见错误和注意事项
5. 通过有挑战性的问题检验真理解`
  },
  humorous: {
    name: '幽默风趣型',
    temperature: 0.9,
    systemPrompt: `你是一位幽默风趣的AI导师。你的教学风格：

【核心特点】
- 用有趣的故事、段子、梗来解释知识
- 让学习过程轻松愉快不枯燥
- 用夸张、比喻让抽象概念变生动
- 适当开玩笑但保持知识点准确
- 像朋友一样和学生互动

【教学方法】
1. 用段子/故事引入知识点
2. 把知识点拟人化/生活化
3. 把错题变成"翻车现场"来分析
4. 用表情包式的语气词增加亲切感
5. 编一些有趣的记忆口诀`
  }
};

// ========== 处理AI对话（支持流式） ==========
function handleChat(bodyData, res, isStream = false, isTutor = false, req) {
  try {
    let messages = bodyData.messages || [];
    const customModel = bodyData.customModel;
    let model = bodyData.model || DEFAULT_MODEL;
    let baseUrl = AGNES_BASE_URL;
    let apiKey = AGNES_API_KEY;
    
    // 如果有自定义模型配置，使用自定义配置
    if (customModel && customModel.baseUrl && customModel.apiKey && customModel.modelName) {
      model = customModel.modelName;
      baseUrl = customModel.baseUrl.replace(/\/$/, '');
      apiKey = customModel.apiKey;
    }
    
    const personality = bodyData.personality || 'socratic';
    const learningMode = bodyData.learningMode;
    const thinkingStrategy = bodyData.thinkingStrategy;

    // 如果是智师模式，加入对应人格的系统提示
    if (isTutor) {
      const personaConfig = TUTOR_PERSONALITIES[personality] || TUTOR_PERSONALITIES.socratic;
      let systemContent = personaConfig.systemPrompt;

      // 追加学习模式指令
      if (learningMode && LEARNING_MODES[learningMode]) {
        systemContent += '\n\n' + LEARNING_MODES[learningMode].prompt;
      }

      // 追加思维策略指令
      if (thinkingStrategy && THINKING_STRATEGIES[thinkingStrategy]) {
        systemContent += '\n\n' + THINKING_STRATEGIES[thinkingStrategy].prompt;
      }

      const tutorSystem = `${systemContent}

【通用教学准则】
1. 结合学生当前学习的知识点进行有针对性的辅导
2. 当学生真正理解后，给予肯定并简要总结要点
3. 如果学生明确要求直接看答案，可以先给提示再给答案，但要鼓励先思考
4. 用中文回答，除非学生用其他语言提问
5. 回复简洁明了，不要长篇大论

记住：好的老师不是给学生答案，而是让学生学会自己找到答案。`;
      messages = [{ role: 'system', content: tutorSystem }, ...messages];
      
      // 根据人格调整temperature
      if (!bodyData.temperature) {
        bodyData.temperature = personaConfig.temperature;
      }
    }

    const requestBody = {
      model: model,
      messages,
      temperature: bodyData.temperature || 0.7,
      max_tokens: bodyData.max_tokens || 4096,
      stream: isStream,
    };

    proxyHttpRequest(
      `${baseUrl}/chat/completions`,
      { method: 'POST', apiKey: apiKey },
      requestBody,
      res,
      isStream,
      req
    );
  } catch (e) {
    sendJSON(res, 400, { code: -1, message: '请求格式错误: ' + e.message }, req);
  }
}

// ========== 调用AI生成内容（非流式，用于生成结构化数据） ==========
function callAI(systemPrompt, userPrompt, model = DEFAULT_MODEL, temperature = 0.4, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    const aiUrl = new URL(`${AGNES_BASE_URL}/chat/completions`);
    const aiReq = https.request({
      hostname: aiUrl.hostname,
      port: 443,
      path: aiUrl.pathname,
      method: 'POST',
      timeout: 60000, // 60秒超时
      headers: {
        'Authorization': `Bearer ${AGNES_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }, (aiRes) => {
      let data = '';
      aiRes.on('data', (chunk) => { data += chunk; });
      aiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'AI调用失败'));
            return;
          }
          let content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          reject(new Error('解析AI响应失败: ' + e.message + ', 响应: ' + data.substring(0, 200)));
        }
      });
    });

    aiReq.on('error', (e) => {
      reject(new Error('AI服务调用失败: ' + e.message));
    });

    aiReq.on('timeout', () => {
      aiReq.destroy();
      reject(new Error('AI请求超时，请稍后重试'));
    });

    aiReq.write(JSON.stringify(requestBody));
    aiReq.end();
  });
}

// ========== 清理AI返回的JSON ==========
function cleanAndParseJSON(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('AI返回内容为空');
  }
  
  content = content.trim();
  
  // 移除Unicode替换字符（乱码）
  content = content.replace(/\uFFFD/g, '');
  // 移除可能的BOM和其他不可见字符
  content = content.replace(/[\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  
  // 移除markdown代码块标记
  if (content.startsWith('```json')) content = content.slice(7);
  else if (content.startsWith('```')) content = content.slice(3);
  if (content.endsWith('```')) content = content.slice(0, -3);
  content = content.trim();

  // 第一次尝试直接解析
  try {
    return JSON.parse(content);
  } catch (e1) {
    // 尝试用正则提取最外层JSON对象
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        // 尝试修复常见JSON问题：尾随逗号、单引号等
        let fixed = match[0]
          .replace(/,\s*([\]}])/g, '$1')  // 移除尾随逗号
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // 给未加引号的key加引号
          .replace(/'/g, '"');  // 单引号转双引号（简单情况）
        try {
          return JSON.parse(fixed);
        } catch (e3) {
          console.error('JSON解析失败，原始内容:', content.substring(0, 500));
          throw new Error('AI返回格式错误，无法解析JSON');
        }
      }
    }
    console.error('未找到JSON对象，原始内容:', content.substring(0, 500));
    throw new Error('AI返回格式错误，无法解析JSON');
  }
}

// ========== 读取请求体（带大小限制） ==========
function readBody(req, res) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('请求体过大，限制1MB'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ========== 静态文件服务（托管前端构建产物） ==========
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(urlPath, res, req) {
  // 安全处理路径，防止目录遍历
  const safePath = decodeURIComponent(urlPath).replace(/\.\./g, '').replace(/\/+/g, '/');
  
  // 构建文件路径：优先 frontend/dist
  let filePath = path.join(__dirname, 'frontend', 'dist', safePath);
  
  // 如果文件不存在，尝试 public 目录
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // 如果是目录，尝试 index.html
    if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      // SPA 回退：所有未匹配的路由返回 index.html
      filePath = path.join(__dirname, 'frontend', 'dist', 'index.html');
    }
  }
  
  // 如果 index.html 也不存在，返回提示
  if (!fs.existsSync(filePath)) {
    sendJSON(res, 404, { 
      code: -1, 
      message: '前端文件未构建。请先运行 cd frontend && npm run build' 
    }, req);
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJSON(res, 500, { code: -1, message: '读取文件失败' }, req);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      ...getCORSHeaders(req || {}),
    });
    res.end(data);
  });
}

// ========== 创建服务器 ==========
const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const url = req.url || '';

  // 速率限制检查
  if (!checkRateLimit(clientIp)) {
    sendJSON(res, 429, { code: -1, message: '请求过于频繁，请稍后再试' }, req);
    return;
  }

  // 检查API Key是否配置
  if (!AGNES_API_KEY) {
    if (url === '/health' || url === '/') {
      sendJSON(res, 503, {
        status: 'error',
        message: 'API Key未配置，请在 .env 文件中设置 AGNES_API_KEY',
        service: 'AI智师导学系统 - AI代理服务',
      }, req);
      return;
    }
  }

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204, getCORSHeaders(req));
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} ${req.method} ${url} (${clientIp})`);

  try {
    // ========== 路由 ==========

    // 健康检查
    if (url === '/health' || url === '/') {
      sendJSON(res, 200, {
        status: 'healthy',
        service: 'AI智师导学系统 - AI代理服务',
        version: '1.2.0',
        default_model: DEFAULT_MODEL,
        api_key_configured: !!AGNES_API_KEY,
      }, req);
      return;
    }

    // ========== 用户认证路由 ==========
    if (url === '/api/auth/register' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        const result = handleRegister(data);
        sendJSON(res, result.status, result.data, req);
      } catch (e) {
        sendJSON(res, 400, { code: -1, message: '请求格式错误: ' + e.message }, req);
      }
      return;
    }

    if (url === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        const result = handleLogin(data);
        sendJSON(res, result.status, result.data, req);
      } catch (e) {
        sendJSON(res, 400, { code: -1, message: '请求格式错误: ' + e.message }, req);
      }
      return;
    }

    if (url === '/api/auth/me' && req.method === 'GET') {
      const result = handleMe(req);
      sendJSON(res, result.status, result.data, req);
      return;
    }

    // API v1 前缀处理: /api/v1/ai/* -> /api/ai/*
    let path = url;
    if (path.startsWith('/api/v1/ai/')) {
      path = '/api/ai/' + path.slice('/api/v1/ai/'.length);
    }

    // 获取思维策略和学习模式列表（供前端获取配置）
    if (path === '/api/ai/config' && req.method === 'GET') {
      sendJSON(res, 200, {
        code: 0,
        data: {
          personalities: Object.entries(TUTOR_PERSONALITIES).map(([id, p]) => ({
            id, name: p.name,
          })),
          learningModes: Object.entries(LEARNING_MODES).map(([id, m]) => ({
            id, name: m.name,
          })),
          thinkingStrategies: Object.entries(THINKING_STRATEGIES).map(([id, s]) => ({
            id, name: s.name,
          })),
        }
      }, req);
      return;
    }

    // 获取模型列表
    if (path === '/api/ai/models' && req.method === 'GET') {
      proxyHttpRequest(`${AGNES_BASE_URL}/models`, { method: 'GET' }, null, res, false, req);
      return;
    }

    // 获取提供商列表（兼容旧接口）
    if (path === '/api/ai/providers' && req.method === 'GET') {
      sendJSON(res, 200, {
        code: 0,
        message: 'success',
        data: {
          default_provider: 'agnes',
          providers: [{
            id: 'agnes',
            name: 'Agnes AI',
            description: 'Sapiens AI出品，免费开放的大模型',
            recommended: true,
            has_api_key: !!AGNES_API_KEY,
          }]
        }
      }, req);
      return;
    }

    // 测试连接
    if (path.startsWith('/api/ai/test-connection') && req.method === 'POST') {
      proxyHttpRequest(`${AGNES_BASE_URL}/models`, { method: 'GET' }, null, res, false, req);
      return;
    }

    // AI对话（统一处理，支持流式）
    if (path === '/api/ai/chat') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        handleChat(data, res, data.stream !== false, false, req);
      } catch (e) {
        sendJSON(res, 400, { code: -1, message: 'Invalid request: ' + e.message }, req);
      }
      return;
    }

    // AI智师对话（流式）
    if (path === '/api/ai/tutor-chat') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        handleChat(data, res, data.stream !== false, true, req);
      } catch (e) {
        sendJSON(res, 400, { code: -1, message: 'Invalid request: ' + e.message }, req);
      }
      return;
    }

    // 生成学习方案
    if (path === '/api/ai/generate-plan' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const params = JSON.parse(body);
        const model = params.model || DEFAULT_MODEL;

        const systemPrompt = `你是学习规划专家。根据用户信息生成学习方案JSON。
要求：阶段循序渐进，知识点有依赖，每周有学习/练习/项目节点。输出纯JSON，无其他文字。`;

        // 限制周数，避免输出过长
        const weeks = Math.min(params.total_weeks, 8); // 最多8周，避免token超限
        
        const userPrompt = `制定学习计划：
方向：${params.direction_name}
水平：${params.current_level}
每日：${params.daily_hours}小时，每周${params.weekly_days}天，共${weeks}周
目标：${params.final_goal}

输出JSON（精简，每阶段2-3周，每周2-4个节点即可）：
{
  "phases": [
    {
      "id": 1,
      "title": "阶段名",
      "description": "描述",
      "durationWeeks": 2,
      "startWeek": 1,
      "weeks": [
        {
          "weekNumber": 1,
          "theme": "主题",
          "goals": ["目标"],
          "nodes": [
            {"id": "N1", "title": "标题", "type": "learn/practice/project", "duration": 60, "desc": "简述", "knowledgePointIds": ["KP1"], "isMilestone": false}
          ]
        }
      ]
    }
  ],
  "knowledgePoints": [
    {"id": "KP1", "name": "名称", "desc": "简述", "difficulty": 3, "chapter": "阶段", "prerequisites": [], "estimatedMinutes": 120, "tags": ["tag"]}
  ],
  "suggestions": ["建议"]
}`;

        console.log('正在生成学习方案，使用模型:', model);
        const content = await callAI(systemPrompt, userPrompt, model, 0.4, 4096);
        const planData = cleanAndParseJSON(content);

        sendJSON(res, 200, {
          code: 0,
          message: '学习方案生成成功',
          data: planData
        }, req);
      } catch (e) {
        console.error('生成学习方案失败:', e);
        sendJSON(res, 500, { code: -1, message: '生成失败: ' + e.message }, req);
      }
      return;
    }

    // 分析错题
    if (path === '/api/ai/analyze-wrong' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const params = JSON.parse(body);
        const model = params.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位经验丰富的老师，擅长分析学生的错题，找出问题根源，并用通俗易懂的方式讲解，帮助学生真正理解。

分析错题时要包含：
1. 错误原因分析：是概念不清、计算失误、审题错误、还是思路偏差
2. 正确解法：详细的解题步骤
3. 知识点讲解：相关知识点的复习
4. 避坑提醒：常见的易错点
5. 改进建议：如何避免再犯类似错误
6. 类似练习推荐：1-2道相似练习题（可选）`;

        const userPrompt = `请帮我分析这道错题：

题目：${params.question}
我的答案：${params.user_answer}
正确答案：${params.correct_answer || '未提供'}
相关知识点：${params.knowledge_point || '未知'}

请详细分析我的错误原因，并给出讲解和建议。`;

        const analysis = await callAI(systemPrompt, userPrompt, model, 0.5, 2048);
        sendJSON(res, 200, { code: 0, message: 'success', data: { analysis } }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '分析失败: ' + e.message }, req);
      }
      return;
    }

    // 生成练习题
    if (path === '/api/ai/generate-exercises' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const params = JSON.parse(body);
        const model = params.model || DEFAULT_MODEL;
        const typeDesc = {
          choice: '选择题', fill: '填空题', calculate: '计算题',
          program: '编程题', mixed: '混合题型（包含多种题型）'
        };

        const systemPrompt = `你是一位专业的出题老师，能够根据知识点和难度生成高质量的练习题。

每道题要包含：
- 题目内容
- 选项（选择题）
- 正确答案
- 答案解析
- 考察知识点

支持多种题型：选择题、填空题、计算题、编程题。输出必须是严格的JSON格式。`;

        const userPrompt = `请围绕知识点「${params.knowledge_point}」生成${params.count}道练习题。

难度：${params.difficulty}星（1星最简单，5星最难）
题型：${typeDesc[params.exercise_type] || params.exercise_type}

请输出JSON格式：
{
  "exercises": [
    {
      "id": "EX-序号",
      "type": "choice/fill/calculate/program",
      "difficulty": ${params.difficulty},
      "question": "题目内容",
      "options": ["A. xxx", "B. xxx"],
      "answer": "正确答案",
      "explanation": "答案解析",
      "knowledgePoint": "${params.knowledge_point}"
    }
  ]
}`;

        const content = await callAI(systemPrompt, userPrompt, model, 0.6, 4096);
        const exerciseData = cleanAndParseJSON(content);
        sendJSON(res, 200, { code: 0, message: '练习题生成成功', data: exerciseData }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '生成失败: ' + e.message }, req);
      }
      return;
    }

    // ========== 学习计划向导：AI引导对话 ==========
    if (path === '/api/ai/plan/interview' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        const { messages, collectedInfo } = data;
        const model = data.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位专业的学习规划师，主要面向中学生（以高中生为主，兼顾初中生），同时也支持成人学习者和职业方向，通过友好对话了解学生的学习需求，为其量身定制学习方案。

【你的任务】
像朋友聊天一样，通过多轮对话自然地收集以下信息（不要一次性问完，每次只问1-2个问题）：
1. 身份和方向：中学生（高一/高二/高三为主，也涵盖初一/初二/初三，科目如数学/物理/英语/化学等）或成人学习者（编程开发/考研/考证/职业提升/兴趣学习等）
2. 学习目标（日常提升/期中考试/期末考试/高考/中考/求职/转行/考证/竞赛等）
3. 当前基础（零基础/薄弱/一般/良好/优秀）
4. 可投入时间（每天多久、每周几天/周末是否有时间）
5. 学习偏好（看视频/刷题/看书/老师讲解/动手实践/混合）
6. 薄弱环节或重点需求（具体哪些知识点不会/哪些技能想掌握）
7. 特殊需求（如艺考、体育生、特长生、冲刺名校、求职准备、项目实战等）

【快捷选项参考】
- 高中方向：高中数学、高中物理、高中英语、高中化学、高考冲刺
- 初中方向：初中数学、初中物理、初中英语、中考冲刺
- 成人/职业：编程开发（前端/后端/Python）、考研/考证、职业提升、兴趣学习

【对话原则】
- 语气亲切友好，像学长/学姐一样聊天
- 根据用户身份（学生/成人）调整对话风格和推荐方向
- 每次回复后给出2-4个快捷回答选项，方便用户选择
- 根据用户回答自然追问，不要生硬
- 信息收集足够后（至少覆盖前5项），告诉用户"信息收集完毕，我来为你生成学习总纲"
- 如果用户信息不明确，主动追问确认
- 用中文回复

【输出格式】
请输出JSON（不要有其他文字）：
{
  "reply": "你的回复内容",
  "suggestedAnswers": ["选项1", "选项2", "选项3"],
  "collectedInfo": {
    "learningGoal": "已收集到的学习目标",
    "targetLevel": "期望达到的水平",
    "currentLevel": "当前基础",
    "timeAvailable": { "dailyMinutes": 60, "weeklyDays": 5, "preferredTime": "evening" },
    "experience": "相关经验描述",
    "learningStyle": "hands-on/visual/reading/video/mixed",
    "specificNeeds": "特殊需求",
    "deadline": "截止日期"
  },
  "isComplete": false,
  "missingInfo": ["还缺哪些信息，如learningGoal/currentLevel等"]
}`;

        const userPrompt = `对话历史：
${messages.map(m => `${m.role === 'ai' ? 'AI' : '用户'}：${m.content}`).join('\n')}

当前已收集信息：${JSON.stringify(collectedInfo || {}, null, 2)}

请继续对话，自然地收集还缺少的信息。`;

        const content = await callAI(systemPrompt, userPrompt, model, 0.8, 2048);
        const result = cleanAndParseJSON(content);
        sendJSON(res, 200, { code: 0, data: result }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '对话失败: ' + e.message }, req);
      }
      return;
    }

    // ========== 学习计划向导：生成学习总纲 ==========
    if (path === '/api/ai/plan/generate-outline' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        const { collectedInfo } = data;
        const model = data.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位资深的课程设计师，擅长根据学生情况制定科学的学习路径总纲。

请根据学生提供的信息，生成一个分阶段的学习总纲。总纲要清晰、可执行，每个阶段有明确目标。

【总纲要求】
1. 划分3-6个学习阶段（如：入门基础→核心进阶→项目实战→高级专题→求职冲刺等）
2. 每个阶段说明：学习主题、持续周数、核心知识点（5-10个）、阶段目标、阶段产出
3. 设置关键里程碑（学完XX能做XX）
4. 给出前置知识要求（零基础就写"无"）
5. 给出学习建议和注意事项
6. 总周数要符合学生的时间安排

请输出严格的JSON格式：
{
  "title": "学习方案名称",
  "overview": "整体学习路径概述（100-200字）",
  "targetLevel": "学完后能达到的水平描述",
  "totalWeeks": 总周数,
  "estimatedHours": 总预估学习小时数,
  "prerequisites": ["前置知识1", "前置知识2"],
  "phases": [
    {
      "id": "phase-1",
      "order": 1,
      "title": "阶段标题",
      "description": "阶段描述",
      "durationWeeks": 周数,
      "startWeek": 起始周,
      "endWeek": 结束周,
      "coreKnowledge": ["核心知识点1", "核心知识点2"],
      "goals": ["目标1", "目标2"],
      "deliverable": "阶段产出（如：完成XX项目）"
    }
  ],
  "milestones": [
    { "week": 周数, "title": "里程碑名称", "desc": "里程碑描述" }
  ],
  "learningTips": ["建议1", "建议2", "建议3"]
}`;

        const userPrompt = `学生信息：
${JSON.stringify(collectedInfo, null, 2)}

请为这位学生生成科学合理的学习总纲。阶段划分要循序渐进，知识点安排要符合学习规律。`;

        const content = await callAI(systemPrompt, userPrompt, model, 0.7, 4096);
        const outline = cleanAndParseJSON(content);
        sendJSON(res, 200, { code: 0, data: outline }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '生成总纲失败: ' + e.message }, req);
      }
      return;
    }

    // ========== 学习计划：生成单周详细计划 ==========
    if (path === '/api/ai/plan/generate-week' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        const { outline, weekNumber, previousWeekSummary, checkinHistory } = data;
        const model = data.model || DEFAULT_MODEL;

        // 找到当前周属于哪个阶段
        let currentPhase = outline.phases[0];
        for (const phase of outline.phases) {
          if (weekNumber >= phase.startWeek && weekNumber <= phase.endWeek) {
            currentPhase = phase;
            break;
          }
        }

        const systemPrompt = `你是一位细致的学习导师，负责为学生制定一周的每日详细学习计划。

【计划要求】
1. 根据当前阶段目标，安排周一到周日的学习任务（周日可以安排复习或休息）
2. 每天的任务要具体、可执行，不要太笼统
3. 每天学习时长符合学生的每日可用时间
4. 任务类型搭配合理：学新知识+做练习+复习+小项目
5. 每个任务说明：学习要点、练习建议
6. 周末安排复习和反思
7. 如果有上周学习情况，根据掌握程度调整难度和节奏

请输出严格的JSON格式：
{
  "weekNumber": ${weekNumber},
  "phaseId": "${currentPhase.id}",
  "phaseTitle": "${currentPhase.title}",
  "theme": "本周主题",
  "goals": ["本周目标1", "本周目标2", "本周目标3"],
  "overview": "本周内容概述（50-100字）",
  "dailyTasks": [
    {
      "id": "W${weekNumber}D1",
      "dayOfWeek": 1,
      "title": "任务标题",
      "type": "learn/practice/project/review/rest",
      "duration": 分钟数,
      "knowledgePoints": ["相关知识点"],
      "description": "任务详细描述",
      "keyPoints": ["学习要点1", "学习要点2"],
      "practiceSuggestion": "练习建议",
      "isComplete": false
    }
  ],
  "weekendReview": {
    "focusPoints": ["复习重点1", "复习重点2"],
    "reflectionPrompt": "本周反思问题"
  },
  "estimatedMinutes": 本周总学习分钟数,
  "difficulty": 难度1-5
}`;

        let userPrompt = `学习总纲：
${JSON.stringify(outline, null, 2)}

当前阶段：${currentPhase.title}（第${currentPhase.startWeek}-${currentPhase.endWeek}周）
请生成第${weekNumber}周的每日详细计划。`;

        if (previousWeekSummary) {
          userPrompt += `\n\n上周学习总结：${JSON.stringify(previousWeekSummary, null, 2)}
请根据上周的学习情况调整本周计划（如果学得好可以适当加快/加深，如果有困难则放慢节奏/增加练习）。`;
        }

        const content = await callAI(systemPrompt, userPrompt, model, 0.7, 4096);
        const weekPlan = cleanAndParseJSON(content);
        sendJSON(res, 200, { code: 0, data: { ...weekPlan, generatedAt: new Date().toISOString() } }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '生成周计划失败: ' + e.message }, req);
      }
      return;
    }

    // ========== 学习计划：周总结AI分析 ==========
    if (path === '/api/ai/plan/weekly-summary' && req.method === 'POST') {
      const body = await readBody(req, res);
      try {
        const data = JSON.parse(body || '{}');
        const { weekNumber, checkins, weekPlan, outline } = data;
        const model = data.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位贴心的学习教练，根据学生一周的打卡记录生成学习总结和下周建议。

请输出严格的JSON格式：
{
  "weekNumber": ${weekNumber},
  "plannedTasks": 计划任务数,
  "completedTasks": 已完成任务数,
  "totalMinutes": 总学习分钟数,
  "averageUnderstanding": 平均理解程度(1-5),
  "strengths": ["做得好的地方1", "做得好的地方2"],
  "weaknesses": ["需要加强的地方1", "需要加强的地方2"],
  "aiAdvice": "鼓励和建议（温暖真诚，像朋友一样）",
  "nextWeekFocus": ["下周重点1", "下周重点2"],
  "adjustedDifficulty": "easier/same/harder"
}`;

        const userPrompt = `本周打卡记录：
${JSON.stringify(checkins, null, 2)}

本周计划：
${JSON.stringify(weekPlan, null, 2)}

请分析这位学生本周的学习情况，给出真诚的反馈和下周建议。多鼓励，指出问题要具体，建议要可执行。`;

        const content = await callAI(systemPrompt, userPrompt, model, 0.8, 2048);
        const summary = cleanAndParseJSON(content);
        // 补充日期信息
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 - (weekNumber - 1) * 7); // 周一
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        summary.startDate = weekStart.toISOString().split('T')[0];
        summary.endDate = weekEnd.toISOString().split('T')[0];
        sendJSON(res, 200, { code: 0, data: summary }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '生成周总结失败: ' + e.message }, req);
      }
      return;
    }

    // ========== 静态文件服务（托管前端构建产物） ==========
    // 非 API 路由尝试返回前端静态文件
    if (!path.startsWith('/api/') && !path.startsWith('/health')) {
      serveStatic(path, res, req);
      return;
    }

    // 404
    sendJSON(res, 404, { code: -1, message: 'Not Found: ' + path }, req);
  } catch (e) {
    console.error('请求处理错误:', e);
    if (!res.headersSent) {
      sendJSON(res, 500, { code: -1, message: '服务器内部错误: ' + e.message }, req);
    }
  }
});

// ========== 启动服务器 ==========
server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 AI代理服务器已启动!`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🤖 默认模型: ${DEFAULT_MODEL}`);
  console.log(`🔑 API Key: ${AGNES_API_KEY ? '已配置 ✅' : '未配置 ❌ (请编辑.env文件)'}`);
  console.log(`🌐 CORS: ${ALLOWED_ORIGINS.includes('*') ? '允许所有来源(*)' : ALLOWED_ORIGINS.join(', ')}`);
  console.log(`========================================\n`);
});
