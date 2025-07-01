// src/app/components/users/user-login/user-login/user-login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss'
})
export class UserLoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  debugMode = true; // Für Entwicklung auf true setzen
  hasToken = false;
  currentUser: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Debug: Prüfe aktuellen Auth-Status
    this.hasToken = !!this.authService.getToken();
    this.currentUser = this.authService.getCurrentUserValue();
    
    console.log('Login Component geladen:');
    console.log('- Hat Token:', this.hasToken);
    console.log('- Current User:', this.currentUser);
    console.log('- Ist eingeloggt:', this.authService.isLoggedIn());
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const credentials = this.loginForm.value;
      console.log('Login-Versuch mit:', { username: credentials.username, password: '***' });

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login erfolgreich:', response);
          this.isLoading = false;
          
          // Weiterleitung zum Dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login-Fehler:', error);
          this.isLoading = false;
          
          // Benutzerfreundliche Fehlermeldung
          if (error.status === 400 || error.status === 401) {
            this.errorMessage = 'Benutzername oder Passwort ist falsch.';
          } else {
            this.errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
          }
        }
      });
    } else {
      // Markiere alle Felder als berührt um Validierungsfehler anzuzeigen
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}