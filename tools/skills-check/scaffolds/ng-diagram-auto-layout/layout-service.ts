// snippet: export class LayoutService {
// From the perform-layout.ts block of the skill.
interface LayoutResult {
  nodes: { id: string; position: Point }[];
  edges: { id: string; routingMode: 'manual' | 'auto'; points?: Point[] }[];
}
declare function layoutWithElk(nodes: Node[], edges: Edge[]): Promise<LayoutResult>;
