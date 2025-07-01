// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiConstants } from '../utils/api.constants';
import { User, UserProfile, UserProfileUpdate } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {}

  /**
   * Aktuellen Benutzer abrufen
   * Entspricht: GET /api/users/users/me/
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(ApiConstants.USERS.ME);
  }

  /**
   * Benutzerprofil abrufen
   * Entspricht: GET /api/users/profiles/my_profile/
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(ApiConstants.USERS.PROFILE);
  }

  /**
   * Benutzerprofil aktualisieren
   * Entspricht: PATCH /api/users/profiles/my_profile/
   */
  updateUserProfile(profileData: UserProfileUpdate): Observable<UserProfile> {
    // Wenn ein File (Avatar) dabei ist, verwende FormData
    if (profileData.avatar && profileData.avatar instanceof File) {
      return this.updateProfileWithFile(profileData);
    }
    
    // Ansonsten normales JSON
    return this.http.patch<UserProfile>(ApiConstants.USERS.PROFILE, profileData);
  }

  /**
   * Profil mit Datei (Avatar) aktualisieren
   */
  private updateProfileWithFile(profileData: UserProfileUpdate): Observable<UserProfile> {
    const formData = new FormData();
    
    // Alle Felder zur FormData hinzufügen
    Object.keys(profileData).forEach(key => {
      const value = (profileData as any)[key];
      if (value !== undefined && value !== null) {
        if (key === 'avatar' && value instanceof File) {
          formData.append(key, value, value.name);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // FormData wird automatisch mit multipart/form-data gesendet
    return this.http.patch<UserProfile>(ApiConstants.USERS.PROFILE, formData);
  }

  /**
   * Avatar hochladen
   */
  uploadAvatar(file: File): Observable<UserProfile> {
    return this.updateUserProfile({ avatar: file });
  }

  /**
   * Avatar entfernen
   */
  removeAvatar(): Observable<UserProfile> {
    return this.updateUserProfile({ avatar: '' });
  }

  /**
   * Standard-Portionen aktualisieren
   */
  updateDefaultServings(servings: number): Observable<UserProfile> {
    return this.updateUserProfile({ default_servings: servings });
  }

  /**
   * Bio aktualisieren
   */
  updateBio(bio: string): Observable<UserProfile> {
    return this.updateUserProfile({ bio });
  }
}