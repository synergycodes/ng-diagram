import ELK, { type ElkNode } from 'elkjs';
import { type Edge, type Node } from 'ng-diagram';

// Single ELK instance reused across all layout calls.
const elk = new ELK();

const layoutOptions = {
  'elk.algorithm': 'mrtree',
  'elk.direction': 'DOWN',
  'spacing.nodeNode': '80',
};

/**
 * Compute tree positions for the given nodes using ELK.js.
 *
 * Converts ng-diagram nodes/edges into the ELK graph format, runs the
 * layout algorithm, and returns a new array of nodes with updated
 * positions.
 */
export async function performLayout(nodes: Node[], edges: Edge[]) {
  // Convert ng-diagram nodes to ELK format (only id + size are needed).
  const nodesToLayout = nodes.map(({ id: nodeId, size }): ElkNode => ({
    id: nodeId,
    ...size,
  }));

  // Build the ELK graph with nodes as children and edges as connections.
  const graph: ElkNode = {
    id: 'root-graph',
    layoutOptions,
    children: nodesToLayout,
    edges: edges.map(({ id, source, target }) => {
      return {
        id,
        sources: [source],
        targets: [target],
      };
    }),
  };

  const { children: laidOutNodes } = await elk.layout(graph);

  const laidOutNodesMap = new Map(laidOutNodes?.map((node) => [node.id, node]));

  return nodes.map((node) => {
    const laidOut = laidOutNodesMap.get(node.id);
    return {
      ...node,
      position: {
        x: laidOut?.x ?? node.position.x,
        y: laidOut?.y ?? node.position.y,
      },
    };
  });
}
