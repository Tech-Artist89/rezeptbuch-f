// src/app/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstants } from '../utils/api.constants';
import { Category, CategoryCreate, CategoryUpdate } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {}

  /**
   * Alle Kategorien abrufen
   * Entspricht: GET /api/categories/
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(ApiConstants.CATEGORIES.BASE);
  }

  /**
   * Kategorie nach ID abrufen
   * Entspricht: GET /api/categories/{id}/
   */
  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(ApiConstants.CATEGORIES.BY_ID(id));
  }

  /**
   * Neue Kategorie erstellen
   * Entspricht: POST /api/categories/
   */
  createCategory(categoryData: CategoryCreate): Observable<Category> {
    return this.http.post<Category>(ApiConstants.CATEGORIES.BASE, categoryData);
  }

  /**
   * Kategorie aktualisieren
   * Entspricht: PUT /api/categories/{id}/
   */
  updateCategory(id: number, categoryData: CategoryUpdate): Observable<Category> {
    return this.http.put<Category>(ApiConstants.CATEGORIES.BY_ID(id), categoryData);
  }

  /**
   * Kategorie teilweise aktualisieren
   * Entspricht: PATCH /api/categories/{id}/
   */
  patchCategory(id: number, categoryData: Partial<CategoryUpdate>): Observable<Category> {
    return this.http.patch<Category>(ApiConstants.CATEGORIES.BY_ID(id), categoryData);
  }

  /**
   * Kategorie löschen
   * Entspricht: DELETE /api/categories/{id}/
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.CATEGORIES.BY_ID(id));
  }

  /**
   * Kategorien nach Name suchen
   */
  searchCategories(searchTerm: string): Observable<Category[]> {
    const url = ApiConstants.buildUrl(ApiConstants.CATEGORIES.BASE, { 
      search: searchTerm 
    });
    return this.http.get<Category[]>(url);
  }
}