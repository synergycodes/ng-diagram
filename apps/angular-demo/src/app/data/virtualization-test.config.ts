import { type NgDiagramConfig } from 'ng-diagram';

export const virtualizationTestConfig = {
  /** Number of nodes to generate for virtualization test */
  nodeCount: 5000,
} as const;

export const virtualizationConfigOverrides: Partial<NgDiagramConfig> = {
  virtualization: {
    enabled: true,
  },
};
