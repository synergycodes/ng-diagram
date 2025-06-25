import type { CommandHandler, Edge, FlowStateUpdate, Node } from '../../types';

const OFFSET = 20;

let copiedNodes: Node[] = [];
let copiedEdges: Edge[] = [];

export interface CopyCommand {
  name: 'copy';
}

export interface PasteCommand {
  name: 'paste';
}

export const copy = async (commandHandler: CommandHandler) => {
  const { nodes, edges } = commandHandler.flowCore.getState();

  copiedNodes = nodes.filter((node) => node.selected);
  copiedEdges = edges.filter((edge) => edge.selected);
};

export const paste = async (commandHandler: CommandHandler) => {
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

  const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
  const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

  nodes.forEach((node) => {
    if (node.selected) {
      nodesToUpdate.push({ id: node.id, selected: false });
    }
  });
  edges.forEach((edge) => {
    if (edge.selected) {
      edgesToUpdate.push({ id: edge.id, selected: false });
    }
  });

  await commandHandler.flowCore.applyUpdate(
    { nodesToAdd: newNodes, edgesToAdd: newEdges, nodesToUpdate, edgesToUpdate },
    'paste'
  );
};
