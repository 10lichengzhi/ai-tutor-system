import { LearningDirection } from '../types/learning'

export interface LearningDirectionOption {
  id: LearningDirection
  name: string
  icon: string
  description: string
}

export const LEARNING_DIRECTIONS: LearningDirectionOption[] = [
  {
    id: 'embedded_robot',
    name: '嵌入式Linux + 机器人',
    icon: '🤖',
    description: 'C语言、单片机、STM32、Linux驱动、ROS机器人开发'
  },
  {
    id: 'frontend',
    name: '前端开发',
    icon: '💻',
    description: 'HTML/CSS、JavaScript、React、Vue、工程化'
  },
  {
    id: 'backend',
    name: '后端开发',
    icon: '⚙️',
    description: 'Java/Python/Go、数据库、微服务、分布式'
  },
  {
    id: 'custom',
    name: '自定义方向',
    icon: '✨',
    description: '告诉我你的目标，AI为你定制'
  }
]
