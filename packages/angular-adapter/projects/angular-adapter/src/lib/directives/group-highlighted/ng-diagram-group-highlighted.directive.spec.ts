import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { GroupNode } from '@angularflow/core';
import { NgDiagramGroupHighlightedDirective } from './ng-diagram-group-highlighted.directive';

@Component({
  template: `<div [ngDiagramGroupHighlighted] [data]="data"></div>`,
  imports: [NgDiagramGroupHighlightedDirective],
})
class TestComponent {
  data: GroupNode = {
    id: '1',
    position: { x: 0, y: 0 },
    data: {},
    isGroup: true,
    highlighted: false,
    size: { width: 100, height: 100 },
    ports: [],
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
    fixture.componentInstance.data = {
      ...fixture.componentInstance.data,
      highlighted: true,
    };
    fixture.detectChanges();
    expect(divElement.classList.contains('ng-diagram-group-highlight')).toBe(true);
  });

  it('should set data-highlighted attribute to false when highlighted is false', () => {
    fixture.componentInstance.data = {
      ...fixture.componentInstance.data,
      highlighted: false,
    };
    fixture.detectChanges();
    expect(divElement.classList.contains('ng-diagram-group-highlight')).toBe(false);
  });
});
