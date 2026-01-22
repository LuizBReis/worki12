import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Imports do Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select'; // Usaremos para as estrelas

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule
  ],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.scss']
})
export class ReviewFormComponent {
  reviewForm: FormGroup;
  reviewType: 'CLIENT_REVIEWING_FREELANCER' | 'FREELANCER_REVIEWING_CLIENT';
  stars = [5, 4, 3, 2, 1]; // Opções de nota

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReviewFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reviewType: any }
  ) {
    this.reviewType = data.reviewType;

    // O formulário é dinâmico
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required]],
      comment: [''] // Começa sem validação
    });

    // Se for o freelancer avaliando, o comentário é obrigatório
    if (this.reviewType === 'FREELANCER_REVIEWING_CLIENT') {
      this.reviewForm.get('comment')?.setValidators([Validators.required]);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.reviewForm.valid) {
      this.dialogRef.close(this.reviewForm.value);
    }
  }
}