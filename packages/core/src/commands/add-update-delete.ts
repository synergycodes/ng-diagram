import { CommandHandler } from '../types/command-handler.interface';
import { Edge } from '../types/edge.interface';
import { Node } from '../types/node.interface';

export interface AddNodesCommand {
  name: 'addNodes';
  nodes: Node[];
}

export const addNodes = (commandHandler: CommandHandler, command: AddNodesCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate({ nodes: [...nodes, ...command.nodes] }, 'addNodes');
};

export interface UpdateNodeCommand {
  name: 'updateNode';
  id: string;
  node: Partial<Node>;
}

export const updateNode = (commandHandler: CommandHandler, command: UpdateNodeCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate(
    { nodes: nodes.map((node) => (node.id === command.id ? { ...node, ...command.node } : node)) },
    'updateNode'
  );
};

export interface DeleteNodesCommand {
  name: 'deleteNodes';
  ids: string[];
}

export const deleteNodes = (commandHandler: CommandHandler, command: DeleteNodesCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate({ nodes: nodes.filter((node) => !command.ids.includes(node.id)) }, 'deleteNodes');
};

export interface AddEdgesCommand {
  name: 'addEdges';
  edges: Edge[];
}

export const addEdges = (commandHandler: CommandHandler, command: AddEdgesCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate({ edges: [...edges, ...command.edges] }, 'addEdges');
};

export interface UpdateEdgeCommand {
  name: 'updateEdge';
  id: string;
  edge: Partial<Edge>;
}

export const updateEdge = (commandHandler: CommandHandler, command: UpdateEdgeCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate(
    { edges: edges.map((edge) => (edge.id === command.id ? { ...edge, ...command.edge } : edge)) },
    'updateEdge'
  );
};

export interface DeleteEdgesCommand {
  name: 'deleteEdges';
  ids: string[];
}

export const deleteEdges = (commandHandler: CommandHandler, command: DeleteEdgesCommand): void => {
  const { edges } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate({ edges: edges.filter((edge) => !command.ids.includes(edge.id)) }, 'deleteEdges');
};
