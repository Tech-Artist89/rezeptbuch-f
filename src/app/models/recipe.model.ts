// src/app/models/recipe.model.ts
import { Category } from './category.model';
import { Ingredient } from './ingredient.model';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface RecipeIngredient {
  id: number;
  ingredient: {
    id: number;
    name: string;
    unit: string;
    calories_per_100g?: number;
    created_at: string;
  };
  amount: number;
  unit: string;
  notes: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  instructions: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  difficulty: DifficultyLevel;
  author: string;
  categories: Category[]; // Array von Category-Objekten, nicht nur IDs
  recipe_ingredients: RecipeIngredient[]; // Array mit nested ingredient objects
  image?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeList {
  id: number;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  difficulty: DifficultyLevel;
  author: string;
  categories: Category[];
  image?: string;
  is_public: boolean;
  created_at: string;
}

export interface RecipeCreate {
  title: string;
  description: string;
  instructions: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: DifficultyLevel;
  category_ids?: number[];
  image?: File | string;
  is_public?: boolean;
}

export interface RecipeUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: DifficultyLevel;
  category_ids?: number[];
  image?: File | string;
  is_public?: boolean;
}

export interface RecipeIngredientCreate {
  ingredient_id: number;
  amount: number;
  unit: string;
  notes?: string;
}