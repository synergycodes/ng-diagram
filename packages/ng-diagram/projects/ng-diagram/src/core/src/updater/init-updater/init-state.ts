import { FlowCore } from '../../flow-core';
import { Edge, EdgeLabel, Node, Point, Port, Size } from '../../types';
import { isValidPosition, isValidSize } from '../../utils/measurement-validation';

/**
 * Separator of the lookup keys built by `itemKey` (e.g., "nodeId->portId").
 * Keys are only compared for equality and are never split back into ids.
 */
const ID_SEPARATOR = '->';

/**
 * Escapes `\` and `>` in an id, so the separator never appears unescaped inside a key part.
 * The id is converted with `String()` first, so ids that are not strings at runtime (e.g. numbers) do not throw.
 */
const escapeKeyPart = (id: string): string => String(id).replace(/[\\>]/g, '\\$&');

/**
 * Builds the lookup key of an item (port or label) of a parent entity (node or edge).
 * Both parts are escaped, so two different (parent, item) pairs never share a key.
 * Ids without `\` or `>` keep the plain form, e.g. "node1->port1".
 *
 * @param entityId - The parent entity ID (nodeId or edgeId)
 * @param itemId - The item ID (portId or labelId)
 * @returns The lookup key, compared for equality only
 */
const itemKey = (entityId: string, itemId: string): string =>
  `${escapeKeyPart(entityId)}${ID_SEPARATOR}${escapeKeyPart(itemId)}`;

/** A port added during initialization, together with the id of its node. */
export interface InitializedPortEntry {
  nodeId: string;
  port: Port;
}

/** An edge label added during initialization, together with the id of its edge. */
export interface InitializedLabelEntry {
  edgeId: string;
  label: EdgeLabel;
}

/** Identifies a port that must be measured during initialization. */
export interface PortRef {
  nodeId: string;
  portId: string;
}

/** Identifies an edge label that must be measured during initialization. */
export interface LabelRef {
  edgeId: string;
  labelId: string;
}

/**
 * Decides which entities create measurement expectations during initialization.
 * Effectively hidden elements render as `display: none` and never deliver valid
 * measurements — expecting them would block init until the safety timeout.
 */
export interface InitMeasurementFilter {
  isNodeMeasurable(nodeId: string): boolean;
  isPortMeasurable(nodeId: string, portId: string): boolean;
  isLabelMeasurable(edgeId: string, labelId: string): boolean;
}

const MEASURE_EVERYTHING: InitMeasurementFilter = {
  isNodeMeasurable: () => true,
  isPortMeasurable: () => true,
  isLabelMeasurable: () => true,
};

/**
 * Represents the complete state during initialization.
 *
 * Purpose: Single source of truth for all initialization data collection and state application.
 *
 * How it works:
 * - Collects entity data (new ports/labels added during init)
 * - Tracks measurement data (sizes, positions) as they arrive
 * - Maintains sets of what needs to be measured vs. what has been measured
 * - Applies all collected data to diagram state in a single batch update
 */
export class InitState {
  constructor(private readonly measurementFilter: InitMeasurementFilter = MEASURE_EVERYTHING) {}

  /** Ports added during initialization with the id of their node, keyed by item key (nodeId->portId) */
  readonly initializedPorts = new Map<string, InitializedPortEntry>();

  /** Edge labels added during initialization with the id of their edge, keyed by item key (edgeId->labelId) */
  readonly initializedLabels = new Map<string, InitializedLabelEntry>();

  /** Node sizes collected during measurement, keyed by nodeId */
  readonly nodeSizes = new Map<string, Size>();

  /** Port measurements (size + position), keyed by item key (nodeId->portId) */
  readonly portRects = new Map<string, { size: Size; position: Point }>();

  /** Edge label sizes collected during measurement, keyed by item key (edgeId->labelId) */
  readonly edgeLabelSizes = new Map<string, Size>();

  /** All ports that need measurement (both pre-existing and newly added): item key (nodeId->portId) to the port ref */
  readonly portsToMeasure = new Map<string, PortRef>();

  /** All labels that need measurement (both pre-existing and newly added): item key (edgeId->labelId) to the label ref */
  readonly labelsToMeasure = new Map<string, LabelRef>();

  /** All nodes that need measurement (rendered nodes at init time), keyed by nodeId */
  readonly nodesToMeasure = new Set<string>();

  /** Nodes that have valid measurements, keyed by nodeId */
  readonly measuredNodes = new Set<string>();

  /** Ports that have valid measurements, keyed by item key (nodeId->portId) */
  readonly measuredPorts = new Set<string>();

  /** Labels that have valid measurements, keyed by item key (edgeId->labelId) */
  readonly measuredLabels = new Set<string>();

  /**
   * Records a node measurement and marks it as measured if valid.
   *
   * @param nodeId - The node ID
   * @param size - The measured size
   */
  trackNodeMeasurement(nodeId: string, size: Size): void {
    this.nodeSizes.set(nodeId, size);

    if (isValidSize(size)) {
      this.measuredNodes.add(nodeId);
    }
  }

  /**
   * Records a port measurement and marks it as measured if valid.
   *
   * @param nodeId - The node ID the port belongs to
   * @param portId - The port ID
   * @param size - The measured size
   * @param position - The measured position
   */
  trackPortMeasurement(nodeId: string, portId: string, size: Size, position: Point): void {
    const key = itemKey(nodeId, portId);
    this.portRects.set(key, { size, position });

    if (isValidSize(size) && isValidPosition(position)) {
      this.measuredPorts.add(key);
    }
  }

  /**
   * Records an edge label measurement and marks it as measured if valid.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param labelId - The label ID
   * @param size - The measured size
   */
  trackLabelMeasurement(edgeId: string, labelId: string, size: Size): void {
    const key = itemKey(edgeId, labelId);
    this.edgeLabelSizes.set(key, size);

    if (isValidSize(size)) {
      this.measuredLabels.add(key);
    }
  }

  /**
   * Adds a new port created during initialization.
   * Stores the port data and records it in the expected measurements count.
   *
   * @param nodeId - The node ID the port belongs to
   * @param port - The port object to add
   */
  addPort(nodeId: string, port: Port): void {
    const key = itemKey(nodeId, port.id);
    this.initializedPorts.set(key, { nodeId, port });

    // Hidden ports still land in the model (edges may reference them) but
    // create no measurement expectation — they cannot deliver a valid size.
    if (this.measurementFilter.isPortMeasurable(nodeId, port.id)) {
      this.portsToMeasure.set(key, { nodeId, portId: port.id });
    }
  }

  /**
   * Adds a new edge label created during initialization.
   * Stores the label data and records it in the expected measurements count.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param label - The label object to add
   */
  addLabel(edgeId: string, label: EdgeLabel): void {
    const key = itemKey(edgeId, label.id);
    this.initializedLabels.set(key, { edgeId, label });

    // See addPort — hidden labels create no measurement expectation.
    if (this.measurementFilter.isLabelMeasurable(edgeId, label.id)) {
      this.labelsToMeasure.set(key, { edgeId, labelId: label.id });
    }
  }

  /**
   * Collects pre-existing entities from the initial diagram state.
   * Records all ports and labels in the expected count, and marks those with valid measurements as measured.
   *
   * @param nodes - Initial nodes to scan for ports
   * @param edges - Initial edges to scan for labels
   */
  collectAlreadyMeasuredItems(nodes: Node[], edges: Edge[]): void {
    for (const node of nodes) {
      // Effectively hidden nodes render as display: none and never deliver a
      // valid measurement — expecting them would block init until the timeout.
      const nodeMeasurable = this.measurementFilter.isNodeMeasurable(node.id);
      if (nodeMeasurable) {
        this.nodesToMeasure.add(node.id);
      }

      if (isValidSize(node.size)) {
        this.measuredNodes.add(node.id);
      }

      for (const port of node.measuredPorts ?? []) {
        if (nodeMeasurable && this.measurementFilter.isPortMeasurable(node.id, port.id)) {
          this.trackPreExistingPort(node.id, port.id);
        }

        if (isValidSize(port.size) && isValidPosition(port.position)) {
          const key = itemKey(node.id, port.id);
          this.measuredPorts.add(key);
        }
      }
    }

    for (const edge of edges) {
      for (const label of edge.measuredLabels ?? []) {
        if (this.measurementFilter.isLabelMeasurable(edge.id, label.id)) {
          this.trackPreExistingLabel(edge.id, label.id);
        }

        if (isValidSize(label.size)) {
          const key = itemKey(edge.id, label.id);
          this.measuredLabels.add(key);
        }
      }
    }
  }

  /**
   * Checks if all entities have received valid measurements.
   * Verifies that all tracked nodes, ports, and labels have been measured.
   *
   * @returns True if all nodes, ports, and labels have valid measurements
   */
  allEntitiesHaveMeasurements(): boolean {
    // Subset checks, not size comparisons: hidden entities can carry valid
    // pre-loaded measurements (counted in measured*) without being expected
    // (absent from *ToMeasure).
    const allNodesMeasured = [...this.nodesToMeasure].every((id) => this.measuredNodes.has(id));
    const allPortsMeasured = [...this.portsToMeasure.keys()].every((key) => this.measuredPorts.has(key));
    const allLabelsMeasured = [...this.labelsToMeasure.keys()].every((key) => this.measuredLabels.has(key));

    return allNodesMeasured && allPortsMeasured && allLabelsMeasured;
  }

  /**
   * Re-applies the measurement filter to the expectation sets.
   * Called when hidden state changes during initialization (e.g. a template
   * declares an element hidden after expectations were collected) so newly
   * hidden entities stop blocking init. Entities that became visible are not
   * re-added — they re-measure through the observer path without blocking.
   */
  pruneUnmeasurableExpectations(): void {
    for (const id of [...this.nodesToMeasure]) {
      if (!this.measurementFilter.isNodeMeasurable(id)) {
        this.nodesToMeasure.delete(id);
      }
    }

    for (const [key, { nodeId, portId }] of [...this.portsToMeasure]) {
      if (
        !this.measurementFilter.isNodeMeasurable(nodeId) ||
        !this.measurementFilter.isPortMeasurable(nodeId, portId)
      ) {
        this.portsToMeasure.delete(key);
      }
    }

    for (const [key, { edgeId, labelId }] of [...this.labelsToMeasure]) {
      if (!this.measurementFilter.isLabelMeasurable(edgeId, labelId)) {
        this.labelsToMeasure.delete(key);
      }
    }
  }

  /**
   * Applies all collected initialization data to the diagram state in a single batch update.
   * Merges new ports/labels with existing ones, applies measurements, and updates the flow state.
   *
   * @param flowCore - The FlowCore instance to update
   */
  applyToDiagramState(flowCore: FlowCore): void {
    const { nodes, edges, ...restState } = flowCore.getState();

    const nodePortsMap = this.groupPortsByNode();
    const edgeLabelsMap = this.groupLabelsByEdge();

    const updatedNodes = this.updateNodes(nodes, nodePortsMap);
    const updatedEdges = this.updateEdges(edges, edgeLabelsMap);

    flowCore.setState({
      ...restState,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  }

  /**
   * Records that a port exists and should be counted in the expected measurements.
   * Used to track pre-existing ports so we can verify all ports have measurements.
   *
   * @param nodeId - The node ID the port belongs to
   * @param portId - The port ID
   */
  private trackPreExistingPort(nodeId: string, portId: string): void {
    const key = itemKey(nodeId, portId);
    this.portsToMeasure.set(key, { nodeId, portId });
  }

  /**
   * Records that a label exists and should be counted in the expected measurements.
   * Used to track pre-existing labels so we can verify all labels have measurements.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param labelId - The label ID
   */
  private trackPreExistingLabel(edgeId: string, labelId: string): void {
    const key = itemKey(edgeId, labelId);
    this.labelsToMeasure.set(key, { edgeId, labelId });
  }

  /**
   * Groups initialized ports by their parent node ID.
   *
   * @returns Map of nodeId to array of ports
   */
  private groupPortsByNode(): Map<string, Port[]> {
    const nodePortsMap = new Map<string, Port[]>();

    for (const { nodeId, port } of this.initializedPorts.values()) {
      const nodePorts = nodePortsMap.get(nodeId) || [];
      nodePorts.push(port);
      nodePortsMap.set(nodeId, nodePorts);
    }

    return nodePortsMap;
  }

  /**
   * Groups initialized labels by their parent edge ID.
   *
   * @returns Map of edgeId to array of labels
   */
  private groupLabelsByEdge(): Map<string, EdgeLabel[]> {
    const edgeLabelsMap = new Map<string, EdgeLabel[]>();

    for (const { edgeId, label } of this.initializedLabels.values()) {
      const edgeLabels = edgeLabelsMap.get(edgeId) || [];
      edgeLabels.push(label);
      edgeLabelsMap.set(edgeId, edgeLabels);
    }

    return edgeLabelsMap;
  }

  /**
   * Updates nodes with new ports and measurements.
   * Merges initialized ports with existing ports (new ports take priority) and applies measurements.
   *
   * @param nodes - Current nodes from state
   * @param nodePortsMap - Map of newly initialized ports grouped by node
   * @returns Updated nodes array
   */
  private updateNodes(nodes: Node[], nodePortsMap: Map<string, Port[]>): Node[] {
    return nodes.map((node) => {
      // On force-finish the collected size can be invalid (e.g. 0×0 from a
      // display: none element) — it must not overwrite the node's existing size.
      const collectedSize = this.nodeSizes.get(node.id);
      const size = collectedSize && isValidSize(collectedSize) ? collectedSize : node.size;
      const newPorts = nodePortsMap.get(node.id);

      // Merge existing and new ports (new ports take priority)
      const portsById = new Map<string, Port>();

      if (node.measuredPorts) {
        for (const port of node.measuredPorts) {
          portsById.set(port.id, port);
        }
      }

      if (newPorts) {
        for (const port of newPorts) {
          portsById.set(port.id, port);
        }
      }

      let measuredPorts = portsById.size > 0 ? Array.from(portsById.values()) : undefined;

      if (measuredPorts) {
        measuredPorts = measuredPorts.map((port) => {
          const key = itemKey(node.id, port.id);
          const rect = this.portRects.get(key);

          // Same force-finish guard as node sizes: keep the port's existing
          // geometry when the collected measurement is invalid.
          if (!rect || !isValidSize(rect.size) || !isValidPosition(rect.position)) return port;

          return {
            ...port,
            size: rect.size,
            position: rect.position,
          };
        });
      }

      return {
        ...node,
        size,
        measuredPorts,
      };
    });
  }

  /**
   * Updates edges with new labels and measurements.
   * Merges initialized labels with existing labels (new labels take priority) and applies measurements.
   *
   * @param edges - Current edges from state
   * @param edgeLabelsMap - Map of newly initialized labels grouped by edge
   * @returns Updated edges array
   */
  private updateEdges(edges: Edge[], edgeLabelsMap: Map<string, EdgeLabel[]>): Edge[] {
    return edges.map((edge) => {
      const newLabels = edgeLabelsMap.get(edge.id);

      // Merge existing and new labels (new labels take priority)
      const labelsById = new Map<string, EdgeLabel>();

      if (edge.measuredLabels) {
        for (const label of edge.measuredLabels) {
          labelsById.set(label.id, label);
        }
      }

      if (newLabels) {
        for (const label of newLabels) {
          labelsById.set(label.id, label);
        }
      }

      let measuredLabels = labelsById.size > 0 ? Array.from(labelsById.values()) : undefined;

      if (measuredLabels) {
        measuredLabels = measuredLabels.map((label) => {
          const key = itemKey(edge.id, label.id);
          const size = this.edgeLabelSizes.get(key);

          // Same force-finish guard as node sizes: keep the label's existing
          // size when the collected measurement is invalid.
          if (!size || !isValidSize(size)) return label;

          return { ...label, size };
        });
      }

      return {
        ...edge,
        measuredLabels,
      };
    });
  }
}
