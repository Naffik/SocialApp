import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCommentListComponent } from './user-comment-list.component';

describe('UserCommentListComponent', () => {
  let component: UserCommentListComponent;
  let fixture: ComponentFixture<UserCommentListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserCommentListComponent]
    });
    fixture = TestBed.createComponent(UserCommentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
