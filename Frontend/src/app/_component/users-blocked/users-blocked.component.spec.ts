import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersBlockedComponent } from './users-blocked.component';

describe('UsersBlockedComponent', () => {
  let component: UsersBlockedComponent;
  let fixture: ComponentFixture<UsersBlockedComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UsersBlockedComponent]
    });
    fixture = TestBed.createComponent(UsersBlockedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
