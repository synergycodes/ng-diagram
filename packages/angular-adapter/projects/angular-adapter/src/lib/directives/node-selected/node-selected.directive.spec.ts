import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { NodeSelectedDirective } from './node-selected.directive';

@Component({
  template: `<div [angularAdapterNodeSelected] [data]="data"></div>`,
  imports: [NodeSelectedDirective],
})
class TestComponent {
  data = {};
}

describe('NodeSelectedDirective', () => {
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
    const directive = fixture.debugElement.query(By.directive(NodeSelectedDirective));
    expect(directive).toBeTruthy();
  });

  it('should set transition style', () => {
    expect(divElement.style.transition).toBe('box-shadow 0.1s ease-in-out');
  });

  it('should set default box-shadow style', () => {
    expect(divElement.style.boxShadow).toBe('none');
  });

  it('should update box-shadow style when selected changes', () => {
    component.data = { selected: true };
    fixture.detectChanges();

    expect(divElement.style.boxShadow).toBe('0 0 2px 4px rgba(30, 144, 255, 0.5)');
  });
});
