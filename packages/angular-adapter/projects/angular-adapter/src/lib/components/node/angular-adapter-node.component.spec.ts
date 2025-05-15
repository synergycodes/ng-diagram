import { Directive, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';
import { NodePositionDirective } from '../../directives/node-position/node-position.directive';
import { NodeSelectedDirective } from '../../directives/node-selected/node-selected.directive';
import { NodeSizeDirective } from '../../directives/node-size/node-size.directive';
import { AngularAdapterNodeComponent } from './angular-adapter-node.component';

@Directive({
  selector: '[angularAdapterNodeSize]',
  standalone: true,
})
class MockNodeSizeDirective {
  @Input() eventTarget?: { type: string };
  @Input() size?: { width: number; height: number };
  @Input() sizeControlled = false;
}

describe('AngularAdapterNodeComponent', () => {
  let component: AngularAdapterNodeComponent;
  let fixture: ComponentFixture<AngularAdapterNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterNodeComponent],
    })
      .overrideComponent(AngularAdapterNodeComponent, {
        remove: {
          hostDirectives: [
            {
              directive: NodeSizeDirective,
              inputs: ['eventTarget', 'size', 'sizeControlled'],
            },
          ],
        },
        add: {
          hostDirectives: [
            {
              directive: MockNodeSizeDirective,
              inputs: ['eventTarget', 'size', 'sizeControlled'],
            },
          ],
        },
      })
      .compileComponents();

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
    const nodeSizeDirective = fixture.debugElement.injector.get(MockNodeSizeDirective);
    expect(nodeSizeDirective).toBeTruthy();
  });
});
