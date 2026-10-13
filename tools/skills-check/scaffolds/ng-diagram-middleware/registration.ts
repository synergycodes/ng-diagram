// snippet: // Class body; diagramService is inject(NgDiagramService). The three middlewares are defined below.
// From later blocks of the skill.
declare const protectLockedNodes: Middleware;
declare const snapNewNodes: Middleware;
declare function createMaxNodesMiddleware(max: number, onRejected: (message: string) => void): Middleware<'max-nodes'>;
