import { TestBed } from '@angular/core/testing';
import { FlowCore, Metadata, Middleware, MiddlewaresConfigFromMiddlewares, ModelAdapter } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectEnvironment } from '../../utils/detect-environment';
import { InputEventsRouterService } from '../input-events/input-events-router.service';
import { RendererService } from '../renderer/renderer.service';
import { FlowCoreProviderService } from './flow-core-provider.service';

vi.mock('./detect-environment');

describe('FlowCoreProviderService', () => {
  const mockMiddlewares: [Middleware<'test'>] = [{ name: 'test', execute: vi.fn() }] as unknown as [Middleware<'test'>];
  const mockOffset = () => ({ x: 0, y: 0 });
  let service: FlowCoreProviderService<typeof mockMiddlewares>;

  const mockModelAdapter: ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<typeof mockMiddlewares>>> = {
    destroy: vi.fn(),
    getNodes: vi.fn().mockReturnValue([]),
    getEdges: vi.fn().mockReturnValue([]),
    getMetadata: vi.fn().mockReturnValue({ viewport: { x: 0, y: 0, scale: 1 }, middlewaresConfig: {} }),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    setMetadata: vi.fn(),
    onChange: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FlowCoreProviderService, RendererService, InputEventsRouterService],
    });
    service = TestBed.inject(FlowCoreProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should create new FlowCore instance', () => {
      service.init(mockModelAdapter, undefined, mockOffset);

      expect(service.provide()).toBeInstanceOf(FlowCore);
    });

    it('should call detectEnvironment method', () => {
      service.init(mockModelAdapter, undefined, mockOffset);

      expect(detectEnvironment).toHaveBeenCalled();
    });

    it('should initialize FlowCore with provided middlewares', () => {
      service.init(mockModelAdapter, mockMiddlewares, mockOffset);

      // Verify that FlowCore was created successfully with middlewares
      const flowCore = service.provide();
      expect(flowCore).toBeInstanceOf(FlowCore);
    });
  });

  describe('provide', () => {
    it('should throw error when FlowCore is not initialized', () => {
      expect(() => service.provide()).toThrow('FlowCore not initialized');
    });

    it('should return FlowCore instance when initialized', () => {
      service.init(mockModelAdapter, undefined, mockOffset);

      const flowCore = service.provide();

      expect(flowCore).toBeInstanceOf(FlowCore);
    });
  });
});
