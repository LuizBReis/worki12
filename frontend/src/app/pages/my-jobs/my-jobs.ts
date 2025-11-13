import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common'; // Adicionei os Pipes
import { RouterLink } from '@angular/router';

// Imports dos nossos Serviços e Interfaces (CORRIGIDOS)
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user';
import { Job, JobApplication } from '../../services/job';
import { ApplicationService } from '../../services/application';
import { NotificationService } from '../../services/notification';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ReviewDialog } from '../../components/review-dialog/review-dialog';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [ 
    CommonModule, 
    RouterLink, 
    MatCardModule, 
    MatProgressSpinnerModule, 
    DatePipe,       // Adicionado para o pipe | date funcionar
    TitleCasePipe,
    MatDividerModule,   // Adicionado para o pipe | titlecase funcionar
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './my-jobs.html',
  styleUrls: ['./my-jobs.scss']
})
export class MyJobs implements OnInit {
  userRole: string | null = null;
  isLoading = true;
  postedJobs: Job[] = [];
  applications: JobApplication[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private applicationService: ApplicationService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    if (this.userRole === 'CLIENT') {
      this.userService.getMyPostedJobs().subscribe({
        next: (jobs) => {
          this.postedJobs = jobs;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar vagas postadas:', err);
          this.isLoading = false;
        }
      });
    } 
    else if (this.userRole === 'FREELANCER') {
      this.userService.getMyApplications().subscribe({
        next: (apps) => {
          this.applications = apps;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar candidaturas:', err);
          this.isLoading = false;
        }
      });
    }
  }

  // --- 5. NOVA FUNÇÃO PARA CANCELAR CANDIDATURA ---
  async onCancelApplication(applicationId: string): Promise<void> {
    const ok = await this.notification.confirm({
      title: 'Tem certeza?',
      text: 'Deseja cancelar sua candidatura?'
    });
    if (ok) {
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          this.applications = this.applications.filter(app => app.id !== applicationId);
          this.notification.success('Candidatura cancelada!', 'Candidatura cancelada com sucesso.');
        },
        error: (err) => {
          this.notification.error('Erro!', 'Erro ao cancelar candidatura.');
          console.error(err);
        }
      });
    }
  }

  // --- Fluxo de encerramento (freelancer) ---
  onConfirmClosure(applicationId: string): void {
    this.applicationService.confirmClosure(applicationId).subscribe({
      next: () => {
        this.notification.success('Encerramento confirmado.', 'Obrigado!');
        this.applications = this.applications.map(app => app.id === applicationId ? { ...app, jobStatus: 'COMPLETED' } : app);
      },
      error: (err) => {
        console.error('Erro ao confirmar encerramento:', err);
        this.notification.error('Erro!', 'Erro ao confirmar encerramento.');
      }
    });
  }

  openFreelancerReview(application: JobApplication): void {
    const dialogRef = this.dialog.open(ReviewDialog, {
      width: '520px',
      data: { applicationId: application.id, mode: 'freelancer' }
    });
    dialogRef.afterClosed().subscribe((ok) => {
      if (ok) {
        // Ajuste: avaliação feita pelo FREELANCER deve atualizar clientReview
        this.applications = this.applications.map(app =>
          app.id === application.id ? { ...app, clientReview: { rating: 5 } } : app
        );
      }
    });
  }

  // MOVER para dentro da classe e remover referência inexistente a applicantFilterControl
  openClientReview(application: JobApplication): void {
    const dialogRef = this.dialog.open(ReviewDialog, {
      width: '520px',
      data: { applicationId: application.id, mode: 'client' }
    });
    dialogRef.afterClosed().subscribe((ok) => {
      if (ok) {
        // Opcional: atualiza visualmente que o CLIENT avaliou o FREELANCER
        this.applications = this.applications.map(app =>
          app.id === application.id ? { ...app, freelancerReview: { rating: 5 } } : app
        );
      }
    });
  }

  // Tradução de status de candidatura para PT-BR
  translateApplicationStatus(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'Pendente',
      'APPLIED': 'Candidatado',
      'SHORTLISTED': 'Aceito',
      'REJECTED': 'Rejeitado',
      'HIRED': 'Contratado',
      'WITHDRAWN': 'Retirada'
    };
    return map[status] || status;
  }

  // Tradução de status da vaga/processo para PT-BR
  translateJobStatus(status?: string): string {
    if (!status) return '';
    const map: Record<string, string> = {
      'ACTIVE': 'Ativa',
      'PENDING_CLOSE': 'Encerramento pendente',
      'COMPLETED': 'Concluído',
      'CANCELLED': 'Cancelado'
    };
    return map[status] || status;
  }
}