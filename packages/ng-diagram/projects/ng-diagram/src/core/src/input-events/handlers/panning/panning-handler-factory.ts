import type { FlowCore } from '../../../flow-core';
import type { EventHandler } from '../event-handler';
import type { PanningEvent } from './panning.event';
import { PanningEventHandler } from './panning.handler';
import { VirtualizedPanningEventHandler } from './virtualized-panning.handler';

/**
 * Factory function that creates the appropriate panning handler based on configuration.
 *
 * - Standard mode: Emits viewport movement on every pointer move
 * - Virtualized mode: Uses RAF throttling and buffer fill management for better performance
 */
export function panningHandlerFactory(flow: FlowCore): EventHandler<PanningEvent> {
  return flow.isVirtualizationActive ? new VirtualizedPanningEventHandler(flow) : new PanningEventHandler(flow);
}
