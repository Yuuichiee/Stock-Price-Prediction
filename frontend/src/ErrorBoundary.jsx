import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#f87171', backgroundColor: '#050812', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' }}>Module Evaluation Failed</h2>
          <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.5rem', overflow: 'auto', border: '1px solid #334155' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem', color: '#fca5a5' }}>
              {this.state.error?.toString() || "Unknown Error"}
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.9, color: '#e2e8f0', fontSize: '0.9rem' }}>
              {this.state.errorInfo?.componentStack || this.state.error?.stack || "No stack trace available"}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
