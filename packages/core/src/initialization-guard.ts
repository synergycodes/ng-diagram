import { FlowCore } from './flow-core';

export class InitializationGuard {
  private onInitialized: () => void = () => {};
  private nodesToMeasure = new Set<string>();

  constructor(private readonly flowCore: FlowCore) {}

  start(onInitialized: () => void) {
    this.onInitialized = onInitialized;
    const { nodes } = this.flowCore.getState();
    nodes.forEach((node) => {
      this.nodesToMeasure.add(node.id);
    });
    this.checkIfInitialized();
  }

  initNodeSize(nodeId: string, size: { width: number; height: number }) {
    const state = this.flowCore.getState();
    this.nodesToMeasure.delete(nodeId);
    this.flowCore.setState({
      ...state,
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, size: { width: size.width, height: size.height } } : node
      ),
    });
    this.checkIfInitialized();
  }

  private checkIfInitialized() {
    if (this.nodesToMeasure.size === 0) {
      this.onInitialized();
    }
  }
}
