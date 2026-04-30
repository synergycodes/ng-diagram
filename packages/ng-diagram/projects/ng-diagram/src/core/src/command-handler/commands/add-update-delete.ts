import { resolveLabelPosition } from '../../edge-routing-manager';
import type { CommandHandler, Edge, EdgeLabel, Node, Port } from '../../types';
import { snapNodePosition } from '../../utils';

const computeAddedPorts = (node: Node, ports: Port[]): Port[] => {
  const newPortIds = new Set(ports.map((port) => port.id));
  const existingPortsToKeep = (node.measuredPorts ?? []).filter((port) => !newPortIds.has(port.id));
  return [...existingPortsToKeep, ...ports];
};

const computeUpdatedPorts = (
  measuredPorts: Port[],
  portUpdates: { portId: string; portChanges: Partial<Port> }[]
): Port[] => {
  const changesById = new Map(portUpdates.map(({ portId, portChanges }) => [portId, portChanges]));
  return measuredPorts.map((port) => {
    const portChanges = changesById.get(port.id);
    if (!portChanges) {
      return port;
    }
    return { ...port, ...portChanges };
  });
};

const computeRemainingPorts = (measuredPorts: Port[] | undefined, portIds: string[]): Port[] => {
  const portIdsSet = new Set(portIds);
  return (measuredPorts ?? []).filter((port) => !portIdsSet.has(port.id));
};

export interface AddNodesCommand {
  name: 'addNodes';
  nodes: Node[];
}

export const addNodes = async (commandHandler: CommandHandler, command: AddNodesCommand) => {
  const { nodes } = command;
  await commandHandler.flowCore.applyUpdate({ nodesToAdd: nodes }, 'addNodes');
};

export interface PaletteDropNodeCommand {
  name: 'paletteDropNode';
  node: Node;
}

export const paletteDropNode = async (commandHandler: CommandHandler, command: PaletteDropNodeCommand) => {
  const { node } = command;
  const position = snapNodePosition(commandHandler.flowCore.config, node, node.position);

  await commandHandler.flowCore.applyUpdate({ nodesToAdd: [{ ...node, position }] }, 'paletteDropNode');
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

export interface UpdateEdgesCommand {
  name: 'updateEdges';
  edges: (Pick<Edge, 'id'> & Partial<Edge>)[];
}

export const updateEdges = async (commandHandler: CommandHandler, command: UpdateEdgesCommand) => {
  const { edges } = command;
  await commandHandler.flowCore.applyUpdate({ edgesToUpdate: edges }, 'updateEdges');
};

export interface DeleteEdgesCommand {
  name: 'deleteEdges';
  ids: string[];
}

export const deleteEdges = async (commandHandler: CommandHandler, command: DeleteEdgesCommand) => {
  const { ids } = command;
  await commandHandler.flowCore.applyUpdate({ edgesToRemove: ids }, 'deleteEdges');
};

export interface AddPortsBulkCommand {
  name: 'addPortsBulk';
  additions: Map<string, Port[]>;
}

export const addPortsBulk = async (commandHandler: CommandHandler, command: AddPortsBulkCommand) => {
  const { additions } = command;
  const nodesToUpdate: { id: string; measuredPorts: Port[] }[] = [];

  additions.forEach((ports, nodeId) => {
    const node = commandHandler.flowCore.getNodeById(nodeId);
    if (!node) {
      return;
    }

    nodesToUpdate.push({ id: nodeId, measuredPorts: computeAddedPorts(node, ports) });
  });

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'addPortsBulk');
};

export interface UpdatePortsBulkCommand {
  name: 'updatePortsBulk';
  updates: Map<string, { portId: string; portChanges: Partial<Port> }[]>;
}

export const updatePortsBulk = async (commandHandler: CommandHandler, command: UpdatePortsBulkCommand) => {
  const { updates } = command;
  const nodesToUpdate: { id: string; measuredPorts: Port[] }[] = [];

  updates.forEach((portUpdates, nodeId) => {
    const node = commandHandler.flowCore.getNodeById(nodeId);
    if (!node || !node.measuredPorts) {
      return;
    }

    nodesToUpdate.push({ id: nodeId, measuredPorts: computeUpdatedPorts(node.measuredPorts, portUpdates) });
  });

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'updatePortsBulk');
};

export interface DeletePortsBulkCommand {
  name: 'deletePortsBulk';
  deletions: Map<string, string[]>;
}

export const deletePortsBulk = async (commandHandler: CommandHandler, command: DeletePortsBulkCommand) => {
  const { deletions } = command;
  const nodesToUpdate: { id: string; measuredPorts: Port[] }[] = [];

  deletions.forEach((portIds, nodeId) => {
    const node = commandHandler.flowCore.getNodeById(nodeId);
    if (!node) {
      return;
    }

    nodesToUpdate.push({ id: nodeId, measuredPorts: computeRemainingPorts(node.measuredPorts, portIds) });
  });

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'deletePortsBulk');
};

export interface AddEdgeLabelsBulkCommand {
  name: 'addEdgeLabelsBulk';
  additions: Map<string, EdgeLabel[]>;
}

export const addEdgeLabelsBulk = async (commandHandler: CommandHandler, command: AddEdgeLabelsBulkCommand) => {
  const { additions } = command;
  const edgesToUpdate: { id: string; measuredLabels: EdgeLabel[] }[] = [];

  additions.forEach((labels, edgeId) => {
    const edge = commandHandler.flowCore.getEdgeById(edgeId);
    if (!edge) {
      return;
    }

    const newLabels = [...(edge.measuredLabels ?? []), ...labels];
    edgesToUpdate.push({ id: edgeId, measuredLabels: newLabels });
  });

  if (edgesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ edgesToUpdate }, 'addEdgeLabelsBulk');
};

export interface UpdateEdgeLabelsBulkCommand {
  name: 'updateEdgeLabelsBulk';
  updates: Map<string, { labelId: string; labelChanges: Partial<EdgeLabel> }[]>;
}

export const updateEdgeLabelsBulk = async (commandHandler: CommandHandler, command: UpdateEdgeLabelsBulkCommand) => {
  const { updates } = command;
  const edgesToUpdate: { id: string; measuredLabels: EdgeLabel[] }[] = [];
  const edgeRoutingManager = commandHandler.flowCore.edgeRoutingManager;

  updates.forEach((labelUpdates, edgeId) => {
    const edge = commandHandler.flowCore.getEdgeById(edgeId);
    if (!edge) {
      return;
    }

    const points = edge.points || [];
    const updatesMap = new Map<string, Partial<EdgeLabel>>();
    labelUpdates.forEach(({ labelId, labelChanges }) => {
      updatesMap.set(labelId, labelChanges);
    });

    const hasValidPoints = points.length >= 2;

    const newLabels = edge.measuredLabels?.map((label) => {
      const labelChanges = updatesMap.get(label.id);
      if (!labelChanges) {
        // Preserve existing position when points aren't available yet
        const position = hasValidPoints
          ? resolveLabelPosition(label.positionOnEdge, edge.routing, points, edgeRoutingManager)
          : label.position;
        return { ...label, position };
      }

      const positionOnEdge = labelChanges.positionOnEdge ?? label.positionOnEdge;
      // Preserve existing position when points aren't available yet
      const position = hasValidPoints
        ? resolveLabelPosition(positionOnEdge, edge.routing, points, edgeRoutingManager)
        : label.position;
      return { ...label, ...labelChanges, position };
    });

    if (newLabels) {
      edgesToUpdate.push({ id: edgeId, measuredLabels: newLabels });
    }
  });

  if (edgesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ edgesToUpdate }, 'updateEdgeLabelsBulk');
};

export interface DeleteEdgeLabelsBulkCommand {
  name: 'deleteEdgeLabelsBulk';
  deletions: Map<string, string[]>;
}

export const deleteEdgeLabelsBulk = async (commandHandler: CommandHandler, command: DeleteEdgeLabelsBulkCommand) => {
  const { deletions } = command;
  const edgesToUpdate: { id: string; measuredLabels: EdgeLabel[] | undefined }[] = [];

  deletions.forEach((labelIds, edgeId) => {
    const edge = commandHandler.flowCore.getEdgeById(edgeId);
    if (!edge) {
      return;
    }
    const labelIdsSet = new Set(labelIds);
    const leftLabels = edge.measuredLabels?.filter((label) => !labelIdsSet.has(label.id));
    edgesToUpdate.push({ id: edgeId, measuredLabels: leftLabels });
  });

  if (edgesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ edgesToUpdate }, 'deleteEdgeLabelsBulk');
};
