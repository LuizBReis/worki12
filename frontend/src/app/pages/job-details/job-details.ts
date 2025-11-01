import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';

import { JobService, Job, JobApplication } from '../../services/job';
import { AuthService } from '../../auth/auth.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { ApplicationService } from '../../services/application';
import { debounceTime, switchMap, startWith } from 'rxjs/operators';
import { MessageService } from '../../services/message';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { JobForm } from '../../components/job-form/job-form';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import Swal from 'sweetalert2';
import { ReviewDialog } from '../../components/review-dialog/review-dialog';
import { NotificationService } from '../../services/notification';
import { MatChipsModule } from '@angular/material/chips'; // ✅ Adicionar

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './job-details.html',
  styleUrls: ['./job-details.scss']
})
export class JobDetails implements OnInit {
  job: Job | null = null;
  isLoading = true;
  isAuthor = false;
  userRole: string | null = null;
  applicantFilterControl = new FormControl('');
  applicants$: Observable<JobApplication[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    private authService: AuthService,
    public dialog: MatDialog,
    private router: Router,
    private applicationService: ApplicationService,
    private messageService: MessageService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    const jobId = this.route.snapshot.paramMap.get('id');

    if (jobId) {
      this.jobService.getJobById(jobId).subscribe({
        next: (data) => {
          this.job = data;
          this.isLoading = false;
          this.isAuthor = this.authService.getUserId() === this.job?.author?.user?.id;

          if (this.isAuthor && this.job?.id) {
            this.applicants$ = this.applicantFilterControl.valueChanges.pipe(
              startWith(this.applicantFilterControl.value),
              debounceTime(300),
              switchMap((skill: string | null) =>
                this.jobService.getJobApplicants(this.job!.id, { skill: skill || '' })
              )
            );
          }
        },
        error: (err) => {
          console.error('Erro ao buscar vaga:', err);
          this.isLoading = false;
        }
      });
    }
  }

  onApply(): void {
    if (!this.job) return;

    this.jobService.applyToJob(this.job!.id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Candidatura enviada!',
          text: 'Sua candidatura foi registrada com sucesso.',
          confirmButtonColor: '#34c759'
        });
        this.job!.hasApplied = true;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: err.error.message || 'Ocorreu um erro ao enviar sua candidatura.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  openEditJobDialog(): void {
    if (!this.job) return;

    const dialogRef = this.dialog.open(JobForm, {
      width: '600px',
      data: this.job
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.job) {
        this.jobService.updateJob(this.job!.id, result).subscribe({
          next: () => {
            this.job = { ...this.job!, ...result };
            Swal.fire({
              icon: 'success',
              title: 'Vaga atualizada!',
              text: 'As informações foram salvas com sucesso.',
              confirmButtonColor: '#34c759'
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erro!',
              text: 'Ocorreu um erro ao atualizar a vaga.',
              confirmButtonColor: '#d33'
            });
            console.error('Erro ao atualizar vaga:', err);
          }
        });
      }
    });
  }

  onDeleteJob(): void {
    if (!this.job) return;

    Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#999',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.jobService.deleteJob(this.job!.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Vaga excluída!',
              text: 'A vaga foi removida com sucesso.',
              confirmButtonColor: '#34c759'
            }).then(() => this.router.navigate(['/dashboard']));
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erro!',
              text: 'Ocorreu um erro ao excluir a vaga.',
              confirmButtonColor: '#d33'
            });
            console.error('Erro ao excluir vaga:', err);
          }
        });
      }
    });
  }

  updateApplicationStatus(applicationId: string, newStatus: 'SHORTLISTED' | 'REJECTED'): void {
    this.applicationService.updateStatus(applicationId, newStatus).subscribe({
      next: () => {
        this.notification.success('Status atualizado!', 'Status do candidato atualizado!');
        this.applicantFilterControl.setValue(this.applicantFilterControl.value);
      },
      error: (err: any) => {
        this.notification.error('Erro!', 'Erro ao atualizar status.');
      }
    });
  }

  onStartConversation(applicationId: string): void {
    this.messageService.startConversation(applicationId).subscribe({
      next: (conversation) => {
        console.log('Conversa iniciada ou encontrada:', conversation);
        this.router.navigate(['/messages', conversation.id]);
        this.notification.success('Conversa iniciada!', 'Você pode conversar agora.');
      },
      error: (err) => {
        console.error('Erro ao iniciar conversa:', err);
        this.notification.error('Erro!', 'Erro ao iniciar conversa.');
      }
    });
  }

  // --- Fluxo de encerramento ---
  onRequestClosure(applicationId: string): void {
    this.applicationService.requestClosure(applicationId).subscribe({
      next: () => {
        this.notification.info('Encerramento solicitado', 'Encerramento solicitado ao freelancer.');
        this.applicantFilterControl.setValue(this.applicantFilterControl.value);
      },
      error: (err) => {
        console.error('Erro ao solicitar encerramento:', err);
        this.notification.error('Erro!', 'Erro ao solicitar encerramento.');
      }
    });
  }

  openClientReview(application: JobApplication): void {
    const dialogRef = this.dialog.open(ReviewDialog, {
      width: '520px',
      data: { applicationId: application.id, mode: 'client' }
    });
    dialogRef.afterClosed().subscribe((ok) => {
      if (ok) {
        this.applicantFilterControl.setValue(this.applicantFilterControl.value);
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
