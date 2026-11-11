/** Quick Start: the canonical snippet of the README and the docs, with the two traps. */

export const installCommands = {
  npm: 'npm install ng-diagram',
  pnpm: 'pnpm add ng-diagram',
  yarn: 'yarn add ng-diagram',
  bun: 'bun add ng-diagram',
} as const;

export type PackageManager = keyof typeof installCommands;

/** Highlighted HTML of the styles step (escaped markup, rendered inside <pre>). */
export const stylesCodeHtml =
  '<span class="cm">/* src/styles.scss */</span>\n@import <span class="str">\'ng-diagram/styles.css\'</span>;';

/** Highlighted HTML of the component step. */
export const componentCodeHtml =
  '<span class="kw">import</span> { Component } <span class="kw">from</span> <span class="str">\'@angular/core\'</span>;\n<span class="kw">import</span> { NgDiagramComponent, <span class="fn">initializeModel</span>,\n<span class="fn">provideNgDiagram</span> } <span class="kw">from</span> <span class="str">\'ng-diagram\'</span>;\n\n<span class="fn">@Component</span>({\nimports: [NgDiagramComponent],\nproviders: [<span class="fn">provideNgDiagram</span>()],\ntemplate: <span class="str">`&lt;ng-diagram [model]="model" /&gt;`</span>,\nstyles: <span class="str">`:host { display: flex; height: 300px; }`</span>,\n})\n<span class="kw">export class</span> AppComponent {\nmodel = <span class="fn">initializeModel</span>({\n  nodes: [\n    { id: <span class="str">\'1\'</span>, position: { x: 100, y: 150 },\n      data: { label: <span class="str">\'Node 1\'</span> } },\n    { id: <span class="str">\'2\'</span>, position: { x: 400, y: 150 },\n      data: { label: <span class="str">\'Node 2\'</span> } },\n  ],\n  edges: [\n    { id: <span class="str">\'1\'</span>, source: <span class="str">\'1\'</span>, sourcePort: <span class="str">\'port-right\'</span>,\n      target: <span class="str">\'2\'</span>, targetPort: <span class="str">\'port-left\'</span>, data: {} },\n  ],\n});\n}';
