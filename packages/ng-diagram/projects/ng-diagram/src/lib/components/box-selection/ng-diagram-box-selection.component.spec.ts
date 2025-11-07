import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { BoxSelectionProviderService } from '../../services';
import { NgDiagramBoxSelectionComponent } from './ng-diagram-box-selection.component';

describe('NgDiagramBoxSelectionComponent', () => {
  let component: NgDiagramBoxSelectionComponent;
  let fixture: ComponentFixture<NgDiagramBoxSelectionComponent>;
  let boxSelectionProvider: BoxSelectionProviderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgDiagramBoxSelectionComponent],
      providers: [BoxSelectionProviderService],
    }).compileComponents();

    fixture = TestBed.createComponent(NgDiagramBoxSelectionComponent);
    component = fixture.componentInstance;
    boxSelectionProvider = TestBed.inject(BoxSelectionProviderService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject BoxSelectionProviderService', () => {
    expect(component.boxSelectionProvider).toBeTruthy();
    expect(component.boxSelectionProvider).toBe(boxSelectionProvider);
  });

  it('should not render box selection element when boundingBox is null', () => {
    boxSelectionProvider.boundingBox.set(null);
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    expect(boxElement).toBeFalsy();
  });

  it('should render box selection element when boundingBox is set', () => {
    boxSelectionProvider.boundingBox.set({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
    });
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    expect(boxElement).toBeTruthy();
  });

  it('should apply correct position and size styles to box selection element', () => {
    const mockBoundingBox = {
      x: 50,
      y: 75,
      width: 150,
      height: 250,
    };

    boxSelectionProvider.boundingBox.set(mockBoundingBox);
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    const nativeElement = boxElement.nativeElement as HTMLElement;
    const styles = nativeElement.style;

    expect(styles.left).toBe('50px');
    expect(styles.top).toBe('75px');
    expect(styles.width).toBe('150px');
    expect(styles.height).toBe('250px');
  });

  it('should update box selection element when boundingBox changes', () => {
    const initialBoundingBox = {
      x: 10,
      y: 20,
      width: 100,
      height: 200,
    };

    boxSelectionProvider.boundingBox.set(initialBoundingBox);
    fixture.detectChanges();

    let boxElement = fixture.debugElement.query(By.css('div'));
    let nativeElement = boxElement.nativeElement as HTMLElement;

    expect(nativeElement.style.left).toBe('10px');
    expect(nativeElement.style.top).toBe('20px');
    expect(nativeElement.style.width).toBe('100px');
    expect(nativeElement.style.height).toBe('200px');

    const updatedBoundingBox = {
      x: 30,
      y: 40,
      width: 300,
      height: 400,
    };

    boxSelectionProvider.boundingBox.set(updatedBoundingBox);
    fixture.detectChanges();

    boxElement = fixture.debugElement.query(By.css('div'));
    nativeElement = boxElement.nativeElement as HTMLElement;

    expect(nativeElement.style.left).toBe('30px');
    expect(nativeElement.style.top).toBe('40px');
    expect(nativeElement.style.width).toBe('300px');
    expect(nativeElement.style.height).toBe('400px');
  });

  it('should remove box selection element when boundingBox is set to null after being set', () => {
    boxSelectionProvider.boundingBox.set({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
    });
    fixture.detectChanges();

    let boxElement = fixture.debugElement.query(By.css('div'));
    expect(boxElement).toBeTruthy();

    boxSelectionProvider.boundingBox.set(null);
    fixture.detectChanges();

    boxElement = fixture.debugElement.query(By.css('div'));
    expect(boxElement).toBeFalsy();
  });

  it('should handle zero dimensions correctly', () => {
    boxSelectionProvider.boundingBox.set({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    const nativeElement = boxElement.nativeElement as HTMLElement;
    const styles = nativeElement.style;

    expect(styles.left).toBe('0px');
    expect(styles.top).toBe('0px');
    expect(styles.width).toBe('0px');
    expect(styles.height).toBe('0px');
  });

  it('should handle negative coordinates correctly', () => {
    boxSelectionProvider.boundingBox.set({
      x: -50,
      y: -100,
      width: 200,
      height: 300,
    });
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    const nativeElement = boxElement.nativeElement as HTMLElement;
    const styles = nativeElement.style;

    expect(styles.left).toBe('-50px');
    expect(styles.top).toBe('-100px');
    expect(styles.width).toBe('200px');
    expect(styles.height).toBe('300px');
  });

  it('should handle fractional values correctly', () => {
    boxSelectionProvider.boundingBox.set({
      x: 12.5,
      y: 25.75,
      width: 150.25,
      height: 200.5,
    });
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    const nativeElement = boxElement.nativeElement as HTMLElement;
    const styles = nativeElement.style;

    expect(styles.left).toBe('12.5px');
    expect(styles.top).toBe('25.75px');
    expect(styles.width).toBe('150.25px');
    expect(styles.height).toBe('200.5px');
  });

  it('should handle large dimension values correctly', () => {
    boxSelectionProvider.boundingBox.set({
      x: 10000,
      y: 20000,
      width: 50000,
      height: 60000,
    });
    fixture.detectChanges();

    const boxElement = fixture.debugElement.query(By.css('div'));
    const nativeElement = boxElement.nativeElement as HTMLElement;
    const styles = nativeElement.style;

    expect(styles.left).toBe('10000px');
    expect(styles.top).toBe('20000px');
    expect(styles.width).toBe('50000px');
    expect(styles.height).toBe('60000px');
  });
});
