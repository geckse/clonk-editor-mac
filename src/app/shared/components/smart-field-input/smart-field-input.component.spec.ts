import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartFieldInputComponent } from './smart-field-input.component';

describe('SmartFieldInputComponent', () => {
  let component: SmartFieldInputComponent;
  let fixture: ComponentFixture<SmartFieldInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmartFieldInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartFieldInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});