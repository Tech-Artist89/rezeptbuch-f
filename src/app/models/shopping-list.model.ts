// src/app/models/shopping-list.model.ts
import { Ingredient } from './ingredient.model';

export interface ShoppingListItem {
  id: number;
  ingredient: Ingredient;
  ingredient_id: number;
  amount: number;
  unit: string;
  is_purchased: boolean;
  notes: string;
}

export interface ShoppingList {
  id: number;
  user: string;
  name: string;
  start_date: string; // YYYY-MM-DD Format
  end_date: string; // YYYY-MM-DD Format
  is_completed: boolean;
  items: ShoppingListItem[];
  total_items: number;
  purchased_items: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListCreate {
  name: string;
  start_date: string; // YYYY-MM-DD Format
  end_date: string; // YYYY-MM-DD Format
}

export interface ShoppingListUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_completed?: boolean;
}

export interface ShoppingListItemCreate {
  ingredient_id: number;
  amount: number;
  unit: string;
  notes?: string;
}

export interface ShoppingListItemUpdate {
  amount?: number;
  unit?: string;
  is_purchased?: boolean;
  notes?: string;
}

export interface GenerateShoppingListResponse {
  message: string;
  items_count: number;
}