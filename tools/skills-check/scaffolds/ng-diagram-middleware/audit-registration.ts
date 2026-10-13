// snippet: createAuditMiddleware((entry) => this.auditLog.push(entry)),
// doc: references/recipes.md
// From the audit middleware block of the reference.
interface AuditEntry {
  at: number;
  actions: string[];
  addedNodeIds: string[];
  removedNodeIds: string[];
  addedEdgeIds: string[];
  removedEdgeIds: string[];
}
declare function createAuditMiddleware(log: (entry: AuditEntry) => void): Middleware<'audit-log'>;

interface SnippetHost {
  auditLog: AuditEntry[];
}
