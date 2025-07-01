// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirect von root zur Login-Seite
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // AUTHENTIFIZIERUNG (für nicht-eingeloggte Benutzer)
  {
    path: 'login',
    loadComponent: () => import('./components/users/user-login/user-login/user-login.component')
      .then(c => c.UserLoginComponent),
    canActivate: [GuestGuard], // Nur für nicht-eingeloggte Benutzer
    title: 'Anmelden - Rezeptbuch'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/users/user-registrierung/user-registrierung/user-registrierung.component')
      .then(c => c.UserRegistrierungComponent),
    canActivate: [GuestGuard], // Nur für nicht-eingeloggte Benutzer
    title: 'Registrieren - Rezeptbuch'
  },

  // HAUPTANWENDUNG (nur für eingeloggte Benutzer)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard/dashboard.component')
      .then(c => c.DashboardComponent),
    canActivate: [AuthGuard],
    title: 'Dashboard - Rezeptbuch'
  },

  // REZEPTE
  {
    path: 'recipes',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/recipes/recipes-list/recipes-list/recipes-list.component')
          .then(c => c.RecipesListComponent),
        title: 'Rezepte - Rezeptbuch'
      },
      {
        path: 'new',
        loadComponent: () => import('./components/recipes/recipes-form/recipes-form/recipes-form.component')
          .then(c => c.RecipesFormComponent),
        title: 'Neues Rezept - Rezeptbuch'
      },
      {
        path: ':id',
        loadComponent: () => import('./components/recipes/recipes-detail/recipes-detail/recipes-detail.component')
          .then(c => c.RecipesDetailComponent),
        title: 'Rezept Details - Rezeptbuch'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/recipes/recipes-form/recipes-form/recipes-form.component')
          .then(c => c.RecipesFormComponent),
        title: 'Rezept bearbeiten - Rezeptbuch'
      }
    ]
  },

  // ZUTATEN
  {
    path: 'ingredients',
    loadComponent: () => import('./components/ingredients/ingredients/ingredients.component')
      .then(c => c.IngredientsComponent),
    canActivate: [AuthGuard],
    title: 'Zutaten - Rezeptbuch'
  },

  // KATEGORIEN
  {
    path: 'categories',
    loadComponent: () => import('./components/categories/categories/categories.component')
      .then(c => c.CategoriesComponent),
    canActivate: [AuthGuard],
    title: 'Kategorien - Rezeptbuch'
  },

  // MEAL PLANNER
  {
    path: 'planner',
    loadComponent: () => import('./components/planner/planner/planner.component')
      .then(c => c.PlannerComponent),
    canActivate: [AuthGuard],
    title: 'Wochenplaner - Rezeptbuch'
  },

  // EINKAUFSLISTEN
  {
    path: 'shopping',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/shopping/shopping-list/shopping-list/shopping-list.component')
          .then(c => c.ShoppingListComponent),
        title: 'Einkaufslisten - Rezeptbuch'
      },
      {
        path: 'new',
        loadComponent: () => import('./components/shopping/shopping-form/shopping-form/shopping-form.component')
          .then(c => c.ShoppingFormComponent),
        title: 'Neue Einkaufsliste - Rezeptbuch'
      },
      {
        path: ':id',
        loadComponent: () => import('./components/shopping/shopping-detil/shopping-detail/shopping-detail.component')
          .then(c => c.ShoppingDetailComponent),
        title: 'Einkaufsliste Details - Rezeptbuch'
      }
    ]
  },

  // FEHLERSEITEN
  {
    path: '404',
    loadComponent: () => import('./shared/error-pages/not-found/not-found.component')
      .then(c => c.NotFoundComponent),
    title: 'Seite nicht gefunden - Rezeptbuch'
  },
  {
    path: '403',
    loadComponent: () => import('./shared/error-pages/forbidden/forbidden.component')
      .then(c => c.ForbiddenComponent),
    title: 'Zugriff verweigert - Rezeptbuch'
  },

  // WILDCARD ROUTE (muss am Ende stehen!)
  {
    path: '**',
    redirectTo: '/404'
  }
];