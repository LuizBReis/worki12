import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { from, switchMap } from 'rxjs'; // Use RxJS handles async

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return from(authService.getToken()).pipe(
    switchMap(token => {
      const authReq = token ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      }) : req;
      return next(authReq);
    })
  );
};