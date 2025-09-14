import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-simple-dropdown',
  templateUrl: './simple-dropdown.component.html',
  styleUrls: ['./simple-dropdown.component.scss']
})
export class SimpleDropdownComponent {

  @Input() options: DropdownOption[] = [];
  @Input() selectedValue = '';
  @Input() placeholder = 'Select option';
  @Input() disabled = false;

  @Output() selectionChange = new EventEmitter<string>();

  onSelectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectionChange.emit(target.value);
  }
}