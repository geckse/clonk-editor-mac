import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { DocumentationType, FieldDocumentation } from '../../types/key-value-types';

@Component({
  selector: 'app-smart-field-input',
  templateUrl: './smart-field-input.component.html',
  styleUrls: ['./smart-field-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartFieldInputComponent implements OnInit, OnDestroy {
  @ViewChild('inputElement', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  
  @Input() documentationType: DocumentationType = DocumentationType.DEFCORE;
  @Input() section: string = 'DefCore';
  @Input() placeholder: string = 'Enter field name...';
  @Input() value: string = '';
  @Input() cssClass: string = '';
  @Input() showSuggestions: boolean = true;
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() valueCommit = new EventEmitter<string>(); // Emitted on blur/enter
  @Output() fieldSelected = new EventEmitter<{ key: string; documentation: FieldDocumentation | null }>();
  
  // Dropdown state
  suggestions: string[] = [];
  filteredSuggestions: string[] = [];
  isDropdownOpen = false;
  highlightedIndex = -1;
  
  // Internal state
  private destroy$ = new Subject<void>();
  private inputValue$ = new BehaviorSubject<string>('');
  private localValue: string = '';
  private committedValue: string = '';
  private skipNextEmit = false;

  constructor(
    private documentationService: KeyValueDocumentationService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Set initial value
    if (this.value) {
      this.inputElement.nativeElement.value = this.value;
      this.inputValue$.next(this.value);
      this.localValue = this.value;
      this.committedValue = this.value;
    }
    
    // Load suggestions once
    if (this.showSuggestions) {
      this.documentationService.getFieldSuggestions(this.documentationType, this.section)
        .pipe(takeUntil(this.destroy$))
        .subscribe(suggestions => {
          this.suggestions = suggestions || [];
          this.cdr.markForCheck();
        });
    }
    
    // Setup input value filtering with debounce
    this.inputValue$.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.updateFilteredSuggestions(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle raw input events
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    // Update local state only
    this.localValue = value;
    this.inputValue$.next(value);
    
    // Don't emit to parent while typing - only update locally
    if (this.skipNextEmit) {
      this.skipNextEmit = false;
    }
    
    // Open dropdown if typing and suggestions available
    if (this.showSuggestions && !this.isDropdownOpen) {
      this.isDropdownOpen = true;
      this.highlightedIndex = -1;
      this.cdr.markForCheck();
    }
  }

  onFocus(): void {
    if (this.showSuggestions && this.suggestions.length > 0) {
      this.updateFilteredSuggestions(this.inputElement.nativeElement.value);
      this.isDropdownOpen = true;
      this.highlightedIndex = -1;
      this.cdr.markForCheck();
    }
  }

  onBlur(): void {
    // Commit the value if it changed
    if (this.localValue !== this.committedValue) {
      this.committedValue = this.localValue;
      this.valueChange.emit(this.localValue);
      this.valueCommit.emit(this.localValue);
    }
    
    // Delay closing to allow click events on dropdown
    setTimeout(() => {
      if (!this.elementRef.nativeElement.contains(document.activeElement)) {
        this.closeDropdown();
      }
    }, 200);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isDropdownOpen || this.filteredSuggestions.length === 0) {
      // Allow Tab to work normally if dropdown is closed
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredSuggestions.length - 1);
        this.cdr.markForCheck();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        this.cdr.markForCheck();
        break;
        
      case 'Tab':
        if (this.highlightedIndex >= 0 && this.filteredSuggestions[this.highlightedIndex]) {
          event.preventDefault();
          this.selectSuggestion(this.filteredSuggestions[this.highlightedIndex]);
        } else if (this.filteredSuggestions.length > 0 && this.isDropdownOpen) {
          // Tab with no selection picks first suggestion
          event.preventDefault();
          this.selectSuggestion(this.filteredSuggestions[0]);
        }
        break;
        
      case 'Enter':
        if (this.highlightedIndex >= 0 && this.filteredSuggestions[this.highlightedIndex]) {
          event.preventDefault();
          this.selectSuggestion(this.filteredSuggestions[this.highlightedIndex]);
        } else {
          // Enter without selection commits current value
          event.preventDefault();
          this.closeDropdown();
          if (this.localValue !== this.committedValue) {
            this.committedValue = this.localValue;
            this.valueChange.emit(this.localValue);
            this.valueCommit.emit(this.localValue);
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  selectSuggestion(suggestion: string): void {
    // Update input value without triggering input event
    this.skipNextEmit = true;
    this.inputElement.nativeElement.value = suggestion;
    this.localValue = suggestion;
    this.committedValue = suggestion;
    this.inputValue$.next(suggestion);
    
    // Emit the change and commit
    this.valueChange.emit(suggestion);
    this.valueCommit.emit(suggestion);
    
    // Get documentation and emit field selection
    this.documentationService.getFieldDocumentation(this.documentationType, this.section, suggestion)
      .pipe(takeUntil(this.destroy$))
      .subscribe((documentation: FieldDocumentation | null) => {
        this.fieldSelected.emit({ key: suggestion, documentation });
      });
    
    // Close dropdown and keep focus
    this.closeDropdown();
    this.inputElement.nativeElement.focus();
  }

  onSuggestionClick(suggestion: string): void {
    this.selectSuggestion(suggestion);
  }

  onSuggestionMouseEnter(index: number): void {
    this.highlightedIndex = index;
    this.cdr.markForCheck();
  }

  private updateFilteredSuggestions(value: string): void {
    if (!value || value.trim() === '') {
      this.filteredSuggestions = this.suggestions.slice(0, 10); // Show first 10 when empty
    } else {
      const searchTerm = value.toLowerCase();
      this.filteredSuggestions = this.suggestions
        .filter(s => s.toLowerCase().includes(searchTerm))
        .slice(0, 10); // Limit to 10 results
    }
    
    // Reset highlight when suggestions change
    if (this.highlightedIndex >= this.filteredSuggestions.length) {
      this.highlightedIndex = -1;
    }
    
    this.cdr.markForCheck();
  }

  private closeDropdown(): void {
    this.isDropdownOpen = false;
    this.highlightedIndex = -1;
    this.cdr.markForCheck();
  }

  // Public method to update value from parent without losing focus
  public updateValue(value: string): void {
    if (this.inputElement.nativeElement.value !== value) {
      this.skipNextEmit = true;
      this.inputElement.nativeElement.value = value;
      this.localValue = value;
      this.committedValue = value;
      this.inputValue$.next(value);
    }
  }

  // Public method to focus the input
  public focus(): void {
    this.inputElement.nativeElement.focus();
  }

  // Check if input has focus
  public hasFocus(): boolean {
    return document.activeElement === this.inputElement.nativeElement;
  }
}