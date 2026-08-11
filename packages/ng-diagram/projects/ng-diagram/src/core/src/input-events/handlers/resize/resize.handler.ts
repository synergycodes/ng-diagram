import { Point } from '../../..';
import type { ResizeNodeCommand } from '../../../command-handler/commands/resize-node';
import type { ResizeActionState, WithoutName } from '../../../types';
import { isSamePoint } from '../../../utils';
import { EventHandler } from '../event-handler';
import { ResizeDirection, ResizeEvent } from './resize.event';

const RESIZE_MISSING_TARGET_ERROR = (event: ResizeEvent) =>
  `[ngDiagram] Resize event missing target node.

Event details:
  • Phase: ${event.phase}
  • Direction: ${event.direction}
  • Target type: ${event.targetType}
  • Pointer position: (${event.lastInputPoint.x}, ${event.lastInputPoint.y})

This indicates a programming error. Resize events must have a target node.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/resizing/`;

export class ResizeEventHandler extends EventHandler<ResizeEvent> {
  // Last continue point of the current gesture; reset on every gesture start.
  private lastContinuePoint: Point | null = null;

  async handle(event: ResizeEvent): Promise<void> {
    if (this.flow.isCancellingInteraction()) {
      return;
    }
    if (!event.target) {
      throw new Error(RESIZE_MISSING_TARGET_ERROR(event));
    }

    const { x, y } = this.flow.clientToFlowPosition(event.lastInputPoint);
    switch (event.phase) {
      case 'start': {
        const node = this.flow.getNodeById(event.target.id);
        if (node && node.size) {
          this.lastContinuePoint = null;
          this.flow.actionStateManager.resize = {
            startX: x,
            startY: y,
            startWidth: node.size.width,
            startHeight: node.size.height,
            startNodePositionX: node.position.x,
            startNodePositionY: node.position.y,
            resizingNode: node,
          };

          await this.flow.commandHandler.emit('resizeNodeStart', { nodeId: node.id });
        }

        break;
      }

      case 'continue': {
        const resizeState = this.flow.actionStateManager.resize;
        if (!resizeState) {
          break;
        }

        this.lastContinuePoint = { x, y };
        this.flow.commandHandler.emit(
          'resizeNode',
          this.buildResizeCommand(resizeState, event.target.id, event.direction, { x, y })
        );
        break;
      }
      case 'end': {
        const resizeState = this.flow.actionStateManager.resize;
        this.claimTeardown(resizeState);
        try {
          // pointerup is not frame-aligned, so the final coalesced pointermove may
          // never arrive — the release point is applied as the last resize. A release
          // that adds nothing over the last continue (or the start) is skipped: on a
          // bare handle click, rounding plus the autoSize flip would mutate the node.
          if (resizeState && resizeState.resizingNode.id === event.target.id) {
            const reference = this.lastContinuePoint ?? { x: resizeState.startX, y: resizeState.startY };
            if (!isSamePoint({ x, y }, reference)) {
              await this.flow.commandHandler.emit(
                'resizeNode',
                this.buildResizeCommand(resizeState, event.target.id, event.direction, { x, y })
              );
            }
          }
        } finally {
          try {
            await this.flow.commandHandler.emit('resizeNodeStop', { nodeId: resizeState?.resizingNode.id });
          } finally {
            // Cleanup must run even when the emit rejects (leaked resize state suppresses
            // node measurements), but a fast re-grab that started a new resize while the
            // emit was suspended must not have its fresh state cleared.
            if (this.flow.actionStateManager.resize === resizeState) {
              this.flow.actionStateManager.clearResize();
            }
          }
        }
        break;
      }
    }
  }

  /** Direction math shared by continue and end: the resize command for the pointer at `point` (flow coordinates). */
  private buildResizeCommand(
    resizeState: ResizeActionState,
    nodeId: string,
    direction: ResizeDirection,
    point: Point
  ): WithoutName<ResizeNodeCommand> {
    const { startHeight, startNodePositionX, startNodePositionY, startWidth, startX, startY } = resizeState;
    const deltaX = Math.round(point.x - startX);
    const deltaY = Math.round(point.y - startY);
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = startNodePositionX;
    let newY = startNodePositionY;

    switch (direction) {
      case 'top-left': {
        newWidth = startWidth - deltaX;
        newX = startNodePositionX + (startWidth - newWidth);
        newHeight = startHeight - deltaY;
        newY = startNodePositionY + (startHeight - newHeight);
        break;
      }
      case 'top': {
        newHeight = startHeight - deltaY;
        newY = startNodePositionY + (startHeight - newHeight);
        break;
      }
      case 'top-right': {
        newWidth = startWidth + deltaX;
        newHeight = startHeight - deltaY;
        newY = startNodePositionY + (startHeight - newHeight);
        break;
      }
      case 'right': {
        newWidth = startWidth + deltaX;
        break;
      }
      case 'bottom-right': {
        newWidth = startWidth + deltaX;
        newHeight = startHeight + deltaY;
        break;
      }
      case 'bottom': {
        newHeight = startHeight + deltaY;
        break;
      }
      case 'bottom-left': {
        newWidth = startWidth - deltaX;
        newX = startNodePositionX + (startWidth - newWidth);
        newHeight = startHeight + deltaY;
        break;
      }
      case 'left': {
        newWidth = startWidth - deltaX;
        newX = startNodePositionX + (startWidth - newWidth);
        break;
      }
    }

    const resizeCommand: WithoutName<ResizeNodeCommand> = {
      id: nodeId,
      disableAutoSize: true,
      size: { width: Math.round(newWidth), height: Math.round(newHeight) },
    };

    if (newX !== startNodePositionX || newY !== startNodePositionY) {
      resizeCommand.position = { x: Math.round(newX), y: Math.round(newY) };
    }

    return resizeCommand;
  }

  override async cancel(): Promise<boolean> {
    const resize = this.flow.actionStateManager.resize;
    if (!resize || this.isTeardownClaimed(resize)) {
      return false;
    }
    this.claimTeardown(resize);

    resize.cancelReason = 'cancelled';

    // Restore the exact pre-resize geometry (updateNode instead of resizeNode
    // so min-size constraints and snapping can't distort the original values)
    // along with the autoSize flag the resize gesture disabled.
    const { startWidth, startHeight, startNodePositionX, startNodePositionY, resizingNode } = resize;
    await this.flow.transaction('cancelResize', async (tx) => {
      await tx.emit('updateNode', {
        id: resizingNode.id,
        nodeChanges: {
          size: { width: startWidth, height: startHeight },
          position: { x: startNodePositionX, y: startNodePositionY },
          autoSize: resizingNode.autoSize,
        },
      });
      await tx.emit('resizeNodeStop', { nodeId: resizingNode.id });
    });

    // A new resize may have started while the transaction above was suspended —
    // the identity guard keeps its fresh state intact.
    if (this.flow.actionStateManager.resize === resize) {
      this.flow.actionStateManager.clearResize();
    }
    return true;
  }
}
