import { describe, expect, it } from 'vitest';
import { BoxSelectionProviderService } from './box-selection-provider.service';

describe('BoxSelectionProviderService', () => {
  it('should be created', () => {
    const service = new BoxSelectionProviderService();
    expect(service).toBeTruthy();
  });

  it('should have boundingBox signal initialized to null', () => {
    const service = new BoxSelectionProviderService();
    expect(service.boundingBox()).toBeNull();
  });

  it('should allow updating the boundingBox signal', () => {
    const service = new BoxSelectionProviderService();
    const rect = { x: 10, y: 20, width: 100, height: 50 };
    service.boundingBox.set(rect);

    expect(service.boundingBox()).toEqual(rect);
  });

  it('should allow resetting the boundingBox signal to null', () => {
    const service = new BoxSelectionProviderService();
    const rect = { x: 10, y: 20, width: 100, height: 50 };
    service.boundingBox.set(rect);
    expect(service.boundingBox()).toEqual(rect);

    service.boundingBox.set(null);
    expect(service.boundingBox()).toBeNull();
  });
});
