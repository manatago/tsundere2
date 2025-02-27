import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Header } from './components/layout/Header';
import { Settings } from './pages/Settings';

type Page = 'home' | 'settings';
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [error, setError] = useState<string | null>(null);

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
        setCurrentPage('home');
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
    return <Settings onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div style={styles.container}>
      <Header
        title="TSUNDERE-CALENDAR"
        showSettings
        onSettingsClick={() => setCurrentPage('settings')}
      />
      <main style={styles.main}>
        <div style={styles.buttonContainer}>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            ログアウト
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </main>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f5f5f5'
  },
  main: {
    flex: 1,
    padding: '20px'
  },
  title: {
    fontSize: '2em',
    marginBottom: '10px',
    color: '#333',
    textAlign: 'center' as const
  },
  subtitle: {
    fontSize: '1.2em',
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center' as const
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  loginButton: {
    padding: '12px 24px',
    fontSize: '16px',
    background: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    color: '#dc3545',
    textAlign: 'center' as const,
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: 'rgba(220, 53, 69, 0.1)'
  }
};