import { Point, Size } from '../../..';
import type { ResizeActionState } from '../../../types/action-state.interface';
import { EventHandler } from '../event-handler';
import { ResizeEvent } from './resize.event';

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
  /**
   * The resize state whose end or cancel claimed the teardown. Never reset —
   * every gesture starts with a fresh state object, so a stale reference can
   * never match a live gesture.
   */
  private finishingState: ResizeActionState | undefined;

  async handle(event: ResizeEvent): Promise<void> {
    if (!event.target) {
      throw new Error(RESIZE_MISSING_TARGET_ERROR(event));
    }

    const { x, y } = this.flow.clientToFlowPosition(event.lastInputPoint);
    switch (event.phase) {
      case 'start': {
        const node = this.flow.getNodeById(event.target.id);
        if (node && node.size) {
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

        const { startHeight, startNodePositionX, startNodePositionY, startWidth, startX, startY } = resizeState;
        const deltaX = Math.round(x - startX);
        const deltaY = Math.round(y - startY);
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startNodePositionX;
        let newY = startNodePositionY;

        switch (event.direction) {
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

        const resizeCommand: {
          id: string;
          disableAutoSize: boolean;
          size: Size;
          position?: Point;
        } = {
          id: event.target.id,
          disableAutoSize: true,
          size: { width: Math.round(newWidth), height: Math.round(newHeight) },
        };

        if (newX !== startNodePositionX || newY !== startNodePositionY) {
          resizeCommand.position = { x: Math.round(newX), y: Math.round(newY) };
        }

        this.flow.commandHandler.emit('resizeNode', resizeCommand);
        break;
      }
      case 'end': {
        const resizeState = this.flow.actionStateManager.resize;
        // Claims the teardown — cancel() must not roll back a resize whose
        // normal end is already in flight.
        this.finishingState = resizeState;
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
        break;
      }
    }
  }

  override async cancel(): Promise<boolean> {
    const resize = this.flow.actionStateManager.resize;
    // No resize, or its normal end (or another cancel) already owns the teardown.
    if (!resize || resize === this.finishingState) {
      return false;
    }
    this.finishingState = resize;

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
