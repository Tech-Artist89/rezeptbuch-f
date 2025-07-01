// src/app/services/auth.service.ts - KORRIGIERTE VERSION
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { User } from '../models/user.model';
import { ApiError } from '../models/api-response.model';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // ENTFERNT: validateTokenOnInit() - das verursacht den 403 Error beim Start!
    // Token-Validierung passiert nur bei tatsächlicher API-Nutzung
  }

  /**
   * Benutzer einloggen - FIX: Verwende Django's Standard Auth-Endpoints
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Django DRF Standard-Endpoint für Token Authentication
    return this.http.post<{ token: string }>(`${environment.apiUrl}/auth-token/`, credentials)
      .pipe(
        map(response => {
          // Simuliere User-Objekt - in echter Implementierung würde das Backend auch User-Daten zurückgeben
          const user: User = {
            id: 0, // Wird später durch getCurrentUser() ersetzt
            username: credentials.username,
            email: '',
            first_name: '',
            last_name: '',
            date_joined: new Date().toISOString()
          };
          
          return {
            token: response.token,
            user: user
          };
        }),
        tap(response => {
          this.setSession(response.token, response.user);
          // Nach Login aktuelle Benutzerdaten laden
          this.getCurrentUser().subscribe();
        }),
        catchError(this.handleAuthError)
      );
  }

  /**
   * Benutzer registrieren
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register/`, userData)
      .pipe(
        tap(response => {
          this.setSession(response.token, response.user);
        }),
        catchError(this.handleAuthError)
      );
  }

  /**
   * Benutzer ausloggen
   */
  logout(): void {
    // Optional: Backend über Logout informieren (falls Endpoint existiert)
    // this.http.post(`${environment.apiUrl}/auth/logout/`, {}).subscribe();
    
    this.clearSession();
  }

  /**
   * Aktueller Benutzer abrufen (vom Backend)
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}${environment.endpoints.userMe}`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user);
        }),
        catchError(error => {
          if (error.status === 401 || error.status === 403) {
            this.clearSession();
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Prüfe ob Benutzer eingeloggt ist
   */
  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  /**
   * Token abrufen
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Aktueller Benutzer (aus Cache)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Session setzen
   */
  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Session löschen
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    this.router.navigate(['/login']);
  }

  /**
   * Prüfe ob gültiger Token vorhanden
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token;
  }

  /**
   * Benutzer aus localStorage laden
   */
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        localStorage.removeItem(this.USER_KEY);
      }
    }
    return null;
  }

  /**
   * Benutzer in localStorage speichern
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Auth-Fehler behandeln
   */
  private handleAuthError = (error: any): Observable<never> => {
    let apiError: ApiError;
    
    if (error.status === 400 || error.status === 401) {
      apiError = {
        error: 'Authentication Failed',
        message: 'Benutzername oder Passwort ist falsch.',
        status: error.status,
        details: error.error
      };
    } else {
      apiError = {
        error: 'Authentication Error',
        message: 'Ein Fehler ist bei der Anmeldung aufgetreten.',
        status: error.status,
        details: error.error
      };
    }
    
    return throwError(() => apiError);
  };
}