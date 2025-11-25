import uPlot from 'uplot';
import { NgDiagramViewportService } from 'ng-diagram';

const CHART_CONFIG = {
  WIDTH: 300,
  HEIGHT: 200,
  Y_RANGE_MAX: 1000,
  LINE_WIDTH: 2,
  POINT_SIZE: 6,
  HOVER_POINT_SIZE: 8,
} as const;

const COLORS = {
  STROKE_PRIMARY: 'rgba(255, 255, 255, 0.3)',
  STROKE_SECONDARY: 'rgba(255, 255, 255, 0.2)',
  GRID: 'rgba(255, 255, 255, 0.1)',
  GRADIENT_START: 'rgb(139, 92, 246)',
  GRADIENT_MID: 'rgb(168, 85, 247)',
  GRADIENT_END: 'rgb(192, 132, 252)',
  FILL_START: 'rgba(147, 51, 234, 0.4)',
  FILL_END: 'rgba(147, 51, 234, 0)',
  POINT_STROKE: 'rgb(147, 51, 234)',
  POINT_FILL: 'rgb(30, 30, 35)',
} as const;

const AXIS_CONFIG = {
  X: {
    SIZE: 35,
    GAP: 5,
    SPACE: 30,
    TICK_SIZE: 4,
  },
  Y: {
    SIZE: 45,
    GAP: 5,
    TICK_SIZE: 4,
    INCREMENTS: [250, 500],
  },
} as const;

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

function createScales(): uPlot.Options['scales'] {
  return {
    x: { time: false },
    y: { range: [0, CHART_CONFIG.Y_RANGE_MAX] },
  };
}

function createXAxis(): uPlot.Axis {
  return {
    show: true,
    stroke: COLORS.STROKE_PRIMARY,
    grid: { show: false },
    ticks: {
      show: true,
      stroke: COLORS.STROKE_SECONDARY,
      size: AXIS_CONFIG.X.TICK_SIZE,
    },
    gap: AXIS_CONFIG.X.GAP,
    size: AXIS_CONFIG.X.SIZE,
    space: AXIS_CONFIG.X.SPACE,
    incrs: [1],
    values: (_u, vals) => vals.map((v) => DAY_LABELS[v]),
  };
}

function createYAxis(): uPlot.Axis {
  return {
    show: true,
    stroke: COLORS.STROKE_PRIMARY,
    grid: {
      show: true,
      stroke: COLORS.GRID,
    },
    ticks: {
      show: true,
      stroke: COLORS.STROKE_SECONDARY,
      size: AXIS_CONFIG.Y.TICK_SIZE,
    },
    size: AXIS_CONFIG.Y.SIZE,
    gap: AXIS_CONFIG.Y.GAP,
    incrs: [...AXIS_CONFIG.Y.INCREMENTS],
    values: (_u, vals) => vals.map((v) => Math.round(v).toString()),
  };
}

function createAxes(): uPlot.Axis[] {
  return [createXAxis(), createYAxis()];
}

function createLineGradient(u: uPlot): CanvasGradient {
  const gradient = u.ctx.createLinearGradient(0, 0, u.bbox.width, 0);
  gradient.addColorStop(0, COLORS.GRADIENT_START);
  gradient.addColorStop(0.5, COLORS.GRADIENT_MID);
  gradient.addColorStop(1, COLORS.GRADIENT_END);
  return gradient;
}

function createFillGradient(u: uPlot): CanvasGradient {
  const gradient = u.ctx.createLinearGradient(0, 0, 0, u.bbox.height);
  gradient.addColorStop(0, COLORS.FILL_START);
  gradient.addColorStop(1, COLORS.FILL_END);
  return gradient;
}

function createSeries(): uPlot.Series[] {
  return [
    {}, // First series is for x-axis
    {
      label: 'New Users',
      stroke: (u) => createLineGradient(u),
      width: CHART_CONFIG.LINE_WIDTH,
      fill: (u) => createFillGradient(u),
      points: {
        show: true,
        size: CHART_CONFIG.POINT_SIZE,
        width: CHART_CONFIG.LINE_WIDTH,
        stroke: COLORS.POINT_STROKE,
        fill: COLORS.POINT_FILL,
      },
    },
  ];
}

function handleCursorMove(
  self: uPlot,
  viewportService: NgDiagramViewportService
) {
  return (e: MouseEvent) => {
    const scale = viewportService.scale();
    const rect = self.over.getBoundingClientRect();

    // Adjust mouse position to account for diagram zoom/scale
    const adjustedX = (e.clientX - rect.left) / scale;
    const adjustedY = (e.clientY - rect.top) / scale;

    self.setCursor({ left: adjustedX, top: adjustedY });

    return null;
  };
}

function createCursorConfig(
  viewportService: NgDiagramViewportService
): uPlot.Cursor {
  return {
    bind: {
      mousemove: (self) => handleCursorMove(self, viewportService),
    },
    drag: {
      x: false,
      y: false,
    },
    points: {
      show: true,
      size: () => CHART_CONFIG.HOVER_POINT_SIZE,
      stroke: () => COLORS.GRADIENT_MID,
      width: () => CHART_CONFIG.LINE_WIDTH,
      fill: () => COLORS.POINT_FILL,
    },
  };
}

/**
 * Creates the complete uPlot configuration
 */
export function createChartOptions(
  viewportService: NgDiagramViewportService
): uPlot.Options {
  return {
    width: CHART_CONFIG.WIDTH,
    height: CHART_CONFIG.HEIGHT,
    scales: createScales(),
    axes: createAxes(),
    series: createSeries(),
    cursor: createCursorConfig(viewportService),
    legend: { show: false },
  };
}
