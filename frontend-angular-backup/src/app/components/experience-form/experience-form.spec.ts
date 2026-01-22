import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperienceForm } from './experience-form';

describe('ExperienceForm', () => {
  let component: ExperienceForm;
  let fixture: ComponentFixture<ExperienceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperienceForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
