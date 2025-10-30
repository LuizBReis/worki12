import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Router, RouterModule } from '@angular/router'; // Importe RouterModule

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule,
    MatInputModule,
    MatButtonModule] // Adicione RouterModule
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  message: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private AuthService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  requestPasswordReset() {
    this.message = null;
    this.errorMessage = null;

    if (this.forgotPasswordForm.valid) {
      const { email } = this.forgotPasswordForm.value;
      // Você precisará implementar o método requestPasswordReset no seu AccesoService
      this.AuthService.requestPasswordReset(email).subscribe(
        (res: any) => {
          this.message = 'Se um email correspondente for encontrado, um link de redefinição de senha foi enviado.';
          this.forgotPasswordForm.reset(); // Limpa o formulário
        },
        (err) => {
          this.errorMessage = 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
          console.error('Erro ao solicitar redefinição de senha:', err);
        }
      );
    } else {
      this.errorMessage = 'Por favor, insira um email válido.';
      this.forgotPasswordForm.markAllAsTouched();
    }
  }
}