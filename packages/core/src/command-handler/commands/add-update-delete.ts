import type { CommandHandler, Edge, EdgeLabel, Node, Port } from '../../types';
import { getPointOnPath } from '../../utils';

export interface AddNodesCommand {
  name: 'addNodes';
  nodes: Node[];
}

export const addNodes = (commandHandler: CommandHandler, command: AddNodesCommand): void => {
  const { nodes } = command;
  commandHandler.flowCore.applyUpdate({ nodesToAdd: nodes }, 'addNodes');
};

export interface UpdateNodeCommand {
  name: 'updateNode';
  id: string;
  nodeChanges: Partial<Node>;
}

export const updateNode = (commandHandler: CommandHandler, command: UpdateNodeCommand): void => {
  const { id, nodeChanges } = command;
  commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id, ...nodeChanges }] }, 'updateNode');
};

export interface DeleteNodesCommand {
  name: 'deleteNodes';
  ids: string[];
}

export const deleteNodes = (commandHandler: CommandHandler, command: DeleteNodesCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { ids } = command;
  const edgesToDeleteIds = new Set<string>();
  const nodesToDeleteIds = new Set<string>(ids);
  edges.forEach((edge) => {
    if (nodesToDeleteIds.has(edge.source) || nodesToDeleteIds.has(edge.target)) {
      edgesToDeleteIds.add(edge.id);
    }
  });
  commandHandler.flowCore.applyUpdate(
    {
      nodesToRemove: Array.from(nodesToDeleteIds),
      edgesToRemove: edgesToDeleteIds.size > 0 ? Array.from(edgesToDeleteIds) : [],
    },
    'deleteNodes'
  );
};

export interface AddEdgesCommand {
  name: 'addEdges';
  edges: Edge[];
}

export const addEdges = (commandHandler: CommandHandler, command: AddEdgesCommand): void => {
  const { edges } = command;
  commandHandler.flowCore.applyUpdate({ edgesToAdd: edges }, 'addEdges');
};

export interface UpdateEdgeCommand {
  name: 'updateEdge';
  id: string;
  edgeChanges: Partial<Edge>;
}

export const updateEdge = (commandHandler: CommandHandler, command: UpdateEdgeCommand): void => {
  const { id, edgeChanges } = command;
  commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id, ...edgeChanges }] }, 'updateEdge');
};

export interface DeleteEdgesCommand {
  name: 'deleteEdges';
  ids: string[];
}

export const deleteEdges = (commandHandler: CommandHandler, command: DeleteEdgesCommand): void => {
  const { ids } = command;
  commandHandler.flowCore.applyUpdate({ edgesToRemove: ids }, 'deleteEdges');
};

export interface AddPortsCommand {
  name: 'addPorts';
  nodeId: string;
  ports: Port[];
}

export const addPorts = (commandHandler: CommandHandler, command: AddPortsCommand): void => {
  const { nodeId, ports } = command;
  const node = commandHandler.flowCore.getNodeById(nodeId);
  if (!node) {
    return;
  }
  const newPorts = [...(node.ports ?? []), ...ports];
  commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id: nodeId, ports: newPorts }] }, 'updateNode');
};

export interface UpdatePortsCommand {
  name: 'updatePorts';
  nodeId: string;
  ports: { portId: string; portChanges: Partial<Port> }[];
}

export const updatePorts = (commandHandler: CommandHandler, command: UpdatePortsCommand): void => {
  const { nodeId, ports } = command;
  const node = commandHandler.flowCore.getNodeById(nodeId);
  if (!node) {
    return;
  }
  const portsToUpdate = node.ports?.map((port) => {
    const portChanges = ports.find(({ portId }) => portId === port.id)?.portChanges;
    if (!portChanges) {
      return port;
    }
    return {
      ...port,
      ...portChanges,
    };
  });
  if (!portsToUpdate) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id: nodeId, ports: portsToUpdate }] }, 'updateNode');
};

export interface DeletePortsCommand {
  name: 'deletePorts';
  nodeId: string;
  portIds: string[];
}

export const deletePorts = (commandHandler: CommandHandler, command: DeletePortsCommand): void => {
  const { nodeId, portIds } = command;
  const node = commandHandler.flowCore.getNodeById(nodeId);
  if (!node) {
    return;
  }
  const leftPorts = node.ports?.filter((port) => !portIds.includes(port.id));
  commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id: nodeId, ports: leftPorts }] }, 'updateNode');
};

export interface AddEdgeLabelsCommand {
  name: 'addEdgeLabels';
  edgeId: string;
  labels: EdgeLabel[];
}

export const addEdgeLabels = (commandHandler: CommandHandler, command: AddEdgeLabelsCommand): void => {
  const { edgeId, labels } = command;
  const edge = commandHandler.flowCore.getEdgeById(edgeId);
  if (!edge) {
    return;
  }
  const points = edge.points || [];
  const newLabels = [
    ...(edge.labels ?? []),
    ...labels.map((label) => ({ ...label, position: getPointOnPath(points, label.positionOnEdge) })),
  ];
  commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id: edgeId, labels: newLabels }] }, 'updateEdge');
};

export interface UpdateEdgeLabelCommand {
  name: 'updateEdgeLabel';
  edgeId: string;
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

export const updateEdgeLabel = (commandHandler: CommandHandler, command: UpdateEdgeLabelCommand): void => {
  const { edgeId, labelId, labelChanges } = command;
  const edge = commandHandler.flowCore.getEdgeById(edgeId);
  if (!edge) {
    return;
  }
  const points = edge.points || [];
  const newLabels = edge.labels
    ?.map((label) => {
      if (label.id !== labelId) {
        return label;
      }
      return { ...label, ...(labelChanges || {}) };
    })
    .map((label) => ({ ...label, position: getPointOnPath(points, label.positionOnEdge) }));
  commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id: edgeId, labels: newLabels }] }, 'updateEdge');
};

export interface DeleteEdgeLabelsCommand {
  name: 'deleteEdgeLabels';
  edgeId: string;
  labelIds: string[];
}

export const deleteEdgeLabels = (commandHandler: CommandHandler, command: DeleteEdgeLabelsCommand): void => {
  const { edgeId, labelIds } = command;
  const edge = commandHandler.flowCore.getEdgeById(edgeId);
  if (!edge) {
    return;
  }
  const leftLabels = edge.labels?.filter((label) => !labelIds.includes(label.id));
  commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id: edgeId, labels: leftLabels }] }, 'updateEdge');
};
