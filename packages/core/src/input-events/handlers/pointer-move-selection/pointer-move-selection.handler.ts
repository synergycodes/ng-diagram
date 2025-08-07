import { Node } from '../../../types/node.interface';
import { TransactionContext } from '../../../types/transaction.interface';
import { ContainerEdge, Point } from '../../../types/utils';
import { isGroup } from '../../../utils';
import { EventHandler } from '../event-hander';
import { PointerMoveSelectionEvent } from './pointer-move-selection.event';

export const EDGE_PANNING_FORCE = 15;

export class PointerMoveSelectionEventHandler extends EventHandler<PointerMoveSelectionEvent> {
  private lastInputPoint: Point | undefined;
  private startPoint: Point | undefined;
  private initialNodePosition: Point | undefined;
  private isMoving = false;

  async handle(event: PointerMoveSelectionEvent) {
    switch (event.phase) {
      case 'start': {
        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.lastInputPoint = flowPosition;
        this.startPoint = flowPosition;
        this.isMoving = true;

        break;
      }
      case 'continue': {
        const selectedNodes = this.flow.modelLookup.getSelectedNodesWithChildren({ directOnly: false });
        if (selectedNodes.length === 0 || !this.isMoving || !this.lastInputPoint || !this.startPoint) {
          return;
        }

        const firstNode = selectedNodes[0];
        if (!this.initialNodePosition) {
          this.initialNodePosition = { ...firstNode.position };
        }

        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);
        const { x, y } = pointer;
        const deltaX = x - this.startPoint.x;
        const deltaY = y - this.startPoint.y;

        const dx = deltaX - (firstNode.position.x - this.initialNodePosition.x);
        const dy = deltaY - (firstNode.position.y - this.initialNodePosition.y);

        this.flow.transaction('moveNodes', async (tx) => {
          await tx.emit('moveNodesBy', {
            delta: { x: dx, y: dy },
            nodes: selectedNodes,
          });

          this.updateGroupHighlightOnDrag(tx, pointer, selectedNodes);
        });
        this.panDiagramOnScreenEdge(event.currentDiagramEdge);

        this.lastInputPoint = event.lastInputPoint;
        break;
      }
      case 'end': {
        const pointer = this.flow.clientToFlowPosition(event.lastInputPoint);
        await this.handleDropOnGroup(pointer);

        this.lastInputPoint = undefined;
        this.startPoint = undefined;
        this.initialNodePosition = undefined;
        this.isMoving = false;
      }
    }
  }

  private updateGroupHighlightOnDrag(tx: TransactionContext, point: Point, selectedNodes: Node[]): void {
    const topLevelGroupNode = this.getTopGroupAtPoint(point);
    if (topLevelGroupNode) {
      if (selectedNodes.some((node) => node.groupId !== topLevelGroupNode.id)) {
        tx.emit('highlightGroup', { groupId: topLevelGroupNode.id, nodes: selectedNodes });
      }
    } else {
      tx.emit('highlightGroupClear');
    }
  }

  private getTopGroupAtPoint(point: Point): Node | null {
    // Get all nodes at this position
    const nodes = this.flow.getNodesInRange(point, 1);

    // Get all groups at this position that are not selected
    const groups = nodes.filter((node) => isGroup(node) && !node.selected);

    // Get the top group
    return groups.toSorted((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0))[0];
  }

  private async handleDropOnGroup(point: Point) {
    const topLevelGroupNode = this.getTopGroupAtPoint(point);

    if (!topLevelGroupNode) {
      return;
    }

    this.flow.commandHandler.emit('addToGroup', {
      groupId: topLevelGroupNode.id,
      nodeIds: this.flow.modelLookup.getSelectedNodes().map((node) => node.id),
    });
  }

  private panDiagramOnScreenEdge(screenEdge: ContainerEdge) {
    if (!screenEdge) {
      return;
    }
    let x = 0;
    let y = 0;
    switch (screenEdge) {
      case 'left':
        x = EDGE_PANNING_FORCE;
        break;
      case 'right':
        x = -EDGE_PANNING_FORCE;
        break;
      case 'top':
        y = EDGE_PANNING_FORCE;
        break;
      case 'bottom':
        y = -EDGE_PANNING_FORCE;
        break;
      case 'topleft':
        x = EDGE_PANNING_FORCE;
        y = EDGE_PANNING_FORCE;
        break;
      case 'topright':
        x = -EDGE_PANNING_FORCE;
        y = EDGE_PANNING_FORCE;
        break;
      case 'bottomleft':
        x = EDGE_PANNING_FORCE;
        y = -EDGE_PANNING_FORCE;
        break;
      case 'bottomright':
        x = -EDGE_PANNING_FORCE;
        y = -EDGE_PANNING_FORCE;
        break;
      default:
        throw new Error(`Unknown screen edge: ${screenEdge}`);
    }
    this.flow.commandHandler.emit('moveViewportBy', { x, y });
  }
}
