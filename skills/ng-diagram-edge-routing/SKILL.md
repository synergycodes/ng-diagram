---
name: ng-diagram-edge-routing
description: Use when shaping ng-diagram edge paths - orthogonal/bezier/polyline, routingMode auto vs manual, waypoints, edges not following nodes, custom routing (registerRouting), or "Edge routing ... is not registered", "Invalid edge coordinates detected".
license: Apache-2.0
---

# Edge routing

How edge paths are computed: the built-in routings and their options, auto vs manual points, and custom routing algorithms. Layout engines (ELK, dagre) are in `ng-diagram-auto-layout`, edge looks in `ng-diagram-custom-edges`, free ends in `ng-diagram-dangling-edges`.

## Rules

- There are three built-in routings: `'orthogonal'` (the default), `'bezier'` and `'polyline'`. Set one per edge with `edge.routing`; edges without it use the default routing. `edgeRouting.defaultRouting` is read once, when the diagram engine is created. Change it later with `NgDiagramService.setDefaultRouting(name)`.
- `routingMode: 'auto'` (default): the library computes `points` on every routing pass, so your writes to `points` are overwritten. `routingMode: 'manual'`: you own `points`. The library keeps them, draws them with the routing's SVG path and places labels on them. A manual edge without `points` is not drawn.
- `sourcePosition` and `targetPosition` are computed from nodes and ports on every routing pass (also for manual edges) and are `undefined` until the ports are measured. The only exception is a free end of a dangling edge, where the position is your anchor.
- An edge is routed again when its ends, ports, `routing`, `routingMode`, `points` or labels change, or when a connected node moves, resizes, rotates or gets new port measurements. Changing `edgeRouting` options or the default routing does not re-route existing edges.
- A custom routing is a class that implements `EdgeRouting`. Register it with `NgDiagramService.registerRouting()` in the `(diagramInit)` handler. Before the engine exists, the services throw `[ngDiagram] Library engine not initialized yet`. Every new model creates a new engine without your routings, and `diagramInit` fires again after it.
- An unknown routing name never breaks an edge: the edge uses the default routing and a warning is logged.

## Configure the built-in routings

```typescript
import { Component } from '@angular/core';
import { initializeModel, NgDiagramComponent, provideNgDiagram, type NgDiagramConfig } from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [config]="config" />`,
})
export class DiagramComponent {
  config: NgDiagramConfig = {
    edgeRouting: {
      defaultRouting: 'orthogonal', // read once, when the diagram engine is created
      orthogonal: { firstLastSegmentLength: 30, maxCornerRadius: 8 },
      bezier: { bezierControlOffset: 150 },
    },
  };

  model = initializeModel({
    nodes: [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 300, y: 0 }, data: {} },
      { id: 'c', position: { x: 300, y: 200 }, data: {} },
    ],
    edges: [
      // no routing: uses the default routing
      { id: 'e1', source: 'a', sourcePort: 'port-right', target: 'b', targetPort: 'port-left', data: {} },
      { id: 'e2', source: 'a', sourcePort: 'port-right', target: 'c', targetPort: 'port-left', routing: 'bezier', data: {} },
      // fixed waypoints (first and last point at the ports): the path does not follow node moves
      {
        id: 'e3', source: 'b', sourcePort: 'port-right', target: 'c', targetPort: 'port-right',
        routing: 'polyline',
        routingMode: 'manual',
        points: [{ x: 480, y: 22 }, { x: 560, y: 22 }, { x: 560, y: 222 }, { x: 480, y: 222 }],
        data: {},
      },
    ],
  });
}
```

| Option | Default | Effect |
| --- | --- | --- |
| `edgeRouting.defaultRouting` | `'orthogonal'` | Routing for edges without `routing`. |
| `edgeRouting.orthogonal.firstLastSegmentLength` | `20` | Straight part at each port. |
| `edgeRouting.orthogonal.maxCornerRadius` | `15` | Corner rounding; `0` gives sharp corners. |
| `edgeRouting.bezier.bezierControlOffset` | `100` | Distance of the curve's control points from the ends. |

Polyline in auto mode is a straight line between the two ends; in manual mode it connects your points with straight segments. The built-in routings look only at the two ends: they do not route around other nodes. For paths around nodes, use points from a layout engine (`ng-diagram-auto-layout`).

## Change routing at runtime

```typescript
import { Component, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramService, type EdgeRoutingName } from 'ng-diagram';

@Component({ selector: 'app-routing-toolbar', template: '' })
export class RoutingToolbarComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  async useRoutingEverywhere(routing: EdgeRoutingName) {
    this.diagramService.setDefaultRouting(routing); // edges without their own `routing`, from their next routing pass
    const edges = this.modelService.getModel().getEdges();
    // a changed `routing` re-routes these edges now
    await this.modelService.updateEdges(edges.map((edge) => ({ id: edge.id, routing })));
  }
}
```

To let a manual edge follow its nodes again, update it to `routingMode: 'auto'`; the next routing pass replaces its `points`. `ng-diagram-auto-layout` shows this pattern for edges placed by a layout engine.

## Path computed in the edge template (follows the nodes)

```typescript
import { Component, computed, input } from '@angular/core';
import { NgDiagramBaseEdgeComponent, type Edge, type NgDiagramEdgeTemplate, type Point } from 'ng-diagram';

@Component({
  selector: 'app-step-edge',
  imports: [NgDiagramBaseEdgeComponent],
  template: `<ng-diagram-base-edge [edge]="routedEdge()" />`,
})
export class StepEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  routedEdge = computed(() => {
    const edge = this.edge();
    const { sourcePosition, targetPosition } = edge;
    if (!sourcePosition || !targetPosition) {
      return edge; // ports not measured yet
    }
    return { ...edge, points: this.stepPoints(sourcePosition, targetPosition), routing: 'polyline', routingMode: 'manual' as const };
  });

  private stepPoints(from: Point, to: Point): Point[] {
    const midX = (from.x + to.x) / 2;
    return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
  }
}
```

`<ng-diagram-base-edge>` writes the `routing`, `routingMode` and `points` of the edge you pass into the model, so labels, relink handles and `toJSON()` use your points. Register the component in an edge template map (`ng-diagram-custom-edges`).

## Custom routing algorithm

```typescript
import { Component, inject } from '@angular/core';
import {
  initializeModel, NgDiagramComponent, NgDiagramService, provideNgDiagram,
  type EdgeRouting, type EdgeRoutingConfig, type EdgeRoutingContext, type NgDiagramConfig, type Point,
} from 'ng-diagram';

export class CurveRouting implements EdgeRouting {
  name = 'curve'; // edges use routing: 'curve'

  // [start, control point, end]. The bend from the config lives in the control point,
  // because computePointOnPath gets only the points.
  computePoints({ sourcePoint: a, targetPoint: b }: EdgeRoutingContext, config?: EdgeRoutingConfig): Point[] {
    const bend = this.bend(config);
    const control = { x: (a.x + b.x) / 2 - (b.y - a.y) * bend, y: (a.y + b.y) / 2 + (b.x - a.x) * bend };
    return [{ x: a.x, y: a.y }, control, { x: b.x, y: b.y }];
  }

  computeSvgPath(points: Point[]): string {
    if (points.length !== 3) return points.map((p, i) => `${i ? 'L' : 'M'} ${p.x},${p.y}`).join(' ');
    const [a, c, b] = points;
    return `M ${a.x},${a.y} Q ${c.x},${c.y} ${b.x},${b.y}`;
  }

  // Optional: puts relative labels on the curve (the fallback uses the straight line between the ends)
  computePointOnPath(points: Point[], percentage: number): Point {
    const [a, c, b] = points.length === 3 ? points : [points[0], points[0], points[points.length - 1]];
    const t = Math.min(Math.max(percentage, 0), 1);
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }

  private bend(config?: EdgeRoutingConfig): number {
    const options = config?.['curve'];
    return typeof options === 'object' && typeof options['bend'] === 'number' ? options['bend'] : 0.25;
  }
}

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [config]="config" (diagramInit)="onDiagramInit()" />`,
})
export class DiagramComponent {
  private readonly diagramService = inject(NgDiagramService);

  config: NgDiagramConfig = { edgeRouting: { curve: { bend: 0.4 } } };

  model = initializeModel({
    nodes: [{ id: 'a', position: { x: 0, y: 0 }, data: {} }, { id: 'b', position: { x: 300, y: 0 }, data: {} }],
    edges: [{ id: 'e1', source: 'a', sourcePort: 'port-right', target: 'b', targetPort: 'port-left', routing: 'curve', data: {} }],
  });

  // Runs after every (re)initialization: a new model creates a new engine without custom routings
  onDiagramInit() {
    this.diagramService.registerRouting(new CurveRouting());
    this.diagramService.setDefaultRouting('curve'); // optional; logs a warning if 'curve' is not registered
  }
}
```

- `computePoints(context, config)` gets `sourcePoint`/`targetPoint` (with `side`), the `edge`, and `sourceNode`/`targetNode`/`sourcePort`/`targetPort` for connected ends. `computeSvgPath(points, config)` gets the config too. `config` is the current `edgeRouting` config; put your options under your routing name.
- `computePointOnPath(points, percentage)` and `computePointAtDistance(points, px)` (the latter since 1.1.0) are optional and get only the points, not the config. Without them, relative labels sit on the straight line between the first and last point, and `'Npx'` labels follow the straight segments between your points (here: through the control point).
- Edges of the initial model are routed before `diagramInit`. With a routing that is not registered yet, they use the default routing and log a warning until their next routing pass. When the shape must be right from the first paint, leave those edges out of `initializeModel` and add them in the `diagramInit` handler right after `registerRouting()`, with `await modelService.addEdges(edges)`.
- Other methods on `NgDiagramService`: `unregisterRouting(name)`, `getRegisteredRoutings()`, `getDefaultRouting()`. Registering an existing name replaces that routing, built-ins included.

## Edge cases

- Dangling edges are routed between their anchors with any routing; the direction at a free end faces the other end.
- Effectively hidden edges are not routed; they are routed again when shown.
- `edgeRouting.defaultRouting` in the config is not checked. Set to a custom name that is not registered yet, edges without `routing` get a straight two-point path that may draw as nothing. Call `setDefaultRouting()` after `registerRouting()` instead: it checks the name.
- Do not unregister the routing that is the default: edges without `routing` are then left without a usable routing.
- For manual-routing edges the library moves the matching end point of `points` on a relink, `attachEdge`, `detachEdge` and a detach on node delete; paste moves all points (since 1.4.0).

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `[ngDiagram] Edge routing '<name>' is not registered. Falling back to default routing.` | The routing is not registered when the edge is routed (typo, registered too late, lost after a new model). Register in `(diagramInit)`; `routing` must equal the class `name`. |
| `[ngDiagram] Routing '<name>' is not registered. Falling back to '<default>' routing.` | Same cause, reported while placing the labels of such an edge. |
| `[ngDiagram] Cannot set default routing to '<name>': routing not registered. Default routing unchanged.` | Call `registerRouting()` before `setDefaultRouting()`. |
| `[ngDiagram] Routing must have a non-empty name property. Registration skipped.` | Give the routing class a `name`. |
| `registerRouting` throws `[ngDiagram] Library engine not initialized yet` | Called before the engine exists (for example in a constructor or `ngOnInit`). Move it into the `(diagramInit)` handler. |
| `[ngDiagram] Invalid edge coordinates detected for edge '<id>'` | An end cannot be placed: `source`/`target` names a node that is not in the model and that end has no port, a free end (`''`) has no `sourcePosition`/`targetPosition`, or `points` contain invalid numbers. Fix the edge data. |
| Edge not drawn and no error | `source`/`target` names a node that does not exist while that end has a port; `sourcePort`/`targetPort` names a port the node does not render (typo) or not measured yet; a manual edge without `points`; a hidden edge or node. |
| Writing `points` has no effect | Auto mode overwrites them. Use `routingMode: 'manual'`. |
| Manual edge stays in place when nodes move | By design. Compute points in the template (recipe) or set `routingMode: 'auto'`. |
| `updateConfig({ edgeRouting: { defaultRouting } })` changes nothing | The default is read once. Use `setDefaultRouting()` and re-route existing edges (recipe). |
| Labels on a curved custom routing sit off the curve | Implement `computePointOnPath` from the points alone (it gets no config), and `computePointAtDistance` for `'Npx'` labels (recipe). |
| A saved model with dangling edges logs "Invalid edge coordinates detected" on load | Fixed in 1.3.0 (free-end positions are kept) — upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
