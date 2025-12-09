import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkerRegistryService } from '../../../services/marker-registry/marker-registry.service';
import { NgDiagramMarkerArrowComponent } from './marker-arrow.component';

describe('MarkerArrowComponent', () => {
  let component: NgDiagramMarkerArrowComponent;
  let fixture: ComponentFixture<NgDiagramMarkerArrowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgDiagramMarkerArrowComponent],
      providers: [MarkerRegistryService],
    }).compileComponents();

    fixture = TestBed.createComponent(NgDiagramMarkerArrowComponent);
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
