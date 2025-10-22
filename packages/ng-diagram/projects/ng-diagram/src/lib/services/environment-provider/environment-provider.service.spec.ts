import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentProviderService } from './environment-provider.service';

describe('EnvironmentProviderService', () => {
  let service: EnvironmentProviderService;
  const spyUserAgent = (userAgent: string) => vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnvironmentProviderService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OS detection', () => {
    const testCases = [
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        expected: 'MacOS',
      },
      {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        expected: 'iOS',
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        expected: 'Windows',
      },
      {
        userAgent:
          'Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 OPR/63.3.3216.58675',
        expected: 'Android',
      },
      {
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        expected: 'Linux',
      },
    ];

    it.each(testCases)(`Should detect %s`, ({ userAgent, expected }) => {
      spyUserAgent(userAgent);
      expect(service.os).toBe(expected);
    });
  });

  describe('Browser detection', () => {
    const testCases = [
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 OPR/119.0.0.0',
        expected: 'Opera',
      },
      {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.3240.50',
        expected: 'Edge',
      },
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        expected: 'Chrome',
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        expected: 'Firefox',
      },
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        expected: 'Safari',
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
        expected: 'IE',
      },
      {
        userAgent: 'SomeUnknownBrowser/1.0',
        expected: 'Unknown',
      },
    ];

    it.each(testCases)(`Should detect %s`, ({ userAgent, expected }) => {
      spyUserAgent(userAgent);
      expect(service.browser).toBe(expected);
    });
  });

  describe('SSR behavior (isClient = false)', () => {
    it('should set runtime to node and os/browser to null in SSR', () => {
      vi.spyOn(EnvironmentProviderService.prototype, 'isClient', 'get').mockReturnValue(false);

      const ssrService = new EnvironmentProviderService();
      expect(ssrService.runtime).toBe('node');
      expect(ssrService.os).toBe(null);
      expect(ssrService.browser).toBe(null);
    });

    it('now() should use Date.now in SSR', () => {
      vi.spyOn(EnvironmentProviderService.prototype, 'isClient', 'get').mockReturnValue(false);
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(987654321);

      const ssrService = new EnvironmentProviderService();
      const value = ssrService.now();

      expect(mockDateNow).toHaveBeenCalled();
      expect(value).toBe(987654321);
    });

    it('generateId() should fallback to timestamp-based in SSR', () => {
      vi.spyOn(EnvironmentProviderService.prototype, 'isClient', 'get').mockReturnValue(false);
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890);
      const mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

      const ssrService = new EnvironmentProviderService();
      const id = ssrService.generateId();

      expect(mockDateNow).toHaveBeenCalled();
      expect(mockMathRandom).toHaveBeenCalled();
      expect(id).toMatch(/^1234567890-[a-z0-9]+$/);
    });
  });

  describe('now() method', () => {
    it('should return a number', () => {
      const result = service.now();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should return different values on subsequent calls', () => {
      const result1 = service.now();
      const result2 = service.now();
      expect(result2).toBeGreaterThanOrEqual(result1);
    });
  });

  describe('generateId() method', () => {
    it('should return a string', () => {
      const result = service.generateId();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return unique values on subsequent calls', () => {
      const result1 = service.generateId();
      const result2 = service.generateId();
      expect(result1).not.toBe(result2);
    });

    it('should return values with expected format', () => {
      const result = service.generateId();
      // Should be either a UUID format (from crypto.randomUUID) or timestamp-based format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result);
      const isTimestampBased = /^\d+-[a-z0-9]+$/.test(result);
      expect(isUUID || isTimestampBased).toBe(true);
    });
  });
});
