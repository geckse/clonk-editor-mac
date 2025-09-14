import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { SmartFieldInputComponent } from '../smart-field-input/smart-field-input.component';
import { 
  KeyValueField, 
  DocumentationType, 
  FieldDocumentation,
  KeyValueSeparator,
  KeyValueEditorConfig
} from '../../types/key-value-types';

@Component({
  selector: 'app-key-value-simple-editor',
  templateUrl: './key-value-simple-editor.component.html',
  styleUrls: ['./key-value-simple-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyValueSimpleEditorComponent implements OnInit, OnDestroy {
  
  @Input() fields: KeyValueField[] = [];
  @Input() config: KeyValueEditorConfig = {
    separator: '=',
    allowReordering: true,
    showAddRemoveButtons: true
  };
  
  @Output() fieldsChange = new EventEmitter<KeyValueField[]>();
  @Output() fieldChange = new EventEmitter<{ index: number; field: KeyValueField }>();
  
  @ViewChildren('keyInput') keyInputs!: QueryList<SmartFieldInputComponent | ElementRef>;
  @ViewChildren('valueInput') valueInputs!: QueryList<ElementRef>;
  
  // Tooltip state
  hoveredField: KeyValueField | null = null;
  tooltipVisible = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private documentationService: KeyValueDocumentationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Enrich existing fields with documentation
    if (this.config.documentationType && this.config.section) {
      this.enrichFieldsWithDocumentation();
    }
  }
  

  private enrichFieldsWithDocumentation(): void {
    if (!this.config.documentationType || !this.config.section) return;

    this.fields.forEach(field => {
      this.documentationService.getFieldDocumentation(
        this.config.documentationType!,
        this.config.section!,
        field.key
      ).pipe(takeUntil(this.destroy$))
      .subscribe((documentation: FieldDocumentation | null) => {
        field.fieldInfo = documentation;
      });
    });
  }

  onFieldKeyChange(index: number, newKey: string): void {
    // Only update on blur/commit to prevent re-renders during typing
    const field = this.fields[index];
    if (field && field.key !== newKey) {
      field.key = newKey;
      
      // Get documentation if available
      if (this.config.documentationType && this.config.section && newKey) {
        this.documentationService.getFieldDocumentation(
          this.config.documentationType,
          this.config.section,
          newKey
        ).pipe(takeUntil(this.destroy$))
        .subscribe((documentation: FieldDocumentation | null) => {
          field.fieldInfo = documentation;
          this.cdr.markForCheck();
        });
      }
      
      // Emit changes after documentation is set
      this.fieldChange.emit({ index, field });
      this.fieldsChange.emit([...this.fields]);
    }
  }
  
  onFieldValueChange(index: number, newValue: string): void {
    // Only update on blur to prevent re-renders during typing
    const field = this.fields[index];
    if (field && field.value !== newValue) {
      field.value = newValue;
      this.fieldChange.emit({ index, field });
      this.fieldsChange.emit([...this.fields]);
    }
  }
  
  onFieldSelected(index: number, data: { key: string; documentation: FieldDocumentation | null }): void {
    const field = this.fields[index];
    field.key = data.key;
    field.fieldInfo = data.documentation;
    
    this.fieldChange.emit({ index, field });
    this.fieldsChange.emit([...this.fields]);
    this.cdr.markForCheck();
  }

  
  addNewField(): void {
    if (!this.config.showAddRemoveButtons) return;
    
    const newField: KeyValueField = {
      key: '',
      value: ''
    };
    this.fields.push(newField);
    this.fieldsChange.emit([...this.fields]);
  }
  
  removeField(index: number): void {
    if (!this.config.showAddRemoveButtons) return;
    
    this.fields.splice(index, 1);
    this.fieldsChange.emit([...this.fields]);
  }
  
  onFieldMouseEnter(field: KeyValueField): void {
    if (field.fieldInfo) {
      this.hoveredField = field;
      this.tooltipVisible = true;
    }
  }
  
  onFieldMouseLeave(): void {
    this.hoveredField = null;
    this.tooltipVisible = false;
  }
  
  isFieldValid(field: KeyValueField): boolean {
    return !!field.fieldInfo || !this.config.documentationType;
  }

  movement(event: any): void {
    if (this.config.allowReordering) {
      // Dragula reordering handled automatically
      this.fieldsChange.emit([...this.fields]);
    }
  }

  get separatorDisplay(): string {
    return this.config.separator;
  }

  get showDocumentationFeatures(): boolean {
    return !!(this.config.documentationType && this.config.section);
  }
  
  // TrackBy function for ngFor to prevent unnecessary DOM recreations
  trackByField(index: number, field: KeyValueField): string {
    return `${field.key}_${field.value}_${index}`;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}