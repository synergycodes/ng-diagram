import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { ZIndexDirective } from './z-index.directive';

@Component({
  template: `<div [angularAdapterZIndex] [data]="data"></div>`,
  imports: [ZIndexDirective],
})
class TestComponent {
  data = {};
}

describe('ZIndexDirective', () => {
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
    const directive = fixture.debugElement.query(By.directive(ZIndexDirective));
    expect(directive).toBeTruthy();
  });

  it('should set default z-index style', () => {
    expect(divElement.style.zIndex).toBe('0');
  });

  it('should update z-index style when data changes', () => {
    component.data = { zIndex: 1 };
    fixture.detectChanges();

    expect(divElement.style.zIndex).toBe('1');
  });
});
