import { Component, inject, output, signal } from '@angular/core';
import { Edge, NgDiagramModelService, NgDiagramService, Node, type Port, type PortSide } from 'ng-diagram';

interface TestResult {
  name: string;
  passed: boolean;
  elapsed: number;
  details: string;
}

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
    this.addResult('Empty transaction', elapsed < 20, elapsed, `Should resolve immediately`);
  }

  async testPositionOnly() {
    const nodes = this.ngDiagramModelService.getModel().getNodes();
    const target = nodes[0];
    if (!target) return;

    const before = this.snapshotNode(target);
    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.updateNodes([
          {
            id: target.id,
            position: { x: target.position.x + 10, y: target.position.y },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const node = this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === target.id)!;
    const after = this.snapshotNode(node);
    const hasBounds = this.hasValidMeasuredBounds(node);

    this.addResult('Position only', hasBounds, elapsed, `measuredBounds valid: ${hasBounds}`);
    console.log('[MeasurementTest] Position only — before:', before);
    console.log('[MeasurementTest] Position only — after:', after);
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
    const node = this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id)!;
    const after = this.snapshotNode(node);
    const hasSize = !!node.size && node.size.width > 0 && node.size.height > 0;
    const hasPorts = this.hasValidMeasuredPorts(node);
    const hasBounds = this.hasValidMeasuredBounds(node);

    this.addResult(
      'Add node with ports',
      hasSize && hasPorts && hasBounds,
      elapsed,
      `size: ${node.size?.width}x${node.size?.height}, ports: ${node.measuredPorts?.length}, bounds: ${hasBounds}`
    );
    console.log('[MeasurementTest] Add node — after:', after);

    this.ngDiagramModelService.deleteNodes([id]);
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

    const nodeBefore = this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id)!;
    const before = this.snapshotNode(nodeBefore);
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
    const node = this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id)!;
    const after = this.snapshotNode(node);
    const portIn = node.measuredPorts?.find((p: Port) => p.id === 'p-in');
    const portOut = node.measuredPorts?.find((p: Port) => p.id === 'p-out');
    const sidesCorrect = portIn?.side === 'top' && portOut?.side === 'bottom';
    const hasPositions = this.hasValidMeasuredPorts(node);

    this.addResult(
      'Data-driven port side change (original bug)',
      sidesCorrect && hasPositions,
      elapsed,
      `p-in: ${portIn?.side}, p-out: ${portOut?.side}, positions valid: ${hasPositions}`
    );
    console.log('[MeasurementTest] Port side change — before:', before);
    console.log('[MeasurementTest] Port side change — after:', after);

    this.ngDiagramModelService.deleteNodes([id]);
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

    const nodeBefore = this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id)!;
    const before = this.snapshotNode(nodeBefore);
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
    const node = this.ngDiagramModelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id)!;
    const after = this.snapshotNode(node);
    const portIn = node.measuredPorts?.find((p: Port) => p.id === 'p-in');
    const portOut = node.measuredPorts?.find((p: Port) => p.id === 'p-out');
    const sidesCorrect = portIn?.side === 'top' && portOut?.side === 'bottom';
    const posCorrect = node.position.x === -400 && node.position.y === -200;
    const hasBounds = this.hasValidMeasuredBounds(node);

    this.addResult(
      'Position + data-driven port side',
      sidesCorrect && posCorrect && hasBounds,
      elapsed,
      `sides: ${portIn?.side}/${portOut?.side}, pos: ${node.position.x},${node.position.y}, bounds: ${hasBounds}`
    );
    console.log('[MeasurementTest] Position + data — before:', before);
    console.log('[MeasurementTest] Position + data — after:', after);

    this.ngDiagramModelService.deleteNodes([id]);
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

    const edgeBefore = this.ngDiagramModelService
      .getModel()
      .getEdges()
      .find((e) => e.id === edgeId)!;
    const before = this.snapshotEdge(edgeBefore);
    const t1 = performance.now();

    await this.ngDiagramService.transaction(
      () => {
        this.ngDiagramModelService.updateEdges([
          {
            id: edgeId,
            data: { labelPosition: 0.3 },
          },
        ]);
      },
      { waitForMeasurements: true }
    );

    const elapsed = performance.now() - t1;
    const edge = this.ngDiagramModelService
      .getModel()
      .getEdges()
      .find((e) => e.id === edgeId)!;
    const after = this.snapshotEdge(edge);
    const hasLabels = !!edge.measuredLabels && edge.measuredLabels.length > 0;
    const labelHasSize = hasLabels && (edge.measuredLabels![0].size?.width ?? 0) > 0;

    this.addResult(
      'Edge label data change',
      hasLabels && labelHasSize,
      elapsed,
      `labels: ${edge.measuredLabels?.length}, size: ${edge.measuredLabels?.[0]?.size?.width}x${edge.measuredLabels?.[0]?.size?.height}`
    );
    console.log('[MeasurementTest] Edge label — before:', before);
    console.log('[MeasurementTest] Edge label — after:', after);

    this.ngDiagramModelService.deleteEdges([edgeId]);
    this.ngDiagramModelService.deleteNodes([nodeId1, nodeId2]);
  }

  private addResult(name: string, passed: boolean, elapsed: number, details: string) {
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`[MeasurementTest] ${passed ? '✅' : '❌'} ${status}: ${name} (${elapsed.toFixed(0)}ms) — ${details}`);
    this.results.update((r) => [...r, { name, passed, elapsed, details }].slice(-6));
  }

  private snapshotNode(node: Node) {
    return {
      position: { ...node.position },
      size: node.size ? { ...node.size } : undefined,
      measuredBounds: node.measuredBounds ? { ...node.measuredBounds } : undefined,
      measuredPorts: node.measuredPorts?.map((p: Port) => ({
        id: p.id,
        side: p.side,
        size: p.size ? { ...p.size } : undefined,
        position: p.position ? { ...p.position } : undefined,
      })),
    };
  }

  private snapshotEdge(edge: Edge) {
    return {
      measuredLabels: edge.measuredLabels?.map((l) => ({
        id: l.id,
        size: l.size ? { ...l.size } : undefined,
        position: l.position ? { ...l.position } : undefined,
        positionOnEdge: l.positionOnEdge,
      })),
    };
  }

  private hasValidMeasuredPorts(node: Node): boolean {
    return (
      !!node.measuredPorts &&
      node.measuredPorts.length > 0 &&
      node.measuredPorts.every((p: Port) => p.size && p.size.width > 0 && p.size.height > 0)
    );
  }

  private hasValidMeasuredBounds(node: Node): boolean {
    return !!node.measuredBounds && node.measuredBounds.width > 0 && node.measuredBounds.height > 0;
  }
}
