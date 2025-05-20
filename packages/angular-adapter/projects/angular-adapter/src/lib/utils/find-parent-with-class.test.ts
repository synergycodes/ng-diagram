import { describe, expect, it } from 'vitest';
import { findParentWithClass } from './find-parent-with-class';

describe('findParentWithClass', () => {
  it('should return the parent element with the given class', () => {
    const parent = document.createElement('div');
    parent.classList.add('parent');
    const child = document.createElement('div');
    child.classList.add('child');
    parent.appendChild(child);
    expect(findParentWithClass(child, 'parent')).toBe(parent);
  });

  it('should return null if no parent element with the given class is found', () => {
    const child = document.createElement('div');
    expect(findParentWithClass(child, 'parent')).toBeNull();
  });

  it('should return the parent element with the given class if it is nested', () => {
    const grandParent = document.createElement('div');
    grandParent.classList.add('grand-parent');

    const parent = document.createElement('div');
    parent.classList.add('parent');

    const child = document.createElement('div');
    child.classList.add('child');

    parent.appendChild(child);
    grandParent.appendChild(parent);

    expect(findParentWithClass(child, 'grand-parent')).toBe(grandParent);
  });
});
