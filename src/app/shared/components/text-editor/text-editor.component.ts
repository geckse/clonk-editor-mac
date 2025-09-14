import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent {

  _text: string = "";
  private lastEmittedValue: string = "";
  
  @Input() set content(value: string) {
    this._text = value;
    this.lastEmittedValue = value;
  }
  get content(): string {
    return this._text;
  }

  @Output() textChange: EventEmitter<string> = new EventEmitter<string>();


  onTextChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this._text = target.value;
    
    // Only emit if the value actually changed to prevent duplicate events
    if (this._text !== this.lastEmittedValue) {
      this.lastEmittedValue = this._text;
      this.textChange.emit(target.value);
    }
  }
}
