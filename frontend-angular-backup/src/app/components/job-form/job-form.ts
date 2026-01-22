import { Component, Inject, OnInit } from '@angular/core'; // ✅ Adicionado OnInit
import { CommonModule } from '@angular/common';
// ✅ Adicionado FormControl
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, startWith, map } from 'rxjs'; // ✅ Adicionado imports RxJS
import { SkillService, Skill } from '../../services/skill'; // ✅ Adicionado SkillService

// Imports do Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
// --- ✅ Novos Imports do Material ---
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; // Adicionei MatSelectModule (do tipo de contrato)
import { MatOptionModule } from '@angular/material/core'; // Adicionei MatOptionModule (do tipo de contrato)
import { MatDatepickerModule } from '@angular/material/datepicker'; // Adicionei MatDatepickerModule (do datepicker)
import { MatNativeDateModule } from '@angular/material/core'; // Adicionei MatNativeDateModule (do datepicker)


@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    // --- ✅ Adicionados aos Imports do Componente ---
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatSelectModule, // Mantém para o tipo de contrato (se aplicável aqui)
    MatOptionModule, // Mantém para o tipo de contrato (se aplicável aqui)
    MatDatepickerModule, // Adicionado para o datepicker
    MatNativeDateModule // Adicionado para o datepicker
  ],
  templateUrl: './job-form.html',
  styleUrls: ['./job-form.scss']
})
export class JobForm implements OnInit { // ✅ Implementa OnInit
  jobForm: FormGroup;
  allSkills: Skill[] = []; // Todas as skills carregadas

  // ✅ Propriedades para gerenciar skills
  skillCtrl = new FormControl('');
  filteredSkills$: Observable<Skill[]>;
  selectedSkills: string[] = []; // Nomes das skills selecionadas

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<JobForm>,
    @Inject(MAT_DIALOG_DATA) public data: any, // data contém a vaga a ser editada
    private skillService: SkillService // ✅ Injeta SkillService
  ) {
    this.jobForm = this.fb.group({
      title: [data?.title || '', [Validators.required]],
      description: [data?.description || '', [Validators.required]],
      budget: [data?.budget || null, [Validators.min(0)]]
      // Não precisamos mais de 'requiredSkills' no form group aqui
    });

    // ✅ Inicializa selectedSkills com as skills existentes da vaga (se houver)
    //    Assumindo que 'data.requiredSkills' seja um array de nomes
    this.selectedSkills = Array.isArray(data?.requiredSkills) ? [...data.requiredSkills] : [];

    this.filteredSkills$ = new Observable<Skill[]>();
  }

  ngOnInit(): void { // ✅ Adicionado ngOnInit
      this.loadSkills();

      // Configura o filtro do autocomplete
      this.filteredSkills$ = this.skillCtrl.valueChanges.pipe(
          startWith(null),
          map((skillName: string | Skill | null) => {
              const name = typeof skillName === 'string' ? skillName : null;
              return name ? this._filter(name) : this.allSkills.slice();
          })
      );
  }

  loadSkills(): void {
      this.skillService.getSuggestedSkills().subscribe({
          next: (data: Skill[]) => {
              this.allSkills = data.filter(s => !!s.id && !!s.name);
          },
          error: (err: any) => console.error('Erro ao carregar skills:', err)
      });
  }

  // Função de filtro para o autocomplete
  private _filter(value: string): Skill[] {
      const filterValue = value.toLowerCase();
      return this.allSkills.filter(skill => skill.name.toLowerCase().includes(filterValue));
  }

  // Função para ADICIONAR uma skill (via Enter no Input)
  addSkill(event: MatChipInputEvent): void {
      const value = (event.value || '').trim();
      if (value && !this.selectedSkills.includes(value)) {
          this.selectedSkills.push(value);
      }
      event.chipInput!.clear();
      this.skillCtrl.setValue(null);
  }

  // Função chamada quando uma skill é SELECIONADA no autocomplete
  selected(event: MatAutocompleteSelectedEvent): void {
      const value = event.option.viewValue;
      if (value && !this.selectedSkills.includes(value)) {
          this.selectedSkills.push(value);
      }
      this.skillCtrl.setValue(null);
      const inputElement = document.getElementById('skill-input-edit') as HTMLInputElement; // ✅ ID diferente para edição
      if(inputElement) inputElement.value = '';
  }

  // Função para REMOVER uma skill
  removeSkill(skill: string): void {
      const index = this.selectedSkills.indexOf(skill);
      if (index >= 0) {
          this.selectedSkills.splice(index, 1);
      }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
     // ✅ Validação extra: Garante que pelo menos uma skill foi adicionada
     if (this.selectedSkills.length === 0) {
        alert('Adicione pelo menos uma habilidade necessária.');
        return;
      }

    if (this.jobForm.valid) {
      // ✅ Combina os dados do formulário com as skills selecionadas
      const updatedJobData = {
        ...this.jobForm.value,
        requiredSkills: this.selectedSkills // Adiciona o array de nomes
      };
      this.dialogRef.close(updatedJobData);
    }
  }
}