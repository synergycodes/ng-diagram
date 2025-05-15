import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandHandler, Node } from '../../../types';
import { controlNodeSize } from '../control-node-size';

describe('controlNodeSize', () => {
  const mockNode: Node = {
    id: 'node-1',
    type: 'default',
    position: { x: 0, y: 0 },
    sizeControlled: false,
    data: {},
  };

  const mockCommandHandler: CommandHandler = {
    flowCore: {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    },
  } as unknown as CommandHandler;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update node sizeControlled property when node exists', () => {
    const nodes = [mockNode];
    (mockCommandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes });

    controlNodeSize(mockCommandHandler, {
      name: 'controlNodeSize',
      id: 'node-1',
      sizeControlled: true,
    });

    expect(mockCommandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodes: [{ ...mockNode, sizeControlled: true }],
      },
      'controlNodeSize'
    );
  });

  it('should not update when node does not exist', () => {
    const nodes = [mockNode];
    (mockCommandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes });

    controlNodeSize(mockCommandHandler, {
      name: 'controlNodeSize',
      id: 'non-existent-node',
      sizeControlled: true,
    });

    expect(mockCommandHandler.flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not update when sizeControlled value is the same', () => {
    const nodes = [{ ...mockNode, sizeControlled: true }];
    (mockCommandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes });

    controlNodeSize(mockCommandHandler, {
      name: 'controlNodeSize',
      id: 'node-1',
      sizeControlled: true,
    });

    expect(mockCommandHandler.flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should handle multiple nodes and update only the target node', () => {
    const nodes = [
      mockNode,
      { ...mockNode, id: 'node-2', sizeControlled: true },
      { ...mockNode, id: 'node-3', sizeControlled: false },
    ];
    (mockCommandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes });

    controlNodeSize(mockCommandHandler, {
      name: 'controlNodeSize',
      id: 'node-1',
      sizeControlled: true,
    });

    expect(mockCommandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodes: [
          { ...mockNode, sizeControlled: true },
          { ...mockNode, id: 'node-2', sizeControlled: true },
          { ...mockNode, id: 'node-3', sizeControlled: false },
        ],
      },
      'controlNodeSize'
    );
  });

  it('should preserve other node properties when updating', () => {
    const nodeWithExtraProps = {
      ...mockNode,
      data: { label: 'Test Node' },
      style: { backgroundColor: 'red' },
    };
    const nodes = [nodeWithExtraProps];
    (mockCommandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes });

    controlNodeSize(mockCommandHandler, {
      name: 'controlNodeSize',
      id: 'node-1',
      sizeControlled: true,
    });

    expect(mockCommandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodes: [{ ...nodeWithExtraProps, sizeControlled: true }],
      },
      'controlNodeSize'
    );
  });
});
