import { Component, ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UI渲染错误:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
          <div className="card max-w-lg w-full text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">页面出错了</h2>
            <p className="text-text-secondary mb-4">
              很抱歉，页面遇到了一些问题。您可以尝试刷新页面恢复。
            </p>
            {this.state.error && (
              <details className="text-left mb-4 p-3 bg-bg-primary rounded-lg border border-border-theme">
                <summary className="cursor-pointer text-sm text-text-secondary font-medium">
                  错误详情
                </summary>
                <pre className="mt-2 text-xs text-red-500 overflow-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary"
              >
                刷新页面
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-outline"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
