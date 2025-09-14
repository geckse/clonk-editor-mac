import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { 
  KeyValueField, 
  DocumentationType, 
  FieldDocumentation 
} from '../../types/key-value-types';

@Component({
  selector: 'app-key-value-editor',
  templateUrl: './key-value-editor.component.html',
  styleUrls: ['./key-value-editor.component.scss']
})
export class KeyValueEditorComponent implements OnInit, OnDestroy {
   
  // this is the string like key=value \n anotherkey=anothervalue
  _text: string = "";
  _parsed: KeyValueField[] = [];
  
  // Documentation and type safety
  currentDocumentationType: DocumentationType = DocumentationType.DEFCORE;
  currentSection: string = 'DefCore';
  
  // Tooltip state
  hoveredField: KeyValueField | null = null;
  tooltipVisible = false;
  
  private destroy$ = new Subject<void>();
  @Input() set content(value: string) {
    this._text = value;
    this._parsed = this.parseKeyValueFromContent(value);
  }
  get content(): string {
    return this._text;
  }

  // it can also have a group heading which is like [Defcore]
  _groups: string[] = [];
  @Input() set groups(value: string[]) {
    this._groups = value;
  }
  get groups(): string[] {
    return this._groups;
  }



  @Output() change: EventEmitter<string> = new EventEmitter<string>();
  @Output() documentationTypeChange: EventEmitter<DocumentationType> = new EventEmitter<DocumentationType>();
  
  constructor(private documentationService: KeyValueDocumentationService) {}


  onTextChange(event: any) {
    this.change.emit(event.target.value);
  }

  ngOnInit(): void {
    // Auto-detect documentation type when content changes
    if (this._text) {
      this.autoDetectDocumentationType();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  parseKeyValueFromContent(content: string): KeyValueField[] {
    if (!content) {
      return [];
    }

    const fields = content.split('\n')
      .filter(line => line.trim().length > 0 && line.includes('='))
      .map(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('='); // Rejoin in case the value contains '='
        return { 
          key: key.trim(), 
          value: value.trim()
        } as KeyValueField;
      });
    
    // Enrich fields with documentation info
    this.enrichFieldsWithDocumentation(fields);
    return fields;
  }

  encodeKeyValueToContent(fields: KeyValueField[]): string {
    return fields.map(field => `${field.key}=${field.value}`).join('\n');
  }
  
  private autoDetectDocumentationType(): void {
    const detectedType = this.documentationService.detectDocumentationType(this._text);
    const detectedSection = this.documentationService.detectSection(this._text, detectedType);
    
    if (detectedType !== this.currentDocumentationType) {
      this.currentDocumentationType = detectedType;
      this.documentationTypeChange.emit(detectedType);
    }
    
    if (detectedSection && detectedSection !== this.currentSection) {
      this.currentSection = detectedSection;
    }
  }
  
  private enrichFieldsWithDocumentation(fields: KeyValueField[]): void {
    fields.forEach(field => {
      this.documentationService.getFieldDocumentation(
        this.currentDocumentationType, 
        this.currentSection, 
        field.key
      ).pipe(takeUntil(this.destroy$))
      .subscribe((documentation: FieldDocumentation | null) => {
        field.fieldInfo = documentation;
      });
    });
  }
  
  onFieldKeyChange(field: KeyValueField, newKey: string): void {
    field.key = newKey;
    this.updateContent();
    
    // Get documentation for the new key
    this.documentationService.getFieldDocumentation(
      this.currentDocumentationType,
      this.currentSection,
      newKey
    ).pipe(takeUntil(this.destroy$))
    .subscribe((documentation: FieldDocumentation | null) => {
      field.fieldInfo = documentation;
    });
  }
  
  onFieldValueChange(field: KeyValueField, newValue: string): void {
    field.value = newValue;
    this.updateContent();
  }
  
  onFieldSelected(field: KeyValueField, data: { key: string; documentation: FieldDocumentation | null }): void {
    field.key = data.key;
    field.fieldInfo = data.documentation;
    this.updateContent();
  }
  
  private updateContent(): void {
    this._text = this.encodeKeyValueToContent(this._parsed);
    this.change.emit(this._text);
  }
  
  addNewField(): void {
    const newField: KeyValueField = {
      key: '',
      value: ''
    };
    this._parsed.push(newField);
    this.updateContent();
  }
  
  removeField(index: number): void {
    this._parsed.splice(index, 1);
    this.updateContent();
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
    return !!field.fieldInfo;
  }

  movement(ev: any){
    console.log(ev);
  }

}
