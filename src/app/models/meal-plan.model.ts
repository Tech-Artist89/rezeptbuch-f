// src/app/models/meal-plan.model.ts
import { RecipeList } from './recipe.model';

export type MealType = 'lunch' | 'dinner';

export interface MealPlan {
  id: number;
  user: string;
  recipe: RecipeList;
  recipe_id: number;
  date: string; // YYYY-MM-DD Format
  meal_type: MealType;
  meal_type_display: string;
  servings: number;
  notes: string;
  created_at: string;
}

export interface MealPlanCreate {
  recipe: number;
  date: string; // YYYY-MM-DD Format
  meal_type: MealType;
  servings: number;
  notes?: string;
}

export interface MealPlanUpdate {
  recipe?: number;
  date?: string;
  meal_type?: MealType;
  servings?: number;
  notes?: string;
}