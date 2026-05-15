import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App Error:', error, info)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', gap: '16px', fontFamily: 'DM Sans'
        }}>
          <h2 style={{ color: '#1D3E61' }}>Une erreur est survenue</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{ background: '#81C063', color: 'white', 
              border: 'none', padding: '12px 24px', 
              borderRadius: '8px', cursor: 'pointer' }}
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
