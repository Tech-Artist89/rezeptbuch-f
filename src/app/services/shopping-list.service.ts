// src/app/services/shopping-list.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstants } from '../utils/api.constants';
import { 
  ShoppingList, 
  ShoppingListCreate, 
  ShoppingListUpdate,
  ShoppingListItem,
  ShoppingListItemCreate,
  ShoppingListItemUpdate,
  GenerateShoppingListResponse 
} from '../models/shopping-list.model';

export interface ShoppingListFilters {
  is_completed?: boolean;
  start_date?: string;
  end_date?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface ShoppingListItemFilters {
  shopping_list?: number;
  is_purchased?: boolean;
  ingredient?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  constructor(private http: HttpClient) {}

  // ===== SHOPPING LISTS =====

  /**
   * Alle Shopping Lists abrufen
   * Entspricht: GET /api/shopping/lists/
   */
  getShoppingLists(filters?: ShoppingListFilters): Observable<ShoppingList[]> {
    let params: any = {};
    
    if (filters) {
      if (filters.is_completed !== undefined) {
        params.is_completed = filters.is_completed;
      }
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      if (filters.date_range) {
        params.start_date_after = filters.date_range.start;
        params.end_date_before = filters.date_range.end;
      }
    }
    
    const url = Object.keys(params).length > 0 ? 
      ApiConstants.buildUrl(ApiConstants.SHOPPING.LISTS.BASE, params) : 
      ApiConstants.SHOPPING.LISTS.BASE;
    
    return this.http.get<ShoppingList[]>(url);
  }

  /**
   * Shopping List nach ID abrufen
   * Entspricht: GET /api/shopping/lists/{id}/
   */
  getShoppingList(id: number): Observable<ShoppingList> {
    return this.http.get<ShoppingList>(ApiConstants.SHOPPING.LISTS.BY_ID(id));
  }

  /**
   * Neue Shopping List erstellen
   * Entspricht: POST /api/shopping/lists/
   */
  createShoppingList(shoppingListData: ShoppingListCreate): Observable<ShoppingList> {
    return this.http.post<ShoppingList>(ApiConstants.SHOPPING.LISTS.BASE, shoppingListData);
  }

  /**
   * Shopping List aktualisieren
   * Entspricht: PUT /api/shopping/lists/{id}/
   */
  updateShoppingList(id: number, shoppingListData: ShoppingListUpdate): Observable<ShoppingList> {
    return this.http.put<ShoppingList>(ApiConstants.SHOPPING.LISTS.BY_ID(id), shoppingListData);
  }

  /**
   * Shopping List teilweise aktualisieren
   * Entspricht: PATCH /api/shopping/lists/{id}/
   */
  patchShoppingList(id: number, shoppingListData: Partial<ShoppingListUpdate>): Observable<ShoppingList> {
    return this.http.patch<ShoppingList>(ApiConstants.SHOPPING.LISTS.BY_ID(id), shoppingListData);
  }

  /**
   * Shopping List löschen
   * Entspricht: DELETE /api/shopping/lists/{id}/
   */
  deleteShoppingList(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.SHOPPING.LISTS.BY_ID(id));
  }

  /**
   * Shopping List aus Meal Plans generieren
   * Entspricht: POST /api/shopping/lists/{id}/generate_from_meal_plans/
   * Custom Action aus deinem ViewSet
   */
  generateFromMealPlans(shoppingListId: number): Observable<GenerateShoppingListResponse> {
    return this.http.post<GenerateShoppingListResponse>(
      ApiConstants.SHOPPING.LISTS.GENERATE_FROM_MEAL_PLANS(shoppingListId), 
      {}
    );
  }

  // ===== SHOPPING LIST ITEMS =====

  /**
   * Alle Shopping List Items abrufen
   * Entspricht: GET /api/shopping/items/
   */
  getShoppingListItems(filters?: ShoppingListItemFilters): Observable<ShoppingListItem[]> {
    let params: any = {};
    
    if (filters) {
      if (filters.shopping_list) {
        params.shopping_list = filters.shopping_list;
      }
      if (filters.is_purchased !== undefined) {
        params.is_purchased = filters.is_purchased;
      }
      if (filters.ingredient) {
        params.ingredient = filters.ingredient;
      }
    }
    
    const url = Object.keys(params).length > 0 ? 
      ApiConstants.buildUrl(ApiConstants.SHOPPING.ITEMS.BASE, params) : 
      ApiConstants.SHOPPING.ITEMS.BASE;
    
    return this.http.get<ShoppingListItem[]>(url);
  }

  /**
   * Shopping List Item nach ID abrufen
   * Entspricht: GET /api/shopping/items/{id}/
   */
  getShoppingListItem(id: number): Observable<ShoppingListItem> {
    return this.http.get<ShoppingListItem>(ApiConstants.SHOPPING.ITEMS.BY_ID(id));
  }

  /**
   * Neues Shopping List Item erstellen
   * Entspricht: POST /api/shopping/items/
   */
  createShoppingListItem(itemData: ShoppingListItemCreate): Observable<ShoppingListItem> {
    return this.http.post<ShoppingListItem>(ApiConstants.SHOPPING.ITEMS.BASE, itemData);
  }

  /**
   * Shopping List Item aktualisieren
   * Entspricht: PUT /api/shopping/items/{id}/
   */
  updateShoppingListItem(id: number, itemData: ShoppingListItemUpdate): Observable<ShoppingListItem> {
    return this.http.put<ShoppingListItem>(ApiConstants.SHOPPING.ITEMS.BY_ID(id), itemData);
  }

  /**
   * Shopping List Item teilweise aktualisieren
   * Entspricht: PATCH /api/shopping/items/{id}/
   */
  patchShoppingListItem(id: number, itemData: Partial<ShoppingListItemUpdate>): Observable<ShoppingListItem> {
    return this.http.patch<ShoppingListItem>(ApiConstants.SHOPPING.ITEMS.BY_ID(id), itemData);
  }

  /**
   * Shopping List Item löschen
   * Entspricht: DELETE /api/shopping/items/{id}/
   */
  deleteShoppingListItem(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.SHOPPING.ITEMS.BY_ID(id));
  }

  /**
   * Item als gekauft/ungekauft markieren
   * Entspricht: PATCH /api/shopping/items/{id}/toggle_purchased/
   * Custom Action aus deinem ViewSet
   */
  togglePurchased(itemId: number): Observable<ShoppingListItem> {
    return this.http.patch<ShoppingListItem>(
      ApiConstants.SHOPPING.ITEMS.TOGGLE_PURCHASED(itemId), 
      {}
    );
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Aktive Shopping Lists abrufen
   */
  getActiveShoppingLists(): Observable<ShoppingList[]> {
    return this.getShoppingLists({ is_completed: false });
  }

  /**
   * Abgeschlossene Shopping Lists abrufen
   */
  getCompletedShoppingLists(): Observable<ShoppingList[]> {
    return this.getShoppingLists({ is_completed: true });
  }

  /**
   * Items einer Shopping List abrufen
   */
  getItemsForShoppingList(shoppingListId: number): Observable<ShoppingListItem[]> {
    return this.getShoppingListItems({ shopping_list: shoppingListId });
  }

  /**
   * Noch nicht gekaufte Items einer Shopping List abrufen
   */
  getPendingItems(shoppingListId: number): Observable<ShoppingListItem[]> {
    return this.getShoppingListItems({ 
      shopping_list: shoppingListId, 
      is_purchased: false 
    });
  }

  /**
   * Bereits gekaufte Items einer Shopping List abrufen
   */
  getPurchasedItems(shoppingListId: number): Observable<ShoppingListItem[]> {
    return this.getShoppingListItems({ 
      shopping_list: shoppingListId, 
      is_purchased: true 
    });
  }

  /**
   * Shopping List für eine Woche erstellen
   */
  createWeeklyShoppingList(startDate: string, name?: string): Observable<ShoppingList> {
    const endDate = this.addDaysToDate(startDate, 6);
    const listName = name || `Einkaufsliste ${this.formatDateGerman(startDate)} - ${this.formatDateGerman(endDate)}`;
    
    return this.createShoppingList({
      name: listName,
      start_date: startDate,
      end_date: endDate
    });
  }

  /**
   * Shopping List als abgeschlossen markieren
   */
  markAsCompleted(id: number): Observable<ShoppingList> {
    return this.patchShoppingList(id, { is_completed: true });
  }

  /**
   * Shopping List als nicht abgeschlossen markieren
   */
  markAsIncomplete(id: number): Observable<ShoppingList> {
    return this.patchShoppingList(id, { is_completed: false });
  }

  /**
   * Item-Menge aktualisieren
   */
  updateItemAmount(itemId: number, amount: number): Observable<ShoppingListItem> {
    return this.patchShoppingListItem(itemId, { amount });
  }

  /**
   * Item-Einheit aktualisieren
   */
  updateItemUnit(itemId: number, unit: string): Observable<ShoppingListItem> {
    return this.patchShoppingListItem(itemId, { unit });
  }

  /**
   * Item-Notizen aktualisieren
   */
  updateItemNotes(itemId: number, notes: string): Observable<ShoppingListItem> {
    return this.patchShoppingListItem(itemId, { notes });
  }

  // ===== HELPER METHODS =====

  /**
   * Tage zu einem Datum hinzufügen
   */
  private addDaysToDate(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Datum im deutschen Format formatieren
   */
  private formatDateGerman(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}