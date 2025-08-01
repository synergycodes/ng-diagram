import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { NodePositionDirective } from './node-position.directive';

@Component({
  template: `<div [ngDiagramNodePosition] [data]="data"></div>`,
  imports: [NodePositionDirective],
})
class TestComponent {
  data = { position: { x: 0, y: 0 } };
}

describe('NodePositionDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let divElement: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    divElement = fixture.debugElement.query(By.css('div')).nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    const directive = fixture.debugElement.query(By.directive(NodePositionDirective));
    expect(directive).toBeTruthy();
  });

  it('should set initial transform style', () => {
    expect(divElement.style.transform).toBe('translate(0px, 0px)');
  });

  it('should update transform style when data changes', () => {
    component.data = { position: { x: 100, y: 200 } };
    fixture.detectChanges();

    expect(divElement.style.transform).toBe('translate(100px, 200px)');
  });
});
