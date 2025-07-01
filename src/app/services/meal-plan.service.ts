// src/app/services/meal-plan.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstants } from '../utils/api.constants';
import { 
  MealPlan, 
  MealPlanCreate, 
  MealPlanUpdate, 
  MealType 
} from '../models/meal-plan.model';

export interface MealPlanFilters {
  date?: string; // YYYY-MM-DD
  date_range?: {
    start: string;
    end: string;
  };
  meal_type?: MealType;
  recipe?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MealPlanService {

  constructor(private http: HttpClient) {}

  /**
   * Alle Meal Plans abrufen
   * Entspricht: GET /api/planner/
   */
  getMealPlans(filters?: MealPlanFilters): Observable<MealPlan[]> {
    let params: any = {};
    
    if (filters) {
      if (filters.date) {
        params.date = filters.date;
      }
      if (filters.date_range) {
        params.date_after = filters.date_range.start;
        params.date_before = filters.date_range.end;
      }
      if (filters.meal_type) {
        params.meal_type = filters.meal_type;
      }
      if (filters.recipe) {
        params.recipe = filters.recipe;
      }
    }
    
    const url = Object.keys(params).length > 0 ? 
      ApiConstants.buildUrl(ApiConstants.MEAL_PLANS.BASE, params) : 
      ApiConstants.MEAL_PLANS.BASE;
    
    return this.http.get<MealPlan[]>(url);
  }

  /**
   * Meal Plan nach ID abrufen
   * Entspricht: GET /api/planner/{id}/
   */
  getMealPlan(id: number): Observable<MealPlan> {
    return this.http.get<MealPlan>(ApiConstants.MEAL_PLANS.BY_ID(id));
  }

  /**
   * Neuen Meal Plan erstellen
   * Entspricht: POST /api/planner/
   */
  createMealPlan(mealPlanData: MealPlanCreate): Observable<MealPlan> {
    return this.http.post<MealPlan>(ApiConstants.MEAL_PLANS.BASE, mealPlanData);
  }

  /**
   * Meal Plan aktualisieren
   * Entspricht: PUT /api/planner/{id}/
   */
  updateMealPlan(id: number, mealPlanData: MealPlanUpdate): Observable<MealPlan> {
    return this.http.put<MealPlan>(ApiConstants.MEAL_PLANS.BY_ID(id), mealPlanData);
  }

  /**
   * Meal Plan teilweise aktualisieren
   * Entspricht: PATCH /api/planner/{id}/
   */
  patchMealPlan(id: number, mealPlanData: Partial<MealPlanUpdate>): Observable<MealPlan> {
    return this.http.patch<MealPlan>(ApiConstants.MEAL_PLANS.BY_ID(id), mealPlanData);
  }

  /**
   * Meal Plan löschen
   * Entspricht: DELETE /api/planner/{id}/
   */
  deleteMealPlan(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.MEAL_PLANS.BY_ID(id));
  }

  /**
   * Meal Plans für aktuelle Woche abrufen
   * Entspricht: GET /api/planner/current_week/
   * Custom Action aus deinem ViewSet
   */
  getCurrentWeekMealPlans(): Observable<MealPlan[]> {
    return this.http.get<MealPlan[]>(ApiConstants.MEAL_PLANS.CURRENT_WEEK);
  }

  /**
   * Meal Plans für spezifische Woche abrufen
   * Entspricht: GET /api/planner/week/?start_date=YYYY-MM-DD
   * Custom Action aus deinem ViewSet
   */
  getWeekMealPlans(startDate: string): Observable<MealPlan[]> {
    const url = ApiConstants.buildUrl(ApiConstants.MEAL_PLANS.WEEK, { 
      start_date: startDate 
    });
    return this.http.get<MealPlan[]>(url);
  }

  /**
   * Meal Plans für einen bestimmten Tag abrufen
   */
  getDayMealPlans(date: string): Observable<MealPlan[]> {
    return this.getMealPlans({ date });
  }

  /**
   * Meal Plans für Datumsbereich abrufen
   */
  getMealPlansInRange(startDate: string, endDate: string): Observable<MealPlan[]> {
    return this.getMealPlans({ 
      date_range: { start: startDate, end: endDate } 
    });
  }

  /**
   * Lunch Plans für eine Woche abrufen
   */
  getWeekLunchPlans(startDate: string): Observable<MealPlan[]> {
    return this.getWeekMealPlans(startDate).pipe(
      // Filter auf Lunch beschränken könnte auch im Backend gemacht werden
    );
  }

  /**
   * Dinner Plans für eine Woche abrufen
   */
  getWeekDinnerPlans(startDate: string): Observable<MealPlan[]> {
    return this.getWeekMealPlans(startDate).pipe(
      // Filter auf Dinner beschränken könnte auch im Backend gemacht werden
    );
  }

  /**
   * Nächste 7 Tage Meal Plans abrufen
   */
  getNextWeekMealPlans(): Observable<MealPlan[]> {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return this.getMealPlansInRange(
      this.formatDate(today),
      this.formatDate(nextWeek)
    );
  }

  /**
   * Meal Plan für spezifischen Tag und Meal Type erstellen
   */
  addMealToDay(date: string, mealType: MealType, recipeId: number, servings: number = 4, notes?: string): Observable<MealPlan> {
    const mealPlanData: MealPlanCreate = {
      recipe: recipeId,
      date,
      meal_type: mealType,
      servings,
      notes: notes || ''
    };
    
    return this.createMealPlan(mealPlanData);
  }

  /**
   * Portionen für Meal Plan ändern
   */
  updateServings(id: number, servings: number): Observable<MealPlan> {
    return this.patchMealPlan(id, { servings });
  }

  /**
   * Notizen für Meal Plan aktualisieren
   */
  updateNotes(id: number, notes: string): Observable<MealPlan> {
    return this.patchMealPlan(id, { notes });
  }

  /**
   * Meal Plan auf anderen Tag verschieben
   */
  moveMealPlan(id: number, newDate: string): Observable<MealPlan> {
    return this.patchMealPlan(id, { date: newDate });
  }

  /**
   * Prüfe ob für einen Tag bereits ein Meal Plan existiert
   */
  checkMealPlanExists(date: string, mealType: MealType): Observable<boolean> {
    return new Observable(observer => {
      this.getMealPlans({ date, meal_type: mealType }).subscribe({
        next: (mealPlans) => {
          observer.next(mealPlans.length > 0);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Helper: Datum zu YYYY-MM-DD String formatieren
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: Wochenbeginn (Montag) für ein Datum berechnen
   */
  getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Montag als Wochenbeginn
    d.setDate(diff);
    return this.formatDate(d);
  }

  /**
   * Helper: Wochenende (Sonntag) für ein Datum berechnen
   */
  getWeekEnd(date: Date): string {
    const weekStart = new Date(this.getWeekStart(date));
    weekStart.setDate(weekStart.getDate() + 6);
    return this.formatDate(weekStart);
  }
}