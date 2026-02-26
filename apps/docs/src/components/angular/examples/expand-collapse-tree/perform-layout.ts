import ELK, { type ElkExtendedEdge, type ElkNode } from 'elkjs';
import { type Edge, type Node } from 'ng-diagram';

const elk = new ELK();
const layoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
  'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
  'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
  'spacing.nodeNode': '40',
  'layered.spacing.nodeNodeBetweenLayers': '50',
};

export async function performLayout(nodes: Node[], edges: Edge[]) {
  const nodesToLayout = nodes.map(
    ({ id: nodeId, size, measuredPorts }): ElkNode => ({
      id: nodeId,
      ...size,
      layoutOptions: {
        portConstraints: 'FIXED_POS',
      },
      ports: measuredPorts?.map(
        ({ id: portId, position, size: portSize }: any) => ({
          id: `${nodeId}:${portId}`,
          ...portSize,
          ...position,
        })
      ),
    })
  );

  const graph: ElkNode = {
    id: 'root-graph',
    layoutOptions,
    children: nodesToLayout,
    edges: edges.map(({ id, source, target, sourcePort, targetPort }) => {
      const sourceWithPort = sourcePort ? `${source}:${sourcePort}` : source;
      const targetWithPort = targetPort ? `${target}:${targetPort}` : target;

      return {
        id,
        sources: [sourceWithPort],
        targets: [targetWithPort],
      };
    }),
  };

  const { children: laidOutNodes, edges: laidOutEdges } =
    await elk.layout(graph);

  const updatedNodes: Node[] = nodes.map((node) => {
    const {
      position: { x: baseX, y: baseY },
    } = node;

    const { x = baseX, y = baseY } = laidOutNodes?.find(
      ({ id }: any) => id === node.id
    ) ?? {
      x: baseX,
      y: baseY,
    };

    return {
      ...node,
      position: { x, y },
    };
  });

  const updatedEdges: Edge[] = edges.map((edge) => {
    const elkEdge = laidOutEdges?.find(({ id }: any) => id === edge.id);
    if (!elkEdge) {
      return edge;
    }

    const points = getLayoutPoints(elkEdge);

    return {
      ...edge,
      routingMode: 'manual',
      points,
    };
  });

  return { nodes: updatedNodes, edges: updatedEdges };
}

function getLayoutPoints(elkEdge: ElkExtendedEdge) {
  if (!elkEdge.sections?.length) return [];

  const section = elkEdge.sections[0];

  return [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
}
