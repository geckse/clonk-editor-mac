import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-focus-safe-input',
  templateUrl: './focus-safe-input.component.html',
  styleUrls: ['./focus-safe-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FocusSafeInputComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() cssClass: string = '';
  
  @Output() valueChange = new EventEmitter<string>();
  
  private lastEmittedValue: string = '';
  private changeTimeout: any;
  
  ngOnInit(): void {
    // Set initial value directly on DOM element
    this.inputElement.nativeElement.value = this.value;
    this.lastEmittedValue = this.value;
    
    // Use raw DOM events to completely bypass Angular change detection
    const inputEl = this.inputElement.nativeElement;
    
    inputEl.addEventListener('input', this.onRawInput.bind(this), { passive: true });
    inputEl.addEventListener('focus', this.onRawFocus.bind(this), { passive: true });
    inputEl.addEventListener('blur', this.onRawBlur.bind(this), { passive: true });
  }
  
  ngOnDestroy(): void {
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
    
    // Clean up raw DOM event listeners
    const inputEl = this.inputElement?.nativeElement;
    if (inputEl) {
      inputEl.removeEventListener('input', this.onRawInput.bind(this));
      inputEl.removeEventListener('focus', this.onRawFocus.bind(this));
      inputEl.removeEventListener('blur', this.onRawBlur.bind(this));
    }
  }
  
  private onRawInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const currentValue = inputEl.value;
    
    // Only emit if value actually changed
    if (currentValue !== this.lastEmittedValue) {
      this.lastEmittedValue = currentValue;
      
      // Debounce the emission to reduce parent updates
      if (this.changeTimeout) {
        clearTimeout(this.changeTimeout);
      }
      
      this.changeTimeout = setTimeout(() => {
        // Emit outside Angular's zone to prevent change detection
        this.valueChange.emit(currentValue);
      }, 150); // Short delay to batch rapid typing
    }
  }
  
  private onRawFocus(event: FocusEvent): void {
    // Focus handling without triggering change detection
    const inputEl = event.target as HTMLInputElement;
    inputEl.select(); // Optional: select all text on focus
  }
  
  private onRawBlur(event: FocusEvent): void {
    // Ensure final value is emitted on blur
    const inputEl = event.target as HTMLInputElement;
    const currentValue = inputEl.value;
    
    if (currentValue !== this.lastEmittedValue) {
      this.lastEmittedValue = currentValue;
      this.valueChange.emit(currentValue);
    }
  }
  
  // Method to update value from parent without triggering events
  updateValue(newValue: string): void {
    if (this.inputElement?.nativeElement && this.inputElement.nativeElement.value !== newValue) {
      // Only update if the input doesn't have focus (user isn't typing)
      if (document.activeElement !== this.inputElement.nativeElement) {
        this.inputElement.nativeElement.value = newValue;
        this.lastEmittedValue = newValue;
      }
    }
  }
  
  // Force focus to this input
  focus(): void {
    if (this.inputElement?.nativeElement) {
      this.inputElement.nativeElement.focus();
    }
  }
  
  // Check if this input has focus
  hasFocus(): boolean {
    return document.activeElement === this.inputElement?.nativeElement;
  }
}