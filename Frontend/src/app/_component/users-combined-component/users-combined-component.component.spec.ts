import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersCombinedComponentComponent } from './users-combined-component.component';

describe('UsersCombinedComponentComponent', () => {
  let component: UsersCombinedComponentComponent;
  let fixture: ComponentFixture<UsersCombinedComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UsersCombinedComponentComponent]
    });
    fixture = TestBed.createComponent(UsersCombinedComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
