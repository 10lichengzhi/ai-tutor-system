import { BookOpen, CheckCircle, Circle, Lock, PlayCircle } from 'lucide-react'
import Card from '../common/Card'

interface KnowledgeCardProps {
  id: string
  title: string
  description?: string
  status: 'mastered' | 'learning' | 'locked' | 'not_started'
  progress?: number
  onClick?: () => void
}

const statusConfig = {
  mastered: {
    icon: CheckCircle,
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
    borderColor: 'border-secondary-200',
    label: '已掌握',
  },
  learning: {
    icon: PlayCircle,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    label: '学习中',
  },
  locked: {
    icon: Lock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: '未解锁',
  },
  not_started: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: '未开始',
  },
}

const KnowledgeCard = ({
  title,
  description,
  status,
  progress = 0,
  onClick,
}: KnowledgeCardProps) => {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card
      hover
      onClick={onClick}
      className={`${config.bgColor} ${config.borderColor} border`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white ${config.color}`}>
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{title}</h4>
            <StatusIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
          </div>
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{description}</p>
          )}
          {status === 'learning' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>学习进度</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="mt-2">
            <span className={`inline-flex items-center text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default KnowledgeCard
