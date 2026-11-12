import type { ImageMetadata } from 'astro';
import articleGojs from '../assets/resources/article-gojs-org-chart.jpg';
import caseStudyHarness from '../assets/resources/case-study-wire-harness.jpg';
import course1 from '../assets/resources/course-1-project-setup.jpg';
import course2 from '../assets/resources/course-2-properties-panel.jpg';
import course3 from '../assets/resources/course-3-node-types.jpg';
import podcast from '../assets/resources/podcast-ng-poland.jpg';

interface ResourceBase {
  /** Kind, source and length, shown under the description; each part is kept on one line. */
  meta: string[];
  title: string;
  description: string;
  image: ImageMetadata;
}

/** A video that plays on the page, in the lightbox (YouTube loads only on click). */
export interface VideoResource extends ResourceBase {
  youtubeId: string;
}

/** An article on another site: new tab. */
export interface ArticleResource extends ResourceBase {
  href: string;
  linkLabel: string;
}

export type Resource = VideoResource | ArticleResource;

export const isVideo = (resource: Resource): resource is VideoResource => 'youtubeId' in resource;

/** The lead says what the material is about without counting it, so new items need no copy change. */
export const resourcesLead =
  'Learn how ngDiagram works, build a workflow editor step by step, and see what developers have made with it.';

export const resources: Resource[] = [
  {
    meta: ['Video course', 'episode 1', '6 min'],
    title: 'Project setup: your first diagram in Angular',
    description:
      'Scaffold an Angular app, install ngDiagram, define a model with nodes and edges, and turn on zoom to fit.',
    image: course1,
    youtubeId: 'Ck_lPtyKE_Q',
  },
  {
    meta: ['Video course', 'episode 2', '9 min'],
    title: 'Properties panel: edit node data live with signals',
    description:
      'Read the selected node from a service, show its data in a side panel, and write edits back – no subscriptions needed.',
    image: course2,
    youtubeId: '8CdH9Rk99KE',
  },
  {
    meta: ['Video course', 'episode 3', '15 min'],
    title: 'Node types: custom node templates and ports',
    description: 'Build node templates as plain Angular components, drive ports from node data, and keep edges clean.',
    image: course3,
    youtubeId: 'UzK0h9wcyEo',
  },
  {
    meta: ['Podcast', 'NG Poland', '55 min'],
    title: 'Angular diagramming library built from scratch – ngDiagram',
    description:
      'Jakub Kubacki and Łukasz Jaźwa on why the team built its own engine instead of wrapping React Flow, GoJS, or JointJS.',
    image: podcast,
    youtubeId: 'FbMcwWR4Ppw',
  },
  {
    meta: ['Article', 'dev.to'],
    title: "I've used GoJS for years. Here's what happened when I built an org chart with ngDiagram",
    description: 'Org chart in 3 weeks: what beat GoJS and what you build yourself.',
    image: articleGojs,
    href: 'https://dev.to/ngdiagram-dev/ive-used-gojs-for-years-heres-what-happened-when-i-built-an-org-chart-with-ngdiagram-1gkn',
    linkLabel: 'Read on dev.to',
  },
  {
    meta: ['Case study', 'Synergy Codes'],
    title: 'Custom wire harness design software: from Excel to editor',
    description:
      'A harness editor built in about 2 weeks on ngDiagram templates and agent skills: Excel import, rule checks, shop files.',
    image: caseStudyHarness,
    href: 'https://www.synergycodes.com/blog/wire-harness-design-software',
    linkLabel: 'Read the case study',
  },
];
