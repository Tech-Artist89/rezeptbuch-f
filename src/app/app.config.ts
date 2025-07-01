// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

// Interceptors für HTTP-Requests
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * Hauptkonfiguration der Angular-Anwendung
 * 
 * Diese Konfiguration stellt alle notwendigen Provider und Services bereit:
 * - Router mit definierten Routen
 * - HTTP Client mit Auth- und Error-Interceptors
 * - Browser-Animationen für UI-Komponenten
 * - Zone Change Detection für optimierte Performance
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone Change Detection mit Event Coalescing für bessere Performance
    // Reduziert die Anzahl der Change Detection Cycles
    provideZoneChangeDetection({ 
      eventCoalescing: true 
    }),
    
    // Router-Konfiguration mit allen App-Routen
    provideRouter(routes),
    
    // HTTP Client mit konfigurierten Interceptors
    provideHttpClient(
      withInterceptors([
        authInterceptor,    // Fügt Auth-Token zu allen API-Requests hinzu
        errorInterceptor    // Globale Fehlerbehandlung für alle HTTP-Requests
      ])
    ),
    
    // Browser-Animationen für Material UI oder andere UI-Bibliotheken
    // Ermöglicht Animationen in Angular-Komponenten
    importProvidersFrom(BrowserAnimationsModule),
    
    /*
     * SERVICES UND GUARDS:
     * 
     * Die folgenden Services und Guards sind bereits automatisch verfügbar
     * durch @Injectable({ providedIn: 'root' }) und müssen hier nicht
     * explizit registriert werden:
     * 
     * AUTHENTICATION & USER SERVICES:
     * - AuthService          (Benutzer-Authentifizierung)
     * - UserService          (Benutzerprofil-Verwaltung)
     * 
     * RECIPE MANAGEMENT SERVICES:
     * - RecipeService        (Rezept-Verwaltung)
     * - CategoryService      (Kategorie-Verwaltung)
     * - IngredientService    (Zutaten-Verwaltung)
     * 
     * MEAL PLANNING SERVICES:
     * - MealPlanService      (Essensplanung)
     * - ShoppingListService  (Einkaufslisten-Verwaltung)
     * 
     * ROUTE GUARDS:
     * - AuthGuard           (Schutz für authentifizierte Routen)
     * - GuestGuard          (Nur für nicht-eingeloggte Benutzer)
     * - AdminGuard          (Admin-spezifische Routen)
     * 
     * Diese Services können direkt in Komponenten über Dependency Injection
     * verwendet werden, z.B.:
     * 
     * constructor(
     *   private authService: AuthService,
     *   private recipeService: RecipeService
     * ) {}
     */
  ]
};

/*
 * ZUSÄTZLICHE KONFIGURATIONSOPTIONEN:
 * 
 * Falls du später weitere Provider hinzufügen möchtest, kannst du sie hier ergänzen:
 * 
 * Beispiele für weitere Provider:
 * 
 * 1. Material UI (falls verwendet):
 *    importProvidersFrom(MatDialogModule, MatSnackBarModule, ...)
 * 
 * 2. State Management (NgRx):
 *    provideStore(reducers)
 *    provideEffects([...effects])
 * 
 * 3. Internationalization (i18n):
 *    importProvidersFrom(
 *      TranslateModule.forRoot({
 *        loader: {
 *          provide: TranslateLoader,
 *          useFactory: HttpLoaderFactory,
 *          deps: [HttpClient]
 *        }
 *      })
 *    )
 * 
 * 4. Service Worker (PWA):
 *    importProvidersFrom(ServiceWorkerModule.register('ngsw-worker.js'))
 * 
 * 5. Custom Error Handler:
 *    { provide: ErrorHandler, useClass: GlobalErrorHandler }
 */