import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { NodePositionDirective } from '../directives';
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
});
