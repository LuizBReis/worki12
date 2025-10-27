import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewFormComponent } from './review-form';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('ReviewFormComponent', () => {


  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { reviewType: 'CLIENT_REVIEWING_FREELANCER' } },
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not require comment for client reviewing freelancer', () => {
    const commentCtrl = component.reviewForm.get('comment');
    commentCtrl?.setValue('');
    commentCtrl?.markAsTouched();
    commentCtrl?.updateValueAndValidity();
    expect(commentCtrl?.hasError('required')).toBeFalse();
  });
});

// Additional scenario: freelancer reviewing client should require comment
describe('ReviewFormComponent (freelancer reviewing client)', () => {
  it('should require comment when freelancer reviews client', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { reviewType: 'FREELANCER_REVIEWING_CLIENT' } },
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ReviewFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const commentCtrl = component.reviewForm.get('comment');
    commentCtrl?.setValue('');
    commentCtrl?.markAsTouched();
    commentCtrl?.updateValueAndValidity();

    expect(commentCtrl?.hasError('required')).toBeTrue();
  });
});