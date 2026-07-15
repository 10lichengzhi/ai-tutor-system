import { useState } from 'react'
import { Lightbulb, Send, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import type { GuidanceStep, GuidanceQuestionType } from '../../types'

interface GuidanceQuestionProps {
  guidance: GuidanceStep
  onSubmit?: (answer: string | string[]) => void
  disabled?: boolean
  /** 显示AI反馈 */
  feedback?: string
  isCorrect?: boolean
}

const GuidanceQuestion = ({ guidance, onSubmit, disabled = false, feedback, isCorrect }: GuidanceQuestionProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    Array.isArray(guidance.userAnswer) ? guidance.userAnswer : guidance.userAnswer ? [guidance.userAnswer] : []
  )
  const [textAnswer, setTextAnswer] = useState(
    typeof guidance.userAnswer === 'string' && guidance.questionType !== 'single_choice' && guidance.questionType !== 'multi_choice'
      ? guidance.userAnswer
      : ''
  )
  const [showHint, setShowHint] = useState(false)
  const [submitted, setSubmitted] = useState(!!guidance.userAnswer)

  const isMultiChoice = guidance.questionType === 'multi_choice'
  const isChoice = guidance.questionType === 'single_choice' || guidance.questionType === 'multi_choice'

  const handleOptionClick = (optionId: string) => {
    if (disabled || submitted) return
    if (isMultiChoice) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleSubmit = () => {
    if (disabled || submitted) return
    let answer: string | string[]
    if (isChoice) {
      if (selectedOptions.length === 0) return
      answer = isMultiChoice ? selectedOptions : selectedOptions[0]
    } else {
      if (!textAnswer.trim()) return
      answer = textAnswer.trim()
    }
    setSubmitted(true)
    onSubmit?.(answer)
  }

  const getOptionStyle = (optionId: string, isCorrectOption?: boolean) => {
    const isSelected = selectedOptions.includes(optionId)
    if (submitted && isCorrectOption !== undefined) {
      if (isCorrectOption) return 'border-secondary-400 bg-secondary-50 text-secondary-800'
      if (isSelected && !isCorrectOption) return 'border-red-300 bg-red-50 text-red-700'
      return 'border-border-theme bg-bg-primary text-text-secondary'
    }
    if (isSelected) return 'border-primary-400 bg-primary-50 text-primary-800 ring-2 ring-primary-100'
    return 'border-border-theme bg-bg-secondary hover:border-primary-300 hover:bg-primary-50/30 text-text-primary'
  }

  const questionTypeLabel: Record<GuidanceQuestionType, string> = {
    single_choice: '选择题',
    multi_choice: '多选题',
    fill_blank: '填空题',
    free_text: '开放思考',
  }

  return (
    <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50/50 to-white overflow-hidden">
      {/* 问题头部 */}
      <div className="px-5 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
          <Lightbulb className="w-4 h-4" />
          <span>苏格拉底引导 · 第{guidance.stepNumber}步</span>
          <span className="ml-auto text-xs bg-bg-secondary/20 px-2 py-0.5 rounded-full">
            {questionTypeLabel[guidance.questionType]}
          </span>
        </div>
        <p className="text-base font-medium leading-relaxed">{guidance.question}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* 提示按钮 */}
        {guidance.hint && !submitted && (
          <div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showHint ? '收起提示' : '需要提示？'}
            </button>
            {showHint && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                💡 {guidance.hint}
              </div>
            )}
          </div>
        )}

        {/* 选项区域（选择题） */}
        {isChoice && guidance.options && (
          <div className="space-y-2.5">
            {guidance.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={disabled || submitted}
                className={`
                  w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200
                  ${getOptionStyle(option.id, submitted ? option.isCorrect : undefined)}
                  ${!disabled && !submitted ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <span className={`
                  w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${selectedOptions.includes(option.id)
                    ? submitted && option.isCorrect
                      ? 'bg-secondary-500 text-white'
                      : submitted && !option.isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-primary-500 text-white'
                    : 'bg-bg-primary text-text-secondary'
                  }
                `}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-sm">{option.label}</span>
                {submitted && option.isCorrect && <CheckCircle2 className="w-5 h-5 text-secondary-500 flex-shrink-0" />}
                {submitted && selectedOptions.includes(option.id) && !option.isCorrect && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* 输入区域（填空/自由输入） */}
        {!isChoice && (
          <div>
            {guidance.questionType === 'fill_blank' ? (
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={disabled || submitted}
                placeholder="在这里填写你的答案..."
                className="w-full px-4 py-3 border-2 border-border-theme rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-base disabled:bg-bg-primary disabled:text-text-secondary"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            ) : (
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={disabled || submitted}
                placeholder="说说你的想法，没有标准答案，大胆思考吧..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-border-theme rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-base resize-none disabled:bg-bg-primary disabled:text-text-secondary"
              />
            )}
          </div>
        )}

        {/* 提交按钮 */}
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={disabled || (isChoice ? selectedOptions.length === 0 : !textAnswer.trim())}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            提交回答
          </button>
        )}

        {/* AI反馈 */}
        {(submitted || feedback) && (
          <div className={`
            p-4 rounded-xl border
            ${isCorrect
              ? 'bg-secondary-50 border-secondary-200'
              : isCorrect === false
                ? 'bg-red-50 border-red-200'
                : 'bg-primary-50 border-primary-200'
            }
          `}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
              ) : isCorrect === false ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold mb-1 ${
                  isCorrect ? 'text-secondary-800' : isCorrect === false ? 'text-red-800' : 'text-primary-900'
                }`}>
                  {isCorrect ? '回答正确！' : isCorrect === false ? '再想想~' : '智师的引导'}
                </p>
                <p className={`text-sm leading-relaxed ${
                  isCorrect ? 'text-secondary-700' : isCorrect === false ? 'text-red-700' : 'text-primary-800'
                }`}>
                  {feedback || guidance.aiFeedback || '让我们继续深入思考这个问题...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GuidanceQuestion
