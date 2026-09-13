import { describe, expect, it } from 'vitest';
import type { FlowCore, Node, ShortcutDefinition } from '../../../../../core/src';
import { MovingAction } from './moving.action';
import { PanningAction } from './panning.action';

describe('keyboard actions — arrow-key gates', () => {
  const createFlowCore = (
    selectedNodes: Partial<Node>[],
    config: { nodeDraggingEnabled?: boolean; viewportPanningEnabled?: boolean } = {}
  ): FlowCore =>
    ({
      config: { nodeDraggingEnabled: true, viewportPanningEnabled: true, ...config },
      modelLookup: {
        getSelectedNodesWithChildren: () => selectedNodes,
        getAllDescendantIds: () => [],
      },
    }) as unknown as FlowCore;

  const moveShortcut = { actionName: 'keyboardMoveSelectionRight' } as ShortcutDefinition;
  const panShortcut = { actionName: 'keyboardPanRight' } as ShortcutDefinition;

  const visible = { id: 'visible', selected: true };
  const hidden = { id: 'hidden', selected: true, computedHidden: true };
  const nonDraggable = { id: 'non-draggable', selected: true, draggable: false };

  const selections: Record<string, Partial<Node>[]> = {
    'no selection': [],
    'visible selection': [visible],
    'hidden-only selection': [hidden],
    'non-draggable-only selection': [nonDraggable],
    'mixed hidden + visible selection': [hidden, visible],
    'mixed non-draggable + visible selection': [nonDraggable, visible],
  };

  // The full config × selection matrix. `moves` is MovingAction's expected
  // claim on the arrow key; PanningAction must claim it in exactly the
  // opposite cells (NGD-314: no cell may leave the arrows dead).
  const matrix: { nodeDraggingEnabled: boolean; selection: string; moves: boolean }[] = [
    { nodeDraggingEnabled: true, selection: 'no selection', moves: false },
    { nodeDraggingEnabled: true, selection: 'visible selection', moves: true },
    { nodeDraggingEnabled: true, selection: 'hidden-only selection', moves: false },
    { nodeDraggingEnabled: true, selection: 'non-draggable-only selection', moves: false },
    { nodeDraggingEnabled: true, selection: 'mixed hidden + visible selection', moves: true },
    { nodeDraggingEnabled: true, selection: 'mixed non-draggable + visible selection', moves: true },
    { nodeDraggingEnabled: false, selection: 'no selection', moves: false },
    { nodeDraggingEnabled: false, selection: 'visible selection', moves: false },
    { nodeDraggingEnabled: false, selection: 'hidden-only selection', moves: false },
    { nodeDraggingEnabled: false, selection: 'non-draggable-only selection', moves: false },
    { nodeDraggingEnabled: false, selection: 'mixed hidden + visible selection', moves: false },
    { nodeDraggingEnabled: false, selection: 'mixed non-draggable + visible selection', moves: false },
  ];

  describe.each(matrix)(
    'nodeDraggingEnabled: $nodeDraggingEnabled, $selection',
    ({ nodeDraggingEnabled, selection, moves }) => {
      const flowCore = () => createFlowCore(selections[selection], { nodeDraggingEnabled });

      it(`should ${moves ? '' : 'not '}be handled by MovingAction`, () => {
        expect(new MovingAction().canHandle(moveShortcut, flowCore())).toBe(moves);
      });

      it(`should ${moves ? 'not ' : ''}be handled by PanningAction (exact complement — arrows never go dead)`, () => {
        expect(new PanningAction().canHandle(panShortcut, flowCore())).toBe(!moves);
      });
    }
  );

  describe('viewportPanningEnabled: false', () => {
    it('should not pan even when nothing claims the key', () => {
      const flowCore = createFlowCore([], { viewportPanningEnabled: false });
      expect(new PanningAction().canHandle(panShortcut, flowCore)).toBe(false);
    });

    it('should not affect MovingAction', () => {
      const flowCore = createFlowCore([visible], { viewportPanningEnabled: false });
      expect(new MovingAction().canHandle(moveShortcut, flowCore)).toBe(true);
    });
  });

  describe('shortcut name gates', () => {
    it('MovingAction should ignore pan shortcuts', () => {
      expect(new MovingAction().canHandle(panShortcut, createFlowCore([visible]))).toBe(false);
    });

    it('PanningAction should ignore move shortcuts', () => {
      expect(new PanningAction().canHandle(moveShortcut, createFlowCore([]))).toBe(false);
    });
  });
});
