import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLikeListComponent } from './user-like-list.component';

describe('UserLikeListComponent', () => {
  let component: UserLikeListComponent;
  let fixture: ComponentFixture<UserLikeListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserLikeListComponent]
    });
    fixture = TestBed.createComponent(UserLikeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
