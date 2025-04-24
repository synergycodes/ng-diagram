import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularAdapterDiagramComponent } from '@angularflow/angular-adapter';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { By } from '@angular/platform-browser';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, AngularAdapterDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with two nodes', () => {
    const nodes = component.nodes();
    expect(nodes.length).toBe(2);
    expect(nodes[0].type).toBe('input-field');
    expect(nodes[1].type).toBe('image');
  });

  it('should have correct node template mappings', () => {
    expect(component.nodeTemplateMap.has('input-field')).toBeTruthy();
    expect(component.nodeTemplateMap.has('image')).toBeTruthy();
  });

  it('should clear interval on destroy', () => {
    const spy = vi.spyOn(window, 'clearInterval');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
  });

  it('should update node positions periodically', () => {
    const initialPositions = component.nodes().map((node) => ({ ...node.position }));

    vi.advanceTimersByTime(3000);

    const newPositions = component.nodes().map((node) => node.position);
    expect(newPositions).not.toEqual(initialPositions);
  });

  it('should generate random positions within container bounds', () => {
    const mockRect = { width: 1000, height: 800 };
    const element = fixture.debugElement.query(By.css('.diagram-container')).nativeElement;
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(mockRect);

    vi.advanceTimersByTime(3000);

    const positions = component.nodes().map((node) => node.position);
    expect(positions[0].x).toBeGreaterThanOrEqual(0);
    expect(positions[0].x).toBeLessThanOrEqual(mockRect.width - 200);
    expect(positions[0].y).toBeGreaterThanOrEqual(0);
    expect(positions[0].y).toBeLessThanOrEqual(mockRect.height - 200);
    expect(positions[1].x).toBeGreaterThanOrEqual(0);
    expect(positions[1].x).toBeLessThanOrEqual(mockRect.width - 200);
    expect(positions[1].y).toBeGreaterThanOrEqual(0);
    expect(positions[1].y).toBeLessThanOrEqual(mockRect.height - 200);
  });
});
