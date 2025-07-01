// src/app/models/ingredient.model.ts

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  calories_per_100g?: number;
  created_at: string;
}

export interface IngredientCreate {
  name: string;
  unit: string;
  calories_per_100g?: number;
}

export interface IngredientUpdate {
  name?: string;
  unit?: string;
  calories_per_100g?: number;
}