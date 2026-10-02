import { FlowCore } from '../../flow-core';
import type { LabelUpdate } from '../../label-batch-processor/label-batch-processor';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Node, Port } from '../../types';
import { EdgeLabel, MEASURED_LABEL_PROPERTIES, MEASURED_PORT_PROPERTIES } from '../../types';
import { getRect, hasChangedProperties, isSameRect, isZeroSize, omitProperties } from '../../utils';
import { Updater } from '../updater.interface';

export class InternalUpdater implements Updater {
  // Stable callback references so BatchProcessor can group keys into a single invocation
  private readonly onPortAddsFlush = (all: Map<string, Port[]>) => {
    return this.flowCore.commandHandler.emit('addPortsBulk', { additions: all });
  };
  private readonly onPortUpdatesFlush = (all: Map<string, PortUpdate[]>) => {
    return this.flowCore.commandHandler.emit('updatePortsBulk', { updates: all });
  };
  private readonly onPortDeletesFlush = (all: Map<string, string[]>) => {
    return this.flowCore.commandHandler.emit('deletePortsBulk', { deletions: all });
  };
  private readonly onLabelAddsFlush = (all: Map<string, EdgeLabel[]>) => {
    return this.flowCore.commandHandler.emit('addEdgeLabelsBulk', { additions: all });
  };
  private readonly onLabelUpdatesFlush = (all: Map<string, LabelUpdate[]>) => {
    return this.flowCore.commandHandler.emit('updateEdgeLabelsBulk', { updates: all });
  };
  private readonly onLabelDeletesFlush = (all: Map<string, string[]>) => {
    return this.flowCore.commandHandler.emit('deleteEdgeLabelsBulk', { deletions: all });
  };

  constructor(private readonly flowCore: FlowCore) {}

  /**
   * @internal
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    this.applyNodeSizes([{ id: nodeId, size }]);
  }

  /**
   * @internal
   */
  applyNodeSizes(updates: { id: string; size: NonNullable<Node['size']> }[]): void {
    const isResizing = this.flowCore.actionStateManager.isResizing();

    const filtered = updates.filter(({ id, size }) => {
      // 0×0 is the display: none signature — never overwrite geometry with it.
      if (isZeroSize(size)) return false;
      const node = this.flowCore.getNodeById(id);
      if (!node) return false;
      // During active user resize, only accept initial sizes (nodes without size yet).
      // Size-changed nodes are suppressed — the resize action is the source of truth.
      if (node.size && isResizing) return false;
      return !isSameRect(getRect(node), getRect({ size }));
    });

    if (filtered.length > 0) {
      this.flowCore.commandHandler.emit('updateNodes', { nodes: filtered });
    }
  }

  /**
   * @internal
   * An add for a port already in the model is a component recreation whose
   * batched add never lands — re-apply its authored (non-measured) properties.
   */
  addPort(nodeId: string, port: Port): void {
    const exists = this.flowCore.getNodeById(nodeId)?.measuredPorts?.some(({ id }) => id === port.id);
    if (exists) {
      this.applyPortChanges(nodeId, [{ portId: port.id, portChanges: omitProperties(port, MEASURED_PORT_PROPERTIES) }]);
    }

    this.flowCore.portBatchProcessor.processAdd(nodeId, port, this.onPortAddsFlush);
  }

  /**
   * @internal
   */
  deletePort(nodeId: string, portId: string): void {
    this.flowCore.portBatchProcessor.processDelete(nodeId, portId, this.onPortDeletesFlush);
  }

  /**
   * @internal
   * Filters out updates where no property actually differs from current state.
   */
  applyPortChanges(nodeId: string, portUpdates: PortUpdate[]): void {
    const node = this.flowCore.getNodeById(nodeId);
    if (!node) {
      return;
    }

    const filteredUpdates = this.filterUnchangedPortUpdates(node, this.rejectZeroSizePortGeometry(portUpdates));
    if (filteredUpdates.length === 0) {
      return;
    }

    for (const portUpdate of filteredUpdates) {
      this.flowCore.portBatchProcessor.processUpdate(nodeId, portUpdate, this.onPortUpdatesFlush);
    }
  }

  /**
   * @internal
   * See {@link addPort} — same recreation handling for labels.
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    const exists = this.flowCore.getEdgeById(edgeId)?.measuredLabels?.some(({ id }) => id === label.id);
    if (exists) {
      this.applyEdgeLabelChanges(edgeId, [
        { labelId: label.id, labelChanges: omitProperties(label, MEASURED_LABEL_PROPERTIES) },
      ]);
    }

    this.flowCore.labelBatchProcessor.processAdd(edgeId, label, this.onLabelAddsFlush);
  }

  /**
   * @internal
   */
  deleteEdgeLabel(edgeId: string, labelId: string): void {
    this.flowCore.labelBatchProcessor.processDelete(edgeId, labelId, this.onLabelDeletesFlush);
  }

  /**
   * @internal
   * Filters out updates where no property actually differs from current state.
   */
  applyEdgeLabelChanges(edgeId: string, labelUpdates: LabelUpdate[]): void {
    const filteredUpdates = this.filterUnchangedLabelUpdates(edgeId, this.rejectZeroSizeLabelGeometry(labelUpdates));
    if (filteredUpdates.length === 0) {
      return;
    }

    for (const labelUpdate of filteredUpdates) {
      this.flowCore.labelBatchProcessor.processUpdate(edgeId, labelUpdate, this.onLabelUpdatesFlush);
    }
  }

  /**
   * Drops measured geometry (size + position) from updates carrying a 0×0 size —
   * the display: none signature — so hiding an observed port never corrupts its
   * last valid geometry. Non-measured properties in the same update still apply.
   */
  private rejectZeroSizePortGeometry(portUpdates: PortUpdate[]): PortUpdate[] {
    return portUpdates
      .map((update) =>
        isZeroSize(update.portChanges.size)
          ? { ...update, portChanges: omitProperties(update.portChanges, MEASURED_PORT_PROPERTIES) }
          : update
      )
      .filter(({ portChanges }) => Object.keys(portChanges).length > 0);
  }

  /**
   * See {@link rejectZeroSizePortGeometry} — same guard for edge labels.
   */
  private rejectZeroSizeLabelGeometry(labelUpdates: LabelUpdate[]): LabelUpdate[] {
    return labelUpdates
      .map((update) =>
        isZeroSize(update.labelChanges.size)
          ? { ...update, labelChanges: omitProperties(update.labelChanges, MEASURED_LABEL_PROPERTIES) }
          : update
      )
      .filter(({ labelChanges }) => Object.keys(labelChanges).length > 0);
  }

  /**
   * Filters out port updates where none of the changed properties actually differ from current state.
   */
  private filterUnchangedPortUpdates(node: Node, portUpdates: PortUpdate[]): PortUpdate[] {
    const measuredPortsMap = new Map((node.measuredPorts ?? []).map((port) => [port.id, port]));

    return portUpdates.filter(({ portId, portChanges }) => {
      const measuredPort = measuredPortsMap.get(portId);
      return !!measuredPort && hasChangedProperties(measuredPort, portChanges);
    });
  }

  /**
   * Filters out label updates where none of the changed properties actually differ from current state.
   */
  private filterUnchangedLabelUpdates(edgeId: string, labelUpdates: LabelUpdate[]): LabelUpdate[] {
    const edge = this.flowCore.getEdgeById(edgeId);
    if (!edge) {
      return [];
    }

    const measuredLabelsMap = new Map((edge.measuredLabels ?? []).map((label) => [label.id, label]));

    return labelUpdates.filter(({ labelId, labelChanges }) => {
      const label = measuredLabelsMap.get(labelId);
      return !!label && hasChangedProperties(label, labelChanges);
    });
  }
}
