// src/app/components/recipes/recipes-list/recipes-list/recipes-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { RecipeService } from '../../../../services/recipe.service';
import { RecipeList, DifficultyLevel } from '../../../../models/recipe.model';

interface DifficultyOption {
  value: DifficultyLevel | '';
  label: string;
  icon: string;
}

interface SortOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-recipes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recipes-list.component.html',
  styleUrls: ['./recipes-list.component.scss'],
})
export class RecipesListComponent implements OnInit, OnDestroy {
  // Data Properties
  recipes: RecipeList[] = [];
  filteredRecipes: RecipeList[] = [];
  isLoading = true;
  
  // Frontend-only state for favorites (not persisted)
  favoriteRecipes = new Set<number>();
  
  // Search and Filter Properties
  searchTerm = '';
  selectedDifficulty: DifficultyLevel | '' = '';
  showSortMenu = false;
  
  // Delete Modal Properties
  showDeleteModal = false;
  recipeToDelete: RecipeList | null = null;
  
  // Search Subject for debouncing
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  
  // Difficulty Options
  difficulties: DifficultyOption[] = [
    { value: '', label: 'Alle', icon: 'bi bi-grid' },
    { value: 'easy', label: 'Einfach', icon: 'bi bi-star' },
    { value: 'medium', label: 'Mittel', icon: 'bi bi-star-fill' },
    { value: 'hard', label: 'Schwer', icon: 'bi bi-stars' }
  ];
  
  // Sort Options
  sortOptions: SortOption[] = [
    { value: 'created_desc', label: 'Neueste zuerst', icon: 'bi bi-sort-down' },
    { value: 'created_asc', label: 'Älteste zuerst', icon: 'bi bi-sort-up' },
    { value: 'title_asc', label: 'A-Z', icon: 'bi bi-sort-alpha-down' },
    { value: 'title_desc', label: 'Z-A', icon: 'bi bi-sort-alpha-up' },
    { value: 'time_asc', label: 'Kürzeste Zeit', icon: 'bi bi-clock' },
    { value: 'time_desc', label: 'Längste Zeit', icon: 'bi bi-clock-fill' }
  ];
  
  currentSort: SortOption = this.sortOptions[0];

  constructor(private recipeService: RecipeService) {}

  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadRecipes();
    
    // Document click listener for sort menu
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
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
  loadRecipes() {
    this.isLoading = true;
    
    const loadSubscription = this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        console.log('🔍 Backend Response:', recipes);
        console.log('🔍 Response Type:', typeof recipes);
        console.log('🔍 Is Array:', Array.isArray(recipes));
        console.log('🔍 Length:', recipes?.length);
        
        // Ensure recipes is an array
        this.recipes = Array.isArray(recipes) ? recipes : [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Fehler beim Laden der Rezepte:', error);
        console.error('❌ Error Status:', error.status);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Full Error:', error);
        
        this.recipes = []; // Reset to empty array on error
        this.filteredRecipes = [];
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

  filterByDifficulty(difficulty: DifficultyLevel | '') {
    this.selectedDifficulty = difficulty;
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.selectedDifficulty = '';
    this.applyFilters();
  }

  private applyFilters() {
    // Safety check: ensure recipes array exists
    if (!this.recipes || !Array.isArray(this.recipes)) {
      this.filteredRecipes = [];
      return;
    }

    let filtered = [...this.recipes];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(search) ||
        recipe.description.toLowerCase().includes(search) ||
        recipe.author.toLowerCase().includes(search) ||
        recipe.categories.some(cat => cat.name.toLowerCase().includes(search))
      );
    }

    // Apply difficulty filter
    if (this.selectedDifficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === this.selectedDifficulty);
    }

    // Apply sorting
    this.sortRecipes(filtered);
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

  private sortRecipes(recipes: RecipeList[]) {
    // Safety check: ensure recipes array exists
    if (!recipes || !Array.isArray(recipes)) {
      this.filteredRecipes = [];
      return;
    }

    switch (this.currentSort.value) {
      case 'created_desc':
        recipes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'created_asc':
        recipes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title_asc':
        recipes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        recipes.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'time_asc':
        recipes.sort((a, b) => a.total_time - b.total_time);
        break;
      case 'time_desc':
        recipes.sort((a, b) => b.total_time - a.total_time);
        break;
    }
    
    this.filteredRecipes = recipes;
  }

  // Helper Methods
  getDifficultyLabel(difficulty: DifficultyLevel): string {
    const difficultyMap = {
      'easy': 'Einfach',
      'medium': 'Mittel',
      'hard': 'Schwer'
    };
    return difficultyMap[difficulty] || difficulty;
  }

  getDifficultyIcon(difficulty: DifficultyLevel): string {
    const iconMap = {
      'easy': 'bi bi-star',
      'medium': 'bi bi-star-fill',
      'hard': 'bi bi-stars'
    };
    return iconMap[difficulty] || 'bi bi-star';
  }

  trackByRecipeId(index: number, recipe: RecipeList): number {
    return recipe.id;
  }

  // Helper method to check if recipe is favorite
  isRecipeFavorite(recipeId: number): boolean {
    return this.favoriteRecipes.has(recipeId);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    
    // Show placeholder instead
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  // Favorite Methods
  toggleFavorite(recipe: RecipeList, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle favorite state in Set
    if (this.favoriteRecipes.has(recipe.id)) {
      this.favoriteRecipes.delete(recipe.id);
      console.log(`Rezept ${recipe.title} als Favorit entfernt`);
    } else {
      this.favoriteRecipes.add(recipe.id);
      console.log(`Rezept ${recipe.title} als Favorit markiert`);
    }
    
    // TODO: Implement API call to persist favorite status
  }

  // Delete Methods
  confirmDelete(recipe: RecipeList, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.recipeToDelete = recipe;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.recipeToDelete = null;
  }

  deleteRecipe() {
    if (!this.recipeToDelete) return;

    const deleteSubscription = this.recipeService.deleteRecipe(this.recipeToDelete.id).subscribe({
      next: () => {
        console.log('Rezept erfolgreich gelöscht');
        
        // Remove from local arrays
        this.recipes = this.recipes.filter(r => r.id !== this.recipeToDelete!.id);
        this.filteredRecipes = this.filteredRecipes.filter(r => r.id !== this.recipeToDelete!.id);
        
        // Close modal
        this.cancelDelete();
        
        // TODO: Show success notification
      },
      error: (error) => {
        console.error('Fehler beim Löschen des Rezepts:', error);
        // TODO: Show error notification
        this.cancelDelete();
      }
    });
    
    this.subscriptions.add(deleteSubscription);
  }
}