import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AngularAdapterPortComponent } from '@angularflow/angular-adapter';
import { ImageNodeComponent } from './image-node.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'angular-adapter-port',
  template: '<span></span>',
})
class MockAngularAdapterPortComponent {}

describe('ImageNodeComponent', () => {
  let component: ImageNodeComponent;
  let fixture: ComponentFixture<ImageNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageNodeComponent],
    })
      .overrideComponent(ImageNodeComponent, {
        remove: { imports: [AngularAdapterPortComponent] },
        add: { imports: [MockAngularAdapterPortComponent] },
      })
      .compileComponents();

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
