import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  NodePositionDirective,
  NodeSelectedDirective,
  NodeSizeDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
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
    fixture.componentRef.setInput('data', { id: '1', type: 'unknown', position: { x: 700, y: 300 }, data: {} });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have NodeSizeDirective as host directive', () => {
    const nodeSizeDirective = fixture.debugElement.injector.get(NodeSizeDirective);
    expect(nodeSizeDirective).toBeTruthy();
  });

  it('should have NodePositionDirective as host directive', () => {
    const nodePositionDirective = fixture.debugElement.injector.get(NodePositionDirective);
    expect(nodePositionDirective).toBeTruthy();
  });

  it('should have NodeSelectedDirective as host directive', () => {
    const nodeSelectedDirective = fixture.debugElement.injector.get(NodeSelectedDirective);
    expect(nodeSelectedDirective).toBeTruthy();
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

  it('should have NodeSizeDirective as host directive', () => {
    const nodeSizeDirective = fixture.debugElement.injector.get(NodeSizeDirective);
    expect(nodeSizeDirective).toBeTruthy();
  });

  it('should have ZIndexDirective as host directive', () => {
    const zIndexDirective = fixture.debugElement.injector.get(ZIndexDirective);
    expect(zIndexDirective).toBeTruthy();
  });
});
