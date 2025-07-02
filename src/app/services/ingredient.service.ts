// src/app/services/ingredient.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, expand, reduce, catchError } from 'rxjs/operators';
import { ApiConstants } from '../utils/api.constants';
import { Ingredient, IngredientCreate, IngredientUpdate } from '../models/ingredient.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class IngredientService {

  constructor(private http: HttpClient) {}

  /**
   * Alle Zutaten abrufen (mit automatischer Paginierung)
   * Entspricht: GET /api/ingredients/ (alle Seiten)
   */
  getIngredients(): Observable<Ingredient[]> {
    return this.getAllIngredientsPaginated();
  }

  /**
   * NEUE METHODE: Alle Zutaten mit Paginierung laden
   */
  private getAllIngredientsPaginated(): Observable<Ingredient[]> {
    return this.http.get<PaginatedResponse<Ingredient>>(ApiConstants.INGREDIENTS.BASE).pipe(
      expand((response: PaginatedResponse<Ingredient>) => {
        // Wenn es eine nächste Seite gibt, lade sie
        if (response.next) {
          return this.http.get<PaginatedResponse<Ingredient>>(response.next);
        } else {
          // Keine weitere Seite, beende die Expansion
          return of();
        }
      }),
      // Sammle alle results Arrays
      map((response: PaginatedResponse<Ingredient>) => response.results),
      // Reduziere alle Arrays zu einem einzigen Array
      reduce((acc: Ingredient[], current: Ingredient[]) => [...acc, ...current], []),
      catchError(error => {
        console.error('Error loading paginated ingredients:', error);
        return of([]); // Leeres Array zurückgeben bei Fehlern
      })
    );
  }

  /**
   * Alternative Methode: Alle Zutaten mit expliziter Seitengröße
   */
  getAllIngredientsWithLimit(): Observable<Ingredient[]> {
    // Erste Anfrage um zu sehen wie viele Zutaten es gibt
    return this.http.get<PaginatedResponse<Ingredient>>(
      ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { page_size: 1 })
    ).pipe(
      map(response => response.count),
      // Dann alle Zutaten mit der maximalen Seitengröße laden
      map(totalCount => Math.min(totalCount, 1000)), // Maximal 1000 pro Anfrage
      map(pageSize => 
        this.http.get<PaginatedResponse<Ingredient>>(
          ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { page_size: pageSize })
        )
      ),
      // Flache die Observable-Struktur ab
      map(observable => observable),
      // Führe die HTTP-Anfrage aus
      expand(obs => obs),
      map((response: PaginatedResponse<Ingredient>) => response.results),
      catchError(error => {
        console.error('Error loading ingredients with limit:', error);
        return of([]);
      })
    );
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
    return this.http.get<PaginatedResponse<Ingredient>>(url).pipe(
      map(response => response.results)
    );
  }

  /**
   * Zutaten nach Einheit filtern
   */
  getIngredientsByUnit(unit: string): Observable<Ingredient[]> {
    const url = ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { 
      unit: unit 
    });
    return this.http.get<PaginatedResponse<Ingredient>>(url).pipe(
      map(response => response.results)
    );
  }

  /**
   * Zutaten mit Kalorienangaben abrufen
   */
  getIngredientsWithCalories(): Observable<Ingredient[]> {
    const url = ApiConstants.buildUrl(ApiConstants.INGREDIENTS.BASE, { 
      has_calories: true 
    });
    return this.http.get<PaginatedResponse<Ingredient>>(url).pipe(
      map(response => response.results)
    );
  }
}