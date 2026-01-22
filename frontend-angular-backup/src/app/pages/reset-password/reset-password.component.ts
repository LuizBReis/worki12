import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Importe ActivatedRoute
import { AuthService } from '../../auth/auth.service'; // Ajuste o caminho se necessário

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule,
    MatInputModule,
    MatButtonModule]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  token: string | null = null;
  message: string | null = null;
  errorMessage: string | null = null;
  loading: boolean = true; // Para mostrar um loader enquanto o token é verificado

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute, // Para pegar o token da URL
    private router: Router,
    private AuthService: AuthService
  ) {
    this.resetPasswordForm = this.fb.group({
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validator: this.passwordMatchValidator }); // Adicione o validador customizado
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.errorMessage = 'Token de redefinição de senha não encontrado.';
      this.loading = false;
    } else {
      // Opcional: Você pode querer um endpoint no backend para validar o token aqui (se é válido/não expirou)
      // antes de mostrar o formulário. Por simplicidade, vamos direto ao formulário.
      this.loading = false;
    }
  }

  // Validador customizado para verificar se as senhas coincidem
  passwordMatchValidator(form: FormGroup) {
    return form.get('novaSenha')?.value === form.get('confirmarSenha')?.value
      ? null : { 'mismatch': true };
  }

  resetPassword() {
    this.message = null;
    this.errorMessage = null;

    if (this.resetPasswordForm.valid && this.token) {
      const { novaSenha } = this.resetPasswordForm.value;
      this.AuthService.resetPassword(this.token, novaSenha).subscribe(
        (res: any) => {
          this.message = res.message;
          this.resetPasswordForm.reset(); // Limpa o formulário
          // Opcional: Redirecionar para a tela de login após alguns segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        (err) => {
          this.errorMessage = err.error.error || 'Erro ao redefinir sua senha. Tente novamente.';
          console.error('Erro ao redefinir senha:', err);
        }
      );
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente e verifique se as senhas coincidem.';
      this.resetPasswordForm.markAllAsTouched();
    }
  }
}