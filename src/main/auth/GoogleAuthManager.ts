import { BrowserWindow, app } from 'electron';
import { google } from 'googleapis';
import ElectronStore from 'electron-store';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { AddressInfo } from 'net';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export class GoogleAuthManager {
  private oauth2Client: OAuth2Client;
  private store: ElectronStore;
  private static instance: GoogleAuthManager;
  private oauthConfig: any;

  private constructor() {
    const configPath = app.isPackaged
      ? path.join(process.resourcesPath, 'config/oauth.json')
      : path.join(__dirname, '../../../config/oauth.json');

    this.oauthConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')).google;

    this.oauth2Client = new google.auth.OAuth2(
      this.oauthConfig.clientId,
      this.oauthConfig.clientSecret,
      'http://127.0.0.1:0/oauth2callback'
    );

    this.store = new ElectronStore({
      name: 'auth',
      encryptionKey: 'your-encryption-key'
    });
  }

  public static getInstance(): GoogleAuthManager {
    if (!GoogleAuthManager.instance) {
      GoogleAuthManager.instance = new GoogleAuthManager();
    }
    return GoogleAuthManager.instance;
  }

  public logout(): void {
    this.store.delete('googleTokens');
    this.oauth2Client.revokeCredentials().catch(console.error);
    this.oauth2Client.credentials = {};
  }

  private async loadStoredCredentials(): Promise<TokenData | null> {
    try {
      const tokens = this.store.get('googleTokens') as TokenData | null;
      return tokens;
    } catch (error) {
      console.error('認証情報の読み込みエラー:', error);
      return null;
    }
  }

  private async saveCredentials(tokens: TokenData): Promise<void> {
    try {
      this.store.set('googleTokens', tokens);
    } catch (error) {
      console.error('認証情報の保存エラー:', error);
      throw error;
    }
  }

  private createLocalServer(): Promise<{ url: string; server: http.Server }> {
    return new Promise((resolve, reject) => {
      const server = http.createServer();
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as AddressInfo;
        const redirectUrl = `http://127.0.0.1:${port}/oauth2callback`;
        resolve({ url: redirectUrl, server });
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  }

  public async authenticate(): Promise<void> {
    let localServer: http.Server | null = null;

    try {
      const storedTokens = await this.loadStoredCredentials();
      if (storedTokens && storedTokens.expiry_date > Date.now()) {
        this.oauth2Client.setCredentials(storedTokens);
        return;
      }

      const { url: redirectUrl, server } = await this.createLocalServer();
      localServer = server;

      const tempOAuth2Client = new google.auth.OAuth2(
        this.oauthConfig.clientId,
        this.oauthConfig.clientSecret,
        redirectUrl
      );

      const authUrl = tempOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.oauthConfig.scopes
      });

      const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      return new Promise((resolve, reject) => {
        const handleAuthCallback = async (code: string) => {
          try {
            const { tokens } = await tempOAuth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            await this.saveCredentials(tokens as TokenData);
            win.close();
            resolve();
          } catch (error) {
            console.error('トークン取得エラー:', error);
            reject(error);
          } finally {
            if (localServer) {
              localServer.close();
            }
          }
        };

        server.on('request', async (req, res) => {
          if (req.url?.startsWith('/oauth2callback')) {
            const url = new URL(req.url, `http://127.0.0.1`);
            const code = url.searchParams.get('code');
            
            if (code) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('認証が完了しました。このウィンドウを閉じてください。');
              await handleAuthCallback(code);
            } else {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('認証コードが見つかりませんでした。');
              reject(new Error('認証コードが見つかりませんでした'));
            }
          }
        });

        win.loadURL(authUrl).catch(reject);

        win.on('closed', () => {
          if (localServer) {
            localServer.close();
          }
          reject(new Error('認証ウィンドウが閉じられました'));
        });
      });
    } catch (error) {
      if (localServer) {
        localServer.close();
      }
      console.error('認証プロセスエラー:', error);
      throw error;
    }
  }

  public async getAuthenticatedClient(): Promise<OAuth2Client> {
    await this.authenticate();
    return this.oauth2Client;
  }

  public isAuthenticated(): boolean {
    try {
      const tokens = this.store.get('googleTokens') as TokenData | null;
      return tokens !== null && tokens.expiry_date > Date.now();
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      return false;
    }
  }
}