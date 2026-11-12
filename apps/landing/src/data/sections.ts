import type { ImageMetadata } from 'astro';
import adamKowalski from '../assets/voices/avatar-adam-kowalski.png';
import emilMalanczak from '../assets/voices/avatar-emil-malanczak.png';
import wojciechKrzesaj from '../assets/voices/avatar-wojciech-krzesaj.png';
import { LINKS } from '../config/landing';

export interface Link {
  label: string;
  href: string;
}

/** Pages of ngdiagram.dev: same tab, no arrow (O10). */
export const primaryNav: Link[] = [
  { label: 'Documentation', href: LINKS.docs },
  { label: 'Examples', href: LINKS.examples },
  { label: 'Templates', href: LINKS.templates },
  { label: 'Showcases', href: LINKS.showcases },
  { label: 'Roadmap', href: LINKS.roadmap },
];

/** New tab without an arrow: the logo says where each one leads. */
export const externalNav = [
  { label: 'Discord', href: LINKS.discord, icon: 'i-discord' },
  { label: 'npm', href: LINKS.npm, icon: 'i-npm' },
  { label: 'GitHub', href: LINKS.github, icon: 'i-github' },
] as const;

/** Facts strip: bold lead and the rest of the sentence. */
export const facts: { lead: string; rest: string }[] = [
  { lead: 'Angular 18', rest: ' or newer' },
  { lead: 'Apache 2.0', rest: ' open-source license' },
  { lead: 'AI-ready', rest: ' docs, skills, and an MCP server' },
];

/** "What is ngDiagram?": one sentence that names the product and says what it is. */
export const whatIsLead =
  'ngDiagram is an open-source Angular diagram library for interactive diagrams, node-based editors, and workflow editors – where users model a process, wire up a system, or map an organization. Built for Angular 18 or newer, ngDiagram is developed and maintained by Synergy Codes under the Apache 2.0 license.';

export const nativePoints = [
  {
    icon: 'i-component',
    title: 'Nodes are your Angular components',
    html: 'Angular templates, signals, dependency injection, and your own forms, rendered as DOM you can inspect.',
  },
  {
    icon: 'i-css',
    title: 'Styles are CSS variables',
    html: 'Your tokens and themes apply from day one – no proprietary styling language.',
  },
  {
    icon: 'i-middleware',
    title: 'Every change passes through middleware',
    html: 'Validate, modify, or block any update before it reaches the model.',
  },
  {
    icon: 'i-signal',
    title: 'Signals by default, your store if you prefer',
    html: '<code>initializeModel</code> gives you a signal-based model; implement <code>ModelAdapter</code> to keep the diagram in your own store.',
  },
] as const;

export const credentials = [
  'Built production diagram editors for Fortune 500 companies.',
  'Delivered 200+ diagram solutions across manufacturing, automation, and analytics.',
  'Co-organize Angular meetups and teach at bootcamps and universities.',
];

export interface Quote {
  /** Word for word as on the production site. */
  text: string;
  name: string;
  role: string;
  avatar: ImageMetadata;
  /** The author's LinkedIn profile: the structured data links the author to it (schema.org `sameAs`). */
  linkedin: string;
}

export const quotes: Quote[] = [
  {
    text: "Started testing this for work and lost track of time – spent 5 hours just playing around with it. Since it's built for Angular, I think even devs who never touched diagrams before can jump in and connect stuff pretty easily.",
    name: 'Adam Kowalski',
    role: 'Senior Angular Architect',
    avatar: adamKowalski,
    linkedin: 'https://www.linkedin.com/in/adam-kowalski-861a98252/',
  },
  {
    text: "The best thing is it's truly Angular-native. Nodes are just regular Angular components with HTML and CSS, so you stick to what you know – no weird context switching. Makes onboarding way easier and maintenance less painful.",
    name: 'Emil Małańczak',
    role: 'Senior Frontend Developer',
    avatar: emilMalanczak,
    linkedin: 'https://www.linkedin.com/in/emil-malanczak/',
  },
  {
    text: "ngDiagram gives you more control than other libraries. The middleware lets you override basically anything – try doing that with closed-source tools where you can't even peek under the hood.",
    name: 'Wojciech Krzesaj',
    role: 'Software Engineer',
    avatar: wojciechKrzesaj,
    linkedin: 'https://www.linkedin.com/in/wojciech-krzesaj/',
  },
];

/** The band between the quotes and the closing call: reasons to trust the project. */
export const projectFacts: { title: string; text: string; link?: Link }[] = [
  { title: 'Apache 2.0', text: 'Free to use under Apache 2.0, including in commercial projects.' },
  {
    title: 'Public roadmap',
    text: 'The roadmap shows what comes next.',
    link: { label: 'See what is in progress', href: LINKS.roadmap },
  },
  {
    title: 'Kept current',
    text: 'Compatible with Angular 18 or newer.',
    link: { label: 'Read the changelog', href: LINKS.changelog },
  },
  {
    title: 'AI-ready',
    text: 'Agent skills and an official MCP server for Claude Code, Cursor, or Codex.',
    link: { label: 'Set up skills and the MCP server', href: LINKS.ai },
  },
];

/** A piece of a FAQ answer: text, inline code, or a link (`external`: another site, new tab). */
export type FaqPart = string | { code: string } | { label: string; href: string; external?: boolean };

export interface FaqItem {
  question: string;
  answer: FaqPart[];
}

/**
 * Questions people ask AI assistants about ngDiagram, each answered so it can be quoted on its
 * own. The FAQPage structured data (data/structured-data.ts) repeats this text word for word.
 * Every claim is backed by the repository: LICENSE, the package's peer dependencies, README and
 * the docs.
 */
export const faq: FaqItem[] = [
  {
    question: 'Is ngDiagram free and open source?',
    answer: [
      'Yes. ngDiagram is an open-source Angular diagram library released under the Apache 2.0 license, which lets you use it free of charge, including in commercial projects. The source code is public on ',
      { label: 'GitHub in the synergycodes/ng-diagram repository', href: LINKS.github, external: true },
      '.',
    ],
  },
  {
    question: 'Which Angular versions does ngDiagram support?',
    answer: [
      'ngDiagram works with Angular 18 or newer: the ng-diagram package on npm lists Angular 18 or higher as a peer dependency. The ',
      { label: 'API stability policy', href: LINKS.angularSupport },
      ' in the docs lists the Angular versions ngDiagram supports, and a new Angular major is added within 2 months of its release. Install ngDiagram with ',
      { code: 'npm install ng-diagram' },
      ' and follow the ',
      { label: 'quick start guide', href: LINKS.quickStart },
      ' in the docs.',
    ],
  },
  {
    question: 'Can I use my own Angular components as nodes in ngDiagram?',
    answer: [
      'Yes. In ngDiagram, a custom node is an Angular component that implements the NgDiagramNodeTemplate interface. You register the component in nodeTemplateMap under a type key, and ngDiagram renders every node of that type with your template. A node template can hold any Angular content, including form controls, images, and buttons.',
    ],
  },
  {
    question: 'Can I build a workflow editor or a node-based editor in Angular with ngDiagram?',
    answer: [
      'Yes. ngDiagram gives you the parts of a node-based editor: a drag-and-drop palette, ports, edges with labels, groups, and copy and paste. Every change passes through a middleware pipeline, where your code can inspect, modify, or cancel the change before the model updates. The BPMN Editor in the ',
      { label: 'ngDiagram showcases', href: LINKS.showcases },
      ' is a process editor with a drag-and-drop palette and swimlanes built as ngDiagram groups.',
    ],
  },
  {
    question: 'Is ngDiagram built specifically for Angular?',
    answer: [
      'Yes. ngDiagram is Angular-first: nodes are Angular components, NgDiagramModelService exposes nodes and edges as signals, and ngDiagram services come through Angular dependency injection. Each diagram gets its own isolated services from provideNgDiagram(), so several independent diagrams can run on one page.',
    ],
  },
  {
    question: 'Can ngDiagram render an interactive network graph with pan and zoom?',
    answer: [
      'Yes. ngDiagram includes pan and zoom, a minimap with click-and-drag navigation, and box selection. For large graph visualizations, turn on virtualization: ngDiagram then renders only the nodes and edges inside the current viewport. The docs describe virtualization as a performance option for diagrams with hundreds or thousands of elements.',
    ],
  },
  {
    question: 'Can Synergy Codes build a custom diagram editor for my team?',
    answer: [
      'Yes. Synergy Codes develops and maintains ngDiagram and offers consulting for larger implementations. Synergy Codes engineers can help with onboarding and implementation support, or design and ship a domain-specific editor with your team. Describe your project through the ',
      { label: 'ngDiagram contact form', href: LINKS.contact },
      '.',
    ],
  },
];

/** The text of a FAQ answer without markup, for the FAQPage structured data. */
export const faqAnswerText = (answer: FaqPart[]): string =>
  answer.map((part) => (typeof part === 'string' ? part : 'code' in part ? part.code : part.label)).join('');

export const footerNav: Link[] = [
  { label: 'Documentation', href: LINKS.docs },
  { label: 'Examples', href: LINKS.examples },
  { label: 'Templates', href: LINKS.templates },
  { label: 'Showcases', href: LINKS.showcases },
  { label: 'Roadmap', href: LINKS.roadmap },
  { label: 'Changelog', href: LINKS.changelog },
  { label: 'Contact', href: LINKS.contact },
];
