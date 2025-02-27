import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { GoogleAuthManager } from './auth/GoogleAuthManager';
import { SettingsManager } from './settings/SettingsManager';

// メインウィンドウの参照をグローバルに保持
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'TSUNDERE-CALENDAR'
  });

  // 開発時はローカルサーバー、本番時はビルドされたファイルを読み込む
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electronの初期化が完了したらウィンドウを作成
app.whenReady().then(createWindow);

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーションがアクティブになったときの処理（macOS）
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC通信のハンドラー設定
ipcMain.handle('auth:google', async () => {
  try {
    const authManager = GoogleAuthManager.getInstance();
    await authManager.authenticate();
    return { success: true };
  } catch (error) {
    console.error('Google認証エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '認証に失敗しました'
    };
  }
});

ipcMain.handle('auth:check', async () => {
  try {
    const authManager = GoogleAuthManager.getInstance();
    return {
      isAuthenticated: authManager.isAuthenticated()
    };
  } catch (error) {
    console.error('認証状態確認エラー:', error);
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : '認証状態の確認に失敗しました'
    };
  }
});

ipcMain.handle('auth:logout', async () => {
  try {
    const authManager = GoogleAuthManager.getInstance();
    authManager.logout();
    return { success: true };
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ログアウトに失敗しました'
    };
  }
});

// 設定関連のIPC通信ハンドラー
ipcMain.handle('settings:get-api-key', async () => {
  try {
    const settingsManager = SettingsManager.getInstance();
    const apiKey = settingsManager.getApiKey();
    return { success: true, apiKey };
  } catch (error) {
    console.error('APIキー取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'APIキーの取得に失敗しました'
    };
  }
});

ipcMain.handle('settings:test-api-key', async (_, apiKey: string) => {
  try {
    const settingsManager = SettingsManager.getInstance();
    return await settingsManager.testApiKey(apiKey);
  } catch (error) {
    console.error('APIキーテストエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'APIキーのテストに失敗しました'
    };
  }
});

ipcMain.handle('settings:save-api-key', async (_, apiKey: string) => {
  try {
    const settingsManager = SettingsManager.getInstance();
    settingsManager.setApiKey(apiKey);
    return { success: true };
  } catch (error) {
    console.error('APIキー保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'APIキーの保存に失敗しました'
    };
  }
});

ipcMain.handle('calendar:get-events', async (_, date: string) => {
  // カレンダーイベント取得の実装（後で追加）
  return [];
});