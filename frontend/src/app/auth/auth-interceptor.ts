import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Pega o token do localStorage
  const authToken = localStorage.getItem('authToken');

  // 2. Clona a requisição e adiciona o cabeçalho de autorização
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`
    }
  });

  // 3. Envia a requisição clonada com o cabeçalho
  // Se não houver token, ele simplesmente envia a requisição original
  return next(authToken ? authReq : req);
};