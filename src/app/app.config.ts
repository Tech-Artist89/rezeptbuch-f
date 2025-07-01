// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

// Interceptors
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Services (werden automatisch durch providedIn: 'root' bereitgestellt)
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { CategoryService } from './services/category.service';
import { IngredientService } from './services/ingredient.service';
import { RecipeService } from './services/recipe.service';
import { MealPlanService } from './services/meal-plan.service';
import { ShoppingListService } from './services/shopping-list.service';

// Guards (werden automatisch durch providedIn: 'root' bereitgestellt)
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/auth.guard';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone Change Detection mit Event Coalescing für bessere Performance
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router mit Routes konfigurieren
    provideRouter(routes),
    
    // HTTP Client mit Interceptors
    provideHttpClient(
      withInterceptors([
        authInterceptor,    // Auth Token zu Requests hinzufügen
        errorInterceptor    // Globales Error Handling
      ])
    ),
    
    // Browser Animations für Material UI oder andere UI Libraries
    importProvidersFrom(BrowserAnimationsModule),
    
    // Services sind bereits durch @Injectable({ providedIn: 'root' }) verfügbar:
    // - AuthService
    // - UserService  
    // - CategoryService
    // - IngredientService
    // - RecipeService
    // - MealPlanService
    // - ShoppingListService
    
    // Guards sind bereits durch @Injectable({ providedIn: 'root' }) verfügbar:
    // - AuthGuard
    // - GuestGuard
    // - AdminGuard
  ]
};