import { describe } from 'vitest';
// import type { KeyboardEvent } from '../../types';
// import { cutAction } from '../handlers/cut';

describe('Cut Action', () => {
  // TODO: Write tests
  // const mockCommandHandler = { emit: vi.fn() };
  // let mockEvent: KeyboardEvent;
  // let mockFlowCore: FlowCore;
  // beforeEach(() => {
  //   vi.clearAllMocks();
  //   mockEvent = {
  //     type: 'keydown',
  //     key: 'x',
  //     code: 'KeyX',
  //     timestamp: Date.now(),
  //     target: { type: 'diagram' },
  //     ctrlKey: false,
  //     shiftKey: false,
  //     altKey: false,
  //     metaKey: false,
  //   };
  //   mockFlowCore = {
  //     getState: vi.fn(),
  //     applyUpdate: vi.fn(),
  //     commandHandler: mockCommandHandler,
  //     environment: mockEnvironment,
  //   } as unknown as FlowCore;
  // });
  // describe('action', () => {
  //   it('should emit cut command', () => {
  //     cutAction.action(mockEvent, mockFlowCore);
  //     expect(mockCommandHandler.emit).toHaveBeenCalledWith('cut');
  //   });
  // });
  // describe('predicate', () => {
  //   it('should return false if event is not a keyboard down event', () => {
  //     mockEvent.type = 'keyup';
  //     expect(cutAction.predicate(mockEvent, mockFlowCore)).toBe(false);
  //   });
  //   it('should return false when key is different from x', () => {
  //     mockEvent.key = 'a';
  //     expect(cutAction.predicate(mockEvent, mockFlowCore)).toBe(false);
  //   });
  //   it('should return false when meta key is not pressed on MacOS', () => {
  //     mockEvent.metaKey = false;
  //     expect(cutAction.predicate(mockEvent, mockFlowCore)).toBe(false);
  //   });
  //   it('should return false when ctrl key is not pressed on Windows', () => {
  //     mockEnvironment.os = 'Windows';
  //     mockEvent.ctrlKey = false;
  //     expect(cutAction.predicate(mockEvent, mockFlowCore)).toBe(false);
  //   });
  //   it('should return true when meta + x is pressed on MacOS', () => {
  //     mockEnvironment.os = 'MacOS';
  //     mockEvent.metaKey = true;
  //     expect(cutAction.predicate(mockEvent, mockFlowCore)).toBe(true);
  //   });
  //   it('should return true when ctrl + x is pressed on Windows', () => {
  //     mockEnvironment.os = 'Windows';
  //     mockEvent.ctrlKey = true;
  //     expect(cutAction.predicate(mockEvent, mockFlowCore)).toBe(true);
  //   });
  // });
});
