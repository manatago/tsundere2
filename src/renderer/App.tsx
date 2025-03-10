import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

type Page = 'home' | 'settings';
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [error, setError] = useState<string | null>(null);

  // ハッシュベースのルーティング
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'settings') {
        setCurrentPage('settings');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const result = await ipcRenderer.invoke('auth:google');
      if (result.success) {
        setAuthStatus('authenticated');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
      setAuthStatus('unauthenticated');
    }
  };

  const handleLogout = async () => {
    try {
      const result = await ipcRenderer.invoke('auth:logout');
      if (result.success) {
        setAuthStatus('unauthenticated');
        window.location.hash = '';
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAuthenticated } = await ipcRenderer.invoke('auth:check');
        setAuthStatus(isAuthenticated ? 'authenticated' : 'unauthenticated');
      } catch (err) {
        setError('認証状態の確認に失敗しました');
        setAuthStatus('unauthenticated');
      }
    };

    checkAuth();
  }, []);

  if (authStatus === 'loading') {
    return (
      <div style={styles.container}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>TSUNDERE-CALENDAR</h1>
        <p style={styles.subtitle}>あなたのスケジュールを可愛くお知らせします♪</p>
        <button
          onClick={handleGoogleLogin}
          style={styles.loginButton}
        >
          Googleでログイン
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  if (currentPage === 'settings') {
    return (
      <Settings
        onBack={() => {
          window.location.hash = '';
        }}
      />
    );
  }

  return <Home />;
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5'
  },
  title: {
    fontSize: '2em',
    marginBottom: '10px',
    color: '#333'
  },
  subtitle: {
    fontSize: '1.2em',
    color: '#666',
    marginBottom: '30px'
  },
  loginButton: {
    padding: '12px 24px',
    fontSize: '16px',
    background: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'background-color 0.3s ease'
  },
  error: {
    color: '#ff0000',
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    background: 'rgba(255,0,0,0.1)'
  }
};