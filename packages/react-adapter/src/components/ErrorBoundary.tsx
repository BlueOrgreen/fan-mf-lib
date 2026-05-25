import React from 'react'

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?:
    | React.ReactNode
    | ((error: Error, resetError: () => void) => React.ReactNode)
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo?: React.ErrorInfo | null
}

/**
 * 错误边界组件
 * 用于捕获子组件树中的错误，并显示降级 UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => <div onClick={reset}>Error: {error.message}</div>}
 *   onError={(error, info) => console.error(error, info)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    console.error(
      '[RemoteReloadUtils] ErrorBoundary caught error:',
      error,
      errorInfo,
    )
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset)
      }
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }
      // 默认降级 UI
      return (
        <div
          role="alert"
          className="p-4 border border-red-200 bg-red-50 rounded-lg"
        >
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-700">{this.state.error.message}</p>
          <button
            onClick={this.handleReset}
            type='button'
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
