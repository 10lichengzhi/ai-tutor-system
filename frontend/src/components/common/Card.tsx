import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
  action?: ReactNode
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

const Card = ({ children, className = '', hover = false, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-panel rounded-xl shadow-card p-6 transition-all duration-200
        ${hover ? 'hover:shadow-card-hover cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = '', action }: CardHeaderProps) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex-1">{children}</div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}

const CardTitle = ({ children, className = '' }: CardTitleProps) => {
  return (
    <h3 className={`text-lg font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  )
}

const CardContent = ({ children, className = '' }: CardContentProps) => {
  return <div className={className}>{children}</div>
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Content = CardContent

export default Card
