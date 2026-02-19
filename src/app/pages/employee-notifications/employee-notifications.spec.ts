import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeNotificationsComponent } from './employee-notifications';

describe('EmployeeNotificationsComponent', () => {
  let component: EmployeeNotificationsComponent;
  let fixture: ComponentFixture<EmployeeNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeNotificationsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly calculate unread count', () => {
    expect(component.unreadCount).toBe(2);
  });

  it('should mark all as read when markAllRead is called', () => {
    component.markAllRead();
    expect(component.unreadCount).toBe(0);
    // Changed .toBeTrue() to .toBe(true)
    expect(component.notifications.every(n => n.isRead)).toBe(true); 
  });
});