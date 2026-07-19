import { Node } from '../../../types/node.interface';
import { TransactionContext } from '../../../types/transaction.interface';
import { Point } from '../../../types/utils';
import { isGroup, sortNodesByZIndex } from '../../../utils';
import { EventHandler } from '../event-handler';
import { PointerMoveSelectionEvent } from './pointer-move-selection.event';

export const MOVE_THRESHOLD = 5; // to find out if move was intended

/**
 * One drag gesture's private input-tracking state — a fresh object per gesture,
 * written only by this handler, so object identity reliably answers "same
 * gesture?". Deliberately not in actionState.dragging: nothing outside this
 * handler reads these fields, and actionState is public API where every write
 * emits actionStateChanged.
 */
interface DragGesture {
  startPoint: Point;
  lastPointerPosition: Point;
  hasMoved: boolean;
  ended: boolean;
}

export class PointerMoveSelectionEventHandler extends EventHandler<PointerMoveSelectionEvent> {
  private gesture: DragGesture | null = null;

  async handle(event: PointerMoveSelectionEvent) {
    switch (event.phase) {
      case 'start': {
        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.gesture = {
          startPoint: flowPosition,
          lastPointerPosition: flowPosition,
          hasMoved: false,
          ended: false,
        };
        this.flow.actionStateManager.dragging = {
          nodeIds: [],
          modifiers: { ...event.modifiers },
          accumulatedDeltas: new Map(),
          movementStarted: false,
        };

        break;
      }
      case 'continue': {
        const selectedNodesWithChildren = this.flow.modelLookup
          .getSelectedNodesWithChildren({ directOnly: false })
          .filter((node) => node.draggable ?? true);
        const selectedNodes = this.flow.modelLookup.getSelectedNodes();
        // Un-awaited handle() calls interleave at every await (see EventHandler.handle)
        // — snapshot values before the first suspension and re-validate the gesture
        // after it, or moves get double-applied.
        const gesture = this.gesture;
        if (selectedNodesWithChildren.length === 0 || !gesture || gesture.ended) {
          return;
        }
        const { startPoint, lastPointerPosition } = gesture;

        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);

        const totalDeltaX = pointer.x - startPoint.x;
        const totalDeltaY = pointer.y - startPoint.y;
        const crossedThreshold =
          !gesture.hasMoved && Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY) >= MOVE_THRESHOLD;
        const draggedNodeIds = selectedNodesWithChildren.map((n) => n.id);
        if (crossedThreshold) {
          gesture.hasMoved = true;
          this.flow.actionStateManager.dragging = {
            nodeIds: draggedNodeIds,
            modifiers: { ...event.modifiers },
            movementStarted: true,
            accumulatedDeltas: new Map(),
          };
        }

        const dx = pointer.x - lastPointerPosition.x;
        const dy = pointer.y - lastPointerPosition.y;
        const shouldMove = gesture.hasMoved;

        if (this.flow.actionStateManager.dragging) {
          this.flow.actionStateManager.dragging.modifiers = { ...event.modifiers };
        }

        gesture.lastPointerPosition = pointer;

        if (crossedThreshold) {
          await this.flow.commandHandler.emit('moveNodesStart', { nodeIds: draggedNodeIds });
          // Ended (even with its 'end' still in flight) or replaced while the emit
          // was suspended — applying the move now would move nodes after the drop.
          if (this.gesture !== gesture || gesture.ended) {
            break;
          }
        }

        if (shouldMove) {
          this.flow.transaction('moveNodes', async (tx) => {
            await tx.emit('moveNodesBy', {
              delta: { x: dx, y: dy },
              nodes: selectedNodesWithChildren,
            });

            this.updateGroupHighlightOnDrag(tx, pointer, selectedNodes);
          });
          this.panDiagramOnScreenEdge(event.panningForce);
        }

        break;
      }
      case 'end': {
        const gesture = this.gesture;
        if (gesture) {
          // Marks the gesture dead for suspended continues — synchronously,
          // because this.gesture is nulled only after the awaits below.
          gesture.ended = true;
        }
        // Captured before any await — a re-drag can replace the dragging state
        // while the drop below is suspended, and nodeDragEnded must report THIS
        // gesture's nodes.
        const draggedNodeIds = this.flow.actionStateManager.dragging?.nodeIds ?? [];
        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);
        // Two guarantees, two finallys: the inner pairs moveNodesStop with the
        // drop; the outer runs cleanup even when moveNodesStop itself rejects.
        try {
          if (gesture?.hasMoved) {
            try {
              await this.handleDrop(pointer);
            } finally {
              // moveNodesStop must fire even when the drop rejects (a user config
              // callback can throw inside addToGroup) — app code pairs the
              // nodeDragStarted/nodeDragEnded lifecycle events.
              await this.flow.commandHandler.emit('moveNodesStop', { nodeIds: draggedNodeIds });
            }
          }
        } finally {
          // A fast re-drag started while the drop was suspended must not have its
          // freshly initialized gesture state clobbered — hence the identity guard.
          if (this.gesture === gesture) {
            // A rejected drop can skip addToGroup's own highlight clear — no
            // highlight may survive the end of the gesture.
            if (this.flow.actionStateManager.highlightGroup) {
              void this.flow.commandHandler.emit('highlightGroupClear');
            }
            this.flow.actionStateManager.clearDragging();
            this.gesture = null;
          }
        }
      }
    }
  }

  private updateGroupHighlightOnDrag(tx: TransactionContext, point: Point, selectedNodes: Node[]): void {
    const topLevelGroupNode = this.getTopGroupAtPoint(point);
    const currentHighlightedGroup = this.flow.actionStateManager.highlightGroup?.highlightedGroupId;

    if (topLevelGroupNode) {
      const shouldHighlight = selectedNodes.some((node) => node.groupId !== topLevelGroupNode.id);

      if (shouldHighlight) {
        if (currentHighlightedGroup !== topLevelGroupNode.id) {
          tx.emit('highlightGroup', { groupId: topLevelGroupNode.id, nodes: selectedNodes });
        }
      } else {
        if (currentHighlightedGroup) {
          tx.emit('highlightGroupClear');
        }
      }
    } else {
      if (currentHighlightedGroup) {
        tx.emit('highlightGroupClear');
      }
    }
  }

  private getTopGroupAtPoint(point: Point): Node | null {
    const nodes = this.flow.getNodesInRange(point, 1);
    const groups = nodes.filter((node) => isGroup(node) && !node.selected);
    const sortedGroups = sortNodesByZIndex(groups, this.flow.getState().nodes);

    return sortedGroups[0];
  }

  private async handleDrop(point: Point) {
    const topLevelGroupNode = this.getTopGroupAtPoint(point);
    const selectedNodes = this.flow.modelLookup.getSelectedNodes();

    if (!topLevelGroupNode) {
      for (const node of selectedNodes) {
        if (node.groupId !== undefined && !selectedNodes.find((n) => n.id === node.groupId)) {
          await this.flow.commandHandler.emit('removeFromGroup', {
            groupId: node.groupId,
            nodeIds: [node.id],
          });
        }
      }
      return;
    }

    await this.flow.commandHandler.emit('addToGroup', {
      groupId: topLevelGroupNode.id,
      nodeIds: selectedNodes.map((node) => node.id),
    });
  }

  private panDiagramOnScreenEdge(panningForce: Point | null) {
    if (!panningForce) {
      return;
    }
    this.flow.commandHandler.emit('moveViewportBy', { x: panningForce.x, y: panningForce.y });
  }
}
