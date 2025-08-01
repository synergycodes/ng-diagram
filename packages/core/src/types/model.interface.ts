import { Edge } from './edge.interface';
import { Metadata } from './metadata.interface';
import { Node } from './node.interface';

export interface Model<TMetadata extends Metadata = Metadata> {
  nodes: Node[];
  edges: Edge[];
  metadata: Partial<TMetadata>;
}
