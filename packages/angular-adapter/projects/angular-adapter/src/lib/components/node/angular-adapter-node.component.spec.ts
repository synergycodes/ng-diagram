import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  NodePositionDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';
import { AngularAdapterNodeComponent } from './angular-adapter-node.component';

describe('AngularAdapterNodeComponent', () => {
  let component: AngularAdapterNodeComponent;
  let fixture: ComponentFixture<AngularAdapterNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterNodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularAdapterNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have NodePositionDirective as host directive', () => {
    const nodePositionDirective = fixture.debugElement.injector.get(NodePositionDirective);
    expect(nodePositionDirective).toBeTruthy();
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
