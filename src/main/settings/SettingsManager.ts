import ElectronStore from 'electron-store';
import OpenAI from 'openai';
import crypto from 'crypto';

interface Settings {
  [key: string]: unknown;
  apiKey?: string;
  lastValidated?: number;
}

export class SettingsManager {
  private store: ElectronStore<Settings>;
  private static instance: SettingsManager;
  private readonly ENCRYPTION_KEY: string;
  private readonly ALGORITHM = 'aes-256-cbc';

  private constructor() {
    // 32バイトの暗号化キーを生成（本番環境では適切に管理する必要があります）
    this.ENCRYPTION_KEY = crypto
      .createHash('sha256')
      .update('your-secret-password')
      .digest('base64')
      .substr(0, 32);

    this.store = new ElectronStore<Settings>({
      name: 'settings',
      encryptionKey: this.ENCRYPTION_KEY
    });
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('暗号化エラー:', error);
      throw new Error('APIキーの暗号化に失敗しました');
    }
  }

  private decrypt(text: string): string {
    try {
      const [ivHex, encryptedText] = text.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('復号化エラー:', error);
      throw new Error('APIキーの復号化に失敗しました');
    }
  }

  public setApiKey(apiKey: string): void {
    try {
      const encrypted = this.encrypt(apiKey);
      this.store.set('apiKey', encrypted);
      this.store.set('lastValidated', Date.now());
    } catch (error) {
      console.error('APIキー保存エラー:', error);
      throw error;
    }
  }

  public getApiKey(): string | null {
    try {
      const encrypted = this.store.get('apiKey') as string | undefined;
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('APIキー取得エラー:', error);
      return null;
    }
  }

  public async testApiKey(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const openai = new OpenAI({
      apiKey: apiKey
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: "あなたはツンデレ女子です。ChatGPTのAPIキーが正しく動いているかの確認をしております。" +
                   "それをふまえて挨拶してください。５０文字以内程度の日本語でお願いします。"
        }],
        max_tokens: 100
      });

      if (response.choices[0]?.message?.content) {
        this.setApiKey(apiKey);
        return {
          success: true,
          message: response.choices[0].message.content
        };
      } else {
        return {
          success: false,
          error: 'APIからの応答が不正です'
        };
      }
    } catch (error: any) {
      console.error('OpenAI APIエラー:', error);
      return {
        success: false,
        error: error.message || 'APIキーのテストに失敗しました'
      };
    }
  }

  public clearSettings(): void {
    this.store.clear();
  }
}