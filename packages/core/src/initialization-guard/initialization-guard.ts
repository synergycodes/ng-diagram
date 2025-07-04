import { FlowCore } from '../flow-core';
import { EdgeLabel, FlowState, Metadata, MiddlewaresConfigFromMiddlewares, Port } from '../types';

export class InitializationGuard {
  private onInitialized: () => void = () => null;
  public isInitialized = false;

  private measuredNodes = new Map<string, boolean>();
  private measuredPorts = new Map<string, boolean>();
  private measuredEdgeLabels = new Map<string, boolean>();

  constructor(private readonly flowCore: FlowCore) {}

  start(onInitialized: () => void) {
    this.isInitialized = false;
    this.onInitialized = onInitialized;
    const { nodes, edges } = this.flowCore.getState();
    nodes.forEach((node) => {
      this.measuredNodes.set(node.id, !!node.size);
      node.ports?.forEach((port) => {
        this.addPort(node.id, port, true);
      });
    });
    edges.forEach((edge) => {
      edge.labels?.forEach((label) => {
        this.addEdgeLabel(edge.id, label, true);
      });
    });
    this.checkIfInitialized();
  }

  initNodeSize(nodeId: string, size: { width: number; height: number }) {
    if (!this.measuredNodes.has(nodeId) || this.measuredNodes.get(nodeId)) {
      return;
    }
    this.measuredNodes.set(nodeId, true);
    this.updateState({
      nodes: this.flowCore
        .getState()
        .nodes.map((node) =>
          node.id === nodeId ? { ...node, size: { width: size.width, height: size.height } } : node
        ),
    });
  }

  addPort(nodeId: string, port: Port, alreadyExist = false) {
    const portKey = this.getPortKey(nodeId, port.id);
    if (this.measuredPorts.has(portKey)) {
      return;
    }
    const isMeasured = !!port.size && !!port.position;
    this.measuredPorts.set(portKey, isMeasured);
    if (alreadyExist) {
      return;
    }
    this.updateState({
      nodes: this.flowCore
        .getState()
        .nodes.map((node) => (node.id === nodeId ? { ...node, ports: [...(node.ports || []), port] } : node)),
    });
  }

  initPortSizeAndPosition(
    nodeId: string,
    portId: string,
    size: { width: number; height: number },
    position: { x: number; y: number }
  ) {
    const portKey = this.getPortKey(nodeId, portId);
    if (!this.measuredPorts.has(portKey) || this.measuredPorts.get(portKey)) {
      return;
    }
    this.measuredPorts.set(portKey, true);
    this.updateState({
      nodes: this.flowCore
        .getState()
        .nodes.map((node) =>
          node.id === nodeId
            ? { ...node, ports: node.ports?.map((port) => (port.id === portId ? { ...port, size, position } : port)) }
            : node
        ),
    });
  }

  addEdgeLabel(edgeId: string, label: EdgeLabel, alreadyExist = false) {
    const labelKey = this.getEdgeLabelKey(edgeId, label.id);
    if (this.measuredEdgeLabels.has(labelKey)) {
      return;
    }
    const isMeasured = !!label.size;
    this.measuredEdgeLabels.set(labelKey, isMeasured);
    if (alreadyExist) {
      return;
    }
    this.updateState({
      edges: this.flowCore
        .getState()
        .edges.map((edge) => (edge.id === edgeId ? { ...edge, labels: [...(edge.labels || []), label] } : edge)),
    });
  }

  initEdgeLabelSize(edgeId: string, labelId: string, size: { width: number; height: number }) {
    const labelKey = this.getEdgeLabelKey(edgeId, labelId);
    if (!this.measuredEdgeLabels.has(labelKey) || this.measuredEdgeLabels.get(labelKey)) {
      return;
    }
    this.measuredEdgeLabels.set(labelKey, true);
    this.updateState({
      edges: this.flowCore.getState().edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              labels: edge.labels?.map((label) => (label.id === labelId ? { ...label, size } : label)),
            }
          : edge
      ),
    });
  }

  private getPortKey(nodeId: string, portId: string) {
    return `${nodeId}->${portId}`;
  }

  private getEdgeLabelKey(edgeId: string, labelId: string) {
    return `${edgeId}->${labelId}`;
  }

  private updateState(state: Partial<FlowState>) {
    const currentState = this.flowCore.getState();
    this.flowCore.setState({
      ...currentState,
      ...state,
    } as FlowState<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>);
    this.checkIfInitialized();
  }

  private checkIfInitialized() {
    const allNodesMeasured = Array.from(this.measuredNodes.values()).every((value) => value);
    const allPortsMeasured = Array.from(this.measuredPorts.values()).every((value) => value);
    const allEdgeLabelsMeasured = Array.from(this.measuredEdgeLabels.values()).every((value) => value);
    if (allNodesMeasured && allPortsMeasured && allEdgeLabelsMeasured) {
      this.isInitialized = true;
      this.onInitialized();
    }
  }
}
