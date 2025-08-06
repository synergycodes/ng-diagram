import { ContainerEdge, Point, Rect } from '../../types';

export const detectContainerEdge = (
  containerBox: Rect,
  clientPosition: Point,
  detectionThreshold: number
): ContainerEdge => {
  const localX = clientPosition.x - containerBox.x;
  const localY = clientPosition.y - containerBox.y;
  const innerWidth = containerBox.width;
  const innerHeight = containerBox.height;

  if (localX < detectionThreshold && localY < detectionThreshold) return 'topleft';
  if (localX < detectionThreshold && localY > innerHeight - detectionThreshold) return 'bottomleft';
  if (localX < detectionThreshold) return 'left';
  if (localX > innerWidth - detectionThreshold && localY < detectionThreshold) return 'topright';
  if (localX > innerWidth - detectionThreshold && localY > innerHeight - detectionThreshold) return 'bottomright';
  if (localX > innerWidth - detectionThreshold) return 'right';
  if (localY < detectionThreshold) return 'top';
  if (localY > innerHeight - detectionThreshold) return 'bottom';

  return null;
};
