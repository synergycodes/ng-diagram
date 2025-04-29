import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../flow-core';
import { mockedEdge, mockedNode } from '../../test-utils';
import { CommandHandler } from '../../types/command-handler.interface';
import { deselectAll, select } from '../selection';

describe('Selection Commands', () => {
  let commandHandler: CommandHandler;

  beforeEach(() => {
    commandHandler = {
      flowCore: {
        getState: () => ({
          nodes: [mockedNode, { ...mockedNode, id: 'node2', selected: true }],
          edges: [mockedEdge, { ...mockedEdge, id: 'edge2' }],
          metadata: {},
        }),
        applyUpdate: vi.fn(),
      } as unknown as FlowCore,
    } as unknown as CommandHandler;
  });

  describe('select', () => {
    it('should call applyUpdate with the correctly selected nodes and edges', () => {
      select(commandHandler, { name: 'select', ids: ['node1', 'edge2'] });

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [
            { ...mockedNode, selected: true },
            { ...mockedNode, id: 'node2', selected: false },
          ],
          edges: [
            { ...mockedEdge, selected: false },
            { ...mockedEdge, id: 'edge2', selected: true },
          ],
        },
        'selectionChange'
      );
    });
  });

  describe('deselectAll', () => {
    it('should call applyUpdate with the correctly deselected nodes and edges', () => {
      deselectAll(commandHandler);

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [mockedNode, { ...mockedNode, id: 'node2', selected: false }],
          edges: [mockedEdge, { ...mockedEdge, id: 'edge2', selected: false }],
        },
        'selectionChange'
      );
    });
  });
});
