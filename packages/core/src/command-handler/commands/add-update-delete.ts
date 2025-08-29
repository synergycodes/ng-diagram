import type { CommandHandler, Edge, EdgeLabel, Node, Port } from '../../types';

export interface AddNodesCommand {
  name: 'addNodes';
  nodes: Node[];
}

export const addNodes = async (commandHandler: CommandHandler, command: AddNodesCommand) => {
  const { nodes } = command;
  await commandHandler.flowCore.applyUpdate({ nodesToAdd: nodes }, 'addNodes');
};

export interface UpdateNodeCommand {
  name: 'updateNode';
  id: string;
  nodeChanges: Partial<Node>;
}

export const updateNode = async (commandHandler: CommandHandler, command: UpdateNodeCommand) => {
  const { id, nodeChanges } = command;
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id, ...nodeChanges }] }, 'updateNode');
};

export interface UpdateNodesCommand {
  name: 'updateNodes';
  nodes: (Pick<Node, 'id'> & Partial<Node>)[];
}

export const updateNodes = async (commandHandler: CommandHandler, command: UpdateNodesCommand) => {
  const { nodes } = command;
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate: nodes }, 'updateNodes');
};

export interface DeleteNodesCommand {
  name: 'deleteNodes';
  ids: string[];
}

export const deleteNodes = async (commandHandler: CommandHandler, command: DeleteNodesCommand) => {
  const { edges } = commandHandler.flowCore.getState();
  const { ids } = command;
  const edgesToDeleteIds = new Set<string>();
  const nodesToDeleteIds = new Set<string>(ids);
  edges.forEach((edge) => {
    if (nodesToDeleteIds.has(edge.source) || nodesToDeleteIds.has(edge.target)) {
      edgesToDeleteIds.add(edge.id);
    }
  });
  await commandHandler.flowCore.applyUpdate(
    {
      nodesToRemove: Array.from(nodesToDeleteIds),
      edgesToRemove: edgesToDeleteIds.size > 0 ? Array.from(edgesToDeleteIds) : [],
    },
    'deleteNodes'
  );
};

export interface ClearModelCommand {
  name: 'clearModel';
}

export const clearModel = async (commandHandler: CommandHandler) => {
  const { edges, nodes } = commandHandler.flowCore.getState();
  await commandHandler.flowCore.applyUpdate(
    {
      nodesToRemove: nodes.map((node) => node.id),
      edgesToRemove: edges.map((edge) => edge.id),
    },
    'clearModel'
  );
};

export interface AddEdgesCommand {
  name: 'addEdges';
  edges: Edge[];
}

export const addEdges = async (commandHandler: CommandHandler, command: AddEdgesCommand) => {
  const { edges } = command;
  await commandHandler.flowCore.applyUpdate({ edgesToAdd: edges }, 'addEdges');
};

export interface UpdateEdgeCommand {
  name: 'updateEdge';
  id: string;
  edgeChanges: Partial<Edge>;
}

export const updateEdge = async (commandHandler: CommandHandler, command: UpdateEdgeCommand) => {
  const { id, edgeChanges } = command;
  await commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id, ...edgeChanges }] }, 'updateEdge');
};

export interface DeleteEdgesCommand {
  name: 'deleteEdges';
  ids: string[];
}

export const deleteEdges = async (commandHandler: CommandHandler, command: DeleteEdgesCommand) => {
  const { ids } = command;
  await commandHandler.flowCore.applyUpdate({ edgesToRemove: ids }, 'deleteEdges');
};

export interface AddPortsCommand {
  name: 'addPorts';
  nodeId: string;
  ports: Port[];
}

export const addPorts = async (commandHandler: CommandHandler, command: AddPortsCommand) => {
  const { nodeId, ports } = command;
  const node = commandHandler.flowCore.getNodeById(nodeId);
  if (!node) {
    return;
  }

  // Even though we have a separate method to update ports, this method also updates existing ports with matching IDs
  // instead of skipping them. This ensures the adapter stays synchronized with the core.
  // The front-end is considered the source of truth in this context.
  const newPortIds = new Set(ports.map((port) => port.id));
  const existingPortsToKeep = (node.ports ?? []).filter((port) => !newPortIds.has(port.id));
  const newPorts = [...existingPortsToKeep, ...ports];

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id: nodeId, ports: newPorts }] }, 'updateNode');
};

export interface UpdatePortsCommand {
  name: 'updatePorts';
  nodeId: string;
  ports: { portId: string; portChanges: Partial<Port> }[];
}

export const updatePorts = async (commandHandler: CommandHandler, command: UpdatePortsCommand) => {
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
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id: nodeId, ports: portsToUpdate }] }, 'updateNode');
};

export interface DeletePortsCommand {
  name: 'deletePorts';
  nodeId: string;
  portIds: string[];
}

export const deletePorts = async (commandHandler: CommandHandler, command: DeletePortsCommand) => {
  const { nodeId, portIds } = command;
  const node = commandHandler.flowCore.getNodeById(nodeId);
  if (!node) {
    return;
  }
  const leftPorts = node.ports?.filter((port) => !portIds.includes(port.id));
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate: [{ id: nodeId, ports: leftPorts }] }, 'updateNode');
};

export interface AddEdgeLabelsCommand {
  name: 'addEdgeLabels';
  edgeId: string;
  labels: EdgeLabel[];
}

export const addEdgeLabels = async (commandHandler: CommandHandler, command: AddEdgeLabelsCommand) => {
  const { edgeId, labels } = command;
  const edge = commandHandler.flowCore.getEdgeById(edgeId);
  if (!edge) {
    return;
  }
  const points = edge.points || [];
  const edgeRoutingManager = commandHandler.flowCore.edgeRoutingManager;
  const newLabels = [
    ...(edge.labels ?? []),
    ...labels.map((label) => ({
      ...label,
      position: edgeRoutingManager.computePointOnPath(edge.routing, points, label.positionOnEdge),
    })),
  ];
  await commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id: edgeId, labels: newLabels }] }, 'updateEdge');
};

export interface UpdateEdgeLabelCommand {
  name: 'updateEdgeLabel';
  edgeId: string;
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

export const updateEdgeLabel = async (commandHandler: CommandHandler, command: UpdateEdgeLabelCommand) => {
  const { edgeId, labelId, labelChanges } = command;
  const edge = commandHandler.flowCore.getEdgeById(edgeId);
  if (!edge) {
    return;
  }
  const points = edge.points || [];
  const edgeRoutingManager = commandHandler.flowCore.edgeRoutingManager;
  const newLabels = edge.labels?.map((label) => {
    const positionOnEdge = labelChanges?.positionOnEdge ?? label.positionOnEdge;
    const position = edgeRoutingManager.computePointOnPath(edge.routing, points, positionOnEdge);
    if (label.id !== labelId) {
      return { ...label, position };
    }
    return { ...label, ...(labelChanges || {}), position };
  });
  if (!newLabels) {
    return;
  }
  await commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id: edgeId, labels: newLabels }] }, 'updateEdge');
};

export interface DeleteEdgeLabelsCommand {
  name: 'deleteEdgeLabels';
  edgeId: string;
  labelIds: string[];
}

export const deleteEdgeLabels = async (commandHandler: CommandHandler, command: DeleteEdgeLabelsCommand) => {
  const { edgeId, labelIds } = command;
  const edge = commandHandler.flowCore.getEdgeById(edgeId);
  if (!edge) {
    return;
  }
  const leftLabels = edge.labels?.filter((label) => !labelIds.includes(label.id));
  await commandHandler.flowCore.applyUpdate({ edgesToUpdate: [{ id: edgeId, labels: leftLabels }] }, 'updateEdge');
};
