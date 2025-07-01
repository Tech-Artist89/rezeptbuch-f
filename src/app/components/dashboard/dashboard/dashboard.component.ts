// src/app/components/dashboard/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  isLoggedIn = false;
  token: string | null = null;
  debugMode = true; // Für Entwicklung auf true setzen

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Aktuelle Benutzerinformationen laden
    this.currentUser = this.authService.getCurrentUserValue();
    this.isLoggedIn = this.authService.isLoggedIn();
    this.token = this.authService.getToken();

    console.log('Dashboard geladen:');
    console.log('- Current User:', this.currentUser);
    console.log('- Ist eingeloggt:', this.isLoggedIn);
    console.log('- Token:', this.token ? this.token.substring(0, 20) + '...' : 'Nicht vorhanden');

    // Falls der Benutzer nicht eingeloggt ist, zur Login-Seite weiterleiten
    if (!this.isLoggedIn) {
      console.log('Benutzer nicht eingeloggt, leite zu Login weiter');
      this.router.navigate(['/login']);
      return;
    }

    // Versuche aktuelle Benutzerdaten vom Server zu laden
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Benutzer vom Server geladen:', user);
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        // Bei Fehlern (z.B. ungültiger Token) automatisch abmelden
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
      }
    });
  }

  logout() {
    console.log('Logout durchgeführt');
    this.authService.logout();
    // Der AuthService leitet automatisch zur Login-Seite weiter
  }
}