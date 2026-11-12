/**
 * Keyboard contract shared by the template tabs and the package manager segment: one Tab stop
 * for the group (roving tabindex), arrows move and select, Home and End jump to the ends.
 */

export interface RovingKeys {
  next: readonly string[];
  previous: readonly string[];
}

export const HORIZONTAL: RovingKeys = { next: ['ArrowRight'], previous: ['ArrowLeft'] };
export const BOTH_AXES: RovingKeys = {
  next: ['ArrowRight', 'ArrowDown'],
  previous: ['ArrowLeft', 'ArrowUp'],
};

export function rovingGroup<T extends HTMLElement>(
  items: readonly T[],
  select: (item: T) => void,
  keys: RovingKeys
): void {
  const last = items.length - 1;

  items.forEach((item, index) => {
    item.addEventListener('click', () => select(item));
    item.addEventListener('keydown', (event) => {
      let target: number;
      if (keys.next.includes(event.key)) {
        target = index === last ? 0 : index + 1;
      } else if (keys.previous.includes(event.key)) {
        target = index === 0 ? last : index - 1;
      } else if (event.key === 'Home') {
        target = 0;
      } else if (event.key === 'End') {
        target = last;
      } else {
        return;
      }
      const next = items[target];
      if (!next) {
        return;
      }
      event.preventDefault();
      select(next);
      next.focus();
    });
  });
}

/** Marks `selected` as the one selected (or checked) item and the group's Tab stop. */
export function setRovingSelection(
  items: readonly HTMLElement[],
  selected: HTMLElement,
  attribute: 'aria-selected' | 'aria-checked'
): void {
  for (const item of items) {
    const on = item === selected;
    item.setAttribute(attribute, on ? 'true' : 'false');
    item.tabIndex = on ? 0 : -1;
  }
}
