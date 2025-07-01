// src/app/core/interceptors/auth.interceptor.ts - KORRIGIERTE VERSION
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Hole Auth Token aus localStorage
  const token = localStorage.getItem('auth_token');
  
  // URLs die keine Authentifizierung benötigen
  const publicUrls = [
    '/auth-token/',      // Django Token Auth Endpoint
    '/auth/login/',      // Falls du custom Login-Endpoint hast
    '/auth/register/',   // Registrierung
    '/auth/refresh/'     // Token Refresh
  ];
  
  // Prüfe ob die URL öffentlich ist
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  // DEBUG: Entferne diese Logs später
  console.log('Auth Interceptor:', {
    url: req.url,
    hasToken: !!token,
    isPublicUrl,
    token: token ? token.substring(0, 10) + '...' : null
  });
  
  // Wenn Token vorhanden und nicht öffentliche URL, füge Authorization Header hinzu
  if (token && !isPublicUrl) {
    console.log('Adding auth header: Token ' + token);
    
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return next(authReq);
  }
  
  // Für öffentliche URLs oder wenn kein Token vorhanden
  return next(req);
};