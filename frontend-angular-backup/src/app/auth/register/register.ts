import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../services/notification';
import { MatSelectModule } from '@angular/material/select'; // ✅ 1. Importe o MatSelectModule

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule, // ✅ 2. Adicione aos imports
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;

  // ✅ 3. Lista de estados para o dropdown
  states: string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {
    this.registerForm = this.fb.group({
      role: ['FREELANCER', [Validators.required]],
      // Campos do Freelancer
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      // Campos do Cliente (iniciam sem validação)
      companyName: [''],
      // location: [''], // ❌ 4. Campo antigo removido
      city: [''],        // ✅ 4. Novo campo de cidade
      state: [''],       // ✅ 4. Novo campo de estado
      // Campos comuns
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  get roleControl(): FormControl {
    return this.registerForm.get('role') as FormControl;
  }

  ngOnInit(): void {
    this.roleControl.valueChanges.subscribe(role => {
      this.updateValidators(role);
    });

    const passwordControl = this.registerForm.get('password');
    const confirmPasswordControl = this.registerForm.get('confirmPassword');

    if (passwordControl && confirmPasswordControl) {
      passwordControl.valueChanges.subscribe(() => {
        confirmPasswordControl.updateValueAndValidity();
      });
    }
  }

  // ✅ 5. Função updateValidators ATUALIZADA
  updateValidators(role: string): void {
    const firstName = this.registerForm.get('firstName');
    const lastName = this.registerForm.get('lastName');
    const companyName = this.registerForm.get('companyName');
    const city = this.registerForm.get('city'); // Pega o novo controle
    const state = this.registerForm.get('state'); // Pega o novo controle

    if (role === 'FREELANCER') {
      firstName?.setValidators([Validators.required]);
      lastName?.setValidators([Validators.required]);
      companyName?.clearValidators();
      city?.clearValidators(); // Limpa validação de cidade
      state?.clearValidators(); // Limpa validação de estado
    } else if (role === 'CLIENT') {
      firstName?.clearValidators();
      lastName?.clearValidators();
      companyName?.setValidators([Validators.required]);
      city?.setValidators([Validators.required]); // Adiciona validação de cidade
      state?.setValidators([Validators.required]); // Adiciona validação de estado
    }

    // Atualiza o estado de validação de todos os campos
    firstName?.updateValueAndValidity();
    lastName?.updateValueAndValidity();
    companyName?.updateValueAndValidity();
    city?.updateValueAndValidity();
    state?.updateValueAndValidity();
  }

  // O validador de grupo agora está correto
  passwordMatchValidator(form: FormGroup) {
    // ... (função igual)
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  // onSubmit atualizado para lidar com o erro
  onSubmit() {
    // ... (função igual)
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.notification.success('Conta criada!', 'Por favor, faça o login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.notification.error('Erro!', (err?.error?.message || err?.message || 'Ocorreu um erro no registro.'));
        }
      });
    } else {
        this.registerForm.markAllAsTouched(); 
        if(this.registerForm.hasError('mismatch')) {
            // O mat-error no HTML já vai aparecer
        } else {
            this.notification.error('Erro!', 'Por favor, preencha todos os campos corretamente.');
        }
    }
  }
}
