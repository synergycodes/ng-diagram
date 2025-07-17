import { Node } from '../../../types/node.interface';
import { Point } from '../../../types/utils';
import { __NEW__EventHandler } from '../event-hander';
import { __NEW__PointerMoveSelectionEvent } from './pointer-move-selection.event';

export class __NEW__PointerMoveSelectionHandler extends __NEW__EventHandler<__NEW__PointerMoveSelectionEvent> {
  private lastInputPoint: Point | undefined;
  private startPoint: Point | undefined;
  private initialNodePosition: Point | undefined;
  private isMoving = false;

  handle(event: __NEW__PointerMoveSelectionEvent) {
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

        const { x, y } = this.flow.clientToFlowPosition(event.lastInputPoint);
        const deltaX = x - this.startPoint.x;
        const deltaY = y - this.startPoint.y;

        const dx = deltaX - (firstNode.position.x - this.initialNodePosition.x);
        const dy = deltaY - (firstNode.position.y - this.initialNodePosition.y);

        this.flow.commandHandler.emit('moveNodesBy', {
          delta: { x: dx, y: dy },
          nodes: selectedNodes,
        });

        this.flow.commandHandler.emit('moveNodesBy', {
          delta: { x: dx, y: dy },
          nodes: selectedNodes,
        });

        this.updateGroupHighlightOnDrag(event.lastInputPoint, selectedNodes);

        this.lastInputPoint = event.lastInputPoint;
        break;
      }
      case 'end': {
        this.handleDropOnGroup(event.lastInputPoint);

        this.lastInputPoint = undefined;
        this.startPoint = undefined;
        this.initialNodePosition = undefined;
        this.isMoving = false;
      }
    }
  }

  private updateGroupHighlightOnDrag(point: Point, selectedNodes: Node[]): void {
    const topLevelGroupNode = this.getTopGroupAtPoint(point);
    if (topLevelGroupNode) {
      if (selectedNodes.some((node) => node.groupId !== topLevelGroupNode.id)) {
        this.flow.commandHandler.emit('highlightGroup', { groupId: topLevelGroupNode.id });
      }
    } else {
      this.flow.commandHandler.emit('highlightGroupClear');
    }
  }

  private getTopGroupAtPoint(point: Point): Node | null {
    // Get all nodes at this position
    const nodes = this.flow.getNodesInRange(point, 1);

    // Get all groups at this position that are not selected
    const groups = nodes.filter((node) => node.isGroup && !node.selected);

    // Get the top group
    return groups.toSorted((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0))[0];
  }

  // TODO: Test if drop works correctly
  private handleDropOnGroup(point: Point) {
    const topLevelGroupNode = this.getTopGroupAtPoint(point);
    const updateData: { id: string; groupId?: string }[] = [];

    for (const selectedNode of this.flow.modelLookup.getSelectedNodes()) {
      if (
        topLevelGroupNode &&
        this.flow.modelLookup.wouldCreateCircularDependency(selectedNode.id, topLevelGroupNode.id)
      ) {
        continue;
      }
      const newGroupId = topLevelGroupNode?.id;
      if (selectedNode.groupId === newGroupId) {
        continue;
      }

      updateData.push({
        id: selectedNode.id,
        groupId: newGroupId,
      });
    }

    if (updateData.length > 0) {
      this.flow.commandHandler.emit('updateNodes', { nodes: updateData });
    }

    // That means a group has been highlighted, so we need to clear it
    if (updateData.some((node) => Boolean(node.groupId))) {
      this.flow.commandHandler.emit('highlightGroupClear');
    }
  }
}
