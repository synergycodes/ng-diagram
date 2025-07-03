import { beforeEach, describe, expect, it } from 'vitest';
import { mockEdge, mockNode } from '../test-utils';
import type { FlowStateUpdate, ModelActionType } from '../types';
import { TransactionManager } from './transaction-manager';

const mockUpdate = (id: number): FlowStateUpdate => ({
  nodesToAdd: [{ ...mockNode, id: `n${id}` }],
  edgesToAdd: [{ ...mockEdge, id: `e${id}` }],
  metadataUpdate: { test: id },
});

describe('TransactionManager', () => {
  let tm: TransactionManager;
  const actionA: ModelActionType = 'addNodes';
  const actionB: ModelActionType = 'addEdges';

  beforeEach(() => {
    tm = new TransactionManager();
  });

  it('should start and stop a transaction', () => {
    tm.startTransaction('addNodes');
    expect(tm.isActive()).toBe(true);
    tm.stopTransaction();
    expect(tm.isActive()).toBe(false);
  });

  it('should throw if starting a transaction twice', () => {
    tm.startTransaction('addNodes');
    expect(() => tm.startTransaction('addNodes')).toThrow();
  });

  it('should throw if stopping a transaction when none is active', () => {
    expect(() => tm.stopTransaction()).toThrow();
  });

  it('should throw if queuing an update when no transaction is active', () => {
    expect(() => tm.queueUpdate({}, 'addNodes')).toThrow();
  });

  it('should queue updates and merge them on stop', () => {
    tm.startTransaction('addNodes');
    tm.queueUpdate(mockUpdate(1), actionA);
    tm.queueUpdate(mockUpdate(2), actionB);
    const result = tm.stopTransaction();
    expect(result.commandsCount).toBe(2);
    expect(result.mergedUpdate.nodesToAdd).toHaveLength(2);
    expect(result.mergedUpdate.edgesToAdd).toHaveLength(2);
    expect(result.mergedUpdate.metadataUpdate).toMatchObject({ test: 2 });
    expect(result.lastActionType).toBe(actionB);
  });

  it('should return empty merged update if no updates were queued', () => {
    tm.startTransaction('addNodes');
    const result = tm.stopTransaction();
    expect(result.commandsCount).toBe(0);
    expect(result.mergedUpdate).toEqual({});
    expect(result.lastActionType).toBeUndefined();
  });

  it('should reset state after stop', () => {
    tm.startTransaction('addNodes');
    tm.queueUpdate(mockUpdate(1), actionA);
    tm.stopTransaction();
    expect(tm.isActive()).toBe(false);
    // Should be able to start again
    tm.startTransaction('addEdges');
    expect(tm.isActive()).toBe(true);
    tm.stopTransaction();
  });

  it('should handle multiple types of updates in merge', () => {
    tm.startTransaction('addNodes');
    tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'n1' }] }, actionA);
    tm.queueUpdate({ nodesToRemove: ['n1'] }, actionA);
    tm.queueUpdate({ edgesToAdd: [{ ...mockEdge, id: 'e1' }] }, actionB);
    tm.queueUpdate({ edgesToRemove: ['e1'] }, actionB);

    const result = tm.stopTransaction();

    expect(result.mergedUpdate.nodesToAdd).toHaveLength(1);
    expect(result.mergedUpdate.nodesToRemove).toHaveLength(1);
    expect(result.mergedUpdate.edgesToAdd).toHaveLength(1);
    expect(result.mergedUpdate.edgesToRemove).toHaveLength(1);
  });

  it('should be inactive after stop', () => {
    tm.startTransaction('addNodes');
    tm.queueUpdate(mockUpdate(1), actionA);
    tm.stopTransaction();

    expect(tm.isActive()).toBe(false);
  });
});
