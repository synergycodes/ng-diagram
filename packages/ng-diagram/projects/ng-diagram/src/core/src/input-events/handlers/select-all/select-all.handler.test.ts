import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import { SelectAllEventHandler } from './select-all.handler';

describe('SelectAllEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let handler: SelectAllEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;

    handler = new SelectAllEventHandler(mockFlowCore);
  });

  it('should emit selectAll command', () => {
    handler.handle();

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('selectAll');
  });

  it('should emit selectEnd after selectAll', () => {
    handler.handle();

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('selectEnd');
    // selectAll should be called before selectEnd
    const calls = mockCommandHandler.emit.mock.calls;
    const selectAllIndex = calls.findIndex((c: string[]) => c[0] === 'selectAll');
    const selectEndIndex = calls.findIndex((c: string[]) => c[0] === 'selectEnd');
    expect(selectAllIndex).toBeLessThan(selectEndIndex);
  });
});
