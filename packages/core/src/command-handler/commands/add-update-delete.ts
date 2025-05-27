import type { CommandHandler, Edge, EdgeLabel, Node, Port } from '../../types';

export interface AddNodesCommand {
  name: 'addNodes';
  nodes: Node[];
}

export const addNodes = (commandHandler: CommandHandler, command: AddNodesCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const { nodes: nodesToAdd } = command;
  commandHandler.flowCore.applyUpdate({ nodes: [...nodes, ...nodesToAdd] }, 'addNodes');
};

export interface UpdateNodeCommand {
  name: 'updateNode';
  id: string;
  nodeChanges: Partial<Node>;
}

export const updateNode = (commandHandler: CommandHandler, command: UpdateNodeCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const { id, nodeChanges } = command;
  commandHandler.flowCore.applyUpdate(
    { nodes: nodes.map((node) => (node.id === id ? { ...node, ...nodeChanges } : node)) },
    'updateNode'
  );
};

export interface DeleteNodesCommand {
  name: 'deleteNodes';
  ids: string[];
}

export const deleteNodes = (commandHandler: CommandHandler, command: DeleteNodesCommand): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
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
      nodes: nodes.filter((node) => !nodesToDeleteIds.has(node.id)),
      edges: edgesToDeleteIds.size > 0 ? edges.filter((edge) => !edgesToDeleteIds.has(edge.id)) : edges,
    },
    'deleteNodes'
  );
};

export interface AddEdgesCommand {
  name: 'addEdges';
  edges: Edge[];
}

export const addEdges = (commandHandler: CommandHandler, command: AddEdgesCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { edges: edgesToAdd } = command;
  commandHandler.flowCore.applyUpdate({ edges: [...edges, ...edgesToAdd] }, 'addEdges');
};

export interface UpdateEdgeCommand {
  name: 'updateEdge';
  id: string;
  edgeChanges: Partial<Edge>;
}

export const updateEdge = (commandHandler: CommandHandler, command: UpdateEdgeCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { id, edgeChanges } = command;
  commandHandler.flowCore.applyUpdate(
    { edges: edges.map((edge) => (edge.id === id ? { ...edge, ...edgeChanges } : edge)) },
    'updateEdge'
  );
};

export interface DeleteEdgesCommand {
  name: 'deleteEdges';
  ids: string[];
}

export const deleteEdges = (commandHandler: CommandHandler, command: DeleteEdgesCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { ids } = command;
  commandHandler.flowCore.applyUpdate({ edges: edges.filter((edge) => !ids.includes(edge.id)) }, 'deleteEdges');
};

export interface AddPortsCommand {
  name: 'addPorts';
  nodeId: string;
  ports: Port[];
}

export const addPorts = (commandHandler: CommandHandler, command: AddPortsCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const { nodeId, ports } = command;
  commandHandler.flowCore.applyUpdate(
    {
      nodes: nodes.map((node) => (node.id === nodeId ? { ...node, ports: [...(node.ports ?? []), ...ports] } : node)),
    },
    'updateNode'
  );
};

export interface UpdatePortsCommand {
  name: 'updatePorts';
  nodeId: string;
  ports: { portId: string; portChanges: Partial<Port> }[];
}

export const updatePorts = (commandHandler: CommandHandler, command: UpdatePortsCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const { nodeId, ports } = command;
  const portsUpdateMap = new Map<string, Partial<Port>>();
  ports.forEach(({ portId, portChanges }) => {
    portsUpdateMap.set(portId, portChanges);
  });
  commandHandler.flowCore.applyUpdate(
    {
      nodes: nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              ports: node.ports?.map((port) =>
                portsUpdateMap.get(port.id) ? { ...port, ...portsUpdateMap.get(port.id) } : port
              ),
            }
          : node
      ),
    },
    'updateNode'
  );
};

export interface DeletePortsCommand {
  name: 'deletePorts';
  nodeId: string;
  portIds: string[];
}

export const deletePorts = (commandHandler: CommandHandler, command: DeletePortsCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const { nodeId, portIds } = command;
  const portsExists = nodes.find((node) => node.id === nodeId)?.ports?.filter((port) => portIds.includes(port.id));
  if (!portsExists) {
    return;
  }
  commandHandler.flowCore.applyUpdate(
    {
      nodes: nodes.map((node) =>
        node.id === nodeId ? { ...node, ports: node.ports?.filter((port) => !portIds.includes(port.id)) } : node
      ),
    },
    'updateNode'
  );
};

export interface AddEdgeLabelsCommand {
  name: 'addEdgeLabels';
  edgeId: string;
  labels: EdgeLabel[];
}

export const addEdgeLabels = (commandHandler: CommandHandler, command: AddEdgeLabelsCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { edgeId, labels } = command;
  commandHandler.flowCore.applyUpdate(
    {
      edges: edges.map((edge) =>
        edge.id === edgeId ? { ...edge, labels: [...(edge.labels ?? []), ...labels] } : edge
      ),
    },
    'updateEdge'
  );
};

export interface UpdateEdgeLabelCommand {
  name: 'updateEdgeLabel';
  edgeId: string;
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

export const updateEdgeLabel = (commandHandler: CommandHandler, command: UpdateEdgeLabelCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { edgeId, labelId, labelChanges } = command;
  commandHandler.flowCore.applyUpdate(
    {
      edges: edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              labels: edge.labels?.map((label) => (label.id === labelId ? { ...label, ...labelChanges } : label)),
            }
          : edge
      ),
    },
    'updateEdge'
  );
};

export interface DeleteEdgeLabelsCommand {
  name: 'deleteEdgeLabels';
  edgeId: string;
  labelIds: string[];
}

export const deleteEdgeLabels = (commandHandler: CommandHandler, command: DeleteEdgeLabelsCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  const { edgeId, labelIds } = command;
  commandHandler.flowCore.applyUpdate(
    {
      edges: edges.map((edge) =>
        edge.id === edgeId ? { ...edge, labels: edge.labels?.filter((label) => !labelIds.includes(label.id)) } : edge
      ),
    },
    'updateEdge'
  );
};
