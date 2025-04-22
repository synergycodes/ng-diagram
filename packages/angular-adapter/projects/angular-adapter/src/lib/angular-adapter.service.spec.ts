import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AngularAdapterService } from './angular-adapter.service';

describe('AngularAdapterService', () => {
  let service: AngularAdapterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularAdapterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
