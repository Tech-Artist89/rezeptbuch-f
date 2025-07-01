// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Hole Auth Token aus localStorage (später über AuthService)
  const token = localStorage.getItem('auth_token');
  
  // URLs die keine Authentifizierung benötigen
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh'
  ];
  
  // Prüfe ob die URL öffentlich ist
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  // Wenn Token vorhanden und nicht öffentliche URL, füge Authorization Header hinzu
  if (token && !isPublicUrl) {
    // Für Django mit Token Authentication verwenden wir "Token" prefix
    // Falls du JWT verwendest, ändere zu "Bearer"
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return next(authReq);
  }
  
  // Für öffentliche URLs oder wenn kein Token vorhanden
  const publicReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json'
    }
  });
  
  return next(publicReq);
};