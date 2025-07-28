import { Node, Port } from '../types';
import { getRect, isSameRect } from '../utils';

export class BaseUpdater {
  getPortsToUpdate(node: Node, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]) {
    const allPortsMap = new Map<string, { size: Port['size']; position: Port['position'] }>();
    node?.ports?.forEach(({ id, size, position }) => allPortsMap.set(id, { size, position }));

    return ports.filter(({ id, size, position }) => {
      const port = allPortsMap.get(id);

      return port && !isSameRect(getRect(port), getRect({ size, position }));
    });
  }
}
