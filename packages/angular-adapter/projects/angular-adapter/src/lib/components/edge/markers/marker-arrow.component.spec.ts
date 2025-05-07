import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkerArrowComponent } from './marker-arrow.component';

describe('MarkerArrowComponent', () => {
  let component: MarkerArrowComponent;
  let fixture: ComponentFixture<MarkerArrowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerArrowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkerArrowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an SVG element', () => {
    const svgElement = fixture.nativeElement.querySelector('svg');
    expect(svgElement).toBeTruthy();
  });
});
