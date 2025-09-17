import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { NgDiagramNodeSelectedDirective } from './ng-diagram-node-selected.directive';

@Component({
  template: `<div [ngDiagramNodeSelected] [node]="node"></div>`,
  imports: [NgDiagramNodeSelectedDirective],
})
class TestComponent {
  node = {};
}

describe('NodeSelectedDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let divElement: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    divElement = fixture.debugElement.query(By.css('div')).nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    const directive = fixture.debugElement.query(By.directive(NgDiagramNodeSelectedDirective));
    expect(directive).toBeTruthy();
  });

  it('should set default box-shadow style', () => {
    expect(divElement.style.boxShadow).toBe('');
  });
});
