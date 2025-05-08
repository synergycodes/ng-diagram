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
    it('should set the nodes, edges and viewport signals to the provided nodes, edges and viewport', () => {
      service.draw(
        [{ id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {} }],
        [{ id: '1', source: '1', target: '2', data: {} }],
        { viewport: { x: 200, y: 200, scale: 2 } }
      );

      expect(service.nodes()).toEqual([{ id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {} }]);
      expect(service.edges()).toEqual([{ id: '1', source: '1', target: '2', data: {} }]);
      expect(service.viewport()).toEqual({ x: 100, y: 100, scale: 2 });
    });
  });
});
