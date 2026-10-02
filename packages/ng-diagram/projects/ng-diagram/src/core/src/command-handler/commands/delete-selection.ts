import type { CommandHandler } from '../../types';
import { partitionIncidentEdges } from './detach-on-node-delete';

export interface DeleteSelectionCommand {
  name: 'deleteSelection';
}

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
  const nodesToDeleteIdsSet = new Set(nodesToDeleteIds);

  // Explicitly selected visible edges are always deleted — detach-on-delete
  // never demotes them. A hidden selected edge is not deleted through its own
  // selection, but an edge whose endpoint is being deleted dies (or detaches,
  // when the dangling-edges feature allows) — hidden or not.
  const selectedEdgeIds = new Set(edges.filter((edge) => edge.selected && !edge.computedHidden).map((edge) => edge.id));

  const { edgesToRemove, edgesToUpdate } = partitionIncidentEdges(
    commandHandler.flowCore,
    edges,
    nodesToDeleteIdsSet,
    selectedEdgeIds
  );

  const edgesToDeleteIds = [...new Set([...selectedEdgeIds, ...edgesToRemove])];

  if (nodesToDeleteIds.length === 0 && edgesToDeleteIds.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToRemove: nodesToDeleteIds,
      edgesToRemove: edgesToDeleteIds,
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
    },
    'deleteSelection'
  );
};
