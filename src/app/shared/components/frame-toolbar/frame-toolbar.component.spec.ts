import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrameToolbarComponent } from './frame-toolbar.component';

describe('FrameToolbarComponent', () => {
  let component: FrameToolbarComponent;
  let fixture: ComponentFixture<FrameToolbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrameToolbarComponent]
    });
    fixture = TestBed.createComponent(FrameToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});