import ELK, { type ElkNode } from 'elkjs';
import { type Edge, type Node, type Point } from 'ng-diagram';

/** A node position update addressed by node id. */
export interface PositionUpdate {
  id: string;
  position: Point;
}

// Single ELK instance reused across all layout calls.
const elk = new ELK();

const layoutOptions = {
  'elk.algorithm': 'mrtree',
  'elk.direction': 'DOWN',
  'spacing.nodeNode': '80',
};

/**
 * Compute tree positions for the given nodes with ELK.js. A node that ELK
 * did not place keeps its current position.
 */
export async function performLayout(
  nodes: Node[],
  edges: Edge[]
): Promise<PositionUpdate[]> {
  const graph: ElkNode = {
    id: 'root-graph',
    layoutOptions,
    // ELK only needs the id and the measured size of each node.
    children: nodes.map(({ id, size }) => ({ id, ...size })),
    edges: edges.map(({ id, source, target }) => ({
      id,
      sources: [source],
      targets: [target],
    })),
  };

  const { children = [] } = await elk.layout(graph);
  const laidOut = new Map(children.map((node) => [node.id, node]));

  return nodes.map(({ id, position }) => ({
    id,
    position: {
      x: laidOut.get(id)?.x ?? position.x,
      y: laidOut.get(id)?.y ?? position.y,
    },
  }));
}
