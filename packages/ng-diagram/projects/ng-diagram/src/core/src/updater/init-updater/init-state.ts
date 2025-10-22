import { FlowCore } from '../../flow-core';
import { Edge, EdgeLabel, Node, Point, Port, Size } from '../../types';
import { isValidPosition, isValidSize } from '../../utils/measurement-validation';

/** Separator used to create compound IDs (e.g., "nodeId->portId") */
const ID_SEPARATOR = '->';

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
  /** Ports added during initialization, keyed by compound ID (nodeId->portId) */
  readonly initializedPorts = new Map<string, Port>();

  /** Edge labels added during initialization, keyed by compound ID (edgeId->labelId) */
  readonly initializedLabels = new Map<string, EdgeLabel>();

  /** Node sizes collected during measurement, keyed by nodeId */
  readonly nodeSizes = new Map<string, Size>();

  /** Port measurements (size + position), keyed by compound ID (nodeId->portId) */
  readonly portRects = new Map<string, { size: Size; position: Point }>();

  /** Edge label sizes collected during measurement, keyed by compound ID (edgeId->labelId) */
  readonly edgeLabelSizes = new Map<string, Size>();

  /** All ports that need measurement (both pre-existing and newly added), keyed by compound ID */
  readonly portsToMeasure = new Set<string>();

  /** All labels that need measurement (both pre-existing and newly added), keyed by compound ID */
  readonly labelsToMeasure = new Set<string>();

  /** Nodes that have valid measurements, keyed by nodeId */
  readonly measuredNodes = new Set<string>();

  /** Ports that have valid measurements, keyed by compound ID (nodeId->portId) */
  readonly measuredPorts = new Set<string>();

  /** Labels that have valid measurements, keyed by compound ID (edgeId->labelId) */
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
    const key = this.getCompoundId(nodeId, portId);
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
    const key = this.getCompoundId(edgeId, labelId);
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
    const key = this.getCompoundId(nodeId, port.id);
    this.initializedPorts.set(key, port);
    this.portsToMeasure.add(key);
  }

  /**
   * Adds a new edge label created during initialization.
   * Stores the label data and records it in the expected measurements count.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param label - The label object to add
   */
  addLabel(edgeId: string, label: EdgeLabel): void {
    const key = this.getCompoundId(edgeId, label.id);
    this.initializedLabels.set(key, label);
    this.labelsToMeasure.add(key);
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
      if (isValidSize(node.size)) {
        this.measuredNodes.add(node.id);
      }

      for (const port of node.measuredPorts ?? []) {
        this.trackPreExistingPort(node.id, port.id);

        if (isValidSize(port.size) && isValidPosition(port.position)) {
          const key = this.getCompoundId(node.id, port.id);
          this.measuredPorts.add(key);
        }
      }
    }

    for (const edge of edges) {
      for (const label of edge.measuredLabels ?? []) {
        this.trackPreExistingLabel(edge.id, label.id);

        if (isValidSize(label.size)) {
          const key = this.getCompoundId(edge.id, label.id);
          this.measuredLabels.add(key);
        }
      }
    }
  }

  /**
   * Checks if all entities have received valid measurements.
   * Compares the count of measured entities against expected counts.
   *
   * @param nodeCount - Expected number of nodes
   * @returns True if all nodes, ports, and labels have valid measurements
   */
  allEntitiesHaveMeasurements(nodeCount: number): boolean {
    const allNodesMeasured = this.measuredNodes.size === nodeCount;
    const allPortsMeasured = this.measuredPorts.size === this.portsToMeasure.size;
    const allLabelsMeasured = this.measuredLabels.size === this.labelsToMeasure.size;

    return allNodesMeasured && allPortsMeasured && allLabelsMeasured;
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
   * Creates a compound ID from entity and item IDs.
   * Used to uniquely identify ports (nodeId->portId) and labels (edgeId->labelId).
   *
   * @param entityId - The parent entity ID (nodeId or edgeId)
   * @param itemId - The item ID (portId or labelId)
   * @returns Compound ID string (e.g., "node1->port1")
   */
  private getCompoundId(entityId: string, itemId: string): string {
    return `${entityId}${ID_SEPARATOR}${itemId}`;
  }

  /**
   * Splits a compound ID back into entity and item IDs.
   *
   * @param id - The compound ID to split (e.g., "node1->port1")
   * @returns Object with entityId and itemId
   */
  private splitCompoundId(id: string): { entityId: string; itemId: string } {
    const [entityId, itemId] = id.split(ID_SEPARATOR);
    return { entityId, itemId };
  }

  /**
   * Records that a port exists and should be counted in the expected measurements.
   * Used to track pre-existing ports so we can verify all ports have measurements.
   *
   * @param nodeId - The node ID the port belongs to
   * @param portId - The port ID
   */
  private trackPreExistingPort(nodeId: string, portId: string): void {
    const key = this.getCompoundId(nodeId, portId);
    this.portsToMeasure.add(key);
  }

  /**
   * Records that a label exists and should be counted in the expected measurements.
   * Used to track pre-existing labels so we can verify all labels have measurements.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param labelId - The label ID
   */
  private trackPreExistingLabel(edgeId: string, labelId: string): void {
    const key = this.getCompoundId(edgeId, labelId);
    this.labelsToMeasure.add(key);
  }

  /**
   * Groups initialized ports by their parent node ID.
   *
   * @returns Map of nodeId to array of ports
   */
  private groupPortsByNode(): Map<string, Port[]> {
    const nodePortsMap = new Map<string, Port[]>();

    for (const [key, port] of this.initializedPorts.entries()) {
      const { entityId: nodeId } = this.splitCompoundId(key);
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

    for (const [key, label] of this.initializedLabels.entries()) {
      const { entityId: edgeId } = this.splitCompoundId(key);
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
      const size = this.nodeSizes.get(node.id) || node.size;
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
          const key = this.getCompoundId(node.id, port.id);
          const rect = this.portRects.get(key);

          if (!rect) return port;

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
          const key = this.getCompoundId(edge.id, label.id);
          const size = this.edgeLabelSizes.get(key);

          if (!size) return label;

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
