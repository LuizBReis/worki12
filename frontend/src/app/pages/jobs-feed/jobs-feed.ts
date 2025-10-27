// src/app/pages/jobs-feed/jobs-feed.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, switchMap } from 'rxjs/operators';


// Imports do Material e do nosso Serviço/Interface
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { Job, JobService } from '../../services/job';
import { AuthService } from '../../auth/auth.service'; 
import { SkillService, Skill } from '../../services/skill';

@Component({
  selector: 'app-jobs-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, // Adicionamos o módulo de cards aqui
    RouterLink, 
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './jobs-feed.html',
  styleUrls: ['./jobs-feed.scss']
})
export class JobsFeed implements OnInit {
  
  jobs: Job[] = []; // Variável para armazenar nossa lista de vagas
  userRole: string | null = null;
  filterForm: FormGroup;
  skills: Skill[] = [];

  // Injetamos o JobService no construtor
  constructor(private jobService: JobService, private authService: AuthService, private fb: FormBuilder, private skillService: SkillService) {
    // 1. Cria o formulário de filtros
    this.filterForm = this.fb.group({
      search: [''],
      minBudget: [null],
      maxBudget: [null],
      skills: [[]]
    });
  }

  // Este método é chamado automaticamente quando o componente é iniciado
  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    // Carrega skills sugeridas
    this.skillService.getSuggestedSkills().subscribe({
      next: (data: Skill[]) => this.skills = data.filter(s => !!s.id && !!s.name && s.name.trim().length > 0),
      error: (err: any) => console.error('Erro ao carregar skills:', err)
    });

    // 2. MÁGICA DO RXJS: Escuta as mudanças no formulário
    this.filterForm.valueChanges.pipe(
      // Inicia com o valor atual do formulário (para a primeira busca)
      startWith(this.filterForm.value),
      // Espera 500ms após o usuário parar de digitar
      debounceTime(500),
      // Cancela a busca anterior e faz uma nova com os novos filtros
      switchMap(filters => this.jobService.getJobs(filters))
    ).subscribe({
      next: (data: Job[]) => {
        this.jobs = data;
      },
      error: (err: any) => {
        console.error('Erro ao buscar vagas:', err);
      }
    });
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      search: '',
      minBudget: null,
      maxBudget: null,
      skills: []
    });
  }
}