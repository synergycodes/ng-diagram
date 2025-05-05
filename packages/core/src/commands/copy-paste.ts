import { CommandHandler } from '../types/command-handler.interface';
import { Edge } from '../types/edge.interface';
import { Node } from '../types/node.interface';

const OFFSET = 20;

let copiedNodes: Node[] = [];
let copiedEdges: Edge[] = [];

export interface CopyCommand {
  name: 'copy';
}

export interface PasteCommand {
  name: 'paste';
}

export const copy = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();

  copiedNodes = nodes.filter((node) => node.selected);
  copiedEdges = edges.filter((edge) => edge.selected);
};

export const paste = (commandHandler: CommandHandler): void => {
  if (copiedNodes.length === 0 && copiedEdges.length === 0) {
    return;
  }

  const { nodes, edges } = commandHandler.flowCore.getState();
  const nodeIdMap = new Map<string, string>();

  const newNodes = copiedNodes.map((node) => {
    const newNodeId = crypto.randomUUID();
    nodeIdMap.set(node.id, newNodeId);

    return {
      ...node,
      id: newNodeId,
      position: {
        x: node.position.x + OFFSET,
        y: node.position.y + OFFSET,
      },
      selected: true,
    };
  });

  const newEdges = copiedEdges.map((edge) => {
    const newEdgeId = crypto.randomUUID();
    return {
      ...edge,
      id: newEdgeId,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
      selected: true,
    };
  });

  const updatedNodes = nodes.map((node) => (node.selected ? { ...node, selected: false } : node));
  const updatedEdges = edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge));

  commandHandler.flowCore.applyUpdate(
    {
      nodes: [...updatedNodes, ...newNodes],
      edges: [...updatedEdges, ...newEdges],
    },
    'paste'
  );
};
