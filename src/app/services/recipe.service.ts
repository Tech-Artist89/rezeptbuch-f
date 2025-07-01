// src/app/services/recipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    
    return this.http.get<RecipeList[]>(url);
  }

  /**
   * Rezept nach ID abrufen (Detail View)
   * Entspricht: GET /api/recipes/{id}/
   * Verwendet RecipeSerializer (vollständig)
   */
  getRecipe(id: number): Observable<Recipe> {
    return this.http.get<Recipe>(ApiConstants.RECIPES.BY_ID(id));
  }

  /**
   * Neues Rezept erstellen
   * Entspricht: POST /api/recipes/
   */
  createRecipe(recipeData: RecipeCreate): Observable<Recipe> {
    // Wenn ein Bild dabei ist, verwende FormData
    if (recipeData.image && recipeData.image instanceof File) {
      return this.createRecipeWithImage(recipeData);
    }
    
    // Ansonsten normales JSON
    return this.http.post<Recipe>(ApiConstants.RECIPES.BASE, recipeData);
  }

  /**
   * Rezept aktualisieren
   * Entspricht: PUT /api/recipes/{id}/
   */
  updateRecipe(id: number, recipeData: RecipeUpdate): Observable<Recipe> {
    // Wenn ein Bild dabei ist, verwende FormData
    if (recipeData.image && recipeData.image instanceof File) {
      return this.updateRecipeWithImage(id, recipeData);
    }
    
    // Ansonsten normales JSON
    return this.http.put<Recipe>(ApiConstants.RECIPES.BY_ID(id), recipeData);
  }

  /**
   * Rezept teilweise aktualisieren
   * Entspricht: PATCH /api/recipes/{id}/
   */
  patchRecipe(id: number, recipeData: Partial<RecipeUpdate>): Observable<Recipe> {
    // Wenn ein Bild dabei ist, verwende FormData
    if (recipeData.image && recipeData.image instanceof File) {
      return this.patchRecipeWithImage(id, recipeData);
    }
    
    // Ansonsten normales JSON
    return this.http.patch<Recipe>(ApiConstants.RECIPES.BY_ID(id), recipeData);
  }

  /**
   * Rezept löschen
   * Entspricht: DELETE /api/recipes/{id}/
   */
  deleteRecipe(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.RECIPES.BY_ID(id));
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
   * Rezept mit Bild erstellen
   */
  private createRecipeWithImage(recipeData: RecipeCreate): Observable<Recipe> {
    const formData = this.buildRecipeFormData(recipeData);
    return this.http.post<Recipe>(ApiConstants.RECIPES.BASE, formData);
  }

  /**
   * Rezept mit Bild aktualisieren (PUT)
   */
  private updateRecipeWithImage(id: number, recipeData: RecipeUpdate): Observable<Recipe> {
    const formData = this.buildRecipeFormData(recipeData);
    return this.http.put<Recipe>(ApiConstants.RECIPES.BY_ID(id), formData);
  }

  /**
   * Rezept mit Bild aktualisieren (PATCH)
   */
  private patchRecipeWithImage(id: number, recipeData: Partial<RecipeUpdate>): Observable<Recipe> {
    const formData = this.buildRecipeFormData(recipeData);
    return this.http.patch<Recipe>(ApiConstants.RECIPES.BY_ID(id), formData);
  }

  /**
   * FormData für Rezept mit Bild erstellen
   */
  private buildRecipeFormData(recipeData: any): FormData {
    const formData = new FormData();
    
    Object.keys(recipeData).forEach(key => {
      const value = recipeData[key];
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value, value.name);
        } else if (key === 'category_ids' && Array.isArray(value)) {
          // Array als JSON String senden
          value.forEach(id => formData.append('category_ids', id.toString()));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  }
}