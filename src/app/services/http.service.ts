import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';


@Injectable({ providedIn: 'root' })
export class HttpService {
  async getText(url: string, headers: Record<string, string> = {}): Promise<string> {
    const res: HttpResponse = await CapacitorHttp.get({
      url,
      headers: { 'User-Agent': 'BenApp/1.0 (+app)', ...headers },
      responseType: 'text',
      connectTimeout: 20000,
      readTimeout: 20000,
    });
    this.assertOk(res, url);
    return this.asText(res.data);
  }

  async getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    const res: HttpResponse = await CapacitorHttp.get({
      url,
      headers: { Accept: 'application/json', ...headers },
      connectTimeout: 20000,
      readTimeout: 20000,
    });
    this.assertOk(res, url);
    return (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as T;
  }

  async postForm(url: string, body: string, headers: Record<string, string> = {}): Promise<string> {
    const res: HttpResponse = await CapacitorHttp.post({
      url,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
      data: body,
      responseType: 'text',
      connectTimeout: 30000,
      readTimeout: 30000,
    });
    this.assertOk(res, url);
    return this.asText(res.data);
  }

  private assertOk(res: HttpResponse, url: string): void {
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status} pro ${url}`);
    }
  }

  private asText(data: unknown): string {
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}
