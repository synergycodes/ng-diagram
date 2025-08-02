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

  async start() {
    if (this.flowCore.getState()?.nodes?.length > 0) {
      await this.checkIfInitialized();

      // Call init to make sure all scheduled data is processed
      for (const initializer of this.getInitializers()) {
        initializer.init();
      }
    }

    this.isInitialized = true;
    return;
  }

  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    this.nodeSizeInitializer.scheduleInit(nodeId, size);
  }

  addPort(nodeId: string, port: Port) {
    const key = this.getCompoundId(nodeId, port.id);

    this.portInitializer.scheduleInit(key, port);
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

      this.portRectInitializer.scheduleInit(key, { ...size, ...position });
    }
  }

  addEdgeLabel(edgeId: string, label: EdgeLabel) {
    this.edgeLabelInitializer.scheduleInit(edgeId, label);
  }

  applyEdgeLabelSize(edgeId: string, labelId: string, size: Size) {
    const key = this.getCompoundId(edgeId, labelId);

    this.edgeLabelSizeInitializer.scheduleInit(key, size);
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

  private async checkIfInitialized() {
    return Promise.all(this.getInitializers().map((initializer) => initializer.waitForFinish()));
  }

  private createInitializers() {
    const { flowCore } = this;

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
    });

    const edgeLabelInitializer = new BatchInitializer<EdgeLabel>((edgeLabelMap) => {
      const { edges, ...state } = flowCore.getState();

      const updatedEdges = edges.map((edge) => {
        const label = edgeLabelMap.get(edge.id);
        if (label) {
          return { ...edge, labels: [...(edge.labels ?? []), label] };
        }
        return edge;
      });

      flowCore.setState({ ...state, edges: updatedEdges });
    });

    const edgeLabelSizeInitializer = new BatchInitializer<Size>((edgeLabelSizeMap) => {
      const { edges, ...state } = flowCore.getState();

      const updatedEdges = edges.map((edge) => ({
        ...edge,
        labels: edge.labels?.map((label) => {
          const size = edgeLabelSizeMap.get(this.getCompoundId(edge.id, label.id));

          if (!size) {
            return label;
          }

          return { ...label, size };
        }),
      }));

      flowCore.setState({ ...state, edges: updatedEdges });
    });

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
          ports: nodePortsMap.get(node.id) ?? node.ports,
        };
      });

      flowCore.setState({ ...state, nodes: updatedNodes });
    });

    const portRectInitializer = new BatchInitializer<Rect>((portRectMap) => {
      const { nodes, ...state } = flowCore.getState();

      const updatedNodes = nodes.map((node) => {
        return {
          ...node,
          ports: node.ports?.map((port) => {
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
    });

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
