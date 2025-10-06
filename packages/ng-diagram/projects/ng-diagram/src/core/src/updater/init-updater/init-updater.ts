import { FlowCore } from '../../flow-core';
import { EdgeLabel, Node, Port, Rect, Size } from '../../types';
import { BaseUpdater } from '../base-updater';
import { Updater } from '../updater.interface';
import { BatchInitializer } from './batch-initializer';

export class InitUpdater extends BaseUpdater implements Updater {
  public isInitialized = false;

  private nodeSizeInitializer: BatchInitializer<Size>;
  private edgeLabelSizeInitializer: BatchInitializer<Size>;
  private edgeLabelInitializer: BatchInitializer<EdgeLabel>;
  private portInitializer: BatchInitializer<Port>;
  private portRectInitializer: BatchInitializer<Rect>;

  constructor(private flowCore: FlowCore) {
    super();

    const {
      nodeSizeInitializer,
      edgeLabelSizeInitializer,
      edgeLabelInitializer,
      portInitializer,
      portRectInitializer,
    } = this.createInitializers();

    this.nodeSizeInitializer = nodeSizeInitializer;
    this.edgeLabelSizeInitializer = edgeLabelSizeInitializer;
    this.edgeLabelInitializer = edgeLabelInitializer;
    this.portInitializer = portInitializer;
    this.portRectInitializer = portRectInitializer;
  }

  start(onComplete?: () => void | Promise<void>) {
    // Start all initializers' stability timers
    // They will wait for data or resolve immediately based on their configuration
    Promise.all(this.getInitializers().map((initializer) => initializer.waitForFinish()))
      .then(async () => {
        // Execute completion callback if provided
        if (onComplete) {
          await onComplete();
        }
        // All initializers have stabilized and finished
        this.isInitialized = true;
        console.log('initialized - all initializers stable');
      })
      .catch(async (err) => {
        console.error('Initialization failed:', err);
        // Still call completion callback even on error
        if (onComplete) {
          await onComplete();
        }
        // Set initialized anyway to prevent hanging
        this.isInitialized = true;
      });
  }

  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    this.nodeSizeInitializer.batchChange(nodeId, size);
  }

  addPort(nodeId: string, port: Port) {
    const key = this.getCompoundId(nodeId, port.id);

    this.portInitializer.batchChange(key, port);
  }

  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]) {
    const node = this.flowCore.getNodeById(nodeId);

    if (!node) {
      return;
    }

    const portsToUpdate = this.getPortsToUpdate(node, ports);

    for (const { id, size, position } of portsToUpdate) {
      if (!size || !position) {
        continue;
      }

      const key = this.getCompoundId(nodeId, id);

      this.portRectInitializer.batchChange(key, { ...size, ...position });
    }
  }

  addEdgeLabel(edgeId: string, label: EdgeLabel) {
    const key = this.getCompoundId(edgeId, label.id);
    this.edgeLabelInitializer.batchChange(key, label);
  }

  applyEdgeLabelSize(edgeId: string, labelId: string, size: Size) {
    const key = this.getCompoundId(edgeId, labelId);

    this.edgeLabelSizeInitializer.batchChange(key, size);
  }

  private splitCompoundId(id: string) {
    const [entityId, itemId] = id.split(ID_SEPARATOR);

    return {
      entityId,
      itemId,
    };
  }

  private getCompoundId(edgeId: string, labelId: string) {
    return `${edgeId}${ID_SEPARATOR}${labelId}`;
  }

  private getInitializers() {
    return [
      this.nodeSizeInitializer,
      this.edgeLabelInitializer,
      this.edgeLabelSizeInitializer,
      this.portInitializer,
      this.portRectInitializer,
    ];
  }

  private createInitializers() {
    const { flowCore } = this;
    const state = flowCore.getState();
    const hasNodes = state.nodes.length > 0;
    const hasEdges = state.edges.length > 0;

    const nodeSizeInitializer = new BatchInitializer<Size>((nodeSizeMap) => {
      const { nodes, ...state } = flowCore.getState();

      const updatedNodes = nodes.map((node) => {
        const size = nodeSizeMap.get(node.id);
        if (size) {
          return { ...node, size };
        }
        return node;
      });

      flowCore.setState({ ...state, nodes: updatedNodes });
    }, hasNodes); // Only wait for node sizes if there are nodes

    const edgeLabelInitializer = new BatchInitializer<EdgeLabel>((edgeLabelMap) => {
      const { edges, ...state } = flowCore.getState();

      const edgeLabelsMap = new Map<string, EdgeLabel[]>();

      for (const [key, label] of edgeLabelMap.entries()) {
        const { entityId: edgeId } = this.splitCompoundId(key);
        edgeLabelsMap.set(edgeId, [...(edgeLabelsMap.get(edgeId) || []), label]);
      }

      const updatedEdges = edges.map((edge) => {
        const labels = edgeLabelsMap.get(edge.id);
        if (labels) {
          return { ...edge, measuredLabels: [...(edge.measuredLabels ?? []), ...labels] };
        }
        return edge;
      });

      flowCore.setState({ ...state, edges: updatedEdges });
    }, hasEdges); // Only wait for edge labels if there are edges

    const edgeLabelSizeInitializer = new BatchInitializer<Size>((edgeLabelSizeMap) => {
      const { edges, ...state } = flowCore.getState();

      const updatedEdges = edges.map((edge) => ({
        ...edge,
        measuredLabels: edge.measuredLabels?.map((label) => {
          const size = edgeLabelSizeMap.get(this.getCompoundId(edge.id, label.id));

          if (!size) {
            return label;
          }

          return { ...label, size };
        }),
      }));

      flowCore.setState({ ...state, edges: updatedEdges });
    }, hasEdges); // Only wait for edge label sizes if there are edges

    const portInitializer = new BatchInitializer<Port>((portMap) => {
      const { nodes, ...state } = flowCore.getState();

      const nodePortsMap = new Map<string, Port[]>();

      for (const [key, port] of portMap.entries()) {
        const { entityId: nodeId } = this.splitCompoundId(key);
        nodePortsMap.set(nodeId, [...(nodePortsMap.get(nodeId) || []), port]);
      }

      const updatedNodes = nodes.map((node) => {
        return {
          ...node,
          measuredPorts: nodePortsMap.get(node.id) ?? node.measuredPorts,
        };
      });

      flowCore.setState({ ...state, nodes: updatedNodes });
    }, hasNodes); // Only wait for ports if there are nodes

    const portRectInitializer = new BatchInitializer<Rect>((portRectMap) => {
      const { nodes, ...state } = flowCore.getState();

      const updatedNodes = nodes.map((node) => {
        return {
          ...node,
          measuredPorts: node.measuredPorts?.map((port) => {
            const key = this.getCompoundId(node.id, port.id);
            const rect = portRectMap.get(key);

            if (!rect) {
              return port;
            }

            const { width, height, x, y } = rect;

            return { ...port, size: { width, height }, position: { x, y } };
          }),
        };
      });

      flowCore.setState({ ...state, nodes: updatedNodes });
    }, hasNodes); // Only wait for port rectangles if there are nodes

    return {
      nodeSizeInitializer,
      edgeLabelInitializer,
      edgeLabelSizeInitializer,
      portInitializer,
      portRectInitializer,
    };
  }
}

const ID_SEPARATOR = '->';
