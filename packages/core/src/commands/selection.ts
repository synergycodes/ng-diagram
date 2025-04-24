import { CommandHandler, WithoutName } from '../types/command-handler.interface';

export interface SelectCommand {
  name: 'select';
  ids: string[];
}

export const select = (commandHandler: CommandHandler, { ids }: WithoutName<SelectCommand>): void => {
  commandHandler.flowCore.executeMiddlewares({ type: 'selectionChange', payload: { ids } });
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = (commandHandler: CommandHandler): void => {
  commandHandler.flowCore.executeMiddlewares({ type: 'selectionChange', payload: { ids: [] } });
};
