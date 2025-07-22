// import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { FlowCore } from '../../flow-core';
// import { getSamplePointerEvent, mockEdge, mockEnvironment, mockNode, mockPointerEvent } from '../../test-utils';
// import { selectAction } from '../__migrated__select';

// describe('selectAction', () => {
//   const mockCommandHandler = { emit: vi.fn() };
//   let mockFlowCore: FlowCore;

//   beforeEach(() => {
//     vi.clearAllMocks();

//     mockFlowCore = {
//       getState: vi.fn(),
//       applyUpdate: vi.fn(),
//       commandHandler: mockCommandHandler,
//       environment: mockEnvironment,
//     } as unknown as FlowCore;
//   });

//   describe('predicate', () => {
//     it('should return true for pointerdown events with target other than resize handle', () => {
//       expect(selectAction.predicate({ ...mockPointerEvent, type: 'pointerdown', button: 0 }, mockFlowCore)).toBe(true);
//     });

//     it('should return false for pointerdown events wit resize handle as target', () => {
//       expect(
//         selectAction.predicate(
//           {
//             ...mockPointerEvent,
//             type: 'pointerdown',
//             button: 0,
//             target: { type: 'resize-handle', element: mockNode, position: 'top-left' },
//           },
//           mockFlowCore
//         )
//       ).toBe(false);
//     });

//     it('should return false for other events', () => {
//       expect(selectAction.predicate({ ...mockPointerEvent, type: 'pointerenter' }, mockFlowCore)).toBe(false);
//       expect(selectAction.predicate({ ...mockPointerEvent, type: 'pointerup', button: 0 }, mockFlowCore)).toBe(false);
//     });
//   });

//   describe('action', () => {
//     describe('when clicking outside of elements', () => {
//       it('should emit deselectAll command', () => {
//         selectAction.action(getSamplePointerEvent({ target: { type: 'diagram' } }), mockFlowCore);
//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselectAll');
//       });
//     });

//     describe('when clicking on a node', () => {
//       beforeEach(() => {
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [mockNode],
//           edges: [],
//         });
//       });

//       it('should select node when clicking on unselected node without modifier', () => {
//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'node', element: mockNode },
//             metaKey: false,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
//           nodeIds: [mockNode.id],
//           edgeIds: undefined,
//           preserveSelection: false,
//         });
//       });

//       it('should preserve selection when clicking on already selected node without modifier', () => {
//         const selectedNode = { ...mockNode, selected: true };
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [selectedNode],
//           edges: [],
//         });

//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'node', element: selectedNode },
//             metaKey: false,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
//           nodeIds: [selectedNode.id],
//           edgeIds: undefined,
//           preserveSelection: true,
//         });
//       });

//       it('should deselect node when clicking on selected node with modifier', () => {
//         const selectedNode = { ...mockNode, selected: true };
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [selectedNode],
//           edges: [],
//         });

//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'node', element: selectedNode },
//             metaKey: true,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
//           nodeIds: [selectedNode.id],
//           edgeIds: undefined,
//         });
//       });
//     });

//     describe('when clicking on an edge', () => {
//       beforeEach(() => {
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [],
//           edges: [mockEdge],
//         });
//       });

//       it('should select edge when clicking on unselected edge without modifier', () => {
//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'edge', element: mockEdge },
//             metaKey: false,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
//           nodeIds: undefined,
//           edgeIds: [mockEdge.id],
//           preserveSelection: false,
//         });
//       });

//       it('should preserve selection when clicking on already selected edge without modifier', () => {
//         const selectedEdge = { ...mockEdge, selected: true };
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [],
//           edges: [selectedEdge],
//         });

//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'edge', element: selectedEdge },
//             metaKey: false,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
//           nodeIds: undefined,
//           edgeIds: [selectedEdge.id],
//           preserveSelection: true,
//         });
//       });

//       it('should deselect edge when clicking on selected edge with modifier', () => {
//         const selectedEdge = { ...mockEdge, selected: true };
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [],
//           edges: [selectedEdge],
//         });

//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'edge', element: selectedEdge },
//             metaKey: true,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
//           nodeIds: undefined,
//           edgeIds: [selectedEdge.id],
//         });
//       });
//     });

//     describe('platform specific behavior', () => {
//       it('should use metaKey on MacOS', () => {
//         const selectedNode = { ...mockNode, selected: true };
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [selectedNode],
//           edges: [],
//         });

//         mockFlowCore.environment.os = 'MacOS';

//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'node', element: selectedNode },
//             metaKey: true,
//             ctrlKey: false,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
//           nodeIds: [selectedNode.id],
//           edgeIds: undefined,
//         });
//       });

//       it('should use ctrlKey on other platforms', () => {
//         const selectedNode = { ...mockNode, selected: true };
//         (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
//           nodes: [selectedNode],
//           edges: [],
//         });

//         mockFlowCore.environment.os = 'Windows';

//         selectAction.action(
//           getSamplePointerEvent({
//             target: { type: 'node', element: selectedNode },
//             metaKey: false,
//             ctrlKey: true,
//           }),
//           mockFlowCore
//         );

//         expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
//           nodeIds: [selectedNode.id],
//           edgeIds: undefined,
//         });
//       });
//     });
//   });
// });
