import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusSafeInputComponent } from './focus-safe-input.component';

describe('FocusSafeInputComponent', () => {
  let component: FocusSafeInputComponent;
  let fixture: ComponentFixture<FocusSafeInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FocusSafeInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FocusSafeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should maintain focus during value changes', () => {
    const inputEl = component.inputElement.nativeElement;
    inputEl.focus();
    
    expect(component.hasFocus()).toBe(true);
    
    // Simulate typing
    inputEl.value = 'test';
    inputEl.dispatchEvent(new Event('input'));
    
    expect(component.hasFocus()).toBe(true);
  });

  it('should not update value when input has focus', () => {
    const inputEl = component.inputElement.nativeElement;
    inputEl.focus();
    inputEl.value = 'user input';
    
    // Try to update from parent while user is typing
    component.updateValue('parent update');
    
    // Should not change the input value
    expect(inputEl.value).toBe('user input');
  });
});