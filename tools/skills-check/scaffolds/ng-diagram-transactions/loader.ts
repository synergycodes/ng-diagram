// snippet: private readonly api = inject(DiagramApi); // your own data service
declare class DiagramApi {
  load(id: string): Promise<{ nodes: Node[]; edges: Edge[] }>;
}
