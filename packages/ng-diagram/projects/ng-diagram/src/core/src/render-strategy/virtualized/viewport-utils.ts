import type { Node, Rect, Viewport, VirtualizationConfig } from '../../types';

const DEFAULT_VIEWPORT_WIDTH = 1920;
const DEFAULT_VIEWPORT_HEIGHT = 1080;

// Percentage of viewport dimensions that triggers recomputation
const RECOMPUTE_THRESHOLD = 0.25;

// Distance threshold (as fraction of viewport) that triggers recompute during panning
const PAN_DISTANCE_THRESHOLD = 0.5;

// Tolerance for viewport dimension changes (pixels) before recomputation
const DIMENSION_CHANGE_TOLERANCE = 10;

/**
 * Checks if virtualization should be bypassed (too few nodes or no viewport).
 */
export function shouldBypassVirtualization(
  nodes: Node[],
  viewport: Viewport | undefined,
  config: VirtualizationConfig
): boolean {
  return !viewport || nodes.length < config.nodeCountThreshold;
}

/**
 * Converts screen viewport to flow coordinates with padding.
 */
export function getViewportRect(viewport: Viewport, paddingMultiplier: number): Rect {
  const { x, y, scale, width, height } = viewport;

  const effectiveWidth = width || DEFAULT_VIEWPORT_WIDTH;
  const effectiveHeight = height || DEFAULT_VIEWPORT_HEIGHT;

  const flowX = -x / scale;
  const flowY = -y / scale;
  const flowWidth = effectiveWidth / scale;
  const flowHeight = effectiveHeight / scale;

  // Calculate padding as a multiple of the largest viewport dimension (in flow coordinates)
  const maxFlowDimension = Math.max(flowWidth, flowHeight);
  const padding = maxFlowDimension * paddingMultiplier;

  return {
    x: flowX - padding,
    y: flowY - padding,
    width: flowWidth + padding * 2,
    height: flowHeight + padding * 2,
  };
}

/**
 * Checks if two viewports are similar enough to reuse cached results.
 * Returns true if the viewport hasn't moved significantly.
 */
export function isViewportSimilar(prev: Rect, current: Rect): boolean {
  const xThreshold = prev.width * RECOMPUTE_THRESHOLD;
  const yThreshold = prev.height * RECOMPUTE_THRESHOLD;

  return (
    Math.abs(prev.x - current.x) < xThreshold &&
    Math.abs(prev.y - current.y) < yThreshold &&
    Math.abs(prev.width - current.width) < DIMENSION_CHANGE_TOLERANCE &&
    Math.abs(prev.height - current.height) < DIMENSION_CHANGE_TOLERANCE
  );
}

/**
 * Checks if viewport has moved too far from the cached position.
 * Used during panning to trigger recompute when accumulated distance is large.
 */
export function hasMovedTooFar(current: Rect, cached: Rect): boolean {
  const xThreshold = cached.width * PAN_DISTANCE_THRESHOLD;
  const yThreshold = cached.height * PAN_DISTANCE_THRESHOLD;

  return Math.abs(current.x - cached.x) > xThreshold || Math.abs(current.y - cached.y) > yThreshold;
}
