// snippet: export class TreeService {
// doc: references/tree-layout.md
// From the treeLayout() block of the reference.
declare function treeLayout(
  nodes: Node[],
  edges: Edge[],
  direction?: 'DOWN' | 'RIGHT'
): Promise<{ id: string; position: Point }[]>;
