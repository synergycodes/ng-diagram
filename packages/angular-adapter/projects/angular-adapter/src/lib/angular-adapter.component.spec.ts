import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AngularAdapterComponent } from './angular-adapter.component';

describe('AngularAdapterComponent', () => {
  let component: AngularAdapterComponent;
  let fixture: ComponentFixture<AngularAdapterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularAdapterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
