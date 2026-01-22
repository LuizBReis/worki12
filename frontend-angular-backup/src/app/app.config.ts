import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Provedores e interceptor de HTTP
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth-interceptor';

// Módulos de formulários e Material
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideAnimationsAsync(),

    // ESTA É A ÚNICA FORMA CORRETA DE CONFIGURAR O HTTPCLIENT E O INTERCEPTOR
    provideHttpClient(withInterceptors([authInterceptor])),

    // O HttpClientModule foi removido da lista abaixo
    importProvidersFrom(
      FormsModule, 
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonToggleModule,
      MatIconModule,
      MatButtonModule,
      MatChipsModule,
      MatDialogModule,
      MatSnackBarModule
    )
  ]
};