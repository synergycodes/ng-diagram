/**
 * Input schema for the get_symbol tool
 */
export interface GetSymbolInput {
  /** Exact symbol name (case-sensitive) */
  name: string;
}

/**
 * Output schema for the get_symbol tool
 */
export interface GetSymbolOutput {
  /** Symbol name */
  name: string;
  /** Symbol kind (class, function, interface, type, const, enum) */
  kind: string;
  /** Full type signature */
  signature: string;
  /** JSDoc documentation, if available */
  jsDoc?: string;
  /** Ready-to-use import statement */
  importStatement: string;
}
