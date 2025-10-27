// src/app/app.routes.ts

import { Routes } from '@angular/router';

// Mantendo suas importações originais
import { Register } from './auth/register/register';
import { Login } from './auth/login/login';
import { authGuard } from './auth/auth-guard';
import { JobsFeed } from './pages/jobs-feed/jobs-feed';
import { JobDetails } from './pages/job-details/job-details';
import { CreateJob } from './pages/create-job/create-job';
import { Profile } from './pages/profile/profile';
import { MainLayout } from './layout/main-layout/main-layout';
import { Settings } from './pages/settings/settings';
import { MyJobs } from './pages/my-jobs/my-jobs';
import { Messages } from './pages/messages/messages';
// 🚀 Importando a nova Home Page
import { Home } from './pages/home/home';

export const routes: Routes = [
  // --- GRUPO 1: Rotas que NÃO usam o layout principal (tela cheia) ---
  { path: '', component: Home }, // ✅ Home Page pública (sem login)
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // --- GRUPO 2: Rota "Pai" que carrega o layout principal ---
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard], // Protegemos todo o grupo de rotas de uma vez
    children: [
      // Rotas "filhas" que serão exibidas DENTRO do MainLayout
      { path: 'dashboard', component: JobsFeed },
      { path: 'jobs/new', component: CreateJob },
      { path: 'jobs/:id', component: JobDetails },
      { path: 'profile/:id', component: Profile },
      { path: 'my-jobs', component: MyJobs },
      { path: 'settings', component: Settings },
      { path: 'messages/inbox', component: Messages},
      { path: 'messages/:id', component: Messages}
    ]
  },

  // Rota de fallback: se nenhuma rota corresponder, redireciona para a Home
  { path: '**', redirectTo: '' }
];
