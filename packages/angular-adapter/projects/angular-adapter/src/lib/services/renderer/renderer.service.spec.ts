import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RendererService } from './renderer.service';

describe('RendererService', () => {
  let service: RendererService;

  beforeEach(() => {
    service = TestBed.inject(RendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('draw', () => {
    it('should accept nodes, edges and viewport data', () => {
      expect(() => {
        service.draw();
      }).not.toThrow();
    });
  });
});
