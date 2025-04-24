import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { InputFieldNodeComponent } from './input-field-node.component';

describe('InputFieldNodeComponent', () => {
  let component: InputFieldNodeComponent;
  let fixture: ComponentFixture<InputFieldNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, InputFieldNodeComponent],
    }).compileComponents();

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
});
