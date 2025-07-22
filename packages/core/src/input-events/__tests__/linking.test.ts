// import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { FlowCore } from '../../flow-core';
// import { mockEnvironment, mockNode, mockPointerEvent, mockPort } from '../../test-utils';
// import type { KeyboardEvent } from '../../types';
// import { linkingAction } from '../linking';

// const keyboardEvent = {
//   type: 'keydown',
//   altKey: false,
//   ctrlKey: false,
//   metaKey: false,
//   shiftKey: false,
// } as KeyboardEvent;

// describe('linkingAction', () => {
//   const mockCommandHandler = { emit: vi.fn() };
//   let mockFlowCore: FlowCore;
//   const mockGetState = vi.fn();
//   const mockGetNearestPortInRange = vi.fn();

//   beforeEach(() => {
//     mockFlowCore = {
//       getState: mockGetState,
//       applyUpdate: vi.fn(),
//       commandHandler: mockCommandHandler,
//       environment: mockEnvironment,
//       clientToFlowPosition: vi.fn().mockImplementation((args) => args),
//       flowToClientPosition: vi.fn().mockImplementation((args) => args),
//       getNearestPortInRange: mockGetNearestPortInRange,
//     } as unknown as FlowCore;

//     // Clean isLinking flag before each test
//     mockGetState.mockReturnValue({
//       metadata: {},
//     });
//     linkingAction.action({ ...mockPointerEvent, type: 'pointerup', button: 2 }, mockFlowCore);
//     vi.clearAllMocks();
//   });

//   describe('predicate', () => {
//     describe('pointer down event', () => {
//       it('should return true if event is pointer down, button is 0, target is a port and port is not a target', () => {
//         expect(
//           linkingAction.predicate(
//             { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//             mockFlowCore
//           )
//         ).toBe(true);
//       });

//       it('should return false if there is a wrong event type', () => {
//         expect(
//           linkingAction.predicate({ ...keyboardEvent, target: { type: 'port', element: mockPort } }, mockFlowCore)
//         ).toBe(false);
//       });

//       it('should return false if  button is not 0', () => {
//         expect(
//           linkingAction.predicate(
//             { ...mockPointerEvent, type: 'pointerdown', button: 1, target: { type: 'port', element: mockPort } },
//             mockFlowCore
//           )
//         ).toBe(false);
//       });

//       it('should return false if target is not a port', () => {
//         expect(
//           linkingAction.predicate(
//             { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'node', element: mockNode } },
//             mockFlowCore
//           )
//         ).toBe(false);
//       });

//       it('should return false if port type is a target', () => {
//         expect(
//           linkingAction.predicate(
//             {
//               ...mockPointerEvent,
//               type: 'pointerdown',
//               button: 0,
//               target: { type: 'port', element: { ...mockPort, type: 'target' } },
//             },
//             mockFlowCore
//           )
//         ).toBe(false);
//       });
//     });

//     describe('pointer move event', () => {
//       it('should return true if event is pointer move and linking has started', () => {
//         linkingAction.action(
//           { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//           mockFlowCore
//         );
//         expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore)).toBe(true);
//       });

//       it('should return false if linking has not started', () => {
//         expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore)).toBe(false);
//       });

//       it('should return false if there is a wrong event type', () => {
//         linkingAction.action(
//           { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//           mockFlowCore
//         );
//         expect(
//           linkingAction.predicate({ ...keyboardEvent, target: { type: 'port', element: mockPort } }, mockFlowCore)
//         ).toBe(false);
//       });
//     });

//     describe('pointer up event', () => {
//       it('should return true if event is pointer up and button is 0 ', () => {
//         expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointerup', button: 0 }, mockFlowCore)).toBe(true);
//       });

//       it('should return false if event button is not 0', () => {
//         expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointerup', button: 1 }, mockFlowCore)).toBe(
//           false
//         );
//       });

//       it('should return false if there is a wrong event type', () => {
//         expect(
//           linkingAction.predicate({ ...keyboardEvent, target: { type: 'port', element: mockPort } }, mockFlowCore)
//         ).toBe(false);
//       });
//     });
//   });

//   describe('action', () => {
//     it('should call startLinking if pointer down event and target is a port', () => {
//       linkingAction.action(
//         { ...mockPointerEvent, type: 'pointerdown', target: { type: 'port', element: mockPort }, button: 2 },
//         mockFlowCore
//       );
//       expect(mockCommandHandler.emit).toHaveBeenCalledWith('startLinking', {
//         source: mockPort.nodeId,
//         sourcePort: mockPort.id,
//       });
//     });

//     it('should not call moveTemporaryEdge if pointer move event and linking not started', () => {
//       linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

//       expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveTemporaryEdge');
//     });

//     it('should call moveTemporaryEdge if pointer move event and linking started but did not found nearest port and set target and target port to empty string', () => {
//       mockGetNearestPortInRange.mockReturnValue(null);
//       linkingAction.action(
//         { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//         mockFlowCore
//       );
//       linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

//       expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
//         position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
//         target: '',
//         targetPort: '',
//       });
//     });

//     it('should call moveTemporaryEdge with nearest port if found is not source port and the found port is target type port', () => {
//       const port = { ...mockPort, type: 'target', nodeId: 'node-2', id: 'port-2' };
//       mockGetNearestPortInRange.mockReturnValue(port);
//       mockGetState.mockReturnValue({
//         metadata: {
//           temporaryEdge: {
//             source: 'node-1',
//             sourcePort: 'port-1',
//           },
//         },
//       });
//       linkingAction.action(
//         { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//         mockFlowCore
//       );
//       linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

//       expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
//         position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
//         target: port.nodeId,
//         targetPort: port.id,
//       });
//     });

//     it('should call moveTemporaryEdge with empty target if found nearest port type is source', () => {
//       const port = { ...mockPort, type: 'source', nodeId: 'node-2', id: 'port-2' };
//       mockGetNearestPortInRange.mockReturnValue(port);
//       linkingAction.action(
//         { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//         mockFlowCore
//       );
//       linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

//       expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
//         position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
//         target: '',
//         targetPort: '',
//       });
//     });

//     it('should call moveTemporaryEdge with empty target if found nearest port is same port as source', () => {
//       mockGetNearestPortInRange.mockReturnValue(mockPort);
//       mockGetState.mockReturnValue({
//         metadata: {},
//       });
//       linkingAction.action(
//         { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//         mockFlowCore
//       );
//       linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

//       expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
//         position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
//         target: '',
//         targetPort: '',
//       });
//     });

//     it('should call finishLinking with same target and target port as temporary edge', () => {
//       mockGetState.mockReturnValue({
//         metadata: {
//           temporaryEdge: {
//             source: mockPort.nodeId,
//             sourcePort: mockPort.id,
//             target: mockPort.nodeId,
//             targetPort: mockPort.id,
//           },
//         },
//       });
//       linkingAction.action(
//         { ...mockPointerEvent, type: 'pointerdown', button: 0, target: { type: 'port', element: mockPort } },
//         mockFlowCore
//       );
//       linkingAction.action({ ...mockPointerEvent, type: 'pointerup', button: 0 }, mockFlowCore);

//       expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinking', {
//         target: mockPort.nodeId,
//         targetPort: mockPort.id,
//       });
//     });
//   });
// });
