import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMediaListComponent } from './user-media-list.component';

describe('UserMediaListComponent', () => {
  let component: UserMediaListComponent;
  let fixture: ComponentFixture<UserMediaListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserMediaListComponent]
    });
    fixture = TestBed.createComponent(UserMediaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
