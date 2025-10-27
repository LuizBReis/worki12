import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationService } from '../../services/application';
import { NotificationService } from '../../services/notification';

interface ReviewDialogData {
  applicationId: string;
  mode: 'client' | 'freelancer';
}

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './review-dialog.html',
  styleUrls: ['./review-dialog.scss']
})
export class ReviewDialog {
  form: any;

  title = '';
  subTitle = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReviewDialogData,
    private dialogRef: MatDialogRef<ReviewDialog>,
    private fb: FormBuilder,
    private applicationService: ApplicationService,
    private notification: NotificationService
  ) {
    // Inicializa o formulário corretamente após a injeção
    this.form = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['']
    });

    if (data.mode === 'client') {
      this.title = 'Avaliar Freelancer';
      this.subTitle = 'Conte como foi trabalhar com este profissional.';
      this.form.get('comment')?.addValidators([Validators.required, Validators.minLength(5)]);
    } else {
      this.title = 'Avaliar Cliente';
      this.subTitle = 'Compartilhe sua experiência com este cliente.';
      // comentário opcional para freelancer
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    // Garante que rating seja um número entre 1 e 5
    const raw = this.form.value as { rating: any; comment?: string };
    const rating = Math.min(5, Math.max(1, Number(raw.rating)));
    const payload: { rating: number; comment: string } = { rating, comment: raw.comment ?? '' };

    // Corrige mapeamento de endpoint: 
    // - CLIENT avalia FREELANCER -> reviewFreelancer
    // - FREELANCER avalia CLIENT -> reviewClient
    const request = this.data.mode === 'client'
      ? this.applicationService.reviewFreelancer(this.data.applicationId, { rating, comment: payload.comment })
      : this.applicationService.reviewClient(this.data.applicationId, payload);

    request.subscribe({
      next: () => {
        this.notification.success('Avaliação enviada!', 'Sua avaliação foi registrada com sucesso.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Erro ao enviar avaliação:', err);
        this.notification.error('Erro!', err?.error?.message || 'Erro ao enviar avaliação.');
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}