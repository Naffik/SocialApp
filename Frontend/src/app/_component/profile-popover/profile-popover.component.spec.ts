import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePopoverComponent } from './profile-popover.component';

describe('ProfilePopoverComponent', () => {
  let component: ProfilePopoverComponent;
  let fixture: ComponentFixture<ProfilePopoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfilePopoverComponent]
    });
    fixture = TestBed.createComponent(ProfilePopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
