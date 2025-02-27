import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthManager } from '../auth/GoogleAuthManager';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string | null;
  location: string | null;
}

interface CacheEntry {
  timestamp: number;
  events: CalendarEvent[];
}

export class CalendarManager {
  private static instance: CalendarManager;
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CalendarManager {
    if (!CalendarManager.instance) {
      CalendarManager.instance = new CalendarManager();
    }
    return CalendarManager.instance;
  }

  private async getAuthClient(): Promise<OAuth2Client> {
    const authManager = GoogleAuthManager.getInstance();
    return await authManager.getAuthenticatedClient();
  }

  private isCacheValid(date: string): boolean {
    const cached = this.cache.get(date);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private async fetchEventsFromGoogle(date: Date): Promise<CalendarEvent[]> {
    const auth = await this.getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay(date).toISOString(),
        timeMax: endOfDay(date).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return (response.data.items || []).map(event => ({
        id: event.id!,
        title: event.summary || '(タイトルなし)',
        start: new Date(event.start?.dateTime || event.start?.date!),
        end: new Date(event.end?.dateTime || event.end?.date!),
        description: event.description || null,
        location: event.location || null
      }));
    } catch (error) {
      console.error('カレンダーイベント取得エラー:', error);
      throw error;
    }
  }

  public async getEvents(date: Date): Promise<CalendarEvent[]> {
    const dateStr = format(date, 'yyyy-MM-dd');

    // キャッシュが有効な場合はキャッシュから返す
    if (this.isCacheValid(dateStr)) {
      return this.cache.get(dateStr)!.events;
    }

    // 新しいデータを取得
    const events = await this.fetchEventsFromGoogle(date);
    
    // キャッシュを更新
    this.cache.set(dateStr, {
      timestamp: Date.now(),
      events
    });

    // 前後の日付のデータを非同期でプリフェッチ
    this.prefetchAdjacentDays(date);

    return events;
  }

  private async prefetchAdjacentDays(date: Date): Promise<void> {
    const yesterday = addDays(date, -1);
    const tomorrow = addDays(date, 1);
    const dates = [yesterday, tomorrow];

    for (const d of dates) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (!this.isCacheValid(dateStr)) {
        try {
          const events = await this.fetchEventsFromGoogle(d);
          this.cache.set(dateStr, {
            timestamp: Date.now(),
            events
          });
        } catch (error) {
          console.error(`プリフェッチエラー (${dateStr}):`, error);
        }
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}