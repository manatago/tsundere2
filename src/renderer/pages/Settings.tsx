import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Header } from '../components/layout/Header';
import { MessageBubble } from '../components/common/MessageBubble';
import { Dialog } from '../components/common/Dialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const result = await ipcRenderer.invoke('settings:get-api-key');
        if (result.success) {
          setApiKey(result.apiKey || '');
        }
      } catch (err) {
        setError('設定の読み込みに失敗しました');
      }
    };
    loadApiKey();
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setError('APIキーを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await ipcRenderer.invoke('settings:test-api-key', apiKey);
      if (result.success) {
        setTestResult(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('テストに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('APIキーを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ipcRenderer.invoke('settings:save-api-key', apiKey);
      if (result.success) {
        setHasUnsavedChanges(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowDialog(true);
    } else {
      onBack();
    }
  };

  return (
    <div style={styles.container}>
      <Header
        title="設定"
        showBack
        onBack={handleBackClick}
      />
      <main style={styles.main}>
        <div style={styles.section}>
          <label style={styles.label}>
            APIキー
            <input
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              style={styles.input}
              placeholder="sk-..."
              spellCheck={false}
            />
          </label>
        </div>

        <div style={styles.section}>
          <div style={styles.buttonGroup}>
            <button
              onClick={handleTest}
              style={styles.button}
              disabled={isLoading || !apiKey.trim()}
            >
              テスト実行
            </button>
            <button
              onClick={handleSave}
              style={{ ...styles.button, ...styles.primaryButton }}
              disabled={isLoading || !apiKey.trim() || !hasUnsavedChanges}
            >
              保存
            </button>
          </div>
        </div>

        {testResult && (
          <div style={styles.section}>
            <MessageBubble
              text={testResult}
              type="character"
              timestamp={Date.now()}
            />
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
      </main>

      <LoadingSpinner
        isVisible={isLoading}
        text="APIキーをテスト中..."
      />

      <Dialog
        isOpen={showDialog}
        title="変更が保存されていません"
        message="変更を破棄して戻りますか？"
        onConfirm={onBack}
        onCancel={() => setShowDialog(false)}
      />
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const
  },
  main: {
    flex: 1,
    padding: '20px',
    maxWidth: '800px',  // 最大幅を設定
    margin: '0 auto',   // 中央寄せ
    width: '100%'       // 幅いっぱいに
  },
  section: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#666',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',  // パディングを増やす
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px',  // フォントサイズを大きく
    marginTop: '8px',
    fontFamily: 'monospace',  // 等幅フォント
    letterSpacing: '0.5px'    // 文字間隔を調整
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '10px 20px',  // ボタンのサイズを大きく
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    transition: 'background-color 0.2s',
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  error: {
    color: '#dc3545',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    marginTop: '10px',
    fontSize: '14px'
  }
};