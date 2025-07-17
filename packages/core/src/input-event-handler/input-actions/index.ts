import { linkingAction } from './linking';
import { rotateAction } from './rotate/rotate';
import { zoomingAction } from './zooming/zooming';

export const inputActions = {
  linking: linkingAction,
  zooming: zoomingAction,
  rotate: rotateAction,
};
