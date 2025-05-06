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
    it('should set the nodes signal and edges signal to the provided nodes and edges', () => {
      service.draw(
        [{ id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {} }],
        [{ id: '1', source: '1', target: '2', data: {} }]
      );

      expect(service.nodes()).toEqual([{ id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {} }]);
      expect(service.edges()).toEqual([{ id: '1', source: '1', target: '2', data: {} }]);
    });
  });
});
