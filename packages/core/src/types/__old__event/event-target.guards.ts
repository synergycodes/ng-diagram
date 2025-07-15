import {
  DiagramTarget,
  EdgeLabelTarget,
  EdgeTarget,
  EventTarget,
  NodeTarget,
  PortTarget,
  ResizeHandleTarget,
  RotateHandleTarget,
} from './event-target.interface';

export const onNode = (target: EventTarget): target is NodeTarget => target.type === 'node';
export const onEdge = (target: EventTarget): target is EdgeTarget => target.type === 'edge';
export const onPort = (target: EventTarget): target is PortTarget => target.type === 'port';
export const onDiagram = (target: EventTarget): target is DiagramTarget => target.type === 'diagram';
export const onEdgeLabel = (target: EventTarget): target is EdgeLabelTarget => target.type === 'edge-label';
export const onResizeHandle = (target: EventTarget): target is ResizeHandleTarget => target.type === 'resize-handle';
export const onRotateHandle = (target: EventTarget): target is RotateHandleTarget => target.type === 'rotate-handle';
