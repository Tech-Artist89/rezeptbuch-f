// src/app/components/recipes/recipes-detail/recipes-detail/recipes-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { RecipeService } from '../../../../services/recipe.service';
import { AuthService } from '../../../../services/auth.service';
import { Recipe, DifficultyLevel } from '../../../../models/recipe.model';

interface DifficultyInfo {
  label: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-recipes-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recipes-detail.component.html',
  styleUrls: ['./recipes-detail.component.scss'],
})
export class RecipesDetailComponent implements OnInit, OnDestroy {
  // Data Properties
  recipe: Recipe | null = null;
  recipeId: number | null = null;
  currentUser: any = null;
  
  // State Properties
  isLoading = true;
  isDeleting = false;
  isFavorite = false;
  showDeleteModal = false;
  showShareModal = false;
  errorMessage = '';
  
  // UI State
  selectedServings: number = 4;
  showFullInstructions = false;
  activeImageIndex = 0;
  
  // Navigator check for share functionality
  get canShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }
  
  // Subscriptions
  private subscriptions = new Subscription();
  
  // Difficulty mapping
  private difficultyMap: Record<DifficultyLevel, DifficultyInfo> = {
    'easy': {
      label: 'Einfach',
      icon: 'bi bi-star',
      color: 'var(--accent-green)',
      description: 'Für Anfänger geeignet'
    },
    'medium': {
      label: 'Mittel',
      icon: 'bi bi-star-fill',
      color: 'var(--accent-orange)',
      description: 'Etwas Erfahrung erforderlich'
    },
    'hard': {
      label: 'Schwer',
      icon: 'bi bi-stars',
      color: 'var(--accent-red)',
      description: 'Für erfahrene Köche'
    }
  };

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.loadCurrentUser();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeComponent() {
    // Get recipe ID from route
    const routeSubscription = this.route.params.subscribe(params => {
      if (params['id']) {
        this.recipeId = +params['id'];
        this.loadRecipe(this.recipeId);
      } else {
        this.router.navigate(['/recipes']);
      }
    });
    
    this.subscriptions.add(routeSubscription);
  }

  private loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUserValue();
  }

  private loadRecipe(id: number) {
    this.isLoading = true;
    this.errorMessage = '';
    
    const recipeSubscription = this.recipeService.getRecipe(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.selectedServings = recipe.servings;
        this.isLoading = false;
        
        console.log('Rezept geladen:', recipe);
        
        // Check if recipe is favorite (frontend-only state)
        this.checkFavoriteStatus();
      },
      error: (error) => {
        console.error('Fehler beim Laden des Rezepts:', error);
        this.isLoading = false;
        
        if (error.status === 404) {
          this.errorMessage = 'Rezept nicht gefunden.';
        } else if (error.status === 403) {
          this.errorMessage = 'Keine Berechtigung, dieses Rezept zu sehen.';
        } else {
          this.errorMessage = 'Fehler beim Laden des Rezepts.';
        }
      }
    });
    
    this.subscriptions.add(recipeSubscription);
  }

  private checkFavoriteStatus() {
    // Frontend-only favorite check - would be replaced with API call
    const favorites = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');
    this.isFavorite = favorites.includes(this.recipe?.id);
  }

  // Getters
  get isOwner(): boolean {
    return this.recipe?.author === this.currentUser?.username;
  }

  get difficultyInfo(): DifficultyInfo {
    return this.recipe ? this.difficultyMap[this.recipe.difficulty] : this.difficultyMap['medium'];
  }

  get scaledIngredients(): any[] {
    if (!this.recipe) return [];
    
    const scale = this.selectedServings / this.recipe.servings;
    return this.recipe.recipe_ingredients.map(ingredient => ({
      ...ingredient,
      scaledAmount: (ingredient.amount * scale).toFixed(2).replace(/\.?0+$/, '')
    }));
  }

  get instructionSteps(): string[] {
    if (!this.recipe) return [];
    return this.recipe.instructions.split('\n').filter(step => step.trim());
  }

  get displayedInstructions(): string[] {
    const steps = this.instructionSteps;
    return this.showFullInstructions ? steps : steps.slice(0, 5);
  }

  get hasMoreInstructions(): boolean {
    return this.instructionSteps.length > 5;
  }

  // Servings Management
  increaseServings() {
    if (this.selectedServings < 20) {
      this.selectedServings++;
    }
  }

  decreaseServings() {
    if (this.selectedServings > 1) {
      this.selectedServings--;
    }
  }

  resetServings() {
    this.selectedServings = this.recipe?.servings || 4;
  }

  // Favorite Management
  toggleFavorite() {
    if (!this.recipe) return;
    
    const favorites = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');
    
    if (this.isFavorite) {
      // Remove from favorites
      const index = favorites.indexOf(this.recipe.id);
      if (index > -1) {
        favorites.splice(index, 1);
      }
      this.isFavorite = false;
      console.log('Rezept aus Favoriten entfernt');
    } else {
      // Add to favorites
      favorites.push(this.recipe.id);
      this.isFavorite = true;
      console.log('Rezept zu Favoriten hinzugefügt');
    }
    
    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
    
    // TODO: Replace with API call to persist favorite status
  }

  // Navigation Actions
  editRecipe() {
    if (this.recipe) {
      this.router.navigate(['/recipes', this.recipe.id, 'edit']);
    }
  }

  goToRecipesList() {
    this.router.navigate(['/recipes']);
  }

  // Delete Actions
  confirmDelete() {
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  deleteRecipe() {
    if (!this.recipe) return;
    
    this.isDeleting = true;
    
    const deleteSubscription = this.recipeService.deleteRecipe(this.recipe.id).subscribe({
      next: () => {
        console.log('Rezept erfolgreich gelöscht');
        this.router.navigate(['/recipes']);
      },
      error: (error) => {
        console.error('Fehler beim Löschen des Rezepts:', error);
        this.errorMessage = 'Fehler beim Löschen des Rezepts.';
        this.isDeleting = false;
        this.showDeleteModal = false;
      }
    });
    
    this.subscriptions.add(deleteSubscription);
  }

  // Share Actions
  openShareModal() {
    this.showShareModal = true;
  }

  closeShareModal() {
    this.showShareModal = false;
  }

  async shareRecipe(method: 'link' | 'copy') {
    if (!this.recipe) return;
    
    const url = window.location.href;
    
    if (method === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        console.log('Link in Zwischenablage kopiert');
        // TODO: Show success toast
      } catch (err) {
        console.error('Fehler beim Kopieren:', err);
        // Fallback for older browsers
        this.fallbackCopyTextToClipboard(url);
      }
    } else if (method === 'link' && this.canShare) {
      try {
        await navigator.share({
          title: this.recipe.title,
          text: this.recipe.description,
          url: url,
        });
      } catch (err) {
        console.log('Teilen abgebrochen oder nicht unterstützt');
      }
    }
    
    this.closeShareModal();
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('Link in Zwischenablage kopiert (Fallback)');
    } catch (err) {
      console.error('Fallback: Kopieren fehlgeschlagen', err);
    }
    
    document.body.removeChild(textArea);
  }

  // Instructions Display
  toggleInstructions() {
    this.showFullInstructions = !this.showFullInstructions;
  }

  // Utility Methods
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} Min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    
    // Show placeholder
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  // Print Recipe
  printRecipe() {
    window.print();
  }

  // Add to Meal Plan (placeholder)
  addToMealPlan() {
    console.log('Add to meal plan - not implemented yet');
    // TODO: Navigate to meal planner with pre-selected recipe
    this.router.navigate(['/planner'], { 
      queryParams: { recipe: this.recipe?.id } 
    });
  }

  // Generate Shopping List (placeholder)
  addToShoppingList() {
    console.log('Add to shopping list - not implemented yet');
    // TODO: Navigate to shopping list creation with pre-selected ingredients
    this.router.navigate(['/shopping/new'], { 
      queryParams: { recipe: this.recipe?.id } 
    });
  }

  // Track By Function for ngFor optimization
  trackByIngredientId(index: number, ingredient: any): number {
    return ingredient.id;
  }
}