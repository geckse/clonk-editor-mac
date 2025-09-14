import { Component, Input, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import { FieldDocumentation } from '../../types/key-value-types';

@Component({
  selector: 'app-field-tooltip',
  templateUrl: './field-tooltip.component.html',
  styleUrls: ['./field-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldTooltipComponent {
  @Input() fieldDocumentation: FieldDocumentation | null = null;
  @Input() fieldName: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() visible: boolean = false;

  @HostBinding('class.visible') 
  get isVisible(): boolean {
    return this.visible && this.hasDocumentation;
  }

  @HostBinding('class')
  get cssClasses(): string {
    return `tooltip-${this.position}`;
  }

  get hasDocumentation(): boolean {
    return !!(this.fieldDocumentation && this.fieldDocumentation.description);
  }

  get typeDisplay(): string {
    if (!this.fieldDocumentation?.type) return '';
    return this.fieldDocumentation.type;
  }

  get description(): string {
    if (!this.fieldDocumentation?.description) return '';
    return this.fieldDocumentation.description;
  }
}