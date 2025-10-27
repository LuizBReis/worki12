import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobService } from '../../services/job';
import { SkillService, Skill } from '../../services/skill';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './create-job.html',
  styleUrls: ['./create-job.scss']
})
export class CreateJob implements OnInit {
  createJobForm!: FormGroup;
  skills: Skill[] = []; // Lista de habilidades sugeridas

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private skillService: SkillService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createJobForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      budget: [null, [Validators.min(0)]],
      requiredSkills: [[], Validators.required] // Campo de skills adicionado
    });

    this.loadSkills();
  }

  // Busca skills do backend
  loadSkills(): void {
    this.skillService.getSuggestedSkills().subscribe({
      next: (data: Skill[]) => {
        // Filtra nomes inválidos e normaliza a lista
        this.skills = data.filter(s => !!s.id && !!s.name);
      },
      error: (err: any) => console.error('Erro ao carregar skills:', err)
    });
  }

  // Submete o formulário
  onSubmit(): void {
    if (this.createJobForm.valid) {
      const jobData = this.createJobForm.value;
      // Mapear IDs selecionados para nomes, garantindo compatibilidade com o backend
      const selectedIds: string[] = Array.isArray(jobData.requiredSkills) ? jobData.requiredSkills : [];
      const requiredSkillNames: string[] = selectedIds
        .map((id) => this.skills.find((s) => s.id === id)?.name)
        .filter((name): name is string => !!name);

      const payload = { ...jobData, requiredSkills: requiredSkillNames };
      console.log('Dados da vaga (payload):', payload);

      this.jobService.createJob(payload).subscribe({
        next: (newJob) => {
          console.log('Vaga criada com sucesso!', newJob);
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => console.error('Erro ao criar vaga:', err)
      });
    }
  }
}
