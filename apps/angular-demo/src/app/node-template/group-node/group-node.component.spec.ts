import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AngularAdapterPortComponent } from '@angularflow/angular-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InputFieldNodeComponent } from './group-node.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'angular-adapter-port',
  template: '<span></span>',
})
class MockAngularAdapterPortComponent {}

describe('InputFieldNodeComponent', () => {
  let component: InputFieldNodeComponent;
  let fixture: ComponentFixture<InputFieldNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, InputFieldNodeComponent],
    })
      .overrideComponent(InputFieldNodeComponent, {
        remove: { imports: [AngularAdapterPortComponent] },
        add: { imports: [MockAngularAdapterPortComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InputFieldNodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { id: '1', type: 'input-field', position: { x: 0, y: 0 } });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update text model when input value changes', () => {
    const input = fixture.nativeElement.querySelector('input');
    const testValue = 'test input';

    input.value = testValue;
    input.dispatchEvent(new Event('input'));

    expect(component.text()).toBe(testValue);
  });

  it('should display the text value in the template', () => {
    const testValue = 'test display';
    component.text.set(testValue);
    fixture.detectChanges();

    const displayedText = fixture.nativeElement.textContent.trim();
    expect(displayedText).toBe(testValue);
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
