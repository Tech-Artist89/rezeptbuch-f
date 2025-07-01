import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipesFormComponent } from './recipes-form.component';

describe('RecipesFormComponent', () => {
  let component: RecipesFormComponent;
  let fixture: ComponentFixture<RecipesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
