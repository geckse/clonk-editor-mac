import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldTooltipComponent } from './field-tooltip.component';
import { FieldDocumentation } from '../../types/key-value-types';

describe('FieldTooltipComponent', () => {
  let component: FieldTooltipComponent;
  let fixture: ComponentFixture<FieldTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldTooltipComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display field documentation when provided', () => {
    const mockDocumentation: FieldDocumentation = {
      type: 'Integer',
      description: 'Test description'
    };

    component.fieldDocumentation = mockDocumentation;
    component.fieldName = 'TestField';
    component.visible = true;
    fixture.detectChanges();

    expect(component.hasDocumentation).toBe(true);
    expect(component.isVisible).toBe(true);
  });

  it('should not be visible when no documentation is provided', () => {
    component.fieldDocumentation = null;
    component.visible = true;
    fixture.detectChanges();

    expect(component.hasDocumentation).toBe(false);
    expect(component.isVisible).toBe(false);
  });
});