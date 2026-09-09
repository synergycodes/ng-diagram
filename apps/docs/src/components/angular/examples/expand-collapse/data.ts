import { type Edge, type Node } from 'ng-diagram';
import { NodeTemplateType, type TreeNodeData } from './types';

export const diagramModel: {
  nodes: Node<TreeNodeData>[];
  edges: Edge[];
} = {
  nodes: [
    {
      id: 'root',
      position: { x: 0, y: 0 },
      data: { label: 'Application' },
      type: NodeTemplateType.TreeNode,
    },

    {
      id: 'frontend',
      position: { x: 0, y: 0 },
      data: { label: 'Frontend' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'components',
      position: { x: 0, y: 0 },
      data: { label: 'Components', collapsed: true },
      type: NodeTemplateType.TreeNode,
    },
    // The "Components" subtree starts collapsed. Its children stay visible in
    // the initial model so they are measured at init; LayoutService sets
    // their `hidden` flag together with the first layout.
    {
      id: 'buttons',
      position: { x: 0, y: 0 },
      data: { label: 'Buttons' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'forms',
      position: { x: 0, y: 0 },
      data: { label: 'Forms' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'services',
      position: { x: 0, y: 0 },
      data: { label: 'Services' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'routing',
      position: { x: 0, y: 0 },
      data: { label: 'Routing' },
      type: NodeTemplateType.TreeNode,
    },

    {
      id: 'backend',
      position: { x: 0, y: 0 },
      data: { label: 'Backend' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'api',
      position: { x: 0, y: 0 },
      data: { label: 'API' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'rest',
      position: { x: 0, y: 0 },
      data: { label: 'REST' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'graphql',
      position: { x: 0, y: 0 },
      data: { label: 'GraphQL' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'database',
      position: { x: 0, y: 0 },
      data: { label: 'Database' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'auth',
      position: { x: 0, y: 0 },
      data: { label: 'Auth' },
      type: NodeTemplateType.TreeNode,
    },

    {
      id: 'devops',
      position: { x: 0, y: 0 },
      data: { label: 'DevOps' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'ci',
      position: { x: 0, y: 0 },
      data: { label: 'CI/CD' },
      type: NodeTemplateType.TreeNode,
    },
    {
      id: 'monitoring',
      position: { x: 0, y: 0 },
      data: { label: 'Monitoring' },
      type: NodeTemplateType.TreeNode,
    },
  ],
  // Edges never need a `hidden` flag of their own: an edge is effectively
  // hidden whenever one of its endpoint nodes is hidden.
  edges: [
    {
      id: 'e-root-frontend',
      source: 'root',
      sourcePort: 'port-bottom',
      target: 'frontend',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-root-backend',
      source: 'root',
      sourcePort: 'port-bottom',
      target: 'backend',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-root-devops',
      source: 'root',
      sourcePort: 'port-bottom',
      target: 'devops',
      targetPort: 'port-top',
      data: {},
    },

    {
      id: 'e-frontend-components',
      source: 'frontend',
      sourcePort: 'port-bottom',
      target: 'components',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-frontend-services',
      source: 'frontend',
      sourcePort: 'port-bottom',
      target: 'services',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-frontend-routing',
      source: 'frontend',
      sourcePort: 'port-bottom',
      target: 'routing',
      targetPort: 'port-top',
      data: {},
    },

    {
      id: 'e-components-buttons',
      source: 'components',
      sourcePort: 'port-bottom',
      target: 'buttons',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-components-forms',
      source: 'components',
      sourcePort: 'port-bottom',
      target: 'forms',
      targetPort: 'port-top',
      data: {},
    },

    {
      id: 'e-backend-api',
      source: 'backend',
      sourcePort: 'port-bottom',
      target: 'api',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-backend-database',
      source: 'backend',
      sourcePort: 'port-bottom',
      target: 'database',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-backend-auth',
      source: 'backend',
      sourcePort: 'port-bottom',
      target: 'auth',
      targetPort: 'port-top',
      data: {},
    },

    {
      id: 'e-api-rest',
      source: 'api',
      sourcePort: 'port-bottom',
      target: 'rest',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-api-graphql',
      source: 'api',
      sourcePort: 'port-bottom',
      target: 'graphql',
      targetPort: 'port-top',
      data: {},
    },

    {
      id: 'e-devops-ci',
      source: 'devops',
      sourcePort: 'port-bottom',
      target: 'ci',
      targetPort: 'port-top',
      data: {},
    },
    {
      id: 'e-devops-monitoring',
      source: 'devops',
      sourcePort: 'port-bottom',
      target: 'monitoring',
      targetPort: 'port-top',
      data: {},
    },
  ],
};
