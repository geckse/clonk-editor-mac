import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { KeyValueGroupsComponent } from './key-value-groups.component';
import { KeyValueDocumentationService } from '../../../core/services/key-value-documentation/key-value-documentation.service';
import { DocumentationType } from '../../types/key-value-types';

describe('KeyValueGroupsComponent', () => {
  let component: KeyValueGroupsComponent;
  let fixture: ComponentFixture<KeyValueGroupsComponent>;
  let mockDocumentationService: jasmine.SpyObj<KeyValueDocumentationService>;

  beforeEach(async () => {
    mockDocumentationService = jasmine.createSpyObj('KeyValueDocumentationService', [
      'detectDocumentationType',
      'detectSection'
    ]);
    
    mockDocumentationService.detectDocumentationType.and.returnValue(DocumentationType.DEFCORE);
    mockDocumentationService.detectSection.and.returnValue('DefCore');

    await TestBed.configureTestingModule({
      declarations: [KeyValueGroupsComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: KeyValueDocumentationService, useValue: mockDocumentationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KeyValueGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse content with sections', () => {
    const testContent = `[DefCore]
id=CLNK
Name=Clonk

[Physical]
Energy=50
Walk=100`;

    component.content = testContent;
    
    expect(component.groups.length).toBe(2);
    expect(component.groups[0].name).toBe('DefCore');
    expect(component.groups[0].fields.length).toBe(2);
    expect(component.groups[1].name).toBe('Physical');
    expect(component.groups[1].fields.length).toBe(2);
  });

  it('should parse content without sections', () => {
    const testContent = `key1=value1
key2=value2`;

    component.content = testContent;
    
    expect(component.groups.length).toBe(1);
    expect(component.groups[0].name).toBe('General');
    expect(component.groups[0].fields.length).toBe(2);
  });

  it('should emit content changes when groups are modified', () => {
    spyOn(component.contentChange, 'emit');
    spyOn(component.groupsChange, 'emit');
    
    component.content = 'key=value';
    component.onGroupFieldsChange(0, [{ key: 'newkey', value: 'newvalue' }]);
    
    expect(component.contentChange.emit).toHaveBeenCalled();
    expect(component.groupsChange.emit).toHaveBeenCalled();
  });

  it('should add new group', () => {
    component.content = 'key=value';
    const initialGroupCount = component.groups.length;
    
    spyOn(component.contentChange, 'emit');
    component.addNewGroup();
    
    expect(component.groups.length).toBe(initialGroupCount + 1);
    expect(component.contentChange.emit).toHaveBeenCalled();
  });

  it('should remove group', () => {
    component.content = `[DefCore]
id=CLNK

[Physical]
Energy=50`;
    
    const initialGroupCount = component.groups.length;
    spyOn(component.contentChange, 'emit');
    
    component.removeGroup(0);
    
    expect(component.groups.length).toBe(initialGroupCount - 1);
    expect(component.contentChange.emit).toHaveBeenCalled();
  });
});