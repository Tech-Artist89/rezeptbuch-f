// src/app/components/ingredients/ingredients/ingredients.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // Hinzugefügt für ngModel
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { IngredientService } from '../../../services/ingredient.service';
import { 
  Ingredient, 
  IngredientCreate, 
  IngredientUpdate 
} from '../../../models/ingredient.model';

interface SortOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule], // FormsModule hinzugefügt
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.scss'],
})
export class IngredientsComponent implements OnInit, OnDestroy {
  // Data Properties
  ingredients: Ingredient[] = [];
  filteredIngredients: Ingredient[] = [];
  
  // State Properties
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  
  // Search and Filter Properties
  searchTerm = '';
  selectedUnit = '';
  showCaloriesOnly = false;
  showSortMenu = false;
  
  // Modal Properties
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  ingredientToEdit: Ingredient | null = null;
  ingredientToDelete: Ingredient | null = null;
  
  // Form Properties
  ingredientForm: FormGroup;
  errorMessage = '';
  
  // Search Subject for debouncing
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  
  // Sort Options
  sortOptions: SortOption[] = [
    { value: 'name_asc', label: 'Name A-Z', icon: 'bi bi-sort-alpha-down' },
    { value: 'name_desc', label: 'Name Z-A', icon: 'bi bi-sort-alpha-up' },
    { value: 'unit_asc', label: 'Einheit A-Z', icon: 'bi bi-sort-down' },
    { value: 'created_desc', label: 'Neueste zuerst', icon: 'bi bi-clock' },
    { value: 'created_asc', label: 'Älteste zuerst', icon: 'bi bi-clock-history' }
  ];
  
  currentSort: SortOption = this.sortOptions[0];
  
  // Common Units
  commonUnits = [
    'g', 'kg', 'ml', 'l', 'Stück', 'EL', 'TL', 'Prise', 
    'Tasse', 'Bund', 'Packung', 'Dose', 'Flasche'
  ];
  
  // Unique units from ingredients
  get availableUnits(): string[] {
    const units = new Set(this.ingredients.map(ing => ing.unit));
    return Array.from(units).sort();
  }

  constructor(
    private ingredientService: IngredientService,
    private formBuilder: FormBuilder
  ) {
    this.ingredientForm = this.createForm();
  }

  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadIngredients();
    
    // Document click listener for sort menu
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      calories_per_100g: [null, [Validators.min(0), Validators.max(9999)]]
    });
  }

  private setupSearchDebouncing() {
    const searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
    
    this.subscriptions.add(searchSubscription);
  }

  private handleDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const sortContainer = document.querySelector('.sort-container');
    
    if (sortContainer && !sortContainer.contains(target)) {
      this.showSortMenu = false;
    }
  }

  // Data Loading
  loadIngredients() {
    this.isLoading = true;
    
    const loadSubscription = this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => {
        console.log('Zutaten geladen:', ingredients);
        this.ingredients = Array.isArray(ingredients) ? ingredients : [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Zutaten:', error);
        this.ingredients = [];
        this.filteredIngredients = [];
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(loadSubscription);
  }

  // Search and Filter Methods
  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  filterByUnit(unit: string) {
    this.selectedUnit = unit;
    this.applyFilters();
  }

  toggleCaloriesFilter() {
    this.showCaloriesOnly = !this.showCaloriesOnly;
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.selectedUnit = '';
    this.showCaloriesOnly = false;
    this.applyFilters();
  }

  private applyFilters() {
    if (!this.ingredients || !Array.isArray(this.ingredients)) {
      this.filteredIngredients = [];
      return;
    }

    let filtered = [...this.ingredients];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(ingredient =>
        ingredient.name.toLowerCase().includes(search) ||
        ingredient.unit.toLowerCase().includes(search)
      );
    }

    // Apply unit filter
    if (this.selectedUnit) {
      filtered = filtered.filter(ingredient => ingredient.unit === this.selectedUnit);
    }

    // Apply calories filter
    if (this.showCaloriesOnly) {
      filtered = filtered.filter(ingredient => 
        ingredient.calories_per_100g !== null && ingredient.calories_per_100g !== undefined
      );
    }

    // Apply sorting
    this.sortIngredients(filtered);
  }

  // Sorting Methods
  toggleSortMenu() {
    this.showSortMenu = !this.showSortMenu;
  }

  selectSort(sort: SortOption) {
    this.currentSort = sort;
    this.showSortMenu = false;
    this.applyFilters();
  }

  private sortIngredients(ingredients: Ingredient[]) {
    if (!ingredients || !Array.isArray(ingredients)) {
      this.filteredIngredients = [];
      return;
    }

    switch (this.currentSort.value) {
      case 'name_asc':
        ingredients.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        ingredients.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'unit_asc':
        ingredients.sort((a, b) => a.unit.localeCompare(b.unit));
        break;
      case 'created_desc':
        ingredients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'created_asc':
        ingredients.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }
    
    this.filteredIngredients = ingredients;
  }

  // Modal Management
  openCreateModal() {
    this.ingredientForm.reset();
    this.errorMessage = '';
    this.showCreateModal = true;
  }

  openEditModal(ingredient: Ingredient) {
    this.ingredientToEdit = ingredient;
    this.ingredientForm.patchValue({
      name: ingredient.name,
      unit: ingredient.unit,
      calories_per_100g: ingredient.calories_per_100g
    });
    this.errorMessage = '';
    this.showEditModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.ingredientForm.reset();
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.ingredientToEdit = null;
    this.ingredientForm.reset();
    this.errorMessage = '';
  }

  // CRUD Operations
  createIngredient() {
    if (this.ingredientForm.valid && !this.isSaving) {
      this.isSaving = true;
      this.errorMessage = '';

      const ingredientData: IngredientCreate = {
        name: this.ingredientForm.get('name')?.value.trim(),
        unit: this.ingredientForm.get('unit')?.value.trim(),
        calories_per_100g: this.ingredientForm.get('calories_per_100g')?.value || null
      };

      const createSubscription = this.ingredientService.createIngredient(ingredientData).subscribe({
        next: (ingredient) => {
          console.log('Zutat erfolgreich erstellt:', ingredient);
          this.ingredients.push(ingredient);
          this.applyFilters();
          this.closeCreateModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Fehler beim Erstellen der Zutat:', error);
          this.errorMessage = 'Fehler beim Erstellen der Zutat. Bitte versuchen Sie es erneut.';
          this.isSaving = false;
        }
      });

      this.subscriptions.add(createSubscription);
    } else {
      this.markFormGroupTouched();
    }
  }

  updateIngredient() {
    if (this.ingredientForm.valid && !this.isSaving && this.ingredientToEdit) {
      this.isSaving = true;
      this.errorMessage = '';

      const ingredientData: IngredientUpdate = {
        name: this.ingredientForm.get('name')?.value.trim(),
        unit: this.ingredientForm.get('unit')?.value.trim(),
        calories_per_100g: this.ingredientForm.get('calories_per_100g')?.value || null
      };

      const updateSubscription = this.ingredientService.updateIngredient(
        this.ingredientToEdit.id, 
        ingredientData
      ).subscribe({
        next: (updatedIngredient) => {
          console.log('Zutat erfolgreich aktualisiert:', updatedIngredient);
          
          // Update in local array
          const index = this.ingredients.findIndex(ing => ing.id === updatedIngredient.id);
          if (index !== -1) {
            this.ingredients[index] = updatedIngredient;
          }
          
          this.applyFilters();
          this.closeEditModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Fehler beim Aktualisieren der Zutat:', error);
          this.errorMessage = 'Fehler beim Aktualisieren der Zutat. Bitte versuchen Sie es erneut.';
          this.isSaving = false;
        }
      });

      this.subscriptions.add(updateSubscription);
    } else {
      this.markFormGroupTouched();
    }
  }

  // Delete Methods
  confirmDelete(ingredient: Ingredient) {
    this.ingredientToDelete = ingredient;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.ingredientToDelete = null;
  }

  deleteIngredient() {
    if (!this.ingredientToDelete) return;

    this.isDeleting = true;
    
    const deleteSubscription = this.ingredientService.deleteIngredient(this.ingredientToDelete.id).subscribe({
      next: () => {
        console.log('Zutat erfolgreich gelöscht');
        
        // Remove from local arrays
        this.ingredients = this.ingredients.filter(ing => ing.id !== this.ingredientToDelete!.id);
        this.filteredIngredients = this.filteredIngredients.filter(ing => ing.id !== this.ingredientToDelete!.id);
        
        // Close modal
        this.cancelDelete();
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Fehler beim Löschen der Zutat:', error);
        this.isDeleting = false;
        this.cancelDelete();
      }
    });
    
    this.subscriptions.add(deleteSubscription);
  }

  // Form Validation Helpers
  private markFormGroupTouched() {
    Object.keys(this.ingredientForm.controls).forEach(key => {
      this.ingredientForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.ingredientForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} ist erforderlich.`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} ist zu kurz.`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} ist zu lang.`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} muss größer oder gleich 0 sein.`;
      if (field.errors['max']) return `${this.getFieldLabel(fieldName)} ist zu groß.`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Name',
      unit: 'Einheit',
      calories_per_100g: 'Kalorien'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.ingredientForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  // Utility Methods
  trackByIngredientId(index: number, ingredient: Ingredient): number {
    return ingredient.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  hasCalories(ingredient: Ingredient): boolean {
    return ingredient.calories_per_100g !== null && ingredient.calories_per_100g !== undefined;
  }

  // Unit Selection Helper
  selectUnit(unit: string) {
    this.ingredientForm.patchValue({ unit });
  }
}