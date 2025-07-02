// src/app/services/recipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiConstants } from '../utils/api.constants';
import { 
  Recipe, 
  RecipeList, 
  RecipeCreate, 
  RecipeUpdate, 
  DifficultyLevel 
} from '../models/recipe.model';

export interface RecipeFilters {
  search?: string;
  category?: number;
  difficulty?: DifficultyLevel;
  author?: string;
  is_public?: boolean;
  prep_time_max?: number;
  cook_time_max?: number;
  servings?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  constructor(private http: HttpClient) {}

  /**
   * Alle Rezepte abrufen (List View)
   * Entspricht: GET /api/recipes/
   * Verwendet RecipeListSerializer
   */
  getRecipes(filters?: RecipeFilters): Observable<RecipeList[]> {
    const url = filters ? 
      ApiConstants.buildUrl(ApiConstants.RECIPES.BASE, filters) : 
      ApiConstants.RECIPES.BASE;
    
    console.log('🔍 Recipe Service - API Call URL:', url);
    console.log('🔍 Recipe Service - Filters:', filters);
    
    return this.http.get<any>(url).pipe(
      tap((response: any) => {
        console.log('🔍 Recipe Service - Full Response:', response);
        console.log('🔍 Recipe Service - Results Array:', response.results);
        console.log('🔍 Recipe Service - Count:', response.count);
      }),
      map((response: any) => response.results || response),
      catchError((error: any) => {
        console.error('❌ Recipe Service - Error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Rezept nach ID abrufen (Detail View)
   * Entspricht: GET /api/recipes/{id}/
   * Verwendet RecipeSerializer (vollständig)
   */
  getRecipe(id: number): Observable<Recipe> {
    // CRITICAL FIX: Ensure URL ends with slash
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BY_ID(id));
    console.log('📖 Getting recipe with URL:', url);
    return this.http.get<Recipe>(url);
  }

  /**
   * Neues Rezept erstellen
   * Entspricht: POST /api/recipes/
   */
  createRecipe(recipeData: RecipeCreate): Observable<Recipe> {
    console.log('🔄 Creating recipe with data:', recipeData);
    
    // Wenn ein Bild dabei ist, verwende FormData
    if (recipeData.image && recipeData.image instanceof File) {
      return this.createRecipeWithImage(recipeData);
    }
    
    // Ansonsten normales JSON
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BASE);
    return this.http.post<Recipe>(url, recipeData);
  }

  /**
   * Rezept aktualisieren
   * Entspricht: PUT /api/recipes/{id}/
   */
  updateRecipe(id: number, recipeData: RecipeUpdate): Observable<Recipe> {
    console.log('🔄 RecipeService.updateRecipe called with:', { id, recipeData });
    
    // CRITICAL FIX: Ensure URL ends with slash
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BY_ID(id));
    console.log('📤 Final URL:', url);
    
    // Wenn ein Bild dabei ist, verwende FormData
    if (recipeData.image && recipeData.image instanceof File) {
      return this.updateRecipeWithImage(id, recipeData);
    }
    
    // Ansonsten normales JSON
    console.log('📤 Sending as JSON:', recipeData);
    return this.http.put<Recipe>(url, recipeData);
  }

  /**
   * Rezept teilweise aktualisieren
   * Entspricht: PATCH /api/recipes/{id}/
   */
  patchRecipe(id: number, recipeData: Partial<RecipeUpdate>): Observable<Recipe> {
    // CRITICAL FIX: Ensure URL ends with slash
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BY_ID(id));
    
    // Wenn ein Bild dabei ist, verwende FormData
    if (recipeData.image && recipeData.image instanceof File) {
      return this.patchRecipeWithImage(id, recipeData);
    }
    
    // Ansonsten normales JSON
    return this.http.patch<Recipe>(url, recipeData);
  }

  /**
   * Rezept löschen
   * Entspricht: DELETE /api/recipes/{id}/
   */
  deleteRecipe(id: number): Observable<void> {
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BY_ID(id));
    return this.http.delete<void>(url);
  }

  /**
   * Meine Rezepte abrufen
   */
  getMyRecipes(): Observable<RecipeList[]> {
    return this.getRecipes({ author: 'me' });
  }

  /**
   * Öffentliche Rezepte abrufen
   */
  getPublicRecipes(): Observable<RecipeList[]> {
    return this.getRecipes({ is_public: true });
  }

  /**
   * Rezepte nach Kategorie abrufen
   */
  getRecipesByCategory(categoryId: number): Observable<RecipeList[]> {
    return this.getRecipes({ category: categoryId });
  }

  /**
   * Rezepte nach Schwierigkeit abrufen
   */
  getRecipesByDifficulty(difficulty: DifficultyLevel): Observable<RecipeList[]> {
    return this.getRecipes({ difficulty });
  }

  /**
   * Rezepte suchen
   */
  searchRecipes(searchTerm: string): Observable<RecipeList[]> {
    return this.getRecipes({ search: searchTerm });
  }

  /**
   * Schnelle Rezepte (max. 30 Min total)
   */
  getQuickRecipes(): Observable<RecipeList[]> {
    return this.getRecipes({ prep_time_max: 30, cook_time_max: 30 });
  }

  /**
   * Helper: URL mit Slash sicherstellen
   */
  private ensureTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : `${url}/`;
  }

  /**
   * Rezept mit Bild erstellen
   */
  private createRecipeWithImage(recipeData: RecipeCreate): Observable<Recipe> {
    const formData = this.buildRecipeFormData(recipeData);
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BASE);
    console.log('📤 Creating recipe with image using FormData');
    return this.http.post<Recipe>(url, formData);
  }

  /**
   * Rezept mit Bild aktualisieren (PUT)
   */
  private updateRecipeWithImage(id: number, recipeData: RecipeUpdate): Observable<Recipe> {
    const formData = this.buildRecipeFormData(recipeData);
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BY_ID(id));
    console.log('📤 Updating recipe with image using FormData');
    return this.http.put<Recipe>(url, formData);
  }

  /**
   * Rezept mit Bild aktualisieren (PATCH)
   */
  private patchRecipeWithImage(id: number, recipeData: Partial<RecipeUpdate>): Observable<Recipe> {
    const formData = this.buildRecipeFormData(recipeData);
    const url = this.ensureTrailingSlash(ApiConstants.RECIPES.BY_ID(id));
    return this.http.patch<Recipe>(url, formData);
  }

  /**
   * FormData für Rezept mit Bild erstellen
   */
  private buildRecipeFormData(recipeData: any): FormData {
    const formData = new FormData();
    
    console.log('🔄 Building FormData from recipe data:', recipeData);
    
    Object.keys(recipeData).forEach(key => {
      const value = recipeData[key];
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value, value.name);
          console.log('📎 Added image file to FormData');
        } else if (key === 'category_ids' && Array.isArray(value)) {
          // Array als JSON String senden
          formData.append('category_ids', JSON.stringify(value));
          console.log('📋 Added category_ids as JSON:', JSON.stringify(value));
        } else if (key === 'recipe_ingredients' && Array.isArray(value)) {
          // CRITICAL FIX: recipe_ingredients als JSON String senden
          formData.append('recipe_ingredients', JSON.stringify(value));
          console.log('🥕 Added recipe_ingredients as JSON:', JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
          console.log(`📝 Added ${key}:`, value.toString());
        }
      }
    });

    // Debug: Log all FormData entries
    console.log('📤 Final FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    return formData;
  }
}