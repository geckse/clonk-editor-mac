import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { 
  KeyValueGroup, 
  KeyValueField,
  DocumentationType, 
  KeyValueSeparator,
  KeyValueEditorConfig
} from '../../types/key-value-types';

@Component({
  selector: 'app-key-value-groups',
  templateUrl: './key-value-groups.component.html',
  styleUrls: ['./key-value-groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyValueGroupsComponent implements OnInit, OnDestroy {
   
  @Input() set content(value: string) {
    this._rawContent = value;
    this.parseContent(value);
  }
  get content(): string {
    return this._rawContent;
  }

  @Input() separator: KeyValueSeparator = '=';
  @Input() allowReordering: boolean = true;
  @Input() showAddRemoveButtons: boolean = true;
  @Input() documentationType: DocumentationType = DocumentationType.DEFCORE;

  @Output() contentChange = new EventEmitter<string>();
  @Output() groupsChange = new EventEmitter<KeyValueGroup[]>();

  groups: KeyValueGroup[] = [];
  private _rawContent: string = '';
  private destroy$ = new Subject<void>();
  private contentUpdateTimeout: any;

  constructor(private documentationService: KeyValueDocumentationService) {}

  ngOnInit(): void {
    // Auto-detect documentation type if content is provided
    if (this._rawContent) {
      this.autoDetectSettings();
    }
  }
  
  ngOnDestroy(): void {
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private autoDetectSettings(): void {
    const detectedType = this.documentationService.detectDocumentationType(this._rawContent);
    
    if (detectedType !== this.documentationType) {
      this.documentationType = detectedType;
    }

    // Auto-detect separator
    const lines = this._rawContent.split('\n').filter(line => line.trim().length > 0);
    const separators: KeyValueSeparator[] = ['=', ':', '|', ' '];
    
    for (const sep of separators) {
      if (lines.some(line => line.includes(sep) && !line.startsWith('[') && !line.endsWith(']'))) {
        this.separator = sep;
        break;
      }
    }
  }

  private parseContent(content: string): void {
    if (!content) {
      this.groups = [];
      return;
    }

    const lines = content.split('\n');
    const groups: KeyValueGroup[] = [];
    let currentGroup: KeyValueGroup | null = null;
    let ungroupedFields: KeyValueField[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check for section header [SectionName]
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        // Save previous ungrouped fields if any
        if (ungroupedFields.length > 0 && !currentGroup) {
          groups.push({
            name: 'General',
            fields: ungroupedFields,
            section: this.documentationService.detectSection(content, this.documentationType) || 'DefCore',
            documentationType: this.documentationType
          });
          ungroupedFields = [];
        }
        
        // Save current group if exists
        if (currentGroup && currentGroup.fields.length > 0) {
          groups.push(currentGroup);
        }
        
        // Create new group
        const sectionName = trimmedLine.slice(1, -1);
        currentGroup = {
          name: sectionName,
          fields: [],
          section: sectionName,
          documentationType: this.documentationType
        };
      } 
      // Check for key-value pair
      else if (trimmedLine.includes(this.separator)) {
        const separatorIndex = trimmedLine.indexOf(this.separator);
        const key = trimmedLine.substring(0, separatorIndex).trim();
        const value = trimmedLine.substring(separatorIndex + 1).trim();
        
        const field: KeyValueField = { key, value };
        
        if (currentGroup) {
          currentGroup.fields.push(field);
        } else {
          ungroupedFields.push(field);
        }
      }
    }
    
    // Handle remaining fields
    if (currentGroup && currentGroup.fields.length > 0) {
      groups.push(currentGroup);
    } else if (ungroupedFields.length > 0) {
      groups.push({
        name: 'General',
        fields: ungroupedFields,
        section: this.documentationService.detectSection(content, this.documentationType) || 'DefCore',
        documentationType: this.documentationType
      });
    }

    this.groups = groups;
  }

  private generateContent(): string {
    const lines: string[] = [];
    
    for (const group of this.groups) {
      // Add section header if not "General"
      if (group.name !== 'General') {
        if (lines.length > 0) lines.push(''); // Empty line before section
        lines.push(`[${group.name}]`);
      }
      
      // Add fields
      for (const field of group.fields) {
        if (field.key.trim() || field.value.trim()) {
          lines.push(`${field.key}${this.separator}${field.value}`);
        }
      }
    }
    
    return lines.join('\n');
  }

  onGroupFieldsChange(groupIndex: number, fields: KeyValueField[]): void {
    this.groups[groupIndex].fields = fields;
    this.debouncedUpdateContent();
  }

  onGroupFieldChange(groupIndex: number, event: { index: number; field: KeyValueField }): void {
    this.groups[groupIndex].fields[event.index] = event.field;
    // For individual field changes, use immediate update but debounced content generation
    this.debouncedUpdateContent();
  }

  updateContent(): void {
    this._rawContent = this.generateContent();
    this.contentChange.emit(this._rawContent);
    this.groupsChange.emit([...this.groups]);
  }
  
  private debouncedUpdateContent(): void {
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
    }
    
    this.contentUpdateTimeout = setTimeout(() => {
      this.updateContent();
    }, 300); // 300ms debounce
  }

  getEditorConfig(group: KeyValueGroup): KeyValueEditorConfig {
    return {
      separator: this.separator,
      allowReordering: this.allowReordering,
      showAddRemoveButtons: this.showAddRemoveButtons,
      documentationType: group.documentationType,
      section: group.section
    };
  }

  addNewGroup(): void {
    const newGroup: KeyValueGroup = {
      name: 'New Section',
      fields: [{ key: '', value: '' }],
      section: 'DefCore',
      documentationType: this.documentationType
    };
    this.groups.push(newGroup);
    this.updateContent();
  }

  removeGroup(index: number): void {
    this.groups.splice(index, 1);
    this.updateContent();
  }

  onGroupNameChange(index: number, newName: string): void {
    this.groups[index].name = newName;
    this.groups[index].section = newName;
    this.updateContent();
  }

  get hasMultipleGroups(): boolean {
    return this.groups.length > 1 || (this.groups.length === 1 && this.groups[0].name !== 'General');
  }

  trackByGroup(index: number, group: KeyValueGroup): string {
    return `${group.name}_${group.fields.length}_${index}`;
  }
}