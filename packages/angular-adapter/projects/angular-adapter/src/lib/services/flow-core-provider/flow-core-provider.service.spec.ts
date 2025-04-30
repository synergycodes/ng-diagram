import { TestBed } from '@angular/core/testing';
import { FlowCore, ModelAdapter } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelProviderService } from '../model-provider/model-provider.service';
import { FlowCoreProviderService } from './flow-core-provider.service';

describe('FlowCoreProviderService', () => {
  let service: FlowCoreProviderService;

  beforeEach(() => {
    service = TestBed.inject(FlowCoreProviderService);
    vi.spyOn(TestBed.inject(ModelProviderService), 'provide').mockReturnValue({} as unknown as ModelAdapter);
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
