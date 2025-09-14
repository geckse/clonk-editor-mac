import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DropdownOption } from '../simple-dropdown/simple-dropdown.component';

@Component({
  selector: 'app-frame-toolbar',
  templateUrl: './frame-toolbar.component.html',
  styleUrls: ['./frame-toolbar.component.scss']
})
export class FrameToolbarComponent {

  @Input() currentEditor: string = '';
  @Input() hasChanges: boolean = false;

  @Output() editorTypeChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  editorOptions: DropdownOption[] = [
    { value: 'basic', label: 'Text Editor' },
    { value: 'key-value-simple', label: 'Key-Value Editor' }
  ];

  onEditorTypeChange(editorType: string): void {
    this.editorTypeChange.emit(editorType);
  }

  onSave(): void {
    console.log('Frame toolbar: Save button clicked');
    this.save.emit();
  }

  onCancel(): void {
    console.log('Frame toolbar: Cancel button clicked');
    this.cancel.emit();
  }
}