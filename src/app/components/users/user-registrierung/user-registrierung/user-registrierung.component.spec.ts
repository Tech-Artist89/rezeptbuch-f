import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRegistrierungComponent } from './user-registrierung.component';

describe('UserRegistrierungComponent', () => {
  let component: UserRegistrierungComponent;
  let fixture: ComponentFixture<UserRegistrierungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRegistrierungComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRegistrierungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
