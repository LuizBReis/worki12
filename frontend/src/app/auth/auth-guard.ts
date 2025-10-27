// src/app/auth/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Verifica se o token existe no localStorage
  const token = localStorage.getItem('authToken');

  if (token) {
    // Se o token existe, permite o acesso
    return true;
  } else {
    // Se não existe, redireciona para a página de login
    router.navigate(['/login']);
    // E bloqueia o acesso à rota original
    return false;
  }
};