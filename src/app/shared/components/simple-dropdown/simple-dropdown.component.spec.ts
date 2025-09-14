import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleDropdownComponent } from './simple-dropdown.component';

describe('SimpleDropdownComponent', () => {
  let component: SimpleDropdownComponent;
  let fixture: ComponentFixture<SimpleDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SimpleDropdownComponent]
    });
    fixture = TestBed.createComponent(SimpleDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});