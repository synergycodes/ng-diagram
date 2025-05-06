import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';
import { AngularAdapterEdgeComponent } from './angular-adapter-edge.component';

describe('AngularAdapterEdgeComponent', () => {
  let component: AngularAdapterEdgeComponent;
  let fixture: ComponentFixture<AngularAdapterEdgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterEdgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularAdapterEdgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have PointerDownEventListenerDirective as host directive', () => {
    const pointerDownEventListenerDirective = fixture.debugElement.injector.get(PointerDownEventListenerDirective);
    expect(pointerDownEventListenerDirective).toBeTruthy();
  });

  it('should have PointerEnterEventListenerDirective as host directive', () => {
    const pointerEnterEventListenerDirective = fixture.debugElement.injector.get(PointerEnterEventListenerDirective);
    expect(pointerEnterEventListenerDirective).toBeTruthy();
  });

  it('should have PointerLeaveEventListenerDirective as host directive', () => {
    const pointerLeaveEventListenerDirective = fixture.debugElement.injector.get(PointerLeaveEventListenerDirective);
    expect(pointerLeaveEventListenerDirective).toBeTruthy();
  });

  it('should have PointerUpEventListenerDirective as host directive', () => {
    const pointerUpEventListenerDirective = fixture.debugElement.injector.get(PointerUpEventListenerDirective);
    expect(pointerUpEventListenerDirective).toBeTruthy();
  });
});
