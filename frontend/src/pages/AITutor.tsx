import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send, User, Bot, Image as ImageIcon,
  Target, Brain, ChevronDown, Check, Sparkles,
  Scissors, Atom, GraduationCap, Network, GitBranch, Route as RouteIcon,
  BookOpen, Zap, RefreshCw,
  CheckCircle, AlertTriangle, Lightbulb, Code, FileText, Bookmark,
  Clock, PanelLeftClose, PanelLeftOpen, Flame, Trophy, TrendingUp,
  Calendar, Dumbbell, HelpCircle, Star, ArrowRight, Wand2
} from 'lucide-react';
import { tutorChatStream } from '../services/aiService';
import { useSettings, TUTOR_PERSONALITY_INFO, TutorPersonality } from '../contexts/SettingsContext';
import { useLearningPlan } from '../contexts/LearningPlanContext';
import { useLearningStats } from '../contexts/LearningStatsContext';
import { cleanText } from '../utils/textCleaner';

// ========== 类型定义 ==========
interface LearningNode {
  id: string | number;
  title: string;
  subject: string;
  type: string;
  duration: number;
  desc?: string;
  isSelfLearning?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'diagnosis' | 'plan' | 'question';
  timestamp: Date;
}

interface DocumentSection {
  title: string;
  icon: any;
  content: string | string[];
  type?: 'text' | 'list' | 'code' | 'warning' | 'tip';
}

// ========== 常量配置 ==========
const LEARNING_MODES = [
  { id: 'goal', name: '目标型学习', desc: '高效直奔目标，最短路径' },
  { id: 'deep', name: '深度学习', desc: '注重理解，拓展关联' },
];

const THINKING_STRATEGIES = [
  { id: 'default', name: '默认引导', icon: Sparkles, desc: '标准引导方式' },
  { id: 'occam', name: '奥卡姆剃刀', icon: Scissors, desc: '最简单解释优先' },
  { id: 'first_principles', name: '第一性原理', icon: Atom, desc: '回归基本概念' },
  { id: 'feynman', name: '费曼学习法', icon: GraduationCap, desc: '用简单语言讲解' },
  { id: 'structured', name: '结构化思维', icon: Network, desc: '框架化分析' },
  { id: 'reverse', name: '逆向思维', icon: GitBranch, desc: '从结论倒推' },
];

const QUICK_ACTIONS = [
  { id: 'diagnose', label: '分析我的学情', icon: Target, desc: '了解学习薄弱点' },
  { id: 'plan', label: '制定学习计划', icon: Brain, desc: '定制专属方案' },
  { id: 'upload', label: '上传题目图片', icon: ImageIcon, desc: '拍照答疑' },
];

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是你的AI智师 🎓\n\n无论你是中学生课后辅导、大学生查漏补缺、考研党系统备考，还是终身学习者，我都能为你提供个性化辅导。\n\n你可以：\n• 直接输入问题开始提问\n• 点击左侧「分析学情」了解你的学习状况\n• 点击「制定计划」获取专属学习方案\n• 上传题目图片让我帮你解答\n\n告诉我，今天想学习什么？',
  type: 'text',
  timestamp: new Date(),
};



// ========== 生成学习文档内容 ==========
const generateDocumentSections = (node: LearningNode | null, mode: 'knowledge' | 'daily'): DocumentSection[] => {
  if (!node) return [];

  if (mode === 'knowledge') {
    return [
      {
        title: '本节学习目标',
        icon: Target,
        type: 'list',
        content: [
          `理解${node.title}的基本概念`,
          '掌握核心公式和解题方法',
          '能够独立完成基础练习题',
          '识别常见易错点'
        ]
      },
      {
        title: '核心概念讲解',
        icon: BookOpen,
        type: 'text',
        content: `${node.title}是${node.subject}中的重要知识点。${node.desc || ''}\n\n简单来说，我们需要理解它的定义、性质和应用场景。在考试中，这部分内容通常会以选择题、填空题和解答题的形式出现，占分约5-10分。\n\n学习建议：先理解概念，再通过例题熟悉解题步骤，最后通过练习巩固。`
      },
      {
        title: '💡 知识要点',
        icon: Lightbulb,
        type: 'list',
        content: [
          '定义：明确概念的内涵和外延',
          '性质：记住关键性质和推论',
          '公式：熟练记忆并理解推导过程',
          '应用：知道什么场景下使用'
        ]
      },
      {
        title: '⚠️ 易错点提醒',
        icon: AlertTriangle,
        type: 'warning',
        content: [
          '注意符号变化：移项时符号容易出错',
          '前提条件：公式使用前先看是否满足条件',
          '单位统一：物理/计算类题目注意单位',
          '多解情况：有些题目可能有多个答案'
        ]
      },
      {
        title: '📝 典型例题',
        icon: FileText,
        type: 'text',
        content: `【例1】基础概念题\n\n题目：下列关于${node.title}的说法正确的是（  ）\nA. ...  B. ...  C. ...  D. ...\n\n解析：做这类题目时，先回忆概念的定义，逐个选项排除。正确答案是B。\n\n【例2】计算应用题\n\n解题步骤：\n1. 审题，明确已知条件\n2. 选择合适的公式\n3. 代入计算\n4. 检查结果合理性`
      },
      {
        title: '🎯 本节小结',
        icon: CheckCircle,
        type: 'list',
        content: [
          '概念理解了吗？能复述出来吗？',
          '公式记住了吗？会推导吗？',
          '例题看懂了吗？能独立做吗？',
          '完成3-5道课后练习题巩固'
        ]
      }
    ];
  } else {
    return [
      {
        title: '🎯 今日目标',
        icon: Target,
        type: 'list',
        content: [
          `完成${node.title}的学习`,
          '理解核心原理和使用场景',
          '动手实践：写代码/搭电路/做实验',
          '输出笔记：用自己的话总结'
        ]
      },
      {
        title: '⏱ 时间分配建议',
        icon: Clock,
        type: 'list',
        content: [
          '概念学习：15分钟（看文档/视频）',
          '动手实践：20分钟（写代码/实验）',
          '总结笔记：10分钟（整理到自己的知识库）'
        ]
      },
      {
        title: '📚 学习步骤',
        icon: BookOpen,
        type: 'list',
        content: [
          '第一步：先看资料，了解这个东西是什么、解决什么问题',
          '第二步：理解核心原理，不需要死记细节，懂逻辑即可',
          '第三步：跟着教程动手做一遍，跑通Hello World',
          '第四步：尝试修改参数/代码，看看会发生什么',
          '第五步：脱离教程，自己重新实现一遍',
          '第六步：记录踩过的坑和解决方法'
        ]
      },
      {
        title: '✅ 必须记住的要点',
        icon: Bookmark,
        type: 'list',
        content: [
          '核心概念：它是什么？解决什么问题？',
          '关键API/函数：常用的5-10个',
          '常见坑：新手最容易踩的3-5个问题',
          '调试技巧：出问题了怎么排查'
        ]
      },
      node.subject.includes('嵌入式') || node.subject.includes('编程') ? {
        title: '💻 动手练习',
        icon: Code,
        type: 'code',
        content: `// 今天的练习任务：\n// 1. 搭建开发环境（如果是第一次）\n// 2. 实现基础Demo\n// 3. 修改Demo观察变化\n// 4. 自己写一个小功能\n\n// 示例代码框架：\n#include <stdio.h>\n\nint main() {\n    // TODO: 今天的练习代码\n    printf("Hello, today I learned ${node.title}!");\n    return 0;\n}`
      } : {
        title: '✏️ 练习任务',
        icon: Zap,
        type: 'list',
        content: [
          '完成教程中的示例',
          '做2-3道相关练习题',
          '用费曼学习法讲给别人听（或自言自语）',
          '整理1页笔记'
        ]
      },
      {
        title: '📊 验收标准',
        icon: CheckCircle,
        type: 'list',
        content: [
          '能说清楚这个知识点是什么、解决什么问题',
          '能独立动手完成基础Demo/练习',
          '知道遇到问题去哪里查资料',
          '笔记整理完成'
        ]
      }
    ];
  }
};

// ========== 主组件 ==========
const AITutor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ai, setAISettings } = useSettings();
  const planCtx = useLearningPlan();
  const statsCtx = useLearningStats();

  const learningNode = (location.state as any)?.learningNode as LearningNode | null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (learningNode) {
      return [{
        id: 'welcome',
        role: 'assistant',
        content: `好的！我们开始学习「${learningNode.title}」。\n\n我已经在左侧为你准备了学习文档，你可以切换「知识点模式」或「每日计划模式」查看。\n\n学习过程中有任何疑问，随时在这里问我！当前是${TUTOR_PERSONALITY_INFO[ai.personality].name}模式${TUTOR_PERSONALITY_INFO[ai.personality].icon}`,
        type: 'text',
        timestamp: new Date(),
      }];
    }
    return [{
      ...INITIAL_MESSAGE,
      content: `${INITIAL_MESSAGE.content}\n\n当前是${TUTOR_PERSONALITY_INFO[ai.personality].name}模式${TUTOR_PERSONALITY_INFO[ai.personality].icon}，${TUTOR_PERSONALITY_INFO[ai.personality].desc}`
    }];
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);

  // 左侧面板状态
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<'plan' | 'doc'>('plan');

  const [docMode, setDocMode] = useState<'knowledge' | 'daily'>(
    learningNode?.isSelfLearning ? 'daily' : 'knowledge'
  );

  // 计算真实学习数据
  const todayTasks = useMemo(() => planCtx.getTodayTasks(), [planCtx])
  const currentWeekPlan = useMemo(() => planCtx.getCurrentWeekPlan(), [planCtx])
  const completedTodayTasks = todayTasks.filter(t => t.isComplete).length

  // 判断是否有有效的学习计划
  const hasOldPlan = planCtx.phases.length > 0 && planCtx.userProfile !== null
  const hasNewPlan = planCtx.outline !== null && planCtx.wizardStep === 'active'
  const hasPlan = hasOldPlan || hasNewPlan

  // 获取学习主题名称
  const getSubjectName = () => {
    if (planCtx.collectedInfo.learningGoal) {
      return planCtx.collectedInfo.learningGoal
    }
    if (planCtx.userProfile?.directionName) {
      return planCtx.userProfile.directionName
    }
    return '综合学习'
  }

  // 计算学习统计
  const learningStats = useMemo(() => {
    const stats = statsCtx.stats
    const streakDays = stats.currentStreak || 0
    const totalMinutes = stats.totalMinutes || 0
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    
    // 计算已掌握知识点数量
    let masteredPoints = stats.masteredKnowledgePoints || 0
    if (hasNewPlan && planCtx.outline) {
      // 新格式：从周计划统计已完成的任务对应的知识点
      let planMastered = 0
      Object.values(planCtx.weeklyPlans).forEach(wp => {
        wp.dailyTasks.forEach(t => {
          if (t.isComplete) planMastered++
        })
      })
      masteredPoints = Math.max(masteredPoints, planMastered)
    } else if (hasOldPlan) {
      // 旧格式：统计completed状态的节点
      let planMastered = 0
      planCtx.phases.forEach(p => {
        p.weeks.forEach(w => {
          w.nodes.forEach(n => {
            if (n.status === 'completed') planMastered++
          })
        })
      })
      masteredPoints = Math.max(masteredPoints, planMastered)
    }

    return {
      streakDays,
      totalHours,
      masteredPoints,
      todayGoal: todayTasks.length > 0 ? todayTasks.length : 0,
      todayDone: completedTodayTasks,
    }
  }, [statsCtx.stats, planCtx, hasNewPlan, hasOldPlan, todayTasks, completedTodayTasks])

  // 当前学习阶段信息（用于学习路径展示）
  const currentLearningInfo = useMemo(() => {
    if (hasNewPlan && planCtx.outline && currentWeekPlan) {
      // 找到当前阶段
      let currentPhase = planCtx.outline.phases[0]
      for (const p of planCtx.outline.phases) {
        if (planCtx.currentWeekNumber >= p.startWeek && planCtx.currentWeekNumber <= p.endWeek) {
          currentPhase = p
          break
        }
      }
      
      const totalTasks = currentWeekPlan.dailyTasks.length
      const completedTasks = currentWeekPlan.dailyTasks.filter(t => t.isComplete).length
      const weekProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      const overallProgress = Math.round(((planCtx.currentWeekNumber - 1) / planCtx.outline.totalWeeks) * 100 + (weekProgress / planCtx.outline.totalWeeks))
      
      // 获取当前和下一个知识点
      const incompleteTasks = currentWeekPlan.dailyTasks.filter(t => !t.isComplete)
      const currentTask = incompleteTasks[0] || currentWeekPlan.dailyTasks[currentWeekPlan.dailyTasks.length - 1]
      const nextTask = incompleteTasks[1]

      return {
        title: cleanText(planCtx.outline.title),
        progress: overallProgress,
        current: currentTask ? cleanText(currentTask.title) : '本周已完成',
        next: nextTask ? cleanText(nextTask.title) : (planCtx.currentWeekNumber < planCtx.outline.totalWeeks ? '下周学习内容' : '已完成全部计划'),
        subject: getSubjectName(),
      }
    } else if (hasOldPlan && planCtx.userProfile) {
      // 旧格式计划
      const totalNodes = planCtx.phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.nodes.length, 0), 0)
      const completedNodes = planCtx.phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.nodes.filter(n => n.status === 'completed').length, 0), 0)
      const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0
      
      // 找当前进行中的节点
      let currentNode: any = null
      for (const p of planCtx.phases) {
        for (const w of p.weeks) {
          for (const n of w.nodes) {
            if (n.status === 'in_progress') {
              currentNode = n
              break
            }
          }
          if (currentNode) break
        }
        if (currentNode) break
      }
      if (!currentNode) {
        for (const p of planCtx.phases) {
          for (const w of p.weeks) {
            for (const n of w.nodes) {
              if (n.status === 'not_started') {
                currentNode = n
                break
              }
            }
            if (currentNode) break
          }
          if (currentNode) break
        }
      }

      const subjectName = planCtx.userProfile.directionName || '学习'
      return {
        title: subjectName + '学习计划',
        progress,
        current: currentNode ? currentNode.title : '开始学习',
        next: '继续学习',
        subject: subjectName,
      }
    }
    return null
  }, [planCtx, hasNewPlan, hasOldPlan, currentWeekPlan])

  // 为当前学习节点生成文档（如果有传入learningNode则使用它，否则从当前计划获取）
  const activeNode = useMemo(() => {
    if (learningNode) return learningNode
    if (hasNewPlan && currentWeekPlan) {
      const incompleteTasks = currentWeekPlan.dailyTasks.filter(t => !t.isComplete)
      const currentTask = incompleteTasks[0]
      if (currentTask) {
        return {
          id: currentTask.id,
          title: cleanText(currentTask.title),
          subject: getSubjectName(),
          type: 'knowledge',
          duration: currentTask.duration || 30,
          desc: currentTask.description ? cleanText(currentTask.description) : '',
          isSelfLearning: false,
        } as LearningNode
      }
    }
    return null
  }, [learningNode, hasNewPlan, currentWeekPlan, planCtx])

  // 当activeNode变化时（从学习计划自动获取当前知识点），更新欢迎消息
  useEffect(() => {
    if (activeNode && !learningNode && messages.length <= 1) {
      setMessages([{
        id: 'welcome-node',
        role: 'assistant',
        content: `好的！我们继续学习「${activeNode.title}」。\n\n我已经在左侧为你准备了学习文档，你可以切换「知识点模式」或「每日计划模式」查看。\n\n学习过程中有任何疑问，随时在这里问我！当前是${TUTOR_PERSONALITY_INFO[ai.personality].name}模式${TUTOR_PERSONALITY_INFO[ai.personality].icon}`,
        type: 'text',
        timestamp: new Date(),
      }]);
    }
  }, [activeNode, learningNode, ai.personality]);

  const docSections = useMemo(() => generateDocumentSections(activeNode, docMode), [activeNode, docMode]);

  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showStrategyMenu, setShowStrategyMenu] = useState(false);
  const [learningMode, setLearningMode] = useState('goal');
  const [thinkingStrategy, setThinkingStrategy] = useState('default');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeNode) {
      setLeftPanelTab('doc');
      setPanelExpanded(true);
    } else {
      setLeftPanelTab('plan');
    }
  }, [activeNode]);

  const togglePanel = () => {
    setPanelExpanded(!panelExpanded);
  };

  // 文件转base64
  const fileToBase64 = (file: File, maxSize = 1024, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('图片大小不能超过5MB'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas not supported')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async (content?: string) => {
    const text = content || inputValue.trim();
    if ((!text && pendingImages.length === 0) || isTyping) return;

    let fullContent = text;
    if (pendingImages.length > 0) {
      fullContent = text + (text ? '\n\n' : '') + `[附带${pendingImages.length}张图片]`;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullContent,
      type: 'text',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setShowPersonalityMenu(false);
    setPendingImages([]);

    const aiMsgId = (Date.now() + 1).toString();
    let aiContent = '';
    
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      type: 'text',
      timestamp: new Date(),
    }]);

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome' || messages.length <= 1)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      let systemContext = '';
      if (activeNode) {
        systemContext = `\n\n当前正在学习的知识点：${activeNode.title}\n知识点描述：${activeNode.desc || '无'}\n学科：${activeNode.subject}`;
      } else if (hasPlan && planCtx.outline) {
        systemContext = `\n\n用户当前的学习计划：${cleanText(planCtx.outline.title)}\n学习目标：${cleanText(planCtx.outline.overview)}\n总周数：${planCtx.outline.totalWeeks}周，当前第${planCtx.currentWeekNumber}周`;
      }

      await tutorChatStream(
        {
          messages: [
            ...chatHistory,
            { role: 'user', content: fullContent + systemContext }
          ],
          model: ai.selectedModel || undefined,
          personality: ai.personality,
        },
        (chunk) => {
          aiContent += chunk;
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, content: aiContent } : m
          ));
        },
        () => {
          setIsTyping(false);
        },
        (error) => {
          console.error('AI对话错误:', error);
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId 
              ? { ...m, content: '抱歉，AI服务暂时不可用，请稍后再试。你可以先在「设置」页面检查AI连接配置。' }
              : m
          ));
          setIsTyping(false);
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId 
          ? { ...m, content: '发送失败，请检查网络连接或AI配置。' }
          : m
      ));
      setIsTyping(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'upload') {
      fileInputRef.current?.click();
    } else {
      const action = QUICK_ACTIONS.find(a => a.id === actionId);
      if (action) handleSend(action.label);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const base64 = await fileToBase64(files[i], 1024, 0.8);
          newImages.push(base64);
        } catch (err) {
          alert(err instanceof Error ? err.message : '图片处理失败');
        }
      }
      if (newImages.length > 0) {
        setPendingImages(prev => [...prev, ...newImages]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingImage = (idx: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentMode = LEARNING_MODES.find(m => m.id === learningMode);
  const currentStrategy = THINKING_STRATEGIES.find(s => s.id === thinkingStrategy);

  const renderSectionContent = (section: DocumentSection) => {
    switch (section.type) {
      case 'list':
        return (
          <ul className="space-y-1.5">
            {(section.content as string[]).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#332a23]/80 leading-relaxed">
                <span className="text-[#993222] mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case 'warning':
        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-3">
            <ul className="space-y-1">
              {(section.content as string[]).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-800">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'code':
        return (
          <pre className="bg-gradient-to-br from-[#332a23] to-[#4a3d33] text-amber-100 rounded-xl p-3 text-xs overflow-x-auto font-mono leading-relaxed shadow-inner">
            {section.content as string}
          </pre>
        );
      default:
        return (
          <p className="text-sm text-[#332a23]/80 leading-relaxed whitespace-pre-wrap">
            {section.content as string}
          </p>
        );
    }
  };

  return (
    <div className="content-page">
      <div className="content-page-inner h-full flex gap-4">
      {/* 左侧面板 - 学习计划/学习文档 */}
      <div
        className={`tutor-sidebar flex flex-col flex-shrink-0 transition-all duration-400 ease-out ${
          panelExpanded ? 'w-96 opacity-100' : 'w-0 overflow-hidden opacity-0'
        }`}
      >
        {/* 面板头部 */}
        <div className="tutor-sidebar-header px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#993222] to-[#7a2818] flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#332a23] text-sm">学习中心</span>
          </div>
          <button
            onClick={togglePanel}
            className="p-1.5 hover:bg-white/60 rounded-lg transition-all duration-200 text-[#332a23]/50 hover:text-[#993222]"
            title="收起面板"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab切换 */}
        <div className="px-3 pb-2">
          <div className="flex bg-white/50 rounded-xl p-1 backdrop-blur-sm">
            <button
              onClick={() => setLeftPanelTab('plan')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                leftPanelTab === 'plan' 
                  ? 'bg-white text-[#993222] shadow-md' 
                  : 'text-[#7a6b5e] hover:text-[#332a23]'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              学习计划
            </button>
            {activeNode && (
              <button
                onClick={() => setLeftPanelTab('doc')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  leftPanelTab === 'doc' 
                    ? 'bg-white text-[#993222] shadow-md' 
                    : 'text-[#7a6b5e] hover:text-[#332a23]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                知识点
              </button>
            )}
          </div>
        </div>

        {/* 面板内容区 */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {leftPanelTab === 'plan' ? (
            /* 学习计划面板 - 使用真实数据 */
            <div className="space-y-3">
              {/* 学习统计卡片 */}
              <div className="tutor-sidebar-card p-4">
                <h3 className="text-xs font-semibold text-[#332a23]/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#993222]" />
                  学习概览
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-2.5 text-center border border-orange-100/50">
                    <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-orange-600">{learningStats.streakDays}</div>
                    <div className="text-[10px] text-orange-600/70">连续打卡</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-2.5 text-center border border-teal-100/50">
                    <div className="flex items-center justify-center gap-1 text-teal-600 mb-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-teal-600">{learningStats.totalHours}h</div>
                    <div className="text-[10px] text-teal-600/70">累计学习</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#993222]/5 to-[#7a2818]/5 rounded-xl p-2.5 text-center border border-[#993222]/10">
                    <div className="flex items-center justify-center gap-1 text-[#993222] mb-1">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-[#993222]">{learningStats.masteredPoints}</div>
                    <div className="text-[10px] text-[#993222]/70">已掌握</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-2.5 text-center border border-blue-100/50">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-blue-600">{learningStats.todayDone}/{learningStats.todayGoal}</div>
                    <div className="text-[10px] text-blue-600/70">今日任务</div>
                  </div>
                </div>
              </div>

              {/* 今日任务 */}
              <div className="tutor-sidebar-card p-4">
                <h3 className="text-xs font-semibold text-[#332a23]/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#993222]" />
                  今日任务
                </h3>
                {todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                          task.isComplete 
                            ? 'bg-green-50/80 border border-green-100/50' 
                            : 'bg-white/60 border border-white/80 hover:bg-white/90 hover:border-[#993222]/10'
                        }`}
                        onClick={() => {
                          if (!task.isComplete) {
                            planCtx.completeDailyTask(task.id)
                          }
                        }}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          task.isComplete 
                            ? 'bg-green-500 text-white' 
                            : 'border-2 border-[#332a23]/20 hover:border-[#993222]'
                        }`}>
                          {task.isComplete && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium ${task.isComplete ? 'text-green-700 line-through' : 'text-[#332a23]'}`}>
                            {cleanText(task.title)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#993222]/8 text-[#993222] rounded-full">
                              {getSubjectName()}
                            </span>
                            <span className="text-[10px] text-[#332a23]/40 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />{task.duration || 30}分钟
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#993222]/5 flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-[#993222]/40" />
                    </div>
                    <p className="text-xs text-[#332a23]/50 mb-3">还没有今日任务</p>
                    {!hasPlan ? (
                      <button
                        onClick={() => navigate('/planner')}
                        className="px-4 py-2 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white text-xs rounded-xl hover:from-[#802a1d] transition-all flex items-center gap-1.5 mx-auto"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        开始定制学习方案
                      </button>
                    ) : (
                      <button
                        onClick={() => planCtx.generateNextWeek()}
                        className="px-4 py-2 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white text-xs rounded-xl hover:from-[#802a1d] transition-all flex items-center gap-1.5 mx-auto"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        生成本周计划
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 学习路径 */}
              <div className="tutor-sidebar-card p-4">
                <h3 className="text-xs font-semibold text-[#332a23]/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <RouteIcon className="w-3.5 h-3.5 text-[#993222]" />
                  我的学习路径
                </h3>
                {currentLearningInfo ? (
                  <div className="space-y-3">
                    <div className="bg-white/50 rounded-xl p-3 border border-white/60 hover:border-[#993222]/15 transition-all cursor-pointer"
                      onClick={() => navigate('/learning-path')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#332a23]">{currentLearningInfo.title}</span>
                        <span className="text-xs font-bold text-[#993222]">{currentLearningInfo.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#332a23]/5 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-[#993222] to-[#7a2818] rounded-full transition-all duration-500"
                          style={{ width: `${currentLearningInfo.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#332a23]/50">
                        <span>正在学：{currentLearningInfo.current}</span>
                        <span className="flex items-center gap-0.5 text-[#993222]">
                          下一步 <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-[#332a23]/50 mb-3">还没有定制学习方案</p>
                    <button
                      onClick={() => navigate('/planner')}
                      className="px-4 py-2 bg-[#993222]/8 text-[#993222] text-xs rounded-xl hover:bg-[#993222]/15 transition-all flex items-center gap-1.5 mx-auto"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      AI定制学习方案
                    </button>
                  </div>
                )}
                <button
                  onClick={() => navigate('/learning-path')}
                  className="w-full mt-3 py-2 text-xs text-[#993222] bg-[#993222]/8 rounded-xl hover:bg-[#993222]/15 transition-all font-medium flex items-center justify-center gap-1"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  查看全部路径
                </button>
              </div>

              {/* 快捷功能 */}
              <div className="tutor-sidebar-card p-4">
                <h3 className="text-xs font-semibold text-[#332a23]/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#993222]" />
                  快捷功能
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {QUICK_ACTIONS.map(action => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        className="flex items-center gap-3 p-2.5 bg-white/50 rounded-xl border border-white/60 hover:bg-white hover:border-[#993222]/20 transition-all duration-200 text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#993222]/8 flex items-center justify-center group-hover:bg-[#993222] group-hover:text-white transition-all">
                          <Icon className="w-4 h-4 text-[#993222] group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#332a23]">{action.label}</div>
                          <div className="text-[10px] text-[#332a23]/50">{action.desc}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#332a23]/20 group-hover:text-[#993222] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* 知识点文档面板 */
            <div className="space-y-3">
              {/* 文档头部信息 */}
              <div className="tutor-sidebar-card p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#993222] to-[#7a2818] flex items-center justify-center shadow-md flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-[#332a23] truncate text-sm">{activeNode?.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#993222]/10 text-[#993222] rounded-full font-medium">
                        {activeNode?.subject}
                      </span>
                      <span className="text-[10px] text-[#332a23]/50 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{activeNode?.duration}分钟
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 模式切换 */}
              <div className="flex bg-white/50 rounded-xl p-1 backdrop-blur-sm">
                <button
                  onClick={() => setDocMode('knowledge')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                    docMode === 'knowledge' 
                      ? 'bg-white text-[#993222] shadow-md' 
                      : 'text-[#7a6b5e] hover:text-[#332a23]'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  知识点
                </button>
                <button
                  onClick={() => setDocMode('daily')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                    docMode === 'daily' 
                      ? 'bg-white text-[#993222] shadow-md' 
                      : 'text-[#7a6b5e] hover:text-[#332a23]'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  每日计划
                </button>
              </div>

              {/* 文档内容 */}
              {docSections.map((section, i) => {
                const Icon = section.icon;
                return (
                  <div key={i} className="tutor-doc-card p-3">
                    <h3 className="flex items-center gap-2 font-semibold text-[#332a23] mb-2 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-[#993222]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#993222]" />
                      </div>
                      {section.title}
                    </h3>
                    {renderSectionContent(section)}
                  </div>
                );
              })}

              {/* 功能按钮 */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => navigate('/exercises')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/70 text-[#7a6b5e] rounded-xl hover:bg-white transition-all duration-200 text-xs font-medium border border-[#332a23]/8 flex-1 justify-center"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  去练习
                </button>
                <button
                  onClick={() => alert('已标记为已掌握！')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/60 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 text-xs font-medium flex-1 justify-center"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  已掌握
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧聊天区 - 毛玻璃护眼风格 */}
      <div className="tutor-chat-container flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="tutor-chat-header flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!panelExpanded && (
              <button
                onClick={togglePanel}
                className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200"
                title="展开面板"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#7a6b5e]" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#993222] to-[#7a2818] flex items-center justify-center shadow-lg shadow-[#993222]/20">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-[#332a23] text-sm block">
                  AI智师
                </span>
                <span className="text-xs text-[#332a23]/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  在线 · 随时为你答疑
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setShowModeMenu(!showModeMenu); setShowStrategyMenu(false); }}
                className="tutor-header-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <Target size={13} className="text-[#993222]" />
                <span>{currentMode?.name}</span>
                <ChevronDown size={11} className={`text-[#332a23]/40 transition-transform duration-200 ${showModeMenu ? 'rotate-180' : ''}`} />
              </button>
              {showModeMenu && (
                <div className="tutor-dropdown absolute right-0 top-full mt-2 w-44 py-2 z-30">
                  {LEARNING_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => { setLearningMode(mode.id); setShowModeMenu(false); }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-[#993222]/5 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="text-[#332a23] font-medium">{mode.name}</span>
                        <p className="text-[#332a23]/50 mt-0.5">{mode.desc}</p>
                      </div>
                      {learningMode === mode.id && <Check size={14} className="text-[#993222] flex-shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowStrategyMenu(!showStrategyMenu); setShowModeMenu(false); }}
                className="tutor-header-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <Brain size={13} className="text-[#993222]" />
                <span>{currentStrategy?.name}</span>
                <ChevronDown size={11} className={`text-[#332a23]/40 transition-transform duration-200 ${showStrategyMenu ? 'rotate-180' : ''}`} />
              </button>
              {showStrategyMenu && (
                <div className="tutor-dropdown absolute right-0 top-full mt-2 w-48 py-2 z-30 max-h-64 overflow-y-auto">
                  {THINKING_STRATEGIES.map(strategy => {
                    const Icon = strategy.icon;
                    return (
                      <button
                        key={strategy.id}
                        onClick={() => { setThinkingStrategy(strategy.id); setShowStrategyMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-[#993222]/5 flex items-center gap-2 transition-colors"
                      >
                        <Icon size={14} className="text-[#993222] flex-shrink-0" />
                        <span className="flex-1 truncate text-[#332a23]">{strategy.name}</span>
                        {thinkingStrategy === strategy.id && <Check size={14} className="text-[#993222] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="tutor-messages-area flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-6 px-5">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 mb-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#993222] to-[#7a2818] shadow-[#993222]/25' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25'
                }`}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-full text-left px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#993222] to-[#7a2818] text-white rounded-tr-md shadow-[#993222]/20'
                      : 'bg-white/80 backdrop-blur-sm border border-white/60 text-[#332a23]/90 rounded-tl-md'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content || <TypingDots />}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-2 h-2 bg-[#993222]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#993222]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#993222]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区 */}
        <div className="tutor-input-area px-5 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* 待发送图片预览 */}
            {pendingImages.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="待发送" className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md" />
                    <button
                      onClick={() => removePendingImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 导师人格选择 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#332a23]/50">导师风格：</span>
                <div className="relative">
                  <button
                    onClick={() => setShowPersonalityMenu(!showPersonalityMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-[#993222]/8 to-[#993222]/5 border border-[#993222]/20 text-[#993222] rounded-full hover:from-[#993222]/12 hover:to-[#993222]/8 transition-all duration-200"
                  >
                    <span className="text-base">{TUTOR_PERSONALITY_INFO[ai.personality].icon}</span>
                    <span className="font-medium">{TUTOR_PERSONALITY_INFO[ai.personality].name}</span>
                    <ChevronDown size={11} className={`transition-transform duration-200 ${showPersonalityMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showPersonalityMenu && (
                    <div className="tutor-dropdown absolute bottom-full left-0 mb-2 w-60 py-2 z-30">
                      {(Object.keys(TUTOR_PERSONALITY_INFO) as TutorPersonality[]).map(key => {
                        const info = TUTOR_PERSONALITY_INFO[key];
                        const isActive = ai.personality === key;
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setAISettings({ personality: key });
                              setShowPersonalityMenu(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-[#993222]/5 transition-colors ${
                              isActive ? 'bg-[#993222]/8' : ''
                            }`}
                          >
                            <span className="text-xl mt-0.5">{info.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-medium ${isActive ? 'text-[#993222]' : 'text-[#332a23]'}`}>
                                  {info.name}
                                </span>
                                {isActive && <Check size={14} className="text-[#993222]" />}
                              </div>
                              <p className="text-xs text-[#332a23]/50 mt-0.5">{info.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setMessages([{
                    ...INITIAL_MESSAGE,
                    content: `${INITIAL_MESSAGE.content}\n\n当前是${TUTOR_PERSONALITY_INFO[ai.personality].name}模式${TUTOR_PERSONALITY_INFO[ai.personality].icon}，${TUTOR_PERSONALITY_INFO[ai.personality].desc}`
                  }]);
                  setPendingImages([]);
                }}
                className="flex items-center gap-1.5 text-xs text-[#332a23]/50 hover:text-[#993222] transition-colors"
              >
                <RefreshCw size={12} />
                新对话
              </button>
            </div>

            <div className="tutor-input-wrapper relative rounded-2xl shadow-sm">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题，Shift+Enter换行... （支持拍照答疑）"
                rows={1}
                className="w-full px-4 py-3 pr-24 resize-none focus:outline-none rounded-2xl text-sm max-h-32 bg-transparent"
                style={{ minHeight: '48px' }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-[#332a23]/40 hover:text-[#993222] rounded-xl hover:bg-[#993222]/8 transition-all duration-200 disabled:opacity-50"
                  title="上传图片"
                >
                  {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={(!inputValue.trim() && pendingImages.length === 0) || isTyping}
                  className="p-2.5 bg-gradient-to-br from-[#993222] to-[#7a2818] text-white rounded-xl hover:from-[#802a1d] hover:to-[#6a2215] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-[#993222]/25 disabled:shadow-none"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>

            {/* 底部提示 */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[#332a23]/40">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                支持中学生/大学生/考研/终身学习
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                AI生成内容仅供参考
              </span>
            </div>
          </div>
        </div>
      </div>

      {(showModeMenu || showStrategyMenu || showPersonalityMenu) && (
        <div className="fixed inset-0 z-20" onClick={() => { setShowModeMenu(false); setShowStrategyMenu(false); setShowPersonalityMenu(false); }} />
      )}
      </div>
    </div>
  );
};

// 打字动画小圆点
const TypingDots = () => (
  <div className="flex gap-1.5 items-center h-5">
    <div className="w-2 h-2 bg-[#993222]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-[#993222]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-[#993222]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export default AITutor;
