import { describe, expect, it } from 'vitest';
import type { FlowCore, Node, ShortcutDefinition } from '../../../../../core/src';
import { MovingAction } from './moving.action';
import { PanningAction } from './panning.action';

describe('keyboard actions — hidden selection gates', () => {
  const createFlowCore = (selectedNodes: Partial<Node>[]): FlowCore =>
    ({
      config: { nodeDraggingEnabled: true, viewportPanningEnabled: true },
      modelLookup: {
        getSelectedNodes: () => selectedNodes,
      },
    }) as unknown as FlowCore;

  const moveShortcut = { actionName: 'keyboardMoveSelectionRight' } as ShortcutDefinition;
  const panShortcut = { actionName: 'keyboardPanRight' } as ShortcutDefinition;

  const visible = { id: 'visible', selected: true };
  const hidden = { id: 'hidden', selected: true, computedHidden: true };

  describe('MovingAction.canHandle', () => {
    it('should handle when a visible node is selected', () => {
      expect(new MovingAction().canHandle(moveShortcut, createFlowCore([visible]))).toBe(true);
    });

    it('should not handle when only effectively hidden nodes are selected', () => {
      expect(new MovingAction().canHandle(moveShortcut, createFlowCore([hidden]))).toBe(false);
    });

    it('should handle a mixed selection', () => {
      expect(new MovingAction().canHandle(moveShortcut, createFlowCore([hidden, visible]))).toBe(true);
    });

    it('should not handle with no selection', () => {
      expect(new MovingAction().canHandle(moveShortcut, createFlowCore([]))).toBe(false);
    });
  });

  describe('PanningAction.canHandle', () => {
    it('should pan when nothing is selected', () => {
      expect(new PanningAction().canHandle(panShortcut, createFlowCore([]))).toBe(true);
    });

    it('should pan when only effectively hidden nodes are selected (arrows must not go dead)', () => {
      expect(new PanningAction().canHandle(panShortcut, createFlowCore([hidden]))).toBe(true);
    });

    it('should not pan when a visible node is selected', () => {
      expect(new PanningAction().canHandle(panShortcut, createFlowCore([visible]))).toBe(false);
    });
  });
});
