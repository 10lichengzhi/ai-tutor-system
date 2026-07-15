/**
 * Vercel Serverless Function - AI API 统一处理入口
 * 通过 vercel.json rewrites 将所有 /api/ai/* 请求路由到此处
 * 原始路径通过 _route 查询参数传递
 */
const {
  getCORSHeaders, sendJSON, proxyHttpRequest, handleChat, callAI, cleanAndParseJSON, readBody,
  AGNES_BASE_URL, AGNES_API_KEY, DEFAULT_MODEL, AI_MODELS,
  TUTOR_PERSONALITIES, LEARNING_MODES, THINKING_STRATEGIES,
} = require('./_lib');

module.exports = async (req, res) => {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204, getCORSHeaders(req));
    res.end();
    return;
  }

  // 从查询参数获取路由（由 vercel.json rewrites 设置）
  let routePath = '';
  if (req.query && req.query._route) {
    routePath = Array.isArray(req.query._route) ? req.query._route.join('/') : req.query._route;
  }

  // 兜底1：从自定义请求头获取
  if (!routePath) {
    routePath = req.headers['x-api-route'] || '';
  }

  // 兜底2：从 req.url 解析
  if (!routePath) {
    const urlPath = (req.url || '').split('?')[0];
    const match = urlPath.match(/^\/api\/(v1\/)?ai\/?(.*)$/);
    if (match) {
      routePath = match[2] || '';
    }
  }

  const route = '/' + routePath.replace(/^\/+/, '');

  try {
    // ========== GET /config - 获取配置列表 ==========
    if (route === '/config' && req.method === 'GET') {
      sendJSON(res, 200, {
        code: 0,
        data: {
          personalities: Object.entries(TUTOR_PERSONALITIES).map(([id, p]) => ({ id, name: p.name })),
          learningModes: Object.entries(LEARNING_MODES).map(([id, m]) => ({ id, name: m.name })),
          thinkingStrategies: Object.entries(THINKING_STRATEGIES).map(([id, s]) => ({ id, name: s.name })),
        }
      }, req);
      return;
    }

    // ========== GET /models - 获取模型列表 ==========
    if (route === '/models' && req.method === 'GET') {
      proxyHttpRequest(`${AGNES_BASE_URL}/models`, { method: 'GET' }, null, res, false, req);
      return;
    }

    // ========== GET /providers - 获取提供商列表 ==========
    if (route === '/providers' && req.method === 'GET') {
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

    // ========== POST /test-connection - 测试连接 ==========
    if (route === '/test-connection' && req.method === 'POST') {
      proxyHttpRequest(`${AGNES_BASE_URL}/models`, { method: 'GET' }, null, res, false, req);
      return;
    }

    // ========== POST /chat - AI对话 ==========
    if (route === '/chat') {
      const body = await readBody(req);
      try {
        const data = JSON.parse(body || '{}');
        handleChat(data, res, data.stream !== false, false, req);
      } catch (e) {
        sendJSON(res, 400, { code: -1, message: 'Invalid request: ' + e.message }, req);
      }
      return;
    }

    // ========== POST /tutor-chat - AI智师对话 ==========
    if (route === '/tutor-chat') {
      const body = await readBody(req);
      try {
        const data = JSON.parse(body || '{}');
        handleChat(data, res, data.stream !== false, true, req);
      } catch (e) {
        sendJSON(res, 400, { code: -1, message: 'Invalid request: ' + e.message }, req);
      }
      return;
    }

    // ========== POST /generate-plan - 生成学习方案 ==========
    if (route === '/generate-plan' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        const params = JSON.parse(body);
        const model = params.model || DEFAULT_MODEL;

        const systemPrompt = `你是学习规划专家。根据用户信息生成学习方案JSON。
要求：阶段循序渐进，知识点有依赖，每周有学习/练习/项目节点。输出纯JSON，无其他文字。`;

        const weeks = Math.min(params.total_weeks, 8);

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

        const content = await callAI(systemPrompt, userPrompt, model, 0.4, 4096);
        const planData = cleanAndParseJSON(content);
        sendJSON(res, 200, { code: 0, message: '学习方案生成成功', data: planData }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '生成失败: ' + e.message }, req);
      }
      return;
    }

    // ========== POST /analyze-wrong - 分析错题 ==========
    if (route === '/analyze-wrong' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        const params = JSON.parse(body);
        const model = params.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位经验丰富的老师，擅长分析学生的错题，找出问题根源，并用通俗易懂的方式讲解，帮助学生真正理解。

分析错题时要包含：
1. 错误原因分析
2. 正确解法：详细的解题步骤
3. 知识点讲解：相关知识点的复习
4. 避坑提醒：常见的易错点
5. 改进建议
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

    // ========== POST /generate-exercises - 生成练习题 ==========
    if (route === '/generate-exercises' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        const params = JSON.parse(body);
        const model = params.model || DEFAULT_MODEL;
        const typeDesc = {
          choice: '选择题', fill: '填空题', calculate: '计算题',
          program: '编程题', mixed: '混合题型（包含多种题型）'
        };

        const systemPrompt = `你是一位专业的出题老师，能够根据知识点和难度生成高质量的练习题。

每道题要包含：题目内容、选项（选择题）、正确答案、答案解析、考察知识点。
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

    // ========== POST /plan/interview - AI引导对话 ==========
    if (route === '/plan/interview' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        const data = JSON.parse(body || '{}');
        const { messages, collectedInfo } = data;
        const model = data.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位专业的学习规划师，正在通过友好对话了解学生的学习需求，为其量身定制学习方案。

【你的任务】
像朋友聊天一样，通过多轮对话自然地收集以下信息（不要一次性问完，每次只问1-2个问题）：
1. 想学什么（具体方向/技术/科目）
2. 学习目标（兴趣/工作/考试/转行等）
3. 当前基础（零基础/入门/有一定基础/熟练）
4. 可投入时间（每天多久、每周几天）
5. 学习偏好（视频/看书/动手实践/混合）
6. 期望多久学成/有无截止日期
7. 特殊需求（如考研、求职、做项目等）

【对话原则】
- 语气亲切友好，像学长/学姐一样聊天
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
  "missingInfo": ["还缺哪些信息"]
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

    // ========== POST /plan/generate-outline - 生成学习总纲 ==========
    if (route === '/plan/generate-outline' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        const data = JSON.parse(body || '{}');
        const { collectedInfo } = data;
        const model = data.model || DEFAULT_MODEL;

        const systemPrompt = `你是一位资深的课程设计师，擅长根据学生情况制定科学的学习路径总纲。

请根据学生提供的信息，生成一个分阶段的学习总纲。总纲要清晰、可执行，每个阶段有明确目标。

【总纲要求】
1. 划分3-6个学习阶段
2. 每个阶段说明：学习主题、持续周数、核心知识点（5-10个）、阶段目标、阶段产出
3. 设置关键里程碑
4. 给出前置知识要求
5. 给出学习建议和注意事项
6. 总周数要符合学生的时间安排

请输出严格的JSON格式：
{
  "title": "学习方案名称",
  "overview": "整体学习路径概述",
  "targetLevel": "学完后能达到的水平描述",
  "totalWeeks": 总周数,
  "estimatedHours": 总预估学习小时数,
  "prerequisites": ["前置知识1"],
  "phases": [
    {
      "id": "phase-1",
      "order": 1,
      "title": "阶段标题",
      "description": "阶段描述",
      "durationWeeks": 周数,
      "startWeek": 起始周,
      "endWeek": 结束周,
      "coreKnowledge": ["核心知识点1"],
      "goals": ["目标1"],
      "deliverable": "阶段产出"
    }
  ],
  "milestones": [
    { "week": 周数, "title": "里程碑名称", "desc": "里程碑描述" }
  ],
  "learningTips": ["建议1"]
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

    // ========== POST /plan/generate-week - 生成单周详细计划 ==========
    if (route === '/plan/generate-week' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        const data = JSON.parse(body || '{}');
        const { outline, weekNumber, previousWeekSummary, checkinHistory } = data;
        const model = data.model || DEFAULT_MODEL;

        let currentPhase = outline.phases[0];
        for (const phase of outline.phases) {
          if (weekNumber >= phase.startWeek && weekNumber <= phase.endWeek) {
            currentPhase = phase;
            break;
          }
        }

        const systemPrompt = `你是一位细致的学习导师，负责为学生制定一周的每日详细学习计划。

【计划要求】
1. 根据当前阶段目标，安排周一到周日的学习任务
2. 每天的任务要具体、可执行
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
  "goals": ["本周目标1"],
  "overview": "本周内容概述",
  "dailyTasks": [
    {
      "id": "W${weekNumber}D1",
      "dayOfWeek": 1,
      "title": "任务标题",
      "type": "learn/practice/project/review/rest",
      "duration": 分钟数,
      "knowledgePoints": ["相关知识点"],
      "description": "任务详细描述",
      "keyPoints": ["学习要点1"],
      "practiceSuggestion": "练习建议",
      "isComplete": false
    }
  ],
  "weekendReview": {
    "focusPoints": ["复习重点1"],
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
请根据上周的学习情况调整本周计划。`;
        }

        const content = await callAI(systemPrompt, userPrompt, model, 0.7, 4096);
        const weekPlan = cleanAndParseJSON(content);
        sendJSON(res, 200, { code: 0, data: { ...weekPlan, generatedAt: new Date().toISOString() } }, req);
      } catch (e) {
        sendJSON(res, 500, { code: -1, message: '生成周计划失败: ' + e.message }, req);
      }
      return;
    }

    // ========== POST /plan/weekly-summary - 周总结AI分析 ==========
    if (route === '/plan/weekly-summary' && req.method === 'POST') {
      const body = await readBody(req);
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
  "strengths": ["做得好的地方1"],
  "weaknesses": ["需要加强的地方1"],
  "aiAdvice": "鼓励和建议",
  "nextWeekFocus": ["下周重点1"],
  "adjustedDifficulty": "easier/same/harder"
}`;

        const userPrompt = `本周打卡记录：
${JSON.stringify(checkins, null, 2)}

本周计划：
${JSON.stringify(weekPlan, null, 2)}

请分析这位学生本周的学习情况，给出真诚的反馈和下周建议。多鼓励，指出问题要具体，建议要可执行。`;

        const content = await callAI(systemPrompt, userPrompt, model, 0.8, 2048);
        const summary = cleanAndParseJSON(content);
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 - (weekNumber - 1) * 7);
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

    // ========== 404 ==========
    sendJSON(res, 404, { code: -1, message: 'Not Found: ' + route }, req);
  } catch (e) {
    if (!res.headersSent) {
      sendJSON(res, 500, { code: -1, message: '服务器内部错误: ' + e.message }, req);
    }
  }
};
