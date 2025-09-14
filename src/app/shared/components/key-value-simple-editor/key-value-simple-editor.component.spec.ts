import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { KeyValueSimpleEditorComponent } from './key-value-simple-editor.component';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { KeyValueField, DocumentationType } from '../../types/key-value-types';

describe('KeyValueSimpleEditorComponent', () => {
  let component: KeyValueSimpleEditorComponent;
  let fixture: ComponentFixture<KeyValueSimpleEditorComponent>;
  let mockDocumentationService: jasmine.SpyObj<KeyValueDocumentationService>;

  beforeEach(async () => {
    mockDocumentationService = jasmine.createSpyObj('KeyValueDocumentationService', [
      'getFieldDocumentation'
    ]);
    
    mockDocumentationService.getFieldDocumentation.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      declarations: [KeyValueSimpleEditorComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: KeyValueDocumentationService, useValue: mockDocumentationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KeyValueSimpleEditorComponent);
    component = fixture.componentInstance;
    
    // Set up basic test data
    component.fields = [
      { key: 'testKey', value: 'testValue' }
    ];
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit field changes when field is modified', () => {
    spyOn(component.fieldsChange, 'emit');
    spyOn(component.fieldChange, 'emit');
    
    component.onFieldKeyChange(0, 'newKey');
    
    expect(component.fieldChange.emit).toHaveBeenCalled();
    expect(component.fieldsChange.emit).toHaveBeenCalled();
  });

  it('should add new field when addNewField is called', () => {
    const initialLength = component.fields.length;
    spyOn(component.fieldsChange, 'emit');
    
    component.addNewField();
    
    expect(component.fields.length).toBe(initialLength + 1);
    expect(component.fieldsChange.emit).toHaveBeenCalled();
  });

  it('should remove field when removeField is called', () => {
    component.fields = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' }
    ];
    
    const initialLength = component.fields.length;
    spyOn(component.fieldsChange, 'emit');
    
    component.removeField(0);
    
    expect(component.fields.length).toBe(initialLength - 1);
    expect(component.fields[0].key).toBe('key2');
    expect(component.fieldsChange.emit).toHaveBeenCalled();
  });
});