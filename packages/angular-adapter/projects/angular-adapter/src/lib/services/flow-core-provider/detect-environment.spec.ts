import { describe, expect, it, vi } from 'vitest';
import { detectEnvironment } from './detect-environment';

describe('detectEnvironment', () => {
  describe('OS detection', () => {
    it('should detect MacOS', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ os: 'MacOS' }));
    });

    it('should detect iOS', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ os: 'iOS' }));
    });

    it('should detect Windows', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ os: 'Windows' }));
    });

    it('should detect Android', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 OPR/63.3.3216.58675'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ os: 'Android' }));
    });

    it('should detect Linux', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ os: 'Linux' }));
    });
  });

  describe('Browser detection', () => {
    it('should detect Opera', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 OPR/119.0.0.0'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ browser: 'Opera' }));
    });

    it('should detect Edge', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.3240.50'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ browser: 'Edge' }));
    });

    it('should detect Chrome', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ browser: 'Chrome' }));
    });

    it('should detect Firefox', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ browser: 'Firefox' }));
    });

    it('should detect Safari', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ browser: 'Safari' }));
    });

    it('should detect IE', () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko'
      );

      expect(detectEnvironment()).toEqual(expect.objectContaining({ browser: 'IE' }));
    });
  });
});
