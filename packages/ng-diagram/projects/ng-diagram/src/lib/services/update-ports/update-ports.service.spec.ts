import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from './update-ports.service';

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height }) as DOMRect;

/** jsdom has no layout, so every element reports the rect it is given here. */
const element = (bounds: DOMRect, attributes: Record<string, string> = {}): HTMLElement => {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(bounds);
  return el;
};

describe('UpdatePortsService', () => {
  let service: UpdatePortsService;
  let scale: number;

  beforeEach(() => {
    scale = 1;
    // The injector provides no ElementRef: the service measures the elements it
    // is given and must not depend on the element its injector belongs to.
    TestBed.configureTestingModule({
      providers: [
        UpdatePortsService,
        {
          provide: FlowCoreProviderService,
          useValue: { provide: () => ({ getState: () => ({ metadata: { viewport: { scale } } }) }) },
        },
      ],
    });
    service = TestBed.inject(UpdatePortsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNodePortsData', () => {
    it('measures every port of the given node element relative to that element', () => {
      const node = element(rect(100, 50, 200, 80));
      node.append(
        element(rect(90, 80, 20, 20), { 'data-port-id': 'left' }),
        element(rect(290, 80, 20, 20), { 'data-port-id': 'right' })
      );

      expect(service.getNodePortsData(node, 'n1')).toEqual([
        { id: 'left', position: { x: -10, y: 30 }, size: { width: 20, height: 20 } },
        { id: 'right', position: { x: 190, y: 30 }, size: { width: 20, height: 20 } },
      ]);
    });

    it('converts screen pixels to flow units with the viewport scale', () => {
      scale = 2;
      const node = element(rect(100, 50, 400, 160));
      node.append(element(rect(480, 110, 40, 40), { 'data-port-id': 'right' }));

      expect(service.getNodePortsData(node, 'n1')).toEqual([
        { id: 'right', position: { x: 190, y: 30 }, size: { width: 20, height: 20 } },
      ]);
    });

    it('returns an empty list for a node without ports', () => {
      expect(service.getNodePortsData(element(rect(0, 0, 100, 40)), 'n1')).toEqual([]);
    });

    it('skips a port with an empty id and reports it with the node id', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const node = element(rect(0, 0, 100, 40));
      node.append(
        element(rect(0, 10, 20, 20), { 'data-port-id': '' }),
        element(rect(80, 10, 20, 20), { 'data-port-id': 'right' })
      );

      expect(service.getNodePortsData(node, 'n1').map(({ id }) => id)).toEqual(['right']);
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Node ID: n1'));
    });
  });

  describe('getPortData', () => {
    it('measures a port relative to its closest node element', () => {
      const node = element(rect(100, 50, 200, 80));
      node.classList.add('ng-diagram-node');
      const wrapper = document.createElement('div');
      const port = element(rect(290, 80, 20, 20));
      wrapper.append(port);
      node.append(wrapper);

      expect(service.getPortData(port)).toEqual({ position: { x: 190, y: 30 }, size: { width: 20, height: 20 } });
    });

    it('returns null and reports a port that is not inside a node element', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const port = element(rect(0, 0, 20, 20), { id: 'orphan' });

      expect(service.getPortData(port)).toBeNull();
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Port ID: orphan'));
    });
  });
});
