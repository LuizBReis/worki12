import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification';

// Validador customizado
export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword && confirmPassword && newPassword.value !== confirmPassword.value ? { passwordsDoNotMatch: true } : null;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class Settings {
  changePasswordForm: FormGroup;
  changeEmailForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private notification: NotificationService
  ) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordsMatchValidator });

    this.changeEmailForm = this.fb.group({
      password: ['', [Validators.required]],
      newEmail: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmitPassWord(): void {
    if (this.changePasswordForm.invalid) return;

    const { oldPassword, newPassword } = this.changePasswordForm.value;
    this.authService.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.notification.success('Senha alterada!', 'Sua senha foi atualizada com sucesso.');
        this.changePasswordForm.reset();
      },
      error: (err) => {
        this.notification.error('Erro!', err?.error?.message || 'Ocorreu um erro ao alterar sua senha.');
      }
    });
  }

  onSubmitEmail(): void {
    if (this.changeEmailForm.invalid) return;

    this.authService.changeEmail(this.changeEmailForm.value).subscribe({
      next: () => {
        this.notification
          .success('E-mail alterado!', 'Por favor, faça login novamente.')
          .then(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          });
      },
      error: (err) => {
        this.notification.error('Erro!', err?.error?.message || 'Ocorreu um erro ao alterar o e-mail.');
      }
    });
  }

  onDeleteAccount(): void {
    this.notification
      .confirm({
        title: 'Tem certeza?',
        text: 'Esta ação é irreversível e todos os seus dados serão perdidos.',
        confirmText: 'Sim, excluir minha conta!',
        cancelText: 'Cancelar',
        confirmColor: '#d33',
        cancelColor: '#999'
      })
      .then((confirmed) => {
        if (confirmed) {
          this.userService.deleteMyAccount().subscribe({
            next: () => {
              this.notification
                .success('Conta excluída!', 'Sua conta foi removida com sucesso.')
                .then(() => {
                  this.authService.logout();
                  this.router.navigate(['/register']);
                });
            },
            error: (err: any) => {
              this.notification.error('Erro!', err?.error?.message || 'Ocorreu um erro ao tentar excluir sua conta.');
              console.error('Erro ao excluir conta:', err);
            }
          });
        }
      });
  }
}
