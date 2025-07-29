export function shouldDiscardEvent(event: Event, type: DiscardableEventType) {
  const selector = getDiscardEventSelector(type);

  if (!event.target || !(event.target instanceof HTMLElement)) {
    return false;
  }

  return event.target.closest(selector);
}

function getDiscardEventSelector(type: DiscardableEventType): string {
  return `[data-no-${type}="true"]`;
}

type DiscardableEventType = 'drag' | 'pan';
