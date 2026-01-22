import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  // Injete o serviço
  constructor(private authService: AuthService) {}

  // ngOnInit é um "gancho de ciclo de vida" que roda quando o componente é iniciado
  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        console.log('Dados do perfil recebidos!', profile);
      },
      error: (err) => {
        console.error('Erro ao buscar perfil:', err);
      }
    });
  }

}
