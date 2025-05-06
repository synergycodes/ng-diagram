import { TestBed } from '@angular/core/testing';
import { FlowCore, ModelAdapter } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelProviderService } from '../model-provider/model-provider.service';
import { detectEnvironment } from './detect-environment';
import { FlowCoreProviderService } from './flow-core-provider.service';

vi.mock('./detect-environment');

describe('FlowCoreProviderService', () => {
  let service: FlowCoreProviderService;

  beforeEach(() => {
    const mockModelAdapter: ModelAdapter = {
      getNodes: vi.fn().mockReturnValue([]),
      getEdges: vi.fn().mockReturnValue([]),
      getMetadata: vi.fn().mockReturnValue({ viewport: { x: 0, y: 0, width: 100, height: 100 } }),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      setMetadata: vi.fn(),
      onChange: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    };
    service = TestBed.inject(FlowCoreProviderService);
    vi.spyOn(TestBed.inject(ModelProviderService), 'provide').mockReturnValue(mockModelAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should create new FlowCore instance', () => {
      service.init();

      expect(service.provide()).toBeInstanceOf(FlowCore);
    });

    it('should call provide method on ModelProviderService', () => {
      const spy = vi.spyOn(TestBed.inject(ModelProviderService), 'provide');

      service.init();

      expect(spy).toHaveBeenCalled();
    });

    it('should call detectEnvironment method', () => {
      service.init();

      expect(detectEnvironment).toHaveBeenCalled();
    });
  });

  describe('provide', () => {
    it('should throw error when FlowCore is not initialized', () => {
      expect(() => service.provide()).toThrow('FlowCore not initialized');
    });

    it('should return FlowCore instance when initialized', () => {
      service.init();
      const flowCore = service.provide();
      expect(flowCore).toBeInstanceOf(FlowCore);
    });
  });
});
