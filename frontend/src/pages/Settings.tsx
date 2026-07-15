import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon, Bot, Brain, Sliders,
  Save, Check, RefreshCw,
  Database, Zap, AlertCircle, CheckCircle, Shield
} from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { useLearningPlan } from '../contexts/LearningPlanContext'
import { useWrongAnswers } from '../contexts/WrongAnswersContext'
import { useLearningStats } from '../contexts/LearningStatsContext'
import { useExercises } from '../contexts/ExercisesContext'

const Settings = () => {
  const navigate = useNavigate()
  const {
    ai, setAISettings,
    learning, setLearningSettings,
    models, defaultModel, loadingModels,
    testingConnection, connectionStatus, connectionMessage,
    testAIConnection,
    resetSettings,
  } = useSettings()

  const { resetPlan } = useLearningPlan()
  const { resetAll: resetWrongAnswers } = useWrongAnswers()
  const { resetAll: resetStats } = useLearningStats()
  const { resetAll: resetExercises } = useExercises()

  const [saved, setSaved] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const personalities = [
    { id: 'patient' as const, name: '耐心引导型', desc: '循序渐进，不直接给答案，引导你思考' },
    { id: 'strict' as const, name: '严格教练型', desc: '高标准严要求，指出不足，鼓励突破' },
    { id: 'humorous' as const, name: '轻松幽默型', desc: '寓教于乐，用有趣的例子讲解知识' },
  ]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 安全地清除所有数据
  const handleClearAllData = async () => {
    if (!confirm('确定要清除所有本地学习数据吗？此操作不可恢复！')) {
      return
    }

    setIsResetting(true)

    try {
      // 按顺序调用各个Context的重置方法
      resetPlan()
      resetWrongAnswers()
      resetStats()
      resetExercises()
      resetSettings()

      // 清除所有ai-tutor开头的localStorage项（兜底）
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ai-tutor-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // 显示成功提示，然后跳转到首页
      alert('所有数据已清除，即将返回首页')
      
      // 延迟跳转，让状态更新完成
      setTimeout(() => {
        setIsResetting(false)
        navigate('/dashboard')
      }, 500)
    } catch (e) {
      console.error('重置数据失败:', e)
      setIsResetting(false)
      alert('重置过程中出现问题，请刷新页面重试')
    }
  }

  // 选中的模型
  const selectedModelId = ai.selectedModel || defaultModel

  return (
    <div className="content-page">
      <div className="content-page-inner animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-[#332a23]/80" />
          设置
        </h1>
        <p className="text-[#332a23]/50">配置AI模型、学习偏好和账户设置</p>
      </div>

      <div className="space-y-6">
        {/* AI模型配置 */}
        <div className="bg-white rounded-xl border border-[#332a23]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#332a23]/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#993222]/10 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#993222]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#332a23]">AI 模型配置</h2>
              <p className="text-xs text-[#332a23]/50">API密钥安全存储在后端，不会暴露给前端</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 模型选择 */}
            <div>
              <label className="block text-sm font-medium text-[#332a23]/80 mb-2">选择AI模型</label>
              {loadingModels ? (
                <div className="text-center py-4 text-[#332a23]/40 text-sm">加载模型列表...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setAISettings({ selectedModel: model.id === defaultModel ? null : model.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedModelId === model.id
                          ? 'border-[#993222] bg-[#993222]/5'
                          : 'border-[#332a23]/10 hover:border-[#332a23]/15 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-[#332a23] text-sm">{model.name}</span>
                        {model.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#993222] text-white rounded">推荐</span>
                        )}
                        {selectedModelId === model.id && (
                          <Check className="w-4 h-4 text-[#993222]" />
                        )}
                      </div>
                      <p className="text-xs text-[#332a23]/50 mb-1">{model.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* API密钥说明 */}
            <div className="bg-[#993222]/5 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#993222] mt-0.5" />
                <div className="text-xs text-[#993222]">
                  <p className="font-medium mb-1">API密钥安全保护</p>
                  <p>API密钥安全存储在后端服务器，前端通过后端代理调用AI接口，密钥全程不暴露给用户。</p>
                </div>
              </div>
            </div>

            {/* 连接测试 */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={testAIConnection}
                disabled={testingConnection}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#332a23]/10 text-[#332a23]/80 rounded-lg text-sm font-medium hover:bg-white/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                {testingConnection ? '测试中...' : '测试连接'}
              </button>

              {connectionStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{connectionMessage}</span>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{connectionMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI 个性化设置 */}
        <div className="bg-white rounded-xl border border-[#332a23]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#332a23]/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#993222]/10 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#993222]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#332a23]">AI 个性化</h2>
              <p className="text-xs text-[#332a23]/50">调整AI智师的教学风格</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* AI性格 */}
            <div>
              <label className="block text-sm font-medium text-[#332a23]/80 mb-2">AI教学风格</label>
              <div className="grid grid-cols-3 gap-3">
                {personalities.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setAISettings({ personality: p.id })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      ai.personality === p.id
                        ? 'border-[#993222] bg-[#993222]/5'
                        : 'border-[#332a23]/10 hover:border-[#332a23]/15 bg-white'
                    }`}
                  >
                    <div className="font-medium text-sm text-[#332a23] mb-0.5">{p.name}</div>
                    <div className="text-xs text-[#332a23]/50">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 创造性（temperature） */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#332a23]/80 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  回答创造性
                </label>
                <span className="text-sm text-[#332a23]/50">{Math.round(ai.temperature * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={ai.temperature}
                onChange={(e) => setAISettings({ temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-white/90 rounded-lg appearance-none cursor-pointer accent-[#993222]"
              />
              <div className="flex justify-between text-xs text-[#332a23]/40 mt-1">
                <span>严谨准确</span>
                <span>平衡</span>
                <span>富有创意</span>
              </div>
            </div>
          </div>
        </div>

        {/* 学习偏好 */}
        <div className="bg-white rounded-xl border border-[#332a23]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#332a23]/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-[#332a23]">学习偏好</h2>
              <p className="text-xs text-[#332a23]/50">定制你的学习体验</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-[#332a23]">每日学习目标</div>
                <div className="text-xs text-[#332a23]/50">每天计划学习时长</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={learning.dailyGoal}
                  onChange={(e) => setLearningSettings({ dailyGoal: parseInt(e.target.value) || 30 })}
                  min="10"
                  max="180"
                  className="w-20 px-3 py-1.5 border border-[#332a23]/10 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <span className="text-sm text-[#332a23]/50">分钟</span>
              </div>
            </div>

            <div className="border-t border-[#332a23]/5" />

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-[#332a23]">自动进入下一节</div>
                <div className="text-xs text-[#332a23]/50">完成当前节点后自动推荐下一个知识点</div>
              </div>
              <button
                onClick={() => setLearningSettings({ autoNext: !learning.autoNext })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  learning.autoNext ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                  learning.autoNext ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-[#332a23]">显示解题提示</div>
                <div className="text-xs text-[#332a23]/50">做题时遇到困难是否自动给出提示</div>
              </div>
              <button
                onClick={() => setLearningSettings({ showHints: !learning.showHints })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  learning.showHints ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                  learning.showHints ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-[#332a23]">学习提醒</div>
                <div className="text-xs text-[#332a23]/50">到学习时间时发送浏览器通知</div>
              </div>
              <button
                onClick={() => setLearningSettings({ notifications: !learning.notifications })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  learning.notifications ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                  learning.notifications ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white rounded-xl border border-[#332a23]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#332a23]/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-[#332a23]">数据管理</h2>
              <p className="text-xs text-[#332a23]/50">学习数据保存在浏览器本地，支持长期学习记忆</p>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-[#7a6b5e] mb-2">
                <span className="font-medium">本地持久化：</span>
                学习方案、进度、错题、聊天记录等所有数据都保存在你的浏览器本地存储中，刷新页面不会丢失，支持长期学习追踪。
              </p>
              <button
                onClick={handleClearAllData}
                disabled={isResetting}
                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? '正在清除...' : '清除所有数据并重置'}
              </button>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-[#993222] to-[#7a2818] text-white hover:shadow-lg'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Settings
