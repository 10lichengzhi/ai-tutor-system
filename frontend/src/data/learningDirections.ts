import { LearningDirection } from '../types/learning'

export interface LearningDirectionOption {
  id: LearningDirection
  name: string
  icon: string
  description: string
}

export const LEARNING_DIRECTIONS: LearningDirectionOption[] = [
  {
    id: 'frontend',
    name: '数学',
    icon: '📐',
    description: '初中数学、高中数学，代数、几何、函数、微积分基础'
  },
  {
    id: 'backend',
    name: '物理',
    icon: '⚡',
    description: '初中物理、高中物理，力学、电磁学、光学、热学'
  },
  {
    id: 'embedded_robot',
    name: '英语',
    icon: '📖',
    description: '初中英语、高中英语，语法、阅读、写作、听力'
  },
  {
    id: 'custom',
    name: '自定义方向',
    icon: '✨',
    description: '告诉我你的目标，AI为你定制'
  }
]
