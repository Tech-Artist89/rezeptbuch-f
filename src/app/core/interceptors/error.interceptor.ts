// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError, FormErrors } from '../../models/api-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let apiError: ApiError;
      
      switch (error.status) {
        case 400:
          // Bad Request - meist Validation Errors
          apiError = {
            error: 'Validation Error',
            message: 'Die eingegebenen Daten sind ungültig.',
            details: error.error,
            status: 400
          };
          break;
          
        case 401:
          // Unauthorized - Token ungültig oder abgelaufen
          apiError = {
            error: 'Unauthorized',
            message: 'Sie sind nicht angemeldet oder Ihre Sitzung ist abgelaufen.',
            status: 401
          };
          
          // Token aus localStorage entfernen
          localStorage.removeItem('auth_token');
          
          // Zur Login-Seite weiterleiten
          router.navigate(['/login']);
          break;
          
        case 403:
          // Forbidden - Keine Berechtigung
          apiError = {
            error: 'Forbidden',
            message: 'Sie haben keine Berechtigung für diese Aktion.',
            status: 403
          };
          break;
          
        case 404:
          // Not Found
          apiError = {
            error: 'Not Found',
            message: 'Die angeforderte Ressource wurde nicht gefunden.',
            status: 404
          };
          break;
          
        case 409:
          // Conflict - z.B. unique constraint violation
          apiError = {
            error: 'Conflict',
            message: 'Ein Konflikt ist aufgetreten. Möglicherweise existiert der Eintrag bereits.',
            details: error.error,
            status: 409
          };
          break;
          
        case 422:
          // Unprocessable Entity - Django REST Framework Validation
          apiError = {
            error: 'Validation Error',
            message: 'Die Validierung der Daten ist fehlgeschlagen.',
            details: error.error,
            status: 422
          };
          break;
          
        case 500:
          // Internal Server Error
          apiError = {
            error: 'Server Error',
            message: 'Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
            status: 500
          };
          break;
          
        case 0:
          // Network Error
          apiError = {
            error: 'Network Error',
            message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
            status: 0
          };
          break;
          
        default:
          // Unbekannter Fehler
          apiError = {
            error: 'Unknown Error',
            message: `Ein unbekannter Fehler ist aufgetreten. (Status: ${error.status})`,
            details: error.error,
            status: error.status
          };
      }
      
      // Fehler in der Konsole loggen (für Entwicklung)
      console.error('HTTP Error:', apiError);
      
      // Hier könntest du auch ein Notification Service aufrufen
      // z.B. this.notificationService.showError(apiError.message);
      
      return throwError(() => apiError);
    })
  );
};

// Helper Funktion um Django Validation Errors zu parsen
export function parseValidationErrors(errorDetails: any): FormErrors {
  const formErrors: FormErrors = {};
  
  if (errorDetails && typeof errorDetails === 'object') {
    Object.keys(errorDetails).forEach(field => {
      const fieldErrors = errorDetails[field];
      if (Array.isArray(fieldErrors)) {
        formErrors[field] = fieldErrors;
      } else if (typeof fieldErrors === 'string') {
        formErrors[field] = [fieldErrors];
      }
    });
  }
  
  return formErrors;
}