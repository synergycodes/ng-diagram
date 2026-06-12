import { describe, expect, it } from 'vitest';
import { Port } from '../../../../types';
import { isProperTargetPort } from '../utils';

function createTargetPort(overrides?: Partial<Port>): Port {
  return {
    id: 'target-port',
    nodeId: 'target-node',
    side: 'right',
    type: 'target',
    ...overrides,
  };
}

describe('isProperTargetPort', () => {
  it('should reject source-only target ports', () => {
    const result = isProperTargetPort(createTargetPort({ type: 'source' }), 'source-node', 'source-port');
    expect(result).toBe(false);
  });

  it('should allow ports on different nodes', () => {
    const result = isProperTargetPort(createTargetPort({ nodeId: 'target-node' }), 'source-node', 'source-port');
    expect(result).toBe(true);
  });

  it('should allow self-loop targeting a different port on the same node', () => {
    const result = isProperTargetPort(
      createTargetPort({ nodeId: 'same-node', id: 'other-port' }),
      'same-node',
      'source-port'
    );
    expect(result).toBe(true);
  });

  it('should reject self-loop targeting the same port on the same node', () => {
    const result = isProperTargetPort(
      createTargetPort({ nodeId: 'same-node', id: 'source-port' }),
      'same-node',
      'source-port'
    );
    expect(result).toBe(false);
  });
});
