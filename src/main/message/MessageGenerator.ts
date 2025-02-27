import OpenAI from 'openai';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SettingsManager } from '../settings/SettingsManager';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description: string | null;
  location: string | null;
}

interface MessageCache {
  timestamp: number;
  message: string;
}

export class MessageGenerator {
  private static instance: MessageGenerator;
  private cache: Map<string, MessageCache>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分
  private openai: OpenAI | null = null;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): MessageGenerator {
    if (!MessageGenerator.instance) {
      MessageGenerator.instance = new MessageGenerator();
    }
    return MessageGenerator.instance;
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      const settingsManager = SettingsManager.getInstance();
      const apiKey = settingsManager.getApiKey();
      if (!apiKey) {
        throw new Error('APIキーが設定されていません');
      }
      this.openai = new OpenAI({
        apiKey: apiKey
      });
    }
    return this.openai;
  }

  private formatEvents(events: CalendarEvent[]): string {
    return events.map(event => {
      const startTime = format(event.start, 'HH:mm');
      const endTime = format(event.end, 'HH:mm');
      const location = event.location ? `（場所: ${event.location}）` : '';
      return `・${startTime}～${endTime} ${event.title} ${location}`;
    }).join('\n');
  }

  private getCacheKey(date: Date, type: 'past' | 'present' | 'future'): string {
    const dateStr = format(date, 'yyyy-MM-dd');
    return `${dateStr}:${type}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private async generateMessage(events: CalendarEvent[], date: Date, type: 'past' | 'present' | 'future'): Promise<string> {
    const formattedDate = format(date, 'M月d日(eee)', { locale: ja });
    const formattedEvents = events.length > 0 ? this.formatEvents(events) : '予定なし';

    const prompts = {
      past: `
以下の予定について、ツンデレな幼馴染の女の子として300文字以上で解説してください。
予定は昨日のものなので、実施済みという前提で、相手（あんた）の対応についてツッコミを入れたり、
褒めたり、怒ったりしながら解説してください。
幼馴染らしく、相手のことを「あんた」と呼び、親しみがありながらもツンツンした態度で接してください。

${formattedDate}の予定：
${formattedEvents}
`,
      present: `
以下の予定について、ツンデレな幼馴染の女の子として300文字以上で解説してください。
予定は本日のものなので、実施前または実施中という前提で、相手（あんた）に対して
準備を催促したり、心配したり、応援したりしながら解説してください。
幼馴染らしく、相手のことを「あんた」と呼び、親しみがありながらもツンツンした態度で接してください。

${formattedDate}の予定：
${formattedEvents}
`,
      future: `
以下の予定について、ツンデレな幼馴染の女の子として300文字以上で解説してください。
予定は明日のものなので、事前準備が必要という前提で、相手（あんた）に対して
アドバイスしたり、警告したり、心配したりしながら解説してください。
幼馴染らしく、相手のことを「あんた」と呼び、親しみがありながらもツンツンした態度で接してください。

${formattedDate}の予定：
${formattedEvents}
`
    };

    try {
      const response = await this.getOpenAI().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompts[type]
        }],
        temperature: 0.8,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || 'メッセージの生成に失敗しました...';
    } catch (error) {
      console.error('メッセージ生成エラー:', error);
      throw error;
    }
  }

  public async getMessage(events: CalendarEvent[], date: Date, type: 'past' | 'present' | 'future'): Promise<string> {
    const cacheKey = this.getCacheKey(date, type);

    // キャッシュが有効な場合はキャッシュから返す
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.message;
    }

    // 新しいメッセージを生成
    const message = await this.generateMessage(events, date, type);
    
    // キャッシュを更新
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      message
    });

    return message;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}