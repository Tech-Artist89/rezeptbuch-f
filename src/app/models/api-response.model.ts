// src/app/models/api-response.model.ts

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  status?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string[];
}