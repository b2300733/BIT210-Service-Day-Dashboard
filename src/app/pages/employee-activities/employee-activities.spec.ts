import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeActivitiesComponent } from './employee-activities';

describe('EmployeeActivitiesComponent', () => {
  let component: EmployeeActivitiesComponent;
  let fixture: ComponentFixture<EmployeeActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeActivitiesComponent] // standalone import
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeActivitiesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
