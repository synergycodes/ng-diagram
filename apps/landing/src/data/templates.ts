import type { ImageMetadata } from 'astro';
import assemblyLine from '../../../docs/public/assets/templates/assembly-line.png';
import av from '../../../docs/public/assets/templates/av.png';
import electricCircuit from '../../../docs/public/assets/templates/electric-circuit.png';
import orgChart from '../../../docs/public/assets/templates/org-chart.png';
import singleLineDiagram from '../../../docs/public/assets/templates/single-line-diagram.png';
import { site } from '../config/landing';

export interface TemplateCard {
  title: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
  demoHref: string;
  sourceHref: string;
}

export interface TemplateDomain {
  id: string;
  name: string;
  /** Bold opening of the domain description. */
  lead: string;
  /** The rest of the description: what the library gives, what the templates add. */
  body: string;
  templates: TemplateCard[];
}

/** No count, so the copy does not change with every new template. */
export const templatesLead = 'Fork-ready editors, each with a live demo and full source.';

/**
 * The five templates of the docs (`apps/docs/src/content/docs/templates/templates.ts`), by domain.
 * A domain with more templates than fit in one row pages them in a scroller (O2).
 */
export const templateDomains: TemplateDomain[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    lead: 'Electrical schematics, substation single-line diagrams, AV signal flow, production-line monitoring.',
    body: 'The library gives you ports with sides and connection types, floating edges with orthogonal, polyline, or Bézier routing, plus snapping, groups, and a minimap. These templates add SVG symbol libraries, geometry-derived wire junctions, schema-driven properties panels, and SVG or DXF export; the Assembly Line template adds a live data feed with Edit and Monitor modes and threshold-colored KPIs.',
    templates: [
      {
        title: 'Electric Circuit',
        description:
          'Node-based schematic editor with a searchable SVG parts library, smart wire junctions, and SVG, JPEG, or JSON export.',
        image: electricCircuit,
        imageAlt:
          'Circuit editor: electronic components wired into a schematic, with a parts palette and a properties panel',
        demoHref: site('/templates/electric-circuit/'),
        sourceHref: 'https://github.com/synergycodes/ng-diagram-electric-circuit',
      },
      {
        title: 'Single-Line Diagram',
        description:
          'Substation SLD editor with IEC 60617 symbols, geometry-derived junctions, and a schema-driven properties panel.',
        image: singleLineDiagram,
        imageAlt:
          'Single-line diagram editor: IEC 60617 substation symbols placed from a categorized palette onto a schematic canvas',
        demoHref: site('/templates/single-line-diagram/'),
        sourceHref: 'https://github.com/synergycodes/ng-diagram-single-line-diagram',
      },
      {
        title: 'AV Schematic',
        description: 'Signal-flow editor with typed connectors (XLR, HDMI, speakON) and PNG or DXF export for AutoCAD.',
        image: av,
        imageAlt:
          'AV signal-flow editor: devices wired port-to-port with a properties panel for editing device fields and ports',
        demoHref: site('/templates/av/'),
        sourceHref: 'https://github.com/synergycodes/ng-diagram-av-schematic',
      },
      {
        title: 'Assembly Line',
        description:
          'Production-line monitor with Edit and Monitor modes, a live data feed, threshold-colored KPIs, and PNG, SVG, or DXF export.',
        image: assemblyLine,
        imageAlt:
          'Assembly Line monitor: production modules connected by conveyor flows, live status badges and KPI grids on the nodes',
        demoHref: site('/templates/assembly-line/'),
        sourceHref: 'https://github.com/synergycodes/ng-diagram-assembly-line',
      },
    ],
  },
  {
    id: 'business',
    name: 'Business modeling',
    lead: 'Org charts, mind maps, BPMN diagrams, hierarchies.',
    body: 'The library gives you nested groups, a signal-based model out of the box, a model adapter interface for your own store, plus selection, box selection, and copy and paste. The Org Chart template adds expand/collapse of subtrees and ELK.js layout; the BPMN Editor showcase builds its swimlanes from groups, with a drag-and-drop palette and ELK.js layout in each lane.',
    templates: [
      {
        title: 'Org Chart',
        description: 'Tree editor with drag-and-drop reordering, expand/collapse, ELK.js layout, minimap, and themes.',
        image: orgChart,
        imageAlt: 'Org Chart starter kit: a tree of person cards with expand and collapse controls',
        demoHref: site('/templates/org-chart/'),
        sourceHref: 'https://github.com/synergycodes/ng-diagram-orgchart',
      },
    ],
  },
];

/** A domain pages its cards in a scroller once it has more than fit in one row of the grid. */
export const SCROLLER_FROM = 4;
