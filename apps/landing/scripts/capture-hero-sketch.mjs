// Captures the live hero diagram as its loading sketch (O13): writes src/data/hero-sketch.ts.
//
//   pnpm --filter landing build && pnpm --filter landing preview   # in one terminal
//   pnpm --filter landing sketch:capture                            # in another
//
// Run it after every change of the docs example "Landing Page Diagram": hero.spec.ts fails while
// the sketch and the live diagram differ. LANDING_URL defaults to http://localhost:4329/.
//
// Everything is measured in the diagram's own coordinates (the canvas is one translate + scale),
// so the sketch's viewBox can repeat the island's fit. The node templates are recognised by the
// docs example's class names; an unknown template stops the capture.

/* global document, getComputedStyle, DOMMatrix */

import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const url = process.env.LANDING_URL ?? 'http://localhost:4329/';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'hero-sketch.ts');

// The chart of "Notify Users" is drawn by uPlot on a canvas, so its line cannot be measured.
// These are GraphNodeComponent.getSampleData() and the y range [0, CHART_CONFIG.Y_RANGE_MAX] of
// configure-chart.ts (apps/docs/.../landing-page-diagram/graph-node/); the grid follows the
// y axis ticks. Update them together with the example.
const CHART_SERIES = [450, 520, 480, 560, 620, 700, 850];
const CHART_Y_MAX = 1000;
const CHART_GRID = [0, 250, 500, 750, 1000];

/** Height of the bars that stand for a line of text: titles, then smaller lines. */
const BAR = { title: 9, small: 7 };

/** Runs in the page: raw geometry of the live diagram, in diagram coordinates. */
function measure() {
  const host = document.querySelector('ng-diagram').getBoundingClientRect();
  const canvas = new DOMMatrix(getComputedStyle(document.querySelector('ng-diagram-canvas')).transform);
  const scale = canvas.a;
  const toDiagram = (r) => ({
    x: (r.left - host.left - canvas.e) / scale,
    y: (r.top - host.top - canvas.f) / scale,
    width: r.width / scale,
    height: r.height / scale,
  });
  const box = (element) => ({
    ...toDiagram(element.getBoundingClientRect()),
    radius: parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
  });
  // The rendered text, not its block: a bar is as long as the words.
  const text = (element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return toDiagram(range.getBoundingClientRect());
  };
  const one = (node, selector) => {
    const element = node.querySelector(selector);
    if (!element) {
      throw new Error(`${node.dataset.nodeId}: no ${selector}`);
    }
    return element;
  };
  const all = (node, selector) => [...node.querySelectorAll(selector)];

  const nodes = [...document.querySelectorAll('ng-diagram-node')].map((node) => {
    const base = { id: node.dataset.nodeId, ...toDiagram(node.getBoundingClientRect()) };
    if (node.querySelector('.group-node')) {
      const card = one(node, '.group-node');
      return {
        ...base,
        kind: 'group',
        radius: box(card).radius,
        header: toDiagram(one(node, '.group-node__header').getBoundingClientRect()),
        title: text(one(node, '.group-node__title')),
      };
    }
    if (node.querySelector('.user-panel')) {
      return {
        ...base,
        kind: 'userPanel',
        radius: box(one(node, '.user-panel')).radius,
        avatars: all(node, '.user-panel__avatar').map(box),
        names: all(node, '.user-panel__name').map(text),
      };
    }
    if (node.querySelector('.workflow-node')) {
      const workflow = {
        ...base,
        kind: 'workflow',
        radius: box(one(node, '.workflow-node')).radius,
        icon: box(one(node, '.workflow-node__icon')),
        title: text(one(node, '.workflow-node__title')),
        subtitle: text(one(node, '.workflow-node__subtitle')),
      };
      if (!node.querySelector('.graph-node')) {
        return workflow;
      }
      return {
        ...workflow,
        kind: 'graph',
        panel: box(one(node, '.graph-node')),
        panelTitle: text(one(node, '.graph-node__title')),
        plot: toDiagram(one(node, '.u-over').getBoundingClientRect()),
      };
    }
    throw new Error(`${base.id}: unknown node template`);
  });

  const ports = [...document.querySelectorAll('ng-diagram-node ng-diagram-port')].map((port) => {
    const r = toDiagram(port.getBoundingClientRect());
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, r: port.offsetWidth / 2 };
  });
  const edges = [...document.querySelectorAll('ng-diagram-edge')].map((edge) => ({
    id: edge.dataset.edgeId,
    d: edge.querySelector('path.ng-diagram-edge__path').getAttribute('d'),
  }));
  const stage = document.querySelector('.hero-stage').getBoundingClientRect();
  return {
    viewport: { x: canvas.e, y: canvas.f, scale },
    stage: { x: stage.left - host.left, y: stage.top - host.top, width: stage.width, height: stage.height },
    nodes,
    ports,
    edges,
  };
}

const round = (value) => Math.round(value * 10) / 10;
const rect = (className, r, radius = 0) => ({
  tag: 'rect',
  class: className,
  x: round(r.x),
  y: round(r.y),
  width: round(r.width),
  height: round(r.height),
  ...(radius ? { rx: round(radius) } : {}),
});
const bar = (run, height) =>
  rect('sk-bar', { x: run.x, y: run.y + (run.height - height) / 2, width: run.width, height }, height / 2);
const line = (className, x1, y1, x2, y2) => ({
  tag: 'line',
  class: className,
  x1: round(x1),
  y1: round(y1),
  x2: round(x2),
  y2: round(y2),
});

function workflowShapes(node) {
  return [
    rect('sk-card', node, node.radius),
    rect('sk-icon', node.icon, node.icon.radius),
    bar(node.title, BAR.title),
    bar(node.subtitle, BAR.small),
  ];
}

function chartShapes(plot) {
  const y = (value) => plot.y + plot.height * (1 - value / CHART_Y_MAX);
  const x = (index) => plot.x + (plot.width * index) / (CHART_SERIES.length - 1);
  const d = CHART_SERIES.map((value, index) => `${index ? 'L' : 'M'}${round(x(index))} ${round(y(value))}`).join(' ');
  return [
    ...CHART_GRID.map((value) => line('sk-grid', plot.x, y(value), plot.x + plot.width, y(value))),
    { tag: 'path', class: 'sk-chart', d, pathLength: 1 },
  ];
}

function shapesOf(node) {
  switch (node.kind) {
    case 'group': {
      const rule = node.header.y + node.header.height;
      return [
        rect('sk-card sk-card--group', node, node.radius),
        line('sk-rule', node.x, rule, node.x + node.width, rule),
        bar(node.title, BAR.title),
      ];
    }
    case 'userPanel':
      return [
        rect('sk-card', node, node.radius),
        ...node.avatars.flatMap((avatar, index) => [
          {
            tag: 'circle',
            class: 'sk-icon',
            cx: round(avatar.x + avatar.width / 2),
            cy: round(avatar.y + avatar.height / 2),
            r: round(avatar.width / 2),
          },
          bar(node.names[index], BAR.title),
        ]),
      ];
    case 'workflow':
      return workflowShapes(node);
    case 'graph':
      return [
        ...workflowShapes(node),
        rect('sk-panel', node.panel, node.panel.radius),
        bar(node.panelTitle, BAR.title),
        ...chartShapes(node.plot),
      ];
  }
}

try {
  await fetch(url);
} catch {
  console.error(`No server at ${url}. Start it with: pnpm --filter landing preview`);
  process.exit(2);
}

const browser = await chromium.launch();
let raw;
try {
  // A desktop window with a fine pointer, where the island loads.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(() => document.querySelector('[data-hero-diagram]')?.dataset.state === 'live', null, {
    timeout: 30_000,
  });
  raw = await page.evaluate(measure);
} finally {
  await browser.close();
}

// The island fits the bounds of the nodes and their ports into the stage; so does the viewBox.
const xs = [
  ...raw.nodes.flatMap((node) => [node.x, node.x + node.width]),
  ...raw.ports.flatMap((p) => [p.cx - p.r, p.cx + p.r]),
];
const ys = [
  ...raw.nodes.flatMap((node) => [node.y, node.y + node.height]),
  ...raw.ports.flatMap((p) => [p.cy - p.r, p.cy + p.r]),
];
const viewBox = { x: round(Math.min(...xs)), y: round(Math.min(...ys)) };
viewBox.width = round(Math.max(...xs) - viewBox.x);
viewBox.height = round(Math.max(...ys) - viewBox.y);

// Self-check: the viewBox, contained and centred in the stage, must give the island's viewport.
const { stage, viewport } = raw;
const scale = Math.min(stage.width / viewBox.width, stage.height / viewBox.height, 1);
const expected = {
  x: stage.x + (stage.width - viewBox.width * scale) / 2 - viewBox.x * scale,
  y: stage.y + (stage.height - viewBox.height * scale) / 2 - viewBox.y * scale,
};
const offset = Math.max(Math.abs(expected.x - viewport.x), Math.abs(expected.y - viewport.y));
const scaleOffset = Math.abs(scale - viewport.scale) * Math.max(viewBox.width, viewBox.height);
if (offset > 0.5 || scaleOffset > 0.5) {
  throw new Error(
    `The island fits other bounds than ${JSON.stringify(viewBox)} (off by ${offset.toFixed(2)}px, ` +
      `scale ${viewport.scale} vs ${scale}). Check HeroDiagramComponent.fit().`
  );
}

// Groups are drawn under the edges, other nodes over them, as in the library.
const nodes = [...raw.nodes]
  .sort((a, b) => Number(b.kind === 'group') - Number(a.kind === 'group'))
  .map((node) => ({ id: node.id, group: node.kind === 'group', shapes: shapesOf(node) }));
const sketch = {
  viewBox,
  nodes,
  edges: raw.edges,
  ports: raw.ports.map((p) => ({ cx: round(p.cx), cy: round(p.cy), r: round(p.r) })),
};

const source = `/**
 * The hero diagram as its loading sketch (O13), in the diagram's own coordinates.
 * Generated by scripts/capture-hero-sketch.mjs from the live diagram: do not edit by hand. After a
 * change of the docs example, rebuild, start the preview and run \`pnpm --filter landing sketch:capture\`.
 */

/** One SVG element of the sketch: tag, class and attributes. */
export interface SketchShape {
  tag: 'rect' | 'circle' | 'line' | 'path';
  class: string;
  [attribute: string]: string | number;
}

export interface SketchNode {
  /** The node id in the diagram model. */
  id: string;
  /** Groups are drawn under the edges, other nodes over them. */
  group: boolean;
  /** The first shape is the node's card, with the node's box. */
  shapes: SketchShape[];
}

export interface HeroSketch {
  /** Bounds of the nodes and their ports: the rectangle the island fits into the stage. */
  viewBox: { x: number; y: number; width: number; height: number };
  nodes: SketchNode[];
  /** Edge paths as the library routed them, in model order. */
  edges: { id: string; d: string }[];
  ports: { cx: number; cy: number; r: number }[];
}

export const HERO_SKETCH: HeroSketch = ${JSON.stringify(sketch)};
`;
const options = (await prettier.resolveConfig(out)) ?? {};
writeFileSync(out, await prettier.format(source, { ...options, filepath: out }));
console.log(
  `Wrote ${out}: ${nodes.length} nodes, ${sketch.edges.length} edges, ${sketch.ports.length} ports, ` +
    `viewBox ${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}.`
);
