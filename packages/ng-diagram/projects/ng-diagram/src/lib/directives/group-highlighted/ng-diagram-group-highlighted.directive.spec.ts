import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { GroupNode } from '@angularflow/core';
import { NgDiagramGroupHighlightedDirective } from './ng-diagram-group-highlighted.directive';

@Component({
  template: `<div [ngDiagramGroupHighlighted] [node]="node"></div>`,
  imports: [NgDiagramGroupHighlightedDirective],
})
class TestComponent {
  node: GroupNode = {
    id: '1',
    position: { x: 0, y: 0 },
    data: {},
    isGroup: true,
    highlighted: false,
    size: { width: 100, height: 100 },
    measuredPorts: [],
    resizable: true,
    type: 'group',
  };
}

describe('GroupHighlightedDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let divElement: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    divElement = fixture.debugElement.query(By.css('div')).nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    const directive = fixture.debugElement.query(By.directive(NgDiagramGroupHighlightedDirective));
    expect(directive).toBeTruthy();
  });

  it('should not set data-highlighted attribute by default', () => {
    expect(divElement.classList.contains('ng-diagram-group-highlight')).toBe(false);
  });

  it('should set data-highlighted attribute when highlighted is true', () => {
    fixture.componentInstance.node = {
      ...fixture.componentInstance.node,
      highlighted: true,
    };
    fixture.detectChanges();
    expect(divElement.classList.contains('ng-diagram-group-highlight')).toBe(true);
  });

  it('should set data-highlighted attribute to false when highlighted is false', () => {
    fixture.componentInstance.node = {
      ...fixture.componentInstance.node,
      highlighted: false,
    };
    fixture.detectChanges();
    expect(divElement.classList.contains('ng-diagram-group-highlight')).toBe(false);
  });
});
