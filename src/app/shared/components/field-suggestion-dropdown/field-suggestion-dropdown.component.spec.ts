import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { FieldSuggestionDropdownComponent } from './field-suggestion-dropdown.component';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';

describe('FieldSuggestionDropdownComponent', () => {
  let component: FieldSuggestionDropdownComponent;
  let fixture: ComponentFixture<FieldSuggestionDropdownComponent>;
  let mockDocumentationService: jasmine.SpyObj<KeyValueDocumentationService>;

  beforeEach(async () => {
    mockDocumentationService = jasmine.createSpyObj('KeyValueDocumentationService', [
      'getFieldSuggestions',
      'getFieldDocumentation'
    ]);
    
    mockDocumentationService.getFieldSuggestions.and.returnValue(of(['id', 'Name', 'Category']));
    mockDocumentationService.getFieldDocumentation.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      declarations: [FieldSuggestionDropdownComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: KeyValueDocumentationService, useValue: mockDocumentationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldSuggestionDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit valueChange on input', () => {
    spyOn(component.valueChange, 'emit');
    const inputElement = fixture.debugElement.nativeElement.querySelector('input');
    
    inputElement.value = 'test';
    inputElement.dispatchEvent(new Event('input'));
    
    expect(component.valueChange.emit).toHaveBeenCalledWith('test');
  });
});