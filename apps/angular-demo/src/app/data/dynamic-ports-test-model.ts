import type { Edge, Node } from 'ng-diagram';

export function generateDynamicPortsTestModel(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const cols = 20;

  // 200 grid nodes
  for (let i = 0; i < 200; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    nodes.push({
      id: `dp-grid-${i}`,
      type: 'dynamic-port',
      position: { x: col * 360, y: row * 140 },
      data: {
        text: `#${i}`,
        ports: [
          { id: 'port-left-1', side: 'left' },
          { id: 'port-left-2', side: 'left' },
          { id: 'port-right', side: 'right' },
        ],
        contentSize: 'small',
      },
    });
  }

  // Focus node with 4 ports for single-node tests
  nodes.push({
    id: 'dp-focus',
    type: 'dynamic-port',
    position: { x: 400, y: -200 },
    data: {
      text: 'Focus Node',
      ports: [
        { id: 'port-tl', side: 'left' },
        { id: 'port-tr', side: 'right' },
        { id: 'port-bl', side: 'left' },
        { id: 'port-br', side: 'right' },
      ],
      contentSize: 'small',
    },
  });

  // ~50 edges between every 4th adjacent pair
  let edgeIndex = 0;
  for (let i = 0; i < 200; i += 4) {
    if (i + 1 < 200 && i % cols < cols - 1) {
      edges.push({
        id: `dp-edge-${edgeIndex++}`,
        type: 'labelled-edge',
        source: `dp-grid-${i}`,
        target: `dp-grid-${i + 1}`,
        sourcePort: 'port-right',
        targetPort: 'port-left-1',
        data: { labelPosition: 0.5 },
      });
    }
  }

  // Focus edge for single-edge label tests
  edges.push({
    id: 'dp-focus-edge',
    type: 'labelled-edge',
    source: 'dp-grid-0',
    target: 'dp-focus',
    sourcePort: 'port-right',
    targetPort: 'port-tl',
    data: { labelPosition: 0.3 },
  });

  return { nodes, edges };
}
