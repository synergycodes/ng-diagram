import { FlowCore } from '../flow-core';
import { WithoutName } from '../types/command-handler.interface';

export interface SelectCommand {
  name: 'select';
  ids: string[];
}

export const select = (flowCore: FlowCore, { ids }: WithoutName<SelectCommand>): void => {
  flowCore.executeMiddlewares({ type: 'selectionChange', payload: { ids } });
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = (flowCore: FlowCore): void => {
  flowCore.executeMiddlewares({ type: 'selectionChange', payload: { ids: [] } });
};
