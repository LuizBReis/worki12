import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Imports do Material para o formulário e o Dialog
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core'; // Necessário para o Datepicker

@Component({
  selector: 'app-experience-form',
  standalone: true,
  // providers é necessário para o Datepicker funcionar
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, MatSelectModule, MatDatepickerModule, MatDialogModule
  ],
  templateUrl: './experience-form.html',
  styleUrls: ['./experience-form.scss']
})
export class ExperienceForm {
  experienceForm: FormGroup;
  employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'];

  constructor(
    private fb: FormBuilder,
    // MatDialogRef é uma referência ao próprio pop-up, para podermos fechá-lo
    public dialogRef: MatDialogRef<ExperienceForm>,
    // MAT_DIALOG_DATA é usado para receber dados quando estamos EDITANDO
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.experienceForm = this.fb.group({
      title: [data?.title || '', [Validators.required]],
      company: [data?.company || '', [Validators.required]],
      employmentType: [data?.employmentType || '', [Validators.required]],
      location: [data?.location || ''],
      startDate: [data?.startDate || '', [Validators.required]],
      endDate: [data?.endDate || null],
      description: [data?.description || '']
    });
  }

  onCancel(): void {
    this.dialogRef.close(); // Fecha o pop-up sem retornar dados
  }

  onSave(): void {
    if (this.experienceForm.valid) {
      // Fecha o pop-up e RETORNA os dados do formulário para quem o abriu
      this.dialogRef.close(this.experienceForm.value);
    }
  }
}