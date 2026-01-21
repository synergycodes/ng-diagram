import { type Edge, type Node } from 'ng-diagram';

export function generateModel(nodeCount: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const cols = Math.ceil(Math.sqrt(nodeCount));
  const rows = Math.ceil(nodeCount / cols);

  const spacingX = 200;
  const spacingY = 150;

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    nodes.push({
      id: `node-${i}`,
      position: {
        x: col * spacingX,
        y: row * spacingY,
      },
      data: { label: `Node ${i}` },
    });

    if (col < cols - 1 && i + 1 < nodeCount) {
      edges.push({
        id: `edge-h-${i}`,
        source: `node-${i}`,
        target: `node-${i + 1}`,
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      });
    }

    if (row < rows - 1 && i + cols < nodeCount && col % 5 === 0) {
      edges.push({
        id: `edge-v-${i}`,
        source: `node-${i}`,
        target: `node-${i + cols}`,
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      });
    }
  }

  console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);
  return { nodes, edges };
}
