import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui', background: '#f8fafc' }}>
          <div style={{ maxWidth: 760, width: '100%', padding: 24, borderRadius: 16, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15,23,42,.08)' }}>
            <h1 style={{ margin: 0, color: '#0f172a' }}>BhoomiIntel could not render</h1>
            <p style={{ color: '#475569' }}>A frontend runtime error occurred. Check the browser console for details.</p>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c', background: '#fef2f2', padding: 12, borderRadius: 10, overflow: 'auto' }}>{this.state.error?.message}</pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, border: 0, background: '#0f172a', color: 'white', cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
