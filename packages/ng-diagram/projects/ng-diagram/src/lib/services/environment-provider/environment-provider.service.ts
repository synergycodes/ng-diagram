import { Injectable } from '@angular/core';
import type { EnvironmentInfo } from '../../../core/src';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentProviderService implements EnvironmentInfo {
  get os(): EnvironmentInfo['os'] | null {
    return this.detectOS();
  }

  get browser(): EnvironmentInfo['browser'] | null {
    return this.detectBrowser();
  }

  get runtime(): EnvironmentInfo['runtime'] {
    return this.isClient ? 'web' : 'node';
  }

  get isClient(): boolean {
    return this.checkIfClient();
  }

  private detectOS(): EnvironmentInfo['os'] {
    if (!this.isClient) return null;

    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Mac/.test(ua)) return 'MacOS';
    if (/Win/.test(ua)) return 'Windows';
    if (/Android/.test(ua)) return 'Android';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Other';
  }

  private detectBrowser(): EnvironmentInfo['browser'] {
    if (!this.isClient) return null;

    const ua = window.navigator.userAgent;

    if (/OPR/.test(ua)) return 'Opera';
    if (/Edge|Edg/.test(ua)) return 'Edge';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    if (/Trident/.test(ua)) return 'IE';

    return 'Unknown';
  }

  private checkIfClient(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  public now(): number {
    return this.isClient ? performance.now() : Date.now();
  }

  public generateId(): string {
    const hasCrypto = this.isClient && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';

    return hasCrypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
