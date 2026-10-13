// snippet: private readonly api = inject(DiagramApi); // your data service
declare class DiagramApi {
  load(id: string): Promise<Partial<Model>>;
}
