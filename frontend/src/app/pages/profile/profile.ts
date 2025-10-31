import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

import { UserService, UserProfile, WorkExperience } from '../../services/user';
import { AuthService } from '../../auth/auth.service';
import { SkillService, Skill } from '../../services/skill';
import { ExperienceForm } from '../../components/experience-form/experience-form';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { NotificationService } from '../../services/notification';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe, TitleCasePipe,
    MatAutocompleteModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule,MatSelectModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = true;
  isOwnProfile = false;
  isEditing = false;
  profileForm: FormGroup;
  skillControl = new FormControl('', { nonNullable: true });

  allSuggestedSkills: Skill[] = [];
  filteredSkills$: Observable<Skill[]>;

  // ✅ ADICIONA A LISTA DE ESTADOS
  states: string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  ];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private skillService: SkillService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private router: Router,
    private notification: NotificationService
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      description: [''],
      companyName: [''],
      city: [''],
      state: [''],
      address: [''],
    });
    this.filteredSkills$ = new Observable<Skill[]>();
  }

  ngOnInit(): void {
    this.skillService.getSuggestedSkills().subscribe({
      next: (skills: Skill[]) => {
        this.allSuggestedSkills = skills.filter(s => !!s.id && !!s.name && s.name.trim().length > 0);
      },
      error: (err: any) => console.error('Erro ao carregar skills:', err)
    });

    this.filteredSkills$ = this.skillControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSkills(value || ''))
    );

    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.isOwnProfile = this.authService.getUserId() === userId;
      this.userService.getUserProfile(userId).subscribe({
        next: (data) => {
          this.userProfile = data;
          this.profileForm.patchValue({
            firstName: data.firstName,
            lastName: data.lastName,
            description: data.role === 'FREELANCER' ? data.freelancerProfile?.description : data.clientProfile?.description,
            companyName: data.clientProfile?.companyName,
            city: data.clientProfile?.city,       // ✅ Adicionado
            state: data.clientProfile?.state,     // ✅ Adicionado
            address: data.clientProfile?.address, // ✅ Adicionado
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar perfil:', err);
          this.isLoading = false;
        }
      });
    }
  }

  // --- Helper para estrelas de classificação (0–5 com meia estrela) ---
  getStars(average: number | null | undefined): string[] {
    const icons: string[] = [];
    const value = typeof average === 'number' ? Math.max(0, Math.min(5, average)) : 0;
    for (let i = 1; i <= 5; i++) {
      const diff = value - i;
      if (diff >= 0) {
        icons.push('star');
      } else if (diff > -1 && value - (i - 1) >= 0.5) {
        icons.push('star_half');
      } else {
        icons.push('star_border');
      }
    }
    return icons;
  }

  private _filterSkills(value: string): Skill[] {
    const filterValue = value.toLowerCase();
    return this.allSuggestedSkills.filter(skill =>
      skill.name.toLowerCase().includes(filterValue)
    );
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  onSave(): void {
    if (this.profileForm.valid && this.userProfile) {
      this.userService.updateMyProfile(this.profileForm.value).subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile;
          this.isEditing = false;
          this.notification.success('Sucesso!', 'Perfil atualizado com sucesso!');
        },
        error: (err: any) => {
          console.error('Erro ao salvar perfil:', err);
          this.notification.error('Erro!', 'Não foi possível salvar o perfil.');
        }
      });
    }
  }

  onAddSkill(): void {
    if (this.skillControl.valid && this.skillControl.value) {
      const skillName = this.skillControl.value;
      this.userService.addSkill(skillName).subscribe({
        next: (updatedProfile) => {
          if(this.userProfile) this.userProfile.freelancerProfile = updatedProfile.freelancerProfile;
          this.skillControl.reset();
          this.notification.success('Sucesso!', 'Skill adicionada.');
        },
        error: (err: any) => {
          console.error('Erro ao adicionar skill:', err);
          this.notification.error('Erro!', 'Não foi possível adicionar a skill.');
        }
      });
    }
  }

  onRemoveSkill(skillName: string): void {
    this.userService.removeSkill(skillName).subscribe({
      next: (updatedProfile) => {
        if(this.userProfile) this.userProfile.freelancerProfile = updatedProfile.freelancerProfile;
      },
      error: (err: any) => {
        console.error('Erro ao remover skill:', err);
        this.notification.error('Erro!', 'Não foi possível remover a skill.');
      }
    });
  }

  openExperienceDialog(experience?: WorkExperience): void {
    const dialogRef = this.dialog.open(ExperienceForm, {
      width: '600px',
      data: experience,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.userProfile?.freelancerProfile) {
        if (experience) {
          this.userService.updateWorkExperience(experience.id, result).subscribe({
            next: () => {
              const index = this.userProfile!.freelancerProfile!.workExperiences.findIndex(exp => exp.id === experience.id);
              if (index > -1) {
                this.userProfile!.freelancerProfile!.workExperiences[index] = { ...this.userProfile!.freelancerProfile!.workExperiences[index], ...result };
              }
              this.notification.success('Sucesso!', 'Experiência atualizada.');
            },
            error: (err: any) => {
              console.error('Erro ao atualizar experiência:', err);
              this.notification.error('Erro!', 'Não foi possível atualizar a experiência.');
            },
          });
        } else {
          this.userService.addWorkExperience(result).subscribe({
            next: (newExperience: WorkExperience) => {
              if (!this.userProfile!.freelancerProfile!.workExperiences) {
                this.userProfile!.freelancerProfile!.workExperiences = [];
              }
              this.userProfile!.freelancerProfile!.workExperiences.unshift(newExperience);
              this.notification.success('Sucesso!', 'Experiência adicionada.');
            },
            error: (err: any) => {
              console.error('Erro ao adicionar experiência:', err);
              this.notification.error('Erro!', 'Não foi possível adicionar a experiência.');
            },
          });
        }
      }
    });
  }

  onDeleteExperience(experienceId: string): void {
    this.notification.confirm({
      title: 'Remover experiência?',
      text: 'Essa ação não pode ser desfeita.'
    }).then(confirmed => {
      if (!confirmed) return;
      this.userService.deleteWorkExperience(experienceId).subscribe({
        next: () => {
          if (this.userProfile?.freelancerProfile?.workExperiences) {
            this.userProfile.freelancerProfile.workExperiences = this.userProfile.freelancerProfile.workExperiences.filter(
              exp => exp.id !== experienceId
            );
          }
          this.notification.success('Sucesso!', 'Experiência removida.');
        },
        error: (err: any) => {
          console.error('Erro ao remover experiência:', err);
          this.notification.error('Erro!', 'Não foi possível remover a experiência.');
        },
      });
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Opcional: Validar tamanho do arquivo (ex: max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notification.error('Erro!', 'A imagem não pode ter mais de 5MB.');
        return;
      }

      this.isLoading = true; // Ativa o spinner global
      this.userService.updateUserAvatar(file).subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile; // Atualiza o perfil com a nova URL
          this.notification.success('Sucesso!', 'Sua foto de perfil foi atualizada.');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao enviar avatar:', err);
          this.notification.error('Erro!', 'Não foi possível atualizar sua foto.');
          this.isLoading = false;
        }
      });
    }
  }

  onDeleteAvatar(): void {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      return; // Opcional: confirmação do usuário
    }

    this.isLoading = true;
    this.userService.deleteUserAvatar().subscribe({
      next: (updatedProfile) => {
        this.userProfile = updatedProfile;
        this.notification.success('Sucesso!', 'Sua foto de perfil foi removida.');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao deletar avatar:', err);
        this.notification.error('Erro!', 'Não foi possível remover sua foto.');
        this.isLoading = false;
      }
    });
  }
}