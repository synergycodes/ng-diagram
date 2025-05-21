import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../../types';
import { bringToFront, BringToFrontCommand, sendToBack, SendToBackCommand } from '../z-order';

describe('Z-order commands', () => {
  let commandHandler: CommandHandler;
  let flowCore: FlowCore;
  let mockGetState: Mock;

  beforeEach(() => {
    mockGetState = vi.fn();
    flowCore = { getState: mockGetState, applyUpdate: vi.fn() } as unknown as FlowCore;
    commandHandler = { flowCore } as CommandHandler;
  });

  describe('bringToFront', () => {
    it('should not update nodes, not edges if there is no target for the command', () => {
      const command: BringToFrontCommand = { name: 'bringToFront' };
      const nodes = [
        { id: '1', selected: false, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: '1', selected: false, zOrder: 1 },
        { id: '2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, command);

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should target current selection when no nodeIds or edgeIds are provided', () => {
      const command: BringToFrontCommand = { name: 'bringToFront' };
      const nodes = [
        { id: '1', selected: true, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: '1', selected: true, zOrder: 1 },
        { id: '2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, command);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [
            { id: '1', selected: true, zOrder: 4 },
            { id: '2', selected: false, zOrder: 2 },
          ],
          edges: [
            { id: '1', selected: true, zOrder: 4 },
            { id: '2', selected: false, zOrder: 3 },
          ],
        },
        'changeZOrder'
      );
    });

    it('should target specific nodes and edges when nodeIds or edgeIds are provided', () => {
      const command: BringToFrontCommand = { name: 'bringToFront', nodeIds: ['1'], edgeIds: ['1'] };
      const nodes = [
        { id: '1', selected: false },
        { id: '2', selected: false },
      ];
      const edges = [
        { id: '1', selected: false },
        { id: '2', selected: false },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, command);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [
            { id: '1', selected: false, zOrder: 1 },
            { id: '2', selected: false },
          ],
          edges: [
            { id: '1', selected: false, zOrder: 1 },
            { id: '2', selected: false },
          ],
        },
        'changeZOrder'
      );
    });
  });

  describe('sendToBack', () => {
    it('should not update nodes, not edges if there is no target for the command', () => {
      const command: SendToBackCommand = { name: 'sendToBack' };
      const nodes = [
        { id: '1', selected: false, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: '1', selected: false, zOrder: 1 },
        { id: '2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      sendToBack(commandHandler, command);

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should target current selection when no nodeIds or edgeIds are provided', () => {
      const command: SendToBackCommand = { name: 'sendToBack' };
      const nodes = [
        { id: '1', selected: true, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: '1', selected: true, zOrder: 1 },
        { id: '2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      sendToBack(commandHandler, command);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [
            { id: '1', selected: true, zOrder: 0 },
            { id: '2', selected: false, zOrder: 2 },
          ],
          edges: [
            { id: '1', selected: true, zOrder: 0 },
            { id: '2', selected: false, zOrder: 3 },
          ],
        },
        'changeZOrder'
      );
    });

    it('should target specific nodes and edges when nodeIds or edgeIds are provided', () => {
      const command: SendToBackCommand = { name: 'sendToBack', nodeIds: ['1'], edgeIds: ['1'] };
      const nodes = [
        { id: '1', selected: false },
        { id: '2', selected: false },
      ];
      const edges = [
        { id: '1', selected: false },
        { id: '2', selected: false },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      sendToBack(commandHandler, command);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [
            { id: '1', selected: false, zOrder: -1 },
            { id: '2', selected: false },
          ],
          edges: [
            { id: '1', selected: false, zOrder: -1 },
            { id: '2', selected: false },
          ],
        },
        'changeZOrder'
      );
    });
  });
});
