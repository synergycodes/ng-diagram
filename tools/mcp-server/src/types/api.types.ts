export interface ApiSymbol {
  name: string;
  kind: 'class' | 'function' | 'interface' | 'type' | 'const' | 'enum';
  signature: string;
  jsDoc?: string;
  importPath: string;
}
