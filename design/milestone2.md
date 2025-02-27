# マイルストーン2: ChatGPT APIキー設定機能の設計

## 1. 機能要件

### 1.1 基本機能
- アプリケーション全体で1つのChatGPT APIキーを管理
- APIキーのバリデーション機能
- APIキーの設定状態の確認機能
- レートリミット制御機能（固定値: 20リクエスト/分）

### 1.2 UI/UX
- ホーム画面のヘッダー部分に設定ページへのリンク（ギアアイコン）を配置
- 設定ページの実装（別ページとして）
  - APIキー入力フォーム
  - テスト実行ボタン（ローディング表示付き）
  - 保存ボタン
  - 設定状態の表示
  - ホームに戻るボタン（未保存時は確認ダイアログ表示）
- LINEライクな吹き出しでのメッセージ表示

## 2. 技術設計

### 2.1 データ構造
```typescript
interface ChatGPTConfig {
  apiKey: string;
  lastValidated: number;      // タイムスタンプ
  isValid: boolean;
  rateLimit: {
    maxRequests: number;      // 固定値: 20
    timeWindow: number;       // 60000ミリ秒（1分）
    remaining: number;
    resetTime: number;
  };
}

interface ValidationResponse {
  message: string;
  isValid: boolean;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

interface MessageBubble {
  text: string;
  type: 'character' | 'system';
  timestamp: number;
}

interface UnsavedChanges {
  hasChanges: boolean;
  originalKey: string;
}
```

## 3. 画面遷移と状態管理

### 3.1 画面遷移
```
ホーム画面 → 設定画面
  ↑          ↓
  └──確認ダイアログ（未保存時）
```

### 3.2 状態
```typescript
interface SettingsState {
  apiKey: string;
  isLoading: boolean;        // テスト実行中
  testResult: string | null;
  hasUnsavedChanges: boolean;
  validationError: string | null;
}
```

## 4. UI コンポーネント

### 4.1 SettingsPage
```tsx
<div className="settings-page">
  <header>
    <BackButton onBack={handleBack} />
    <h1>設定</h1>
  </header>
  
  <main>
    <APIKeyForm
      value={apiKey}
      onChange={handleChange}
      onTest={handleTest}
      isLoading={isLoading}
    />
    
    {testResult && (
      <MessageBubble
        text={testResult}
        type="character"
      />
    )}
    
    <div className="rate-limit-info">
      制限: 20リクエスト/分
    </div>
    
    <button 
      onClick={handleSave}
      disabled={isLoading}
    >
      保存
    </button>
  </main>
</div>
```

### 4.2 確認ダイアログ
```tsx
<Dialog
  isOpen={showDialog}
  title="変更が保存されていません"
  message="変更を破棄して戻りますか？"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### 4.3 ローディング表示
```tsx
<LoadingSpinner
  isVisible={isLoading}
  text="APIキーをテスト中..."
/>
```

## 5. エラーハンドリング

### 5.1 バリデーションエラー
- 無効なAPIキー形式
- 認証失敗
- ネットワークエラー
- レートリミット超過

### 5.2 ユーザー操作エラー
- 未保存の変更がある状態での画面遷移
- テスト実行中の操作制限

## 6. セキュリティ

### 6.1 APIキー管理
- 暗号化保存
- メモリ上での安全な取り扱い
- エラー時の情報漏洩防止

### 6.2 レートリミット
- 固定値（20req/min）での制限
- 超過時の適切なエラーメッセージ
- リクエストのキューイング

## 7. テスト実行フロー

1. テストボタンクリック
2. ローディング表示開始
3. APIキーバリデーション
4. OpenAI APIテスト実行
5. 結果を吹き出しで表示
6. ローディング表示終了

## 8. 変更管理フロー

1. APIキー変更検知
2. 未保存状態をマーク
3. 画面遷移時に確認ダイアログ表示
4. 保存または破棄の選択