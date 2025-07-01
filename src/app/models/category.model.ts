// src/app/models/category.model.ts

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
}