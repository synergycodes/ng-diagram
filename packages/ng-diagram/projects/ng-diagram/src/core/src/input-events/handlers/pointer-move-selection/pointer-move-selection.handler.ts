import { Node } from '../../../types/node.interface';
import { TransactionContext } from '../../../types/transaction.interface';
import { Point } from '../../../types/utils';
import { isGroup, sortNodesByZIndex } from '../../../utils';
import { EventHandler } from '../event-handler';
import { PointerMoveSelectionEvent } from './pointer-move-selection.event';

export const MOVE_THRESHOLD = 5; // to find out if move was intended

export class PointerMoveSelectionEventHandler extends EventHandler<PointerMoveSelectionEvent> {
  private lastPointerPosition: Point | undefined;
  private startPoint: Point | undefined;
  private isMoving = false;
  private hasMoved = false;

  async handle(event: PointerMoveSelectionEvent) {
    switch (event.phase) {
      case 'start': {
        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.lastPointerPosition = flowPosition;
        this.startPoint = flowPosition;
        this.isMoving = true;
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
        if (selectedNodesWithChildren.length === 0 || !this.isMoving || !this.lastPointerPosition || !this.startPoint) {
          return;
        }

        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);

        if (!this.hasMoved) {
          const totalDeltaX = pointer.x - this.startPoint.x;
          const totalDeltaY = pointer.y - this.startPoint.y;
          const distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
          if (distance >= MOVE_THRESHOLD) {
            this.hasMoved = true;
            this.flow.actionStateManager.dragging = {
              nodeIds: selectedNodesWithChildren.map((n) => n.id),
              modifiers: { ...event.modifiers },
              movementStarted: true,
              accumulatedDeltas: new Map(),
              // Nodes haven't moved yet at this point — the first delta is applied below.
              initialPositions: new Map(selectedNodesWithChildren.map((n) => [n.id, { ...n.position }])),
            };
            await this.flow.commandHandler.emit('moveNodesStart');
          }
        }

        const dx = pointer.x - this.lastPointerPosition.x;
        const dy = pointer.y - this.lastPointerPosition.y;

        if (this.flow.actionStateManager.dragging) {
          this.flow.actionStateManager.dragging.modifiers = { ...event.modifiers };
        }

        if (this.hasMoved) {
          this.flow.transaction('moveNodes', async (tx) => {
            await tx.emit('moveNodesBy', {
              delta: { x: dx, y: dy },
              nodes: selectedNodesWithChildren,
            });

            this.updateGroupHighlightOnDrag(tx, pointer, selectedNodes);
          });
          this.panDiagramOnScreenEdge(event.panningForce);
        }

        this.lastPointerPosition = pointer;
        break;
      }
      case 'end': {
        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);
        if (this.hasMoved) {
          await this.handleDrop(pointer);
          await this.flow.commandHandler.emit('moveNodesStop');
        }

        this.flow.actionStateManager.clearDragging();
        this.lastPointerPosition = undefined;
        this.startPoint = undefined;
        this.isMoving = false;
        this.hasMoved = false;
      }
    }
  }

  override async cancel(): Promise<void> {
    if (this.isMoving || this.flow.actionStateManager.isDragging()) {
      const dragging = this.flow.actionStateManager.dragging;
      const needsStop = this.hasMoved;
      const needsHighlightClear = !!this.flow.actionStateManager.highlightGroup;

      if (needsStop && dragging) {
        // Must be set BEFORE the transaction commits — the NodeDragEndedEmitter
        // reads it from the action state during middleware execution.
        dragging.cancelReason = 'cancelled';
      }

      if (needsStop || needsHighlightClear) {
        // Unlike the 'end' phase, skip the drop handling — an aborted drag must
        // not change group membership.
        await this.flow.transaction('cancelDrag', async (tx) => {
          if (needsStop) {
            // Snap the dragged nodes back to where they were before the drag.
            const initialPositions = dragging?.initialPositions;
            if (initialPositions?.size) {
              await tx.emit('updateNodes', {
                nodes: [...initialPositions].map(([id, position]) => ({ id, position })),
              });
            }
            await tx.emit('moveNodesStop');
          }
          if (needsHighlightClear) {
            await tx.emit('highlightGroupClear');
          }
        });
      }

      this.flow.actionStateManager.clearDragging();
    }

    this.lastPointerPosition = undefined;
    this.startPoint = undefined;
    this.isMoving = false;
    this.hasMoved = false;
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
