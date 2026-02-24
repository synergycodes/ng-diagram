import type { ModelLookup } from '../../model-lookup/model-lookup';
import type { CommandHandler, FlowStateUpdate } from '../../types';

/**
 * Computes selection changes using modelLookup for O(1) lookups.
 * Converts selection arrays to Sets to avoid O(n²) complexity.
 */
const changeSelection = (
  modelLookup: ModelLookup,
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
  multiSelection = false
): Pick<FlowStateUpdate, 'nodesToUpdate' | 'edgesToUpdate'> => {
  const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
  const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

  const selectedNodeIdSet = new Set(selectedNodeIds);
  const selectedEdgeIdSet = new Set(selectedEdgeIds);

  for (const node of modelLookup.nodesMap.values()) {
    const isSelected = selectedNodeIdSet.has(node.id);
    if (!!node.selected === isSelected || (multiSelection && !!node.selected)) {
      continue;
    }
    nodesToUpdate.push({ id: node.id, selected: isSelected });
  }

  for (const edge of modelLookup.edgesMap.values()) {
    const isSelected = selectedEdgeIdSet.has(edge.id);
    if (!!edge.selected === isSelected || (multiSelection && !!edge.selected)) {
      continue;
    }
    edgesToUpdate.push({ id: edge.id, selected: isSelected });
  }

  return { nodesToUpdate, edgesToUpdate };
};

const applySelectionUpdate = async (
  commandHandler: CommandHandler,
  { nodesToUpdate, edgesToUpdate }: Pick<FlowStateUpdate, 'nodesToUpdate' | 'edgesToUpdate'>
) => {
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  commandHandler.flowCore.actionStateManager.selection = { selectionChanged: true };
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};

export interface SelectCommand {
  name: 'select';
  nodeIds?: string[];
  edgeIds?: string[];
  multiSelection?: boolean;
}

export const select = async (
  commandHandler: CommandHandler,
  { nodeIds, edgeIds, multiSelection = false }: SelectCommand
) => {
  const { modelLookup } = commandHandler.flowCore;
  const update = changeSelection(modelLookup, nodeIds ?? [], edgeIds ?? [], multiSelection);
  await applySelectionUpdate(commandHandler, update);
};

export interface DeselectCommand {
  name: 'deselect';
  nodeIds?: string[];
  edgeIds?: string[];
}

export const deselect = async (commandHandler: CommandHandler, { nodeIds, edgeIds }: DeselectCommand) => {
  const { modelLookup } = commandHandler.flowCore;
  const nodeIdSet = new Set<string>(nodeIds);
  const edgeIdSet = new Set<string>(edgeIds);

  // Find nodes/edges that should remain selected (not in the deselect list)
  const nodesToLeftSelected: string[] = [];
  for (const node of modelLookup.nodesMap.values()) {
    if (!nodeIdSet.has(node.id) && !!node.selected) {
      nodesToLeftSelected.push(node.id);
    }
  }

  const edgesToLeftSelected: string[] = [];
  for (const edge of modelLookup.edgesMap.values()) {
    if (!edgeIdSet.has(edge.id) && !!edge.selected) {
      edgesToLeftSelected.push(edge.id);
    }
  }

  const update = changeSelection(modelLookup, nodesToLeftSelected, edgesToLeftSelected);
  await applySelectionUpdate(commandHandler, update);
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = async (commandHandler: CommandHandler) => {
  const { modelLookup } = commandHandler.flowCore;
  const update = changeSelection(modelLookup, [], []);
  await applySelectionUpdate(commandHandler, update);
};

export interface SelectEndCommand {
  name: 'selectEnd';
}

export const selectEnd = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'selectEnd');
};

export interface SelectAllCommand {
  name: 'selectAll';
}

export const selectAll = async (commandHandler: CommandHandler) => {
  const { modelLookup } = commandHandler.flowCore;
  const allNodeIds = Array.from(modelLookup.nodesMap.keys());
  const allEdgeIds = Array.from(modelLookup.edgesMap.keys());
  const update = changeSelection(modelLookup, allNodeIds, allEdgeIds);
  await applySelectionUpdate(commandHandler, update);
};
