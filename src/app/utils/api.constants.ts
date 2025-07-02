// src/app/utils/api.constants.ts - KORRIGIERT
import { environment } from '../environments/environment';

export class ApiConstants {
  private static readonly BASE_URL = environment.apiUrl;

  // Users API Endpoints
  static readonly USERS = {
    BASE: `${this.BASE_URL}${environment.endpoints.users}`,
    ME: `${this.BASE_URL}${environment.endpoints.userMe}`,
    PROFILE: `${this.BASE_URL}${environment.endpoints.userProfile}`,
  };

  // Categories API Endpoints
  static readonly CATEGORIES = {
    BASE: `${this.BASE_URL}${environment.endpoints.categories}`,
    BY_ID: (id: number) => `${this.BASE_URL}${environment.endpoints.categories}${id}/`, // <- SLASH HINZUGEFÜGT
  };

  // Ingredients API Endpoints
  static readonly INGREDIENTS = {
    BASE: `${this.BASE_URL}${environment.endpoints.ingredients}`,
    BY_ID: (id: number) => `${this.BASE_URL}${environment.endpoints.ingredients}${id}/`, // <- SLASH HINZUGEFÜGT
  };

  // Recipes API Endpoints
  static readonly RECIPES = {
    BASE: `${this.BASE_URL}${environment.endpoints.recipes}`,
    BY_ID: (id: number) => `${this.BASE_URL}${environment.endpoints.recipes}${id}/`, // <- SLASH HINZUGEFÜGT
  };

  // Meal Plans API Endpoints
  static readonly MEAL_PLANS = {
    BASE: `${this.BASE_URL}${environment.endpoints.mealPlans}`,
    BY_ID: (id: number) => `${this.BASE_URL}${environment.endpoints.mealPlans}${id}/`, // <- SLASH HINZUGEFÜGT
    CURRENT_WEEK: `${this.BASE_URL}${environment.endpoints.mealPlansCurrentWeek}`,
    WEEK: `${this.BASE_URL}${environment.endpoints.mealPlansWeek}`,
  };

  // Shopping Lists API Endpoints
  static readonly SHOPPING = {
    LISTS: {
      BASE: `${this.BASE_URL}${environment.endpoints.shoppingLists}`,
      BY_ID: (id: number) => `${this.BASE_URL}${environment.endpoints.shoppingLists}${id}/`, // <- SLASH HINZUGEFÜGT
      GENERATE_FROM_MEAL_PLANS: (id: number) => `${this.BASE_URL}${environment.endpoints.generateShoppingList(id)}`,
    },
    ITEMS: {
      BASE: `${this.BASE_URL}${environment.endpoints.shoppingListItems}`,
      BY_ID: (id: number) => `${this.BASE_URL}${environment.endpoints.shoppingListItems}${id}/`, // <- SLASH HINZUGEFÜGT
      TOGGLE_PURCHASED: (id: number) => `${this.BASE_URL}${environment.endpoints.togglePurchased(id)}`,
    },
  };

  // HTTP Methods
  static readonly HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
  } as const;

  // Content Types
  static readonly CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
  } as const;

  // Query Parameters Helper
  static buildQueryParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // URL Builder Helper
  static buildUrl(baseUrl: string, params?: Record<string, any>): string {
    if (!params) return baseUrl;
    return `${baseUrl}${this.buildQueryParams(params)}`;
  }
}