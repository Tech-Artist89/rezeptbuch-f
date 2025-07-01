// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild,
  CanLoad,
  Router, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Route aktivieren - prüft ob Benutzer eingeloggt ist
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  /**
   * Child Route aktivieren
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(childRoute, state);
  }

  /**
   * Lazy Loading Module laden
   */
  canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth();
  }

  /**
   * Zentrale Auth-Prüfung
   */
  private checkAuth(redirectUrl?: string): Observable<boolean> {
    // Wenn bereits eingeloggt, direkt erlauben
    if (this.authService.isLoggedIn()) {
      // Zusätzlich aktuellen User validieren
      return this.authService.getCurrentUser().pipe(
        map(() => true),
        catchError(() => {
          // User konnte nicht geladen werden (z.B. ungültiger Token)
          this.handleUnauthorized(redirectUrl);
          return of(false);
        })
      );
    }

    // Nicht eingeloggt
    this.handleUnauthorized(redirectUrl);
    return of(false);
  }

  /**
   * Nicht autorisiert - zur Login-Seite weiterleiten
   */
  private handleUnauthorized(redirectUrl?: string): void {
    // Aktuelle URL speichern für Redirect nach Login
    if (redirectUrl) {
      localStorage.setItem('auth_redirect_url', redirectUrl);
    }

    // Zur Login-Seite weiterleiten
    this.router.navigate(['/login']);
  }
}

/**
 * Guest Guard - nur für nicht eingeloggte Benutzer
 * Für Login/Register Seiten
 */
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isLoggedIn()) {
      // Bereits eingeloggt - zur Dashboard weiterleiten
      this.router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  }
}

/**
 * Admin Guard - nur für Admin-Benutzer
 * Falls du später Admin-Funktionen brauchst
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const currentUser = this.authService.getCurrentUserValue();
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    // Hier könntest du prüfen ob User Admin ist
    // z.B. if (currentUser.is_staff || currentUser.is_superuser)
    // Da dein User Model das nicht hat, einfach true zurückgeben
    return true;
  }
}