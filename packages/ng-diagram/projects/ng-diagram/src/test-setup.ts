import '@analogjs/vitest-angular/setup-zone';

import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { vi } from 'vitest';
import './core/src/set.polyfill';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
