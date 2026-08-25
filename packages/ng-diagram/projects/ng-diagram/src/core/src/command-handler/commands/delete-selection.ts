import type { CommandHandler, Edge } from '../../types';

export interface DeleteSelectionCommand {
  name: 'deleteSelection';
}

interface GetEdgesToRemoveParams {
  edges: Edge[];
  nodesToDeleteIds: string[];
}

const getEdgesToRemove = ({ edges, nodesToDeleteIds }: GetEdgesToRemoveParams): string[] => {
  const nodeIdsSet = new Set<string>(nodesToDeleteIds);
  // A hidden selected edge is not deleted through its own selection, but an
  // edge whose endpoint is being deleted always dies — hidden or not —
  // otherwise it would dangle.
  return edges
    .filter(
      (edge) => (edge.selected && !edge.computedHidden) || nodeIdsSet.has(edge.source) || nodeIdsSet.has(edge.target)
    )
    .map((edge) => edge.id);
};

export const deleteSelection = async (commandHandler: CommandHandler) => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { modelLookup } = commandHandler.flowCore;

  // Hiding does not deselect, so a selection can contain effectively hidden
  // elements. Deleting content the user cannot see would be destructive —
  // hidden selected elements are skipped. Descendants of a deleted visible
  // node are deleted regardless of their own hidden state (e.g. a collapsed
  // group takes its hidden children with it).
  const selectedVisibleNodeIds = nodes.filter((node) => node.selected && !node.computedHidden).map((node) => node.id);

  const nodesToDeleteIds = [
    ...new Set(selectedVisibleNodeIds.flatMap((id) => [id, ...modelLookup.getAllDescendantIds(id)])),
  ];

  const edgesToDeleteIds = getEdgesToRemove({ edges, nodesToDeleteIds });

  if (nodesToDeleteIds.length === 0 && edgesToDeleteIds.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    { nodesToRemove: nodesToDeleteIds, edgesToRemove: edgesToDeleteIds },
    'deleteSelection'
  );
};
