import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, combineLatest } from 'rxjs';
import { map, startWith, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { DocumentationType, FieldDocumentation } from '../../types/key-value-types';

@Component({
  selector: 'app-field-suggestion-dropdown',
  templateUrl: './field-suggestion-dropdown.component.html',
  styleUrls: ['./field-suggestion-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldSuggestionDropdownComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('inputElement', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  
  @Input() documentationType: DocumentationType = DocumentationType.DEFCORE;
  @Input() section: string = 'DefCore';
  @Input() placeholder: string = 'Enter field name...';
  @Input() initialValue: string = '';
  @Input() showSuggestions: boolean = true;
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() fieldSelected = new EventEmitter<{ key: string; documentation: FieldDocumentation | null }>();
  
  inputValue$ = new Subject<string>();
  filteredSuggestions$: Observable<string[]> = new Observable();
  isDropdownOpen = false;
  highlightedIndex = -1;
  
  private destroy$ = new Subject<void>();
  private allSuggestions: string[] = [];
  private isUpdatingFromParent = false;

  constructor(
    private documentationService: KeyValueDocumentationService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Set initial value without triggering events
    this.setInputValueSilently(this.initialValue);
    
    this.filteredSuggestions$ = combineLatest({
      inputValue: this.inputValue$.pipe(
        startWith(this.initialValue),
        debounceTime(100),
        distinctUntilChanged()
      ),
      suggestions: this.documentationService.getFieldSuggestions(this.documentationType, this.section)
    }).pipe(
      map(({ inputValue, suggestions }) => {
        this.allSuggestions = suggestions || [];
        if (!inputValue || inputValue.trim() === '') {
          return suggestions || [];
        }
        return (suggestions || []).filter((suggestion: string) => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase())
        );
      }),
      takeUntil(this.destroy$)
    );

    // Listen for clicks outside to close dropdown
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  onInput(event: Event): void {
    // Don't process if we're updating from parent
    if (this.isUpdatingFromParent) {
      this.isUpdatingFromParent = false;
      return;
    }
    
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.inputValue$.next(value);
    this.valueChange.emit(value);
    
    // Only open dropdown if suggestions are enabled
    if (this.showSuggestions) {
      this.isDropdownOpen = true;
      this.highlightedIndex = -1;
      this.cdr.detectChanges();
    }
  }

  onFocus(): void {
    // Only open dropdown if we have suggestions enabled and user isn't just navigating
    if (!this.isUpdatingFromParent && this.showSuggestions) {
      this.isDropdownOpen = true;
      this.highlightedIndex = -1;
      this.cdr.detectChanges();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.isDropdownOpen) return;

    this.filteredSuggestions$.pipe(takeUntil(this.destroy$)).subscribe(suggestions => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.highlightedIndex = Math.min(this.highlightedIndex + 1, suggestions.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.highlightedIndex >= 0 && suggestions[this.highlightedIndex]) {
            this.selectSuggestion(suggestions[this.highlightedIndex]);
          }
          break;
        case 'Escape':
          this.isDropdownOpen = false;
          this.highlightedIndex = -1;
          break;
      }
    });
  }

  selectSuggestion(suggestion: string): void {
    this.setInputValueSilently(suggestion);
    this.inputValue$.next(suggestion);
    this.valueChange.emit(suggestion);
    this.isDropdownOpen = false;
    this.highlightedIndex = -1;
    this.cdr.detectChanges();

    // Get field documentation and emit
    this.documentationService.getFieldDocumentation(this.documentationType, this.section, suggestion)
      .pipe(takeUntil(this.destroy$))
      .subscribe((documentation: FieldDocumentation | null) => {
        this.fieldSelected.emit({ key: suggestion, documentation });
        // Restore focus after selection
        setTimeout(() => {
          if (this.inputElement?.nativeElement) {
            this.inputElement.nativeElement.focus();
          }
        }, 0);
      });
  }

  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isDropdownOpen = false;
      this.highlightedIndex = -1;
    }
  }

  isHighlighted(index: number): boolean {
    return index === this.highlightedIndex;
  }
  
  // Method to update input value without triggering change events
  private setInputValueSilently(value: string): void {
    if (this.inputElement?.nativeElement) {
      this.isUpdatingFromParent = true;
      this.inputElement.nativeElement.value = value;
      // Don't trigger input event since we set the flag
    }
  }
  
  // Watch for changes to initialValue from parent
  ngOnChanges(): void {
    if (this.inputElement?.nativeElement && this.inputElement.nativeElement.value !== this.initialValue) {
      this.setInputValueSilently(this.initialValue);
    }
  }
}