import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { MealPlanService } from '../../../services/meal-plan.service';
import { RecipeService } from '../../../services/recipe.service';
import { MealPlan, MealPlanCreate, MealType } from '../../../models/meal-plan.model';
import { RecipeList } from '../../../models/recipe.model';
import { RouterModule } from '@angular/router';

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  lunchPlan?: MealPlan;
  dinnerPlan?: MealPlan;
}

interface WeekDay {
  name: string;
  short: string;
}

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss'
})
export class PlannerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Kalender-Daten
  currentDate = new Date();
  currentMonth = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: WeekDay[] = [
    { name: 'Montag', short: 'Mo' },
    { name: 'Dienstag', short: 'Di' },
    { name: 'Mittwoch', short: 'Mi' },
    { name: 'Donnerstag', short: 'Do' },
    { name: 'Freitag', short: 'Fr' },
    { name: 'Samstag', short: 'Sa' },
    { name: 'Sonntag', short: 'So' }
  ];
  
  // Daten
  mealPlans: MealPlan[] = [];
  recipes: RecipeList[] = [];
  
  // UI State
  isLoading = false;
  selectedDate: Date | null = null;
  showAddMealModal = false;
  showRecipeSelector = false;
  isEditMode = false;
  editingMealPlan: MealPlan | null = null;
  
  // Modal-Daten
  selectedMealType: MealType = 'lunch';
  selectedRecipe: RecipeList | null = null;
  servings = 4;
  notes = '';
  
  // Recipe Selector
  recipeSearchTerm = '';
  filteredRecipes: RecipeList[] = [];
  
  constructor(
    private mealPlanService: MealPlanService,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.generateCalendar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Lädt initiale Daten (Rezepte und Meal Plans)
   */
  private loadInitialData(): void {
    this.isLoading = true;
    
    forkJoin({
      recipes: this.recipeService.getRecipes(),
      mealPlans: this.mealPlanService.getCurrentWeekMealPlans()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        console.log('🔍 Loaded Meal Plans:', data.mealPlans);
        
        // Validiere Meal Plan Daten
        const validMealPlans = data.mealPlans.filter(mp => {
          const hasId = mp.id !== undefined && mp.id !== null;
          if (!hasId) {
            console.warn('⚠️ Meal Plan ohne ID gefunden:', mp);
          }
          return hasId;
        });
        
        console.log(`✅ Von ${data.mealPlans.length} Meal Plans sind ${validMealPlans.length} gültig (mit ID)`);
        
        this.recipes = data.recipes;
        this.mealPlans = validMealPlans; // Nur gültige Meal Plans verwenden
        this.filteredRecipes = this.recipes;
        this.assignMealPlansToCalendar();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Daten:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Generiert die Kalender-Tage für den aktuellen Monat
   */
  private generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Erster Tag des Monats
    const firstDay = new Date(year, month, 1);
    // Letzter Tag des Monats
    const lastDay = new Date(year, month + 1, 0);
    
    // Montag der ersten Woche (kann im vorherigen Monat liegen)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);
    
    // Sonntag der letzten Woche (kann im nächsten Monat liegen)
    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    endDate.setDate(lastDay.getDate() + sundayOffset);
    
    // Kalender-Tage generieren
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = this.formatDate(currentDate);
      const dayOfWeek = currentDate.getDay();
      
      this.calendarDays.push({
        date: new Date(currentDate),
        dateString,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDay(currentDate, new Date()),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.assignMealPlansToCalendar();
  }

  /**
   * Weist die Meal Plans den entsprechenden Kalender-Tagen zu
   */
  private assignMealPlansToCalendar(): void {
    this.calendarDays.forEach(day => {
      day.lunchPlan = this.mealPlans.find(mp => 
        mp.date === day.dateString && mp.meal_type === 'lunch'
      );
      day.dinnerPlan = this.mealPlans.find(mp => 
        mp.date === day.dateString && mp.meal_type === 'dinner'
      );
    });
  }

  /**
   * Navigiert zum vorherigen Monat
   */
  previousMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.currentMonth = new Date(this.currentMonth);
    this.generateCalendar();
    this.loadMealPlansForMonth();
  }

  /**
   * Navigiert zum nächsten Monat
   */
  nextMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.currentMonth = new Date(this.currentMonth);
    this.generateCalendar();
    this.loadMealPlansForMonth();
  }

  /**
   * Geht zum aktuellen Monat zurück
   */
  goToToday(): void {
    this.currentMonth = new Date();
    this.generateCalendar();
    this.loadMealPlansForMonth();
  }

  /**
   * Lädt Meal Plans für den aktuellen Monat
   */
  private loadMealPlansForMonth(): void {
    const startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    
    this.mealPlanService.getMealPlansInRange(
      this.formatDate(startDate),
      this.formatDate(endDate)
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (mealPlans) => {
        this.mealPlans = mealPlans;
        this.assignMealPlansToCalendar();
      },
      error: (error) => {
        console.error('Fehler beim Laden der Meal Plans:', error);
      }
    });
  }

  /**
   * Öffnet das Modal zum Hinzufügen einer Mahlzeit
   */
  openAddMealModal(date: Date, mealType: MealType): void {
    this.selectedDate = date;
    this.selectedMealType = mealType;
    this.selectedRecipe = null;
    this.servings = 4;
    this.notes = '';
    this.isEditMode = false;
    this.editingMealPlan = null;
    this.showAddMealModal = true;
  }

  /**
   * Schließt das Add-Meal Modal
   */
  closeAddMealModal(): void {
    this.showAddMealModal = false;
    this.selectedDate = null;
    this.selectedRecipe = null;
    this.isEditMode = false;
    this.editingMealPlan = null;
  }

  /**
   * Öffnet den Rezept-Selector
   */
  openRecipeSelector(): void {
    this.showRecipeSelector = true;
    this.recipeSearchTerm = '';
    this.filteredRecipes = this.recipes;
  }

  /**
   * Schließt den Rezept-Selector
   */
  closeRecipeSelector(): void {
    this.showRecipeSelector = false;
  }

  /**
   * Wählt ein Rezept aus
   */
  selectRecipe(recipe: RecipeList): void {
    this.selectedRecipe = recipe;
    this.servings = recipe.servings;
    this.closeRecipeSelector();
  }

  /**
   * Filtert Rezepte basierend auf Suchbegriff
   */
  filterRecipes(): void {
    if (!this.recipeSearchTerm.trim()) {
      this.filteredRecipes = this.recipes;
      return;
    }
    
    const term = this.recipeSearchTerm.toLowerCase();
    this.filteredRecipes = this.recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(term) ||
      recipe.description.toLowerCase().includes(term)
    );
  }

  /**
   * Speichert den neuen Meal Plan
   */
  saveMealPlan(): void {
    if (!this.selectedDate || !this.selectedRecipe) {
      return;
    }

    const dateString = this.formatDate(this.selectedDate);

    if (this.isEditMode && this.editingMealPlan && this.editingMealPlan.id) {
      // Im Edit-Modus: Bestehenden Meal Plan aktualisieren
      this.updateExistingMealPlan(this.editingMealPlan);
    } else {
      // Im Create-Modus oder Edit ohne ID: Delete & Create Strategie
      const existingMealPlan = this.mealPlans.find(mp => 
        mp.date === dateString && mp.meal_type === this.selectedMealType
      );

      if (existingMealPlan && existingMealPlan.id) {
        // Existing Plan gefunden mit ID: Frage ob überschreiben
        if (confirm('Für diesen Tag und Mahlzeit existiert bereits ein Plan. Möchten Sie ihn ersetzen?')) {
          this.replaceExistingMealPlan(existingMealPlan, dateString);
        }
      } else if (existingMealPlan && !existingMealPlan.id) {
        // Existing Plan ohne ID: Direkt ersetzen (wahrscheinlich neu erstellt)
        this.replaceExistingMealPlan(existingMealPlan, dateString);
      } else {
        // Kein existing Plan: Neu erstellen
        this.createNewMealPlan(dateString);
      }
    }
  }

  /**
   * Ersetzt einen bestehenden Meal Plan durch Delete & Create
   */
  private replaceExistingMealPlan(existingMealPlan: MealPlan, dateString: string): void {
    if (existingMealPlan.id) {
      // Lösche zuerst den bestehenden Plan
      this.mealPlanService.deleteMealPlan(existingMealPlan.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Entferne aus lokaler Liste
            this.mealPlans = this.mealPlans.filter(mp => mp.id !== existingMealPlan.id);
            // Erstelle neuen Plan
            this.createNewMealPlan(dateString);
          },
          error: (error) => {
            console.error('Fehler beim Löschen des alten Meal Plans:', error);
            // Versuche trotzdem zu erstellen
            this.createNewMealPlan(dateString);
          }
        });
    } else {
      // Kein ID vorhanden: Entferne aus lokaler Liste und erstelle neu
      this.mealPlans = this.mealPlans.filter(mp => 
        !(mp.date === existingMealPlan.date && mp.meal_type === existingMealPlan.meal_type)
      );
      this.createNewMealPlan(dateString);
    }
  }

  /**
   * Erstellt einen neuen Meal Plan
   */
  private createNewMealPlan(dateString: string): void {
    const mealPlanData: MealPlanCreate = {
      recipe: this.selectedRecipe!.id,
      date: dateString,
      meal_type: this.selectedMealType,
      servings: this.servings,
      notes: this.notes
    };

    this.mealPlanService.createMealPlan(mealPlanData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mealPlan) => {
          console.log('✅ Meal Plan erstellt:', mealPlan);
          
          // Validiere, dass die Response eine ID hat
          if (!mealPlan.id) {
            console.warn('⚠️ Neuer Meal Plan hat keine ID, lade Daten neu');
            // Lade die Meal Plans neu, um die korrekten IDs zu bekommen
            this.loadMealPlansForMonth();
          } else {
            this.mealPlans.push(mealPlan);
            this.assignMealPlansToCalendar();
          }
          
          this.closeAddMealModal();
        },
        error: (error) => {
          console.error('Fehler beim Erstellen des Meal Plans:', error);
          this.handleMealPlanError(error);
        }
      });
  }

  /**
   * Aktualisiert einen bestehenden Meal Plan
   */
  private updateExistingMealPlan(existingMealPlan: MealPlan): void {
    console.log('🔄 Updating Meal Plan:', existingMealPlan); // Debug Log
    
    if (!existingMealPlan.id) {
      console.error('❌ Kann Meal Plan nicht aktualisieren: ID fehlt', existingMealPlan);
      this.handleMealPlanError({ 
        status: 400, 
        error: 'ID fehlt', 
        message: 'Meal Plan kann nicht aktualisiert werden: ID fehlt' 
      });
      return;
    }

    const updateData = {
      recipe: this.selectedRecipe!.id,
      servings: this.servings,
      notes: this.notes
    };

    console.log('📤 Update Data:', updateData);
    console.log('🔗 Updating Meal Plan ID:', existingMealPlan.id);

    this.mealPlanService.patchMealPlan(existingMealPlan.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedMealPlan) => {
          console.log('✅ Meal Plan aktualisiert:', updatedMealPlan);
          // Ersetze den alten Meal Plan in der Liste
          const index = this.mealPlans.findIndex(mp => mp.id === existingMealPlan.id);
          if (index !== -1) {
            this.mealPlans[index] = updatedMealPlan;
          }
          this.assignMealPlansToCalendar();
          this.closeAddMealModal();
        },
        error: (error) => {
          console.error('❌ Fehler beim Aktualisieren des Meal Plans:', error);
          this.handleMealPlanError(error);
        }
      });
  }

  /**
   * Behandelt Fehler beim Speichern von Meal Plans
   */
  private handleMealPlanError(error: any): void {
    // Hier könntest du eine Toast-Nachricht oder ein Modal anzeigen
    console.error('Meal Plan Fehler:', error);
    
    // Einfache Alert-Nachricht (später durch Toast ersetzen)
    if (error.status === 400 && error.error?.detail?.includes('unique')) {
      alert('Für diesen Tag und Mahlzeit ist bereits ein Plan vorhanden. Bitte wählen Sie einen anderen Tag oder löschen Sie den bestehenden Plan.');
    } else {
      alert('Fehler beim Speichern des Meal Plans. Bitte versuchen Sie es erneut.');
    }
  }

  /**
   * Löscht einen Meal Plan
   */
  deleteMealPlan(mealPlan: MealPlan, event: Event): void {
    event.stopPropagation();
    
    console.log('🗑️ Delete Meal Plan:', mealPlan);
    
    if (!mealPlan.id) {
      console.warn('⚠️ Meal Plan hat keine ID - entferne nur lokal');
      // Entferne nur aus lokaler Liste
      this.mealPlans = this.mealPlans.filter(mp => 
        !(mp.date === mealPlan.date && mp.meal_type === mealPlan.meal_type)
      );
      this.assignMealPlansToCalendar();
      return;
    }
    
    if (confirm('Möchten Sie diese Mahlzeit wirklich löschen?')) {
      this.mealPlanService.deleteMealPlan(mealPlan.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Meal Plan gelöscht');
            this.mealPlans = this.mealPlans.filter(mp => mp.id !== mealPlan.id);
            this.assignMealPlansToCalendar();
          },
          error: (error) => {
            console.error('❌ Fehler beim Löschen des Meal Plans:', error);
            // Auch bei Fehler aus lokaler Liste entfernen
            this.mealPlans = this.mealPlans.filter(mp => mp.id !== mealPlan.id);
            this.assignMealPlansToCalendar();
          }
        });
    }
  }

  /**
   * Bearbeitet einen Meal Plan
   */
  editMealPlan(mealPlan: MealPlan, event: Event): void {
    event.stopPropagation();
    
    console.log('🔍 Edit Meal Plan:', mealPlan); // Debug Log
    
    if (!mealPlan.id) {
      console.error('❌ Meal Plan hat keine ID!', mealPlan);
      alert('Fehler: Meal Plan kann nicht bearbeitet werden (keine ID gefunden).');
      return;
    }
    
    this.selectedDate = new Date(mealPlan.date);
    this.selectedMealType = mealPlan.meal_type;
    this.selectedRecipe = mealPlan.recipe;
    this.servings = mealPlan.servings;
    this.notes = mealPlan.notes;
    this.isEditMode = true;
    this.editingMealPlan = mealPlan;
    this.showAddMealModal = true;
  }

  /**
   * Hilfsfunktionen
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatMonthYear(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    });
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  getMealTypeDisplay(mealType: MealType): string {
    return mealType === 'lunch' ? 'Mittagessen' : 'Abendessen';
  }

  getDifficultyDisplay(difficulty: string): string {
    const map: { [key: string]: string } = {
      'easy': 'Einfach',
      'medium': 'Mittel',
      'hard': 'Schwer'
    };
    return map[difficulty] || difficulty;
  }
}