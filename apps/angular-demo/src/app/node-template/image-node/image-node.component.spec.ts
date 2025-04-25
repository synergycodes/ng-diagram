import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ImageNodeComponent } from './image-node.component';

describe('ImageNodeComponent', () => {
  let component: ImageNodeComponent;
  let fixture: ComponentFixture<ImageNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageNodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageNodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {
      id: '1',
      type: 'image',
      position: { x: 0, y: 0 },
      data: { imageUrl: 'https://test-image.jpg' },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the image with correct URL', () => {
    const img = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://test-image.jpg/');
  });

  it('should handle missing image URL gracefully', () => {
    fixture.componentRef.setInput('data', {
      id: '1',
      type: 'image',
      position: { x: 0, y: 0 },
    });
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://placehold.jp/150x150.png');
  });
});
