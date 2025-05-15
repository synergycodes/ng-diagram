import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FlowCoreProviderService } from '@angularflow/angular-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResizableNodeComponent } from './resizable-node.component';

describe('ResizableNodeComponent', () => {
  let component: ResizableNodeComponent;
  let fixture: ComponentFixture<ResizableNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ResizableNodeComponent],
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: {
            provide: vi.fn().mockReturnValue({
              commandHandler: {
                emit: vi.fn(),
              },
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizableNodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { id: '1', type: 'input-field', position: { x: 0, y: 0 } });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update text model when input value changes', () => {
    const input = fixture.nativeElement.querySelector('.text-input');
    const testValue = 'test input';

    input.value = testValue;
    input.dispatchEvent(new Event('input'));

    expect(component.text()).toBe(testValue);
  });

  it('should update size model when input value changes', () => {
    const input = fixture.nativeElement.querySelector('.size-input');
    const testValue = '100 200';

    input.value = testValue;
    input.dispatchEvent(new Event('input'));

    expect(component.sizeText()).toBe(testValue);
  });

  it('should display the text value in the template', () => {
    const testValue = 'test display';
    component.text.set(testValue);
    fixture.detectChanges();

    const displayedText = fixture.nativeElement.textContent.trim();
    expect(displayedText).contain(testValue);
  });

  it('should display width and height in the template', () => {
    fixture.componentRef.setInput('data', { size: { width: 100, height: 200 } });
    fixture.detectChanges();

    const displayedText = fixture.nativeElement.textContent.trim();
    expect(displayedText).contain('width: 100, height: 200');
  });

  it('should update size when size input changes', () => {
    const input = fixture.nativeElement.querySelector('.size-input');
    const testValue = '100 200';
    const flowCoreProvider = TestBed.inject(FlowCoreProviderService);
    const spy = vi.spyOn(flowCoreProvider.provide().commandHandler, 'emit');

    input.value = testValue;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));

    expect(spy).toHaveBeenCalledWith('resizeNode', {
      id: '1',
      size: { width: 100, height: 200 },
    });
  });

  it('should not update size when size input is invalid', () => {
    const input = fixture.nativeElement.querySelector('.size-input');
    const testValue = 'invalid';
    const flowCoreProvider = TestBed.inject(FlowCoreProviderService);
    const spy = vi.spyOn(flowCoreProvider.provide().commandHandler, 'emit');

    input.value = testValue;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));

    expect(spy).not.toHaveBeenCalled();
  });

  it('should update controlNodeSize when size controlled is checked', () => {
    const input = fixture.nativeElement.querySelector('.size-control-checkbox');
    const flowCoreProvider = TestBed.inject(FlowCoreProviderService);
    const spy = vi.spyOn(flowCoreProvider.provide().commandHandler, 'emit');

    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith('controlNodeSize', {
      id: '1',
      sizeControlled: true,
    });
  });

  it('should update size when size controlled is checked', () => {
    component.sizeText.set('100 200');
    const input = fixture.nativeElement.querySelector('.size-control-checkbox');
    const flowCoreProvider = TestBed.inject(FlowCoreProviderService);
    const spy = vi.spyOn(flowCoreProvider.provide().commandHandler, 'emit');

    input.checked = true;
    input.dispatchEvent(new Event('change'));

    // One with sizeControlled true, one with new size
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('resizeNode', {
      id: '1',
      size: { width: 100, height: 200 },
    });
  });

  it('should not update size when size controlled is unchecked', () => {
    component.sizeText.set('100 200');
    const input = fixture.nativeElement.querySelector('.size-control-checkbox');
    const flowCoreProvider = TestBed.inject(FlowCoreProviderService);
    const spy = vi.spyOn(flowCoreProvider.provide().commandHandler, 'emit');

    input.checked = false;
    input.dispatchEvent(new Event('change'));

    // Only with sizeControlled false, no resizeNode
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('controlNodeSize', {
      id: '1',
      sizeControlled: false,
    });
  });

  describe.each(['keydown', 'keypress', 'keyup'])('event=%s', (eventType) => {
    it(`should stop ${eventType} event propagation`, () => {
      const input = fixture.nativeElement.querySelector('input');
      const event = new Event(eventType);
      const spy = vi.spyOn(event, 'stopPropagation');

      input.dispatchEvent(event);

      expect(spy).toHaveBeenCalled();
    });
  });
});
