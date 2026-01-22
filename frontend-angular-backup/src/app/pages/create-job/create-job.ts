// src/app/pages/create-job/create-job.ts (VERSÃO REFINADA)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { JobService } from '../../services/job';
import { SkillService, Skill } from '../../services/skill';
import { Observable, startWith, map } from 'rxjs';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { CdkTextareaAutosize } from '@angular/cdk/text-field'; // Importe CdkTextareaAutosize

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
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    CdkTextareaAutosize // ✅ Adicione CdkTextareaAutosize aos imports
  ],
  templateUrl: './create-job.html',
  styleUrls: ['./create-job.scss']
})
export class CreateJob implements OnInit {
  createJobForm!: FormGroup;
  skills: Skill[] = []; // Lista de skills carregadas

  skillCtrl = new FormControl(''); // Controle SÓ para o input de skill
  filteredSkills$: Observable<Skill[]>;
  selectedSkills: string[] = []; // Nomes das skills adicionadas

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private skillService: SkillService,
    private router: Router
  ) {
    // Inicializa o form SEM o controle de skills
    this.createJobForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      budget: [null, [Validators.min(0)]],
    });

    // Configura o filtro do autocomplete (será preenchido no ngOnInit)
    this.filteredSkills$ = new Observable<Skill[]>();
  }

  ngOnInit(): void {
    this.loadSkills();

    // ✅ Lógica do autocomplete simplificada
    this.filteredSkills$ = this.skillCtrl.valueChanges.pipe(
      startWith(''), // Começa emitindo uma string vazia
      map(value => typeof value === 'string' ? value : ''), // Garante que é string
      map(name => name ? this._filter(name) : this.skills.slice()) // Filtra ou retorna todas
    );
  }

  loadSkills(): void {
    this.skillService.getSuggestedSkills().subscribe({
      next: (data: Skill[]) => {
        this.skills = data.filter(s => !!s.id && !!s.name);
         // ✅ Força a re-emissão do valueChanges para atualizar o autocomplete inicial
         this.skillCtrl.setValue(this.skillCtrl.value); 
      },
      error: (err: any) => console.error('Erro ao carregar skills:', err)
    });
  }

  private _filter(value: string): Skill[] {
    const filterValue = value.toLowerCase();
    return this.skills.filter(skill => skill.name.toLowerCase().includes(filterValue));
  }

  // Adiciona skill via Enter
  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.selectedSkills.includes(value)) {
      this.selectedSkills.push(value);
    }
    event.chipInput!.clear();
    this.skillCtrl.setValue(''); // ✅ Limpa o valor do controle
  }

  // Adiciona skill via seleção no autocomplete
  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (value && !this.selectedSkills.includes(value)) {
      this.selectedSkills.push(value);
    }
    this.skillCtrl.setValue(''); // ✅ Limpa o valor do controle
    // Limpa o input visualmente
    const inputElement = document.getElementById('skill-input') as HTMLInputElement;
    if (inputElement) inputElement.value = '';
  }

  // Remove skill do chip
  removeSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index >= 0) {
      this.selectedSkills.splice(index, 1);
    }
  }

  onSubmit(): void {
     if (this.selectedSkills.length === 0) {
       alert('Adicione pelo menos uma habilidade necessária.');
       return;
     }

    if (this.createJobForm.valid) {
      const { title, description, budget } = this.createJobForm.value;
      const payload = {
        title,
        description,
        budget,
        requiredSkills: this.selectedSkills
      };
      console.log('Dados da vaga (payload):', payload);

      this.jobService.createJob(payload).subscribe({
        next: (newJob) => {
          console.log('Vaga criada com sucesso!', newJob);
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => console.error('Erro ao criar vaga:', err)
      });
    } else {
        this.createJobForm.markAllAsTouched();
    }
  }
}