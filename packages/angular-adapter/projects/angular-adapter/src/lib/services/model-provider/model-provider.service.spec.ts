import { TestBed } from '@angular/core/testing';
import { ModelAdapter } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ModelProviderService } from './model-provider.service';

describe('ModelProviderService', () => {
  let service: ModelProviderService;
  const mockModel: ModelAdapter = {
    getNodes: vi.fn(),
    getEdges: vi.fn(),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    getMetadata: vi.fn(),
    setMetadata: vi.fn(),
    onChange: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  };

  beforeEach(() => {
    service = TestBed.inject(ModelProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should set the model', () => {
      service.init(mockModel);

      expect(service.provide()).toBe(mockModel);
    });
  });

  describe('provide', () => {
    it('should throw error when model is not initialized', () => {
      expect(() => service.provide()).toThrow('ModelAdapter not initialized');
    });

    it('should return model when initialized', () => {
      service.init(mockModel);

      expect(service.provide()).toBe(mockModel);
    });
  });
});
