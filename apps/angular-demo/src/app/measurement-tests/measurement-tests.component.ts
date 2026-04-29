import { Component, inject, output, signal } from '@angular/core';
import { Edge, NgDiagramModelService, NgDiagramService, Node, type Port, type PortSide } from 'ng-diagram';

interface TestResult {
  name: string;
  passed: boolean;
  elapsed: number;
  details: string;
  failures: string[];
}

/** Tolerance in pixels for position/size comparisons */
const PX_TOLERANCE = 2;

/** Round for readable output */
const r = (n: number) => Math.round(n * 100) / 100;

@Component({
  selector: 'app-measurement-tests',
  templateUrl: './measurement-tests.component.html',
  styleUrl: './measurement-tests.component.scss',
})
export class MeasurementTestsComponent {
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly ngDiagramModelService = inject(NgDiagramModelService);

  exit = output<void>();

  results = signal<TestResult[]>([]);
  isRunning = signal(false);

  private testCounter = 0;

  async runAll() {
    this.results.set([]);
    this.isRunning.set(true);

    await this.testEmptyTransaction();
    await this.testPositionOnly();
    await this.testAddNode();
    await this.testDataDrivenPortSideChange();
    await this.testPositionAndDataChange();
    await this.testEdgeLabelChange();

    this.isRunning.set(false);
  }

  async testEmptyTransaction() {
    const t1 = performance.now();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await this.ngDiagramService.transaction(() => {}, { waitForMeasurements: true });

    const elapsed = performance.now() - t1;
    this.addResult('Empty transaction', elapsed, (assert) => {
      assert(elapsed < 10, `Should resolve quickly, took ${elapsed.toFixed(0)}ms`);
    });
  }

  async testPositionOnly() {
    const nodes = this.ngDiagramModelService.getModel().getNodes();
    const target = nodes[0];
    if (!target) return;

    const originalX = target.position.x;
    const originalY = target.position.y;
    const originalSize = target.size ? { ...target.size } : undefined;
    const originalBounds = target.measuredBounds ? { ...target.measuredBounds } : undefined;
    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.updateNodes([{ id: target.id, position: { x: originalX + 10, y: originalY } }]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const node = this.getNode(target.id)!;

    this.addResult('Position only', elapsed, (assert) => {
      // Position updated
      assert(node.position.x === originalX + 10, `position.x: expected ${originalX + 10}, got ${node.position.x}`);
      assert(node.position.y === originalY, `position.y: expected ${originalY}, got ${node.position.y}`);

      // Size unchanged
      if (originalSize) {
        assert(
          node.size?.width === originalSize.width,
          `size.width unchanged: expected ${originalSize.width}, got ${node.size?.width}`
        );
        assert(
          node.size?.height === originalSize.height,
          `size.height unchanged: expected ${originalSize.height}, got ${node.size?.height}`
        );
      }

      // MeasuredBounds shifted by exactly +10 on x, same width/height
      if (originalBounds && node.measuredBounds) {
        assert(
          this.isNear(node.measuredBounds.x, originalBounds.x + 10, PX_TOLERANCE),
          `measuredBounds.x should shift by +10: expected ~${originalBounds.x + 10}, got ${node.measuredBounds.x}`
        );
        assert(
          node.measuredBounds.y === originalBounds.y,
          `measuredBounds.y unchanged: expected ${originalBounds.y}, got ${node.measuredBounds.y}`
        );
        assert(
          node.measuredBounds.width === originalBounds.width,
          `measuredBounds.width unchanged: expected ${originalBounds.width}, got ${node.measuredBounds.width}`
        );
        assert(
          node.measuredBounds.height === originalBounds.height,
          `measuredBounds.height unchanged: expected ${originalBounds.height}, got ${node.measuredBounds.height}`
        );
      }
    });
  }

  async testAddNode() {
    const id = `test-add-${this.testCounter++}`;
    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.addNodes([
          {
            id,
            type: 'dynamic-port',
            position: { x: -500, y: -100 },
            data: {
              text: 'Test Add Node',
              ports: [
                { id: 'p1', side: 'left' as PortSide },
                { id: 'p2', side: 'right' as PortSide },
              ],
            },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const node = this.getNode(id)!;
    const p1 = node.measuredPorts?.find((p: Port) => p.id === 'p1');
    const p2 = node.measuredPorts?.find((p: Port) => p.id === 'p2');

    this.addResult('Add node with ports', elapsed, (assert) => {
      // Node size
      assert(!!node.size, `node should have size`);
      assert((node.size?.width ?? 0) >= 100, `node width >= 100 (min-width), got ${node.size?.width}`);
      assert((node.size?.height ?? 0) > 0, `node height > 0, got ${node.size?.height}`);

      // Port count and sides
      assert(node.measuredPorts?.length === 2, `expected 2 ports, got ${node.measuredPorts?.length}`);
      assert(p1?.side === 'left', `p1 side: expected 'left', got '${p1?.side}'`);
      assert(p2?.side === 'right', `p2 side: expected 'right', got '${p2?.side}'`);

      // Port sizes > 0
      assert(
        (p1?.size?.width ?? 0) > 0 && (p1?.size?.height ?? 0) > 0,
        `p1 should have size, got ${p1?.size?.width}x${p1?.size?.height}`
      );
      assert(
        (p2?.size?.width ?? 0) > 0 && (p2?.size?.height ?? 0) > 0,
        `p2 should have size, got ${p2?.size?.width}x${p2?.size?.height}`
      );

      // Port positions exist
      assert(p1?.position !== undefined, `p1 should have position`);
      assert(p2?.position !== undefined, `p2 should have position`);

      // MeasuredBounds: should encompass node + ports
      this.assertBoundsEncompassNodeAndPorts(assert, node);
    });
  }

  async testDataDrivenPortSideChange() {
    const id = `test-port-side-${this.testCounter++}`;

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.addNodes([
          {
            id,
            type: 'dynamic-port',
            position: { x: -500, y: -500 },
            data: {
              text: 'Test Port Side',
              ports: [
                { id: 'p-in', side: 'left' as PortSide },
                { id: 'p-out', side: 'right' as PortSide },
              ],
            },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    // Capture before state
    const nodeBefore = this.getNode(id)!;
    const pInBefore = nodeBefore.measuredPorts?.find((p: Port) => p.id === 'p-in');
    const pOutBefore = nodeBefore.measuredPorts?.find((p: Port) => p.id === 'p-out');
    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.updateNodes([
          {
            id,
            data: {
              text: 'Test Port Side',
              ports: [
                { id: 'p-in', side: 'top' as PortSide },
                { id: 'p-out', side: 'bottom' as PortSide },
              ],
            },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const node = this.getNode(id)!;
    const pIn = node.measuredPorts?.find((p: Port) => p.id === 'p-in');
    const pOut = node.measuredPorts?.find((p: Port) => p.id === 'p-out');

    this.addResult('Data-driven port side change', elapsed, (assert) => {
      // Sides updated in measuredPorts
      assert(pIn?.side === 'top', `p-in side: expected 'top', got '${pIn?.side}'`);
      assert(pOut?.side === 'bottom', `p-out side: expected 'bottom', got '${pOut?.side}'`);

      // Port sizes preserved (side change shouldn't affect port size)
      if (pInBefore?.size && pIn?.size) {
        assert(
          this.isNear(pIn.size.width, pInBefore.size.width, PX_TOLERANCE),
          `p-in width should be stable: before ${pInBefore.size.width}, after ${pIn.size.width}`
        );
      }

      // Positions changed (left→top, right→bottom means positions must differ)
      assert(
        pIn?.position?.x !== pInBefore?.position?.x || pIn?.position?.y !== pInBefore?.position?.y,
        `p-in position should change after side left→top`
      );
      assert(
        pOut?.position?.x !== pOutBefore?.position?.x || pOut?.position?.y !== pOutBefore?.position?.y,
        `p-out position should change after side right→bottom`
      );

      // MeasuredBounds should encompass node + ports at new positions
      this.assertBoundsEncompassNodeAndPorts(assert, node);
    });
  }

  async testPositionAndDataChange() {
    const id = `test-pos-data-${this.testCounter++}`;

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.addNodes([
          {
            id,
            type: 'dynamic-port',
            position: { x: -500, y: -300 },
            data: {
              text: 'Test Pos+Data',
              ports: [
                { id: 'p-in', side: 'left' as PortSide },
                { id: 'p-out', side: 'right' as PortSide },
              ],
            },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.updateNodes([
          {
            id,
            position: { x: -400, y: -200 },
            data: {
              text: 'Test Pos+Data',
              ports: [
                { id: 'p-in', side: 'top' as PortSide },
                { id: 'p-out', side: 'bottom' as PortSide },
              ],
            },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const node = this.getNode(id)!;
    const pIn = node.measuredPorts?.find((p: Port) => p.id === 'p-in');
    const pOut = node.measuredPorts?.find((p: Port) => p.id === 'p-out');

    this.addResult('Position + data-driven port side', elapsed, (assert) => {
      // Position updated
      assert(node.position.x === -400, `position.x: expected -400, got ${node.position.x}`);
      assert(node.position.y === -200, `position.y: expected -200, got ${node.position.y}`);

      // Sides updated
      assert(pIn?.side === 'top', `p-in side: expected 'top', got '${pIn?.side}'`);
      assert(pOut?.side === 'bottom', `p-out side: expected 'bottom', got '${pOut?.side}'`);

      // MeasuredBounds should be positioned relative to new node position
      assert(!!node.measuredBounds, `measuredBounds should exist`);
      if (node.measuredBounds) {
        assert(
          this.isNear(node.measuredBounds.x, -400, node.measuredBounds.width),
          `measuredBounds.x should be near node position -400, got ${node.measuredBounds.x}`
        );
        assert(
          this.isNear(node.measuredBounds.y, -200, node.measuredBounds.height),
          `measuredBounds.y should be near node position -200, got ${node.measuredBounds.y}`
        );
      }

      // MeasuredBounds encompasses node + ports
      this.assertBoundsEncompassNodeAndPorts(assert, node);
    });
  }

  async testEdgeLabelChange() {
    const nodeId1 = `test-elabel-n1-${this.testCounter}`;
    const nodeId2 = `test-elabel-n2-${this.testCounter}`;
    const edgeId = `test-elabel-e-${this.testCounter++}`;

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.addNodes([
          {
            id: nodeId1,
            type: 'dynamic-port',
            position: { x: -500, y: 100 },
            data: { text: 'N1', ports: [{ id: 'p-out', side: 'right' as PortSide }] },
          },
          {
            id: nodeId2,
            type: 'dynamic-port',
            position: { x: -200, y: 100 },
            data: { text: 'N2', ports: [{ id: 'p-in', side: 'left' as PortSide }] },
          },
        ]);
        this.ngDiagramModelService.addEdges([
          {
            id: edgeId,
            type: 'labelled-edge',
            source: nodeId1,
            target: nodeId2,
            sourcePort: 'p-out',
            targetPort: 'p-in',
            data: { labelPosition: 0.5 },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const edgeBefore = this.getEdge(edgeId)!;
    const labelBefore = edgeBefore.measuredLabels?.[0];
    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.updateEdges([{ id: edgeId, data: { labelPosition: 0.3 } }]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const edge = this.getEdge(edgeId)!;
    const label = edge.measuredLabels?.[0];

    this.addResult('Edge label data change', elapsed, (assert) => {
      // Label exists with measurements
      assert(!!label, `edge should have a measured label`);
      assert((label?.size?.width ?? 0) > 0, `label width > 0, got ${label?.size?.width}`);
      assert((label?.size?.height ?? 0) > 0, `label height > 0, got ${label?.size?.height}`);
      assert(label?.position !== undefined, `label should have position`);

      // positionOnEdge updated
      assert(label?.positionOnEdge === 0.3, `positionOnEdge: expected 0.3, got ${label?.positionOnEdge}`);

      // Label size should be stable (text content structure didn't change)
      if (labelBefore?.size && label?.size) {
        assert(
          this.isNear(label.size.width, labelBefore.size.width, PX_TOLERANCE),
          `label width stable: before ${labelBefore.size.width}, after ${label.size.width}`
        );
        assert(
          this.isNear(label.size.height, labelBefore.size.height, PX_TOLERANCE),
          `label height stable: before ${labelBefore.size.height}, after ${label.size.height}`
        );
      }

      // Label position should have changed (moved from 0.5 to 0.3)
      if (labelBefore?.position && label?.position) {
        assert(
          label.position.x !== labelBefore.position.x || label.position.y !== labelBefore.position.y,
          `label position should change when positionOnEdge moves from 0.5 to 0.3`
        );
      }

      // Label position should be between the two nodes (x: -500 to -200)
      if (label?.position) {
        assert(
          label.position.x >= -510 && label.position.x <= -190,
          `label x should be between nodes (-500 to -200), got ${label.position.x}`
        );
      }
    });
  }

  // =============================================
  // Helpers
  // =============================================

  private getNode(id: string): Node | undefined {
    return this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id);
  }

  private getEdge(id: string): Edge | undefined {
    return this.ngDiagramModelService
      .getModel()
      .getEdges()
      .find((e) => e.id === id);
  }

  private isNear(actual: number | undefined, expected: number, tolerance: number): boolean {
    if (actual === undefined) return false;
    return Math.abs(actual - expected) <= tolerance;
  }

  /**
   * Verifies that measuredBounds encompasses the node body and all its ports,
   * and that each port's position is consistent with its declared side.
   */
  private assertBoundsEncompassNodeAndPorts(assert: (condition: boolean, message: string) => void, node: Node): void {
    const bounds = node.measuredBounds;
    assert(!!bounds, `measuredBounds should exist`);
    if (!bounds || !node.size) return;

    const nodeLeft = node.position.x;
    const nodeTop = node.position.y;
    const nodeRight = nodeLeft + node.size.width;
    const nodeBottom = nodeTop + node.size.height;

    // Bounds should contain the node body
    assert(bounds.x <= nodeLeft + PX_TOLERANCE, `bounds.x (${r(bounds.x)}) should be <= node left (${r(nodeLeft)})`);
    assert(bounds.y <= nodeTop + PX_TOLERANCE, `bounds.y (${r(bounds.y)}) should be <= node top (${r(nodeTop)})`);
    assert(
      bounds.x + bounds.width >= nodeRight - PX_TOLERANCE,
      `bounds right (${r(bounds.x + bounds.width)}) should be >= node right (${r(nodeRight)})`
    );
    assert(
      bounds.y + bounds.height >= nodeBottom - PX_TOLERANCE,
      `bounds bottom (${r(bounds.y + bounds.height)}) should be >= node bottom (${r(nodeBottom)})`
    );

    // Each port: bounds contain it, and position matches declared side
    for (const port of node.measuredPorts ?? []) {
      if (!port.position || !port.size) continue;
      const portLeft = nodeLeft + port.position.x;
      const portTop = nodeTop + port.position.y;
      const portRight = portLeft + port.size.width;
      const portBottom = portTop + port.size.height;
      const portCenterX = port.position.x + port.size.width / 2;
      const portCenterY = port.position.y + port.size.height / 2;

      // Bounds containment
      assert(bounds.x <= portLeft + PX_TOLERANCE, `bounds should contain port '${port.id}' left edge`);
      assert(bounds.y <= portTop + PX_TOLERANCE, `bounds should contain port '${port.id}' top edge`);
      assert(bounds.x + bounds.width >= portRight - PX_TOLERANCE, `bounds should contain port '${port.id}' right edge`);
      assert(
        bounds.y + bounds.height >= portBottom - PX_TOLERANCE,
        `bounds should contain port '${port.id}' bottom edge`
      );

      // Side-specific position: port center should align with the declared edge of the node
      switch (port.side) {
        case 'left':
          assert(
            this.isNear(portCenterX, 0, PX_TOLERANCE),
            `port '${port.id}' (left): center.x should be near 0, got ${r(portCenterX)}`
          );
          break;
        case 'right':
          assert(
            this.isNear(portCenterX, node.size.width, PX_TOLERANCE),
            `port '${port.id}' (right): center.x should be near ${r(node.size.width)}, got ${r(portCenterX)}`
          );
          break;
        case 'top':
          assert(
            this.isNear(portCenterY, 0, PX_TOLERANCE),
            `port '${port.id}' (top): center.y should be near 0, got ${r(portCenterY)}`
          );
          break;
        case 'bottom':
          assert(
            this.isNear(portCenterY, node.size.height, PX_TOLERANCE),
            `port '${port.id}' (bottom): center.y should be near ${r(node.size.height)}, got ${r(portCenterY)}`
          );
          break;
      }
    }
  }

  private addResult(
    name: string,
    elapsed: number,
    assertions: (assert: (condition: boolean, message: string) => void) => void
  ) {
    const failures: string[] = [];
    assertions((condition, message) => {
      if (!condition) failures.push(message);
    });
    const passed = failures.length === 0;
    const details = passed ? 'All assertions passed' : failures.join('; ');
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`[MeasurementTest] ${passed ? '✅' : '❌'} ${status}: ${name} (${elapsed.toFixed(0)}ms)`);
    if (!passed) failures.forEach((f) => console.log(`  ❌ ${f}`));
    this.results.update((r) => [...r, { name, passed, elapsed, details, failures }]);
  }
}
