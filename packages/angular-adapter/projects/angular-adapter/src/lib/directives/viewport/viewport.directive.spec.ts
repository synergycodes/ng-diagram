import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { ViewportDirective } from './viewport.directive';

@Component({
  template: `<div [ngDiagramViewport] [viewport]="viewport"></div>`,
  imports: [ViewportDirective],
})
class TestComponent {
  viewport = { x: 0, y: 0, scale: 1 };
}

describe('ViewportDirective', () => {
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
    const directive = fixture.debugElement.query(By.directive(ViewportDirective));
    expect(directive).toBeTruthy();
  });

  it('should set initial transform style', () => {
    expect(divElement.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('should update transform style when viewport changes', () => {
    component.viewport = { x: 100, y: 200, scale: 2 };
    fixture.detectChanges();

    expect(divElement.style.transform).toBe('translate(100px, 200px) scale(2)');
  });
});
