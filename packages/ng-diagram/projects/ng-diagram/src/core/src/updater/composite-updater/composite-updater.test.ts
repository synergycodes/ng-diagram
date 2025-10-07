import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEdgeLabel, mockPort } from '../../test-utils';
import { InitUpdater } from '../init-updater/init-updater';
import { InternalUpdater } from '../internal-updater/internal-updater';
import { CompositeUpdater } from './composite-updater';

describe('CompositeUpdater', () => {
  let initUpdater: InitUpdater;
  let internalUpdater: InternalUpdater;
  let compositeUpdater: CompositeUpdater;

  beforeEach(() => {
    initUpdater = {
      applyNodeSize: vi.fn(),
      addPort: vi.fn(),
      applyPortsSizesAndPositions: vi.fn(),
      addEdgeLabel: vi.fn(),
      applyEdgeLabelSize: vi.fn(),
      isNodeSizeInitializerFinished: vi.fn(),
      isPortInitializerFinished: vi.fn(),
      isPortRectInitializerFinished: vi.fn(),
      isEdgeLabelInitializerFinished: vi.fn(),
      isEdgeLabelSizeInitializerFinished: vi.fn(),
    } as unknown as InitUpdater;

    internalUpdater = {
      applyNodeSize: vi.fn(),
      addPort: vi.fn(),
      applyPortsSizesAndPositions: vi.fn(),
      addEdgeLabel: vi.fn(),
      applyEdgeLabelSize: vi.fn(),
    } as unknown as InternalUpdater;

    compositeUpdater = new CompositeUpdater(initUpdater, internalUpdater);
  });

  describe('applyNodeSize', () => {
    it('should route to initUpdater when node size initializer is not finished', () => {
      vi.mocked(initUpdater.isNodeSizeInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyNodeSize).mockReturnValue(true);
      const size = { width: 100, height: 100 };

      const result = compositeUpdater.applyNodeSize('node-1', size);

      expect(result).toBe(true);
      expect(initUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
      expect(internalUpdater.applyNodeSize).not.toHaveBeenCalled();
    });

    it('should route to internalUpdater when node size initializer is finished', () => {
      vi.mocked(initUpdater.isNodeSizeInitializerFinished).mockReturnValue(true);
      vi.mocked(internalUpdater.applyNodeSize).mockReturnValue(true);
      const size = { width: 100, height: 100 };

      const result = compositeUpdater.applyNodeSize('node-1', size);

      expect(result).toBe(true);
      expect(internalUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
      expect(initUpdater.applyNodeSize).not.toHaveBeenCalled();
    });

    it('should retry with internalUpdater if initUpdater rejects', () => {
      vi.mocked(initUpdater.isNodeSizeInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyNodeSize).mockReturnValue(false); // Rejected
      vi.mocked(internalUpdater.applyNodeSize).mockReturnValue(true);
      const size = { width: 100, height: 100 };

      const result = compositeUpdater.applyNodeSize('node-1', size);

      expect(result).toBe(true);
      expect(initUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
      expect(internalUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
    });
  });

  describe('addPort', () => {
    it('should route to initUpdater when port initializer is not finished', () => {
      vi.mocked(initUpdater.isPortInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.addPort).mockReturnValue(true);

      const result = compositeUpdater.addPort('node-1', mockPort);

      expect(result).toBe(true);
      expect(initUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(internalUpdater.addPort).not.toHaveBeenCalled();
    });

    it('should route to internalUpdater when port initializer is finished', () => {
      vi.mocked(initUpdater.isPortInitializerFinished).mockReturnValue(true);
      vi.mocked(internalUpdater.addPort).mockReturnValue(true);

      const result = compositeUpdater.addPort('node-1', mockPort);

      expect(result).toBe(true);
      expect(internalUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(initUpdater.addPort).not.toHaveBeenCalled();
    });

    it('should retry with internalUpdater if initUpdater rejects', () => {
      vi.mocked(initUpdater.isPortInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.addPort).mockReturnValue(false);
      vi.mocked(internalUpdater.addPort).mockReturnValue(true);

      const result = compositeUpdater.addPort('node-1', mockPort);

      expect(result).toBe(true);
      expect(initUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(internalUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
    });
  });

  describe('applyPortsSizesAndPositions', () => {
    const ports = [{ id: 'port-1', size: { width: 100, height: 100 }, position: { x: 0, y: 0 } }];

    it('should route to initUpdater when port rect initializer is not finished', () => {
      vi.mocked(initUpdater.isPortRectInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyPortsSizesAndPositions).mockReturnValue(true);

      const result = compositeUpdater.applyPortsSizesAndPositions('node-1', ports);

      expect(result).toBe(true);
      expect(initUpdater.applyPortsSizesAndPositions).toHaveBeenCalledWith('node-1', ports);
      expect(internalUpdater.applyPortsSizesAndPositions).not.toHaveBeenCalled();
    });

    it('should route to internalUpdater when port rect initializer is finished', () => {
      vi.mocked(initUpdater.isPortRectInitializerFinished).mockReturnValue(true);
      vi.mocked(internalUpdater.applyPortsSizesAndPositions).mockReturnValue(true);

      const result = compositeUpdater.applyPortsSizesAndPositions('node-1', ports);

      expect(result).toBe(true);
      expect(internalUpdater.applyPortsSizesAndPositions).toHaveBeenCalledWith('node-1', ports);
      expect(initUpdater.applyPortsSizesAndPositions).not.toHaveBeenCalled();
    });

    it('should retry with internalUpdater if initUpdater rejects', () => {
      vi.mocked(initUpdater.isPortRectInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyPortsSizesAndPositions).mockReturnValue(false);
      vi.mocked(internalUpdater.applyPortsSizesAndPositions).mockReturnValue(true);

      const result = compositeUpdater.applyPortsSizesAndPositions('node-1', ports);

      expect(result).toBe(true);
      expect(initUpdater.applyPortsSizesAndPositions).toHaveBeenCalledWith('node-1', ports);
      expect(internalUpdater.applyPortsSizesAndPositions).toHaveBeenCalledWith('node-1', ports);
    });
  });

  describe('addEdgeLabel', () => {
    it('should route to initUpdater when edge label initializer is not finished', () => {
      vi.mocked(initUpdater.isEdgeLabelInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.addEdgeLabel).mockReturnValue(true);

      const result = compositeUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(result).toBe(true);
      expect(initUpdater.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
      expect(internalUpdater.addEdgeLabel).not.toHaveBeenCalled();
    });

    it('should route to internalUpdater when edge label initializer is finished', () => {
      vi.mocked(initUpdater.isEdgeLabelInitializerFinished).mockReturnValue(true);
      vi.mocked(internalUpdater.addEdgeLabel).mockReturnValue(true);

      const result = compositeUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(result).toBe(true);
      expect(internalUpdater.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
      expect(initUpdater.addEdgeLabel).not.toHaveBeenCalled();
    });

    it('should retry with internalUpdater if initUpdater rejects', () => {
      vi.mocked(initUpdater.isEdgeLabelInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.addEdgeLabel).mockReturnValue(false);
      vi.mocked(internalUpdater.addEdgeLabel).mockReturnValue(true);

      const result = compositeUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(result).toBe(true);
      expect(initUpdater.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
      expect(internalUpdater.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
    });
  });

  describe('applyEdgeLabelSize', () => {
    const size = { width: 100, height: 100 };

    it('should route to initUpdater when edge label size initializer is not finished', () => {
      vi.mocked(initUpdater.isEdgeLabelSizeInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyEdgeLabelSize).mockReturnValue(true);

      const result = compositeUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(result).toBe(true);
      expect(initUpdater.applyEdgeLabelSize).toHaveBeenCalledWith('edge-1', 'label-1', size);
      expect(internalUpdater.applyEdgeLabelSize).not.toHaveBeenCalled();
    });

    it('should route to internalUpdater when edge label size initializer is finished', () => {
      vi.mocked(initUpdater.isEdgeLabelSizeInitializerFinished).mockReturnValue(true);
      vi.mocked(internalUpdater.applyEdgeLabelSize).mockReturnValue(true);

      const result = compositeUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(result).toBe(true);
      expect(internalUpdater.applyEdgeLabelSize).toHaveBeenCalledWith('edge-1', 'label-1', size);
      expect(initUpdater.applyEdgeLabelSize).not.toHaveBeenCalled();
    });

    it('should retry with internalUpdater if initUpdater rejects', () => {
      vi.mocked(initUpdater.isEdgeLabelSizeInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyEdgeLabelSize).mockReturnValue(false);
      vi.mocked(internalUpdater.applyEdgeLabelSize).mockReturnValue(true);

      const result = compositeUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(result).toBe(true);
      expect(initUpdater.applyEdgeLabelSize).toHaveBeenCalledWith('edge-1', 'label-1', size);
      expect(internalUpdater.applyEdgeLabelSize).toHaveBeenCalledWith('edge-1', 'label-1', size);
    });
  });

  describe('mixed initialization states', () => {
    it('should route different operations to different updaters based on their state', () => {
      // Node size finished, but ports not finished
      vi.mocked(initUpdater.isNodeSizeInitializerFinished).mockReturnValue(true);
      vi.mocked(initUpdater.isPortInitializerFinished).mockReturnValue(false);
      vi.mocked(internalUpdater.applyNodeSize).mockReturnValue(true);
      vi.mocked(initUpdater.addPort).mockReturnValue(true);

      const size = { width: 100, height: 100 };
      compositeUpdater.applyNodeSize('node-1', size);
      compositeUpdater.addPort('node-1', mockPort);

      // Node size goes to internal, port goes to init
      expect(internalUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
      expect(initUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(initUpdater.applyNodeSize).not.toHaveBeenCalled();
      expect(internalUpdater.addPort).not.toHaveBeenCalled();
    });

    it('should handle all initializers finished', () => {
      // All finished
      vi.mocked(initUpdater.isNodeSizeInitializerFinished).mockReturnValue(true);
      vi.mocked(initUpdater.isPortInitializerFinished).mockReturnValue(true);
      vi.mocked(initUpdater.isPortRectInitializerFinished).mockReturnValue(true);
      vi.mocked(initUpdater.isEdgeLabelInitializerFinished).mockReturnValue(true);
      vi.mocked(initUpdater.isEdgeLabelSizeInitializerFinished).mockReturnValue(true);
      vi.mocked(internalUpdater.applyNodeSize).mockReturnValue(true);
      vi.mocked(internalUpdater.addPort).mockReturnValue(true);
      vi.mocked(internalUpdater.applyPortsSizesAndPositions).mockReturnValue(true);
      vi.mocked(internalUpdater.addEdgeLabel).mockReturnValue(true);
      vi.mocked(internalUpdater.applyEdgeLabelSize).mockReturnValue(true);

      const size = { width: 100, height: 100 };
      const ports = [{ id: 'port-1', size: { width: 100, height: 100 }, position: { x: 0, y: 0 } }];

      compositeUpdater.applyNodeSize('node-1', size);
      compositeUpdater.addPort('node-1', mockPort);
      compositeUpdater.applyPortsSizesAndPositions('node-1', ports);
      compositeUpdater.addEdgeLabel('edge-1', mockEdgeLabel);
      compositeUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      // All go to internal updater
      expect(internalUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
      expect(internalUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(internalUpdater.applyPortsSizesAndPositions).toHaveBeenCalledWith('node-1', ports);
      expect(internalUpdater.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
      expect(internalUpdater.applyEdgeLabelSize).toHaveBeenCalledWith('edge-1', 'label-1', size);

      // None go to init updater
      expect(initUpdater.applyNodeSize).not.toHaveBeenCalled();
      expect(initUpdater.addPort).not.toHaveBeenCalled();
      expect(initUpdater.applyPortsSizesAndPositions).not.toHaveBeenCalled();
      expect(initUpdater.addEdgeLabel).not.toHaveBeenCalled();
      expect(initUpdater.applyEdgeLabelSize).not.toHaveBeenCalled();
    });

    it('should handle no initializers finished', () => {
      // None finished
      vi.mocked(initUpdater.isNodeSizeInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.isPortInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.isPortRectInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.isEdgeLabelInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.isEdgeLabelSizeInitializerFinished).mockReturnValue(false);
      vi.mocked(initUpdater.applyNodeSize).mockReturnValue(true);
      vi.mocked(initUpdater.addPort).mockReturnValue(true);
      vi.mocked(initUpdater.applyPortsSizesAndPositions).mockReturnValue(true);
      vi.mocked(initUpdater.addEdgeLabel).mockReturnValue(true);
      vi.mocked(initUpdater.applyEdgeLabelSize).mockReturnValue(true);

      const size = { width: 100, height: 100 };
      const ports = [{ id: 'port-1', size: { width: 100, height: 100 }, position: { x: 0, y: 0 } }];

      compositeUpdater.applyNodeSize('node-1', size);
      compositeUpdater.addPort('node-1', mockPort);
      compositeUpdater.applyPortsSizesAndPositions('node-1', ports);
      compositeUpdater.addEdgeLabel('edge-1', mockEdgeLabel);
      compositeUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      // All go to init updater
      expect(initUpdater.applyNodeSize).toHaveBeenCalledWith('node-1', size);
      expect(initUpdater.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(initUpdater.applyPortsSizesAndPositions).toHaveBeenCalledWith('node-1', ports);
      expect(initUpdater.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
      expect(initUpdater.applyEdgeLabelSize).toHaveBeenCalledWith('edge-1', 'label-1', size);

      // None go to internal updater
      expect(internalUpdater.applyNodeSize).not.toHaveBeenCalled();
      expect(internalUpdater.addPort).not.toHaveBeenCalled();
      expect(internalUpdater.applyPortsSizesAndPositions).not.toHaveBeenCalled();
      expect(internalUpdater.addEdgeLabel).not.toHaveBeenCalled();
      expect(internalUpdater.applyEdgeLabelSize).not.toHaveBeenCalled();
    });
  });
});
