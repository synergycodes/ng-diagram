import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RotateHandleComponent } from './rotate-handle.component';
import { FlowCoreProviderService } from '../../../../services';

describe('RotateHandleComponent', () => {
  let component: RotateHandleComponent;
  let fixture: ComponentFixture<RotateHandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotateHandleComponent],
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: {
            provide: vi.fn().mockReturnValue({
              getState: () => ({
                metadata: {
                  viewport: { x: 0, y: 0, scale: 1 },
                },
              }),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RotateHandleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isRotating', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit pointerDownEvent on pointer down', () => {
    const spy = vi.spyOn(component.pointerDownEvent, 'emit');
    const event = new Event('pointerdown') as PointerEvent;
    component.onPointerDown(event);
    expect(spy).toHaveBeenCalledWith({ event });
  });

  it('should set data-rotating attribute when rotating', () => {
    fixture.componentRef.setInput('isRotating', true);
    fixture.detectChanges();
    expect(component.pointerDownAttr).toBe('true');
  });
});
