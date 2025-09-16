import { Edge } from './edge.interface';
import { Metadata } from './metadata.interface';
import { Node } from './node.interface';

export interface Model {
  nodes: Node[];
  edges: Edge[];
  metadata: Partial<Metadata>;
}
