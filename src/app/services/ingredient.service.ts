// src/app/services/ingredient.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstants } from '../utils/api.constants';
import { Ingredient, IngredientCreate, IngredientUpdate } from '../models/ingredient.model';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {

  constructor(private http: HttpClient) {}

  /**
   * Alle Zutaten abrufen
   * Entspricht: GET /api/ingredients/
   */
  getIngredients(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(ApiConstants.INGREDIENTS.BASE);
  }

  /**
   * Zutat nach ID abrufen
   * Entspricht: GET /api/ingredients/{id}/
   */
  getIngredient(id: number): Observable<Ingredient> {
    return this.http.get<Ingredient>(ApiConstants.INGREDIENTS.BY_ID(id));
  }

  /**
   * Neue Zutat erstellen
   * Entspricht: POST /api/ingredients/
   */
  createIngredient(ingredientData: IngredientCreate): Observable<Ingredient> {
    return this.http.post<Ingredient>(ApiConstants.INGREDIENTS.BASE, ingredientData);
  }

  /**
   * Zutat aktualisieren
   * Entspricht: PUT /api/ingredients/{id}/
   */
  updateIngredient(id: number, ingredientData: IngredientUpdate): Observable<Ingredient> {
    return this.http.put<Ingredient>(ApiConstants.INGREDIENTS.BY_ID(id), ingredientData);
  }

  /**
   * Zutat teilweise aktualisieren
   * Entspricht: PATCH /api/ingredients/{id}/
   */
  patchIngredient(id: number, ingredientData: Partial<IngredientUpdate>): Observable<Ingredient> {
    return this.http.patch<Ingredient>(ApiConstants.INGREDIENTS.BY_ID(id), ingredientData);
  }

  /**
   * Zutat löschen
   * Entspricht: DELETE /api/ingredients/{id}/
   */
  deleteIngredient(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.INGREDIENTS.BY_ID(id));
  }

  /**
   * Zutaten nach Name suchen
   */
  searchIngredients(searchTerm: string): Observable<Ingredient[]> {
    const url = ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { 
      search: searchTerm 
    });
    return this.http.get<Ingredient[]>(url);
  }

  /**
   * Zutaten nach Einheit filtern
   */
  getIngredientsByUnit(unit: string): Observable<Ingredient[]> {
    const url = ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { 
      unit: unit 
    });
    return this.http.get<Ingredient[]>(url);
  }

  /**
   * Zutaten mit Kalorienangaben abrufen
   */
  getIngredientsWithCalories(): Observable<Ingredient[]> {
    const url = ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { 
      has_calories: true 
    });
    return this.http.get<Ingredient[]>(url);
  }
}