import { Node } from '../../../types/node.interface';
import { TransactionContext } from '../../../types/transaction.interface';
import { ContainerEdge, Point } from '../../../types/utils';
import { isGroup, sortNodesByZIndex } from '../../../utils';
import { EventHandler } from '../event-hander';
import { PointerMoveSelectionEvent } from './pointer-move-selection.event';

export const MOVE_THRESHOLD = 5; // to find out if move was intended

export class PointerMoveSelectionEventHandler extends EventHandler<PointerMoveSelectionEvent> {
  private lastInputPoint: Point | undefined;
  private startPoint: Point | undefined;
  private initialNodePosition: Point | undefined;
  private isMoving = false;
  private hasMoved = false;

  async handle(event: PointerMoveSelectionEvent) {
    switch (event.phase) {
      case 'start': {
        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.lastInputPoint = flowPosition;
        this.startPoint = flowPosition;
        this.isMoving = true;
        this.flow.actionStateManager.dragging = {
          modifiers: { ...event.modifiers },
        };

        break;
      }
      case 'continue': {
        const selectedNodesWithChildren = this.flow.modelLookup.getSelectedNodesWithChildren({ directOnly: false });
        const selectedNodes = this.flow.modelLookup.getSelectedNodes();
        if (selectedNodesWithChildren.length === 0 || !this.isMoving || !this.lastInputPoint || !this.startPoint) {
          return;
        }

        const firstNode = selectedNodesWithChildren[0];
        if (!this.initialNodePosition) {
          this.initialNodePosition = { ...firstNode.position };
        }

        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);
        const { x, y } = pointer;
        const deltaX = x - this.startPoint.x;
        const deltaY = y - this.startPoint.y;

        if (!this.hasMoved) {
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          if (distance >= MOVE_THRESHOLD) {
            this.hasMoved = true;
          }
        }

        const dx = deltaX - (firstNode.position.x - this.initialNodePosition.x);
        const dy = deltaY - (firstNode.position.y - this.initialNodePosition.y);

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

            this.panDiagramOnScreenEdge(event.currentDiagramEdge);
          });
        }

        this.lastInputPoint = event.lastInputPoint;
        break;
      }
      case 'end': {
        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);
        if (this.hasMoved) {
          await this.handleDrop(pointer);
        }

        this.flow.actionStateManager.clearDragging();
        this.lastInputPoint = undefined;
        this.startPoint = undefined;
        this.initialNodePosition = undefined;
        this.isMoving = false;
        this.hasMoved = false;
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
        if (node.groupId != null) {
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

  private panDiagramOnScreenEdge(screenEdge: ContainerEdge) {
    const { pointerEdgePanningForce } = this.flow.config.selectionMoving;

    if (!screenEdge) {
      return;
    }

    let x = 0;
    let y = 0;
    switch (screenEdge) {
      case 'left':
        x = pointerEdgePanningForce;
        break;
      case 'right':
        x = -pointerEdgePanningForce;
        break;
      case 'top':
        y = pointerEdgePanningForce;
        break;
      case 'bottom':
        y = -pointerEdgePanningForce;
        break;
      case 'topleft':
        x = pointerEdgePanningForce;
        y = pointerEdgePanningForce;
        break;
      case 'topright':
        x = -pointerEdgePanningForce;
        y = pointerEdgePanningForce;
        break;
      case 'bottomleft':
        x = pointerEdgePanningForce;
        y = -pointerEdgePanningForce;
        break;
      case 'bottomright':
        x = -pointerEdgePanningForce;
        y = -pointerEdgePanningForce;
        break;
      default:
        throw new Error(`Unknown screen edge: ${screenEdge}`);
    }

    this.flow.commandHandler.emit('moveViewportBy', { x, y });
  }
}
