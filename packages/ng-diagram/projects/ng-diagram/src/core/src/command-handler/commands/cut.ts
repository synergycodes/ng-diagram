import { CommandHandler } from '../../types';
import { copy } from './copy-paste';
import { deleteSelection } from './delete-selection';

export interface CutCommand {
  name: 'cut';
}

export const cut = async (commandHandler: CommandHandler) => {
  await copy(commandHandler);
  await deleteSelection(commandHandler);
};
