// src/app/components/recipes/recipes-form/recipes-form/recipes-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { RecipeService } from '../../../../services/recipe.service';
import { CategoryService } from '../../../../services/category.service';
import { IngredientService } from '../../../../services/ingredient.service';
import { 
  Recipe, 
  RecipeCreate, 
  RecipeUpdate, 
  DifficultyLevel,
  RecipeIngredientCreate 
} from '../../../../models/recipe.model';
import { Category } from '../../../../models/category.model';
import { Ingredient } from '../../../../models/ingredient.model';

interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-recipes-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './recipes-form.component.html',
  styleUrls: ['./recipes-form.component.scss'],
})
export class RecipesFormComponent implements OnInit, OnDestroy {
  // Form Properties
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: number | null = null;
  
  // Loading States
  isLoading = false;
  isSaving = false;
  isLoadingData = true;
  
  // Data Properties
  categories: Category[] = [];
  ingredients: Ingredient[] = [];
  filteredIngredients: Ingredient[] = [];
  
  // Data loading flags
  private categoriesLoaded = false;
  private ingredientsLoaded = false;
  
  // Form State
  selectedImage: File | null = null;
  previewUrl: string | null = null;
  errorMessage = '';
  
  // Subscriptions
  private subscriptions = new Subscription();
  
  // Difficulty Options
  difficultyOptions: DifficultyOption[] = [
    {
      value: 'easy',
      label: 'Einfach',
      icon: 'bi bi-star',
      description: 'Für Anfänger geeignet'
    },
    {
      value: 'medium',
      label: 'Mittel',
      icon: 'bi bi-star-fill',
      description: 'Etwas Erfahrung erforderlich'
    },
    {
      value: 'hard',
      label: 'Schwer',
      icon: 'bi bi-stars',
      description: 'Für erfahrene Köche'
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private ingredientService: IngredientService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.recipeForm = this.createForm();
    
    // CRITICAL: Initialize private arrays immediately
    this.categories = [];
    this.ingredients = [];
    this.filteredIngredients = [];
    this.categoriesLoaded = false;
    this.ingredientsLoaded = false;
    
    console.log('🏗️ Constructor: Arrays initialized as:', {
      categories: Array.isArray(this.categories),
      ingredients: Array.isArray(this.ingredients),
      filteredIngredients: Array.isArray(this.filteredIngredients)
    });
  }

  ngOnInit() {
    this.initializeComponent();
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeComponent() {
    // Check if we're in edit mode
    const routeSubscription = this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.recipeId = +params['id'];
        // DON'T load recipe immediately - wait for ingredients to load first
        console.log('🔄 Edit mode detected, will load recipe after ingredients are loaded');
      } else {
        this.isLoadingData = false;
      }
    });
    
    this.subscriptions.add(routeSubscription);
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      instructions: ['', [Validators.required, Validators.minLength(20)]],
      prep_time: [30, [Validators.required, Validators.min(1), Validators.max(600)]],
      cook_time: [30, [Validators.required, Validators.min(0), Validators.max(600)]],
      servings: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
      difficulty: ['medium', [Validators.required]],
      category_ids: [[]],
      is_public: [false],
      recipe_ingredients: this.formBuilder.array([])
    });
  }

  // Getter for recipe ingredients FormArray
  get recipeIngredients(): FormArray {
    return this.recipeForm.get('recipe_ingredients') as FormArray;
  }

  // Getter for total time
  get totalTime(): number {
    const prepTime = this.recipeForm.get('prep_time')?.value || 0;
    const cookTime = this.recipeForm.get('cook_time')?.value || 0;
    return prepTime + cookTime;
  }

  // Typsichere Helper-Methode für Response-Handling
  private ensureArrayResponse<T>(response: unknown): T[] {
    console.log('🔍 Processing response:', response, 'Type:', typeof response);
    
    if (Array.isArray(response)) {
      return response as T[];
    }
    
    if (response && typeof response === 'object') {
      // Check for paginated response structure
      const responseObj = response as Record<string, unknown>;
      
      if ('results' in responseObj && Array.isArray(responseObj['results'])) {
        return responseObj['results'] as T[];
      }
      
      if ('data' in responseObj && Array.isArray(responseObj['data'])) {
        return responseObj['data'] as T[];
      }
      
      // Try to convert object values to array
      try {
        const values = Object.values(responseObj);
        if (values.length > 0 && values.every(item => typeof item === 'object' && item !== null)) {
          return values as T[];
        }
      } catch (error) {
        console.warn('⚠️ Could not convert object to array:', error);
      }
    }
    
    console.warn('⚠️ Response is not array-like, returning empty array');
    return [];
  }

  private loadInitialData() {
    console.log('🔄 loadInitialData started');
    
    // Load categories
    const categoriesSubscription = this.categoryService.getCategories().subscribe({
      next: (response) => {
        console.log('📦 Categories response received:', response);
        this.categories = this.ensureArrayResponse<Category>(response);
        this.categoriesLoaded = true;
        this.checkDataLoadingComplete();
        console.log('✅ Categories loaded:', this.categories.length);
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
        this.categories = [];
        this.categoriesLoaded = true;
        this.checkDataLoadingComplete();
      }
    });

    // Load ingredients
    const ingredientsSubscription = this.ingredientService.getIngredients().subscribe({
      next: (response) => {
        console.log('🥕 Ingredients response received:', response);
        this.ingredients = this.ensureArrayResponse<Ingredient>(response);
        this.filteredIngredients = [...this.ingredients];
        this.ingredientsLoaded = true;
        this.checkDataLoadingComplete();
        console.log('✅ Ingredients loaded:', this.ingredients.length);
        console.log('✅ Ingredients final check - isArray:', Array.isArray(this.ingredients));
      },
      error: (error) => {
        console.error('❌ Error loading ingredients:', error);
        this.ingredients = [];
        this.filteredIngredients = [];
        this.ingredientsLoaded = true;
        this.checkDataLoadingComplete();
      }
    });

    this.subscriptions.add(categoriesSubscription);
    this.subscriptions.add(ingredientsSubscription);
  }

  private checkDataLoadingComplete() {
    if (this.categoriesLoaded && this.ingredientsLoaded) {
      console.log('📋 All initial data loaded successfully');
      console.log('📋 Final arrays status:', {
        categories: { isArray: Array.isArray(this.categories), length: this.categories.length },
        ingredients: { isArray: Array.isArray(this.ingredients), length: this.ingredients.length },
        filteredIngredients: { isArray: Array.isArray(this.filteredIngredients), length: this.filteredIngredients.length }
      });
      
      // NOW load the recipe if we're in edit mode
      if (this.isEditMode && this.recipeId && !this.isLoading) {
        console.log('🔄 Loading recipe now that ingredients are available');
        this.loadRecipe(this.recipeId);
      } else if (!this.isEditMode) {
        this.isLoadingData = false;
      }
    }
  }

  private loadRecipe(id: number) {
    console.log('📖 Loading recipe with ID:', id);
    
    // Ensure ingredients are loaded before proceeding
    if (!Array.isArray(this.ingredients) || this.ingredients.length === 0) {
      console.log('⏳ Ingredients not yet loaded, waiting...');
      
      // Retry after ingredients are loaded
      const checkIngredientsInterval = setInterval(() => {
        if (Array.isArray(this.ingredients) && this.ingredients.length > 0) {
          console.log('✅ Ingredients now available, loading recipe');
          clearInterval(checkIngredientsInterval);
          this.performRecipeLoad(id);
        }
      }, 100); // Check every 100ms
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkIngredientsInterval);
        if (!Array.isArray(this.ingredients) || this.ingredients.length === 0) {
          console.warn('⚠️ Timeout waiting for ingredients, loading recipe anyway');
          this.performRecipeLoad(id);
        }
      }, 5000);
      
      return;
    }
    
    this.performRecipeLoad(id);
  }

  private performRecipeLoad(id: number) {
    console.log('📖 Ingredients status before loading recipe:', {
      type: typeof this.ingredients,
      isArray: Array.isArray(this.ingredients),
      length: this.ingredients?.length,
      value: this.ingredients
    });
    
    this.isLoading = true;
    
    const recipeSubscription = this.recipeService.getRecipe(id).subscribe({
      next: (recipe) => {
        console.log('📖 Recipe loaded successfully:', recipe);
        console.log('📖 Ingredients status after recipe load but before populate:', {
          type: typeof this.ingredients,
          isArray: Array.isArray(this.ingredients),
          length: this.ingredients?.length
        });
        
        this.populateForm(recipe);
        this.isLoading = false;
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('❌ Error loading recipe:', error);
        this.errorMessage = 'Rezept konnte nicht geladen werden.';
        this.isLoading = false;
        this.isLoadingData = false;
      }
    });

    this.subscriptions.add(recipeSubscription);
  }

// Füge diese Debug-Methode zu deiner Component hinzu
debugBackendStructure(recipe: any) {
  console.log('🔍 BACKEND STRUCTURE DEBUG:');
  console.log('📋 Full recipe object:', recipe);
  
  if (recipe.categories) {
    console.log('📋 Categories structure:', recipe.categories);
    console.log('📋 Categories type:', typeof recipe.categories);
    console.log('📋 Categories is array:', Array.isArray(recipe.categories));
  }
  
  if (recipe.recipe_ingredients) {
    console.log('📋 Recipe ingredients structure:', recipe.recipe_ingredients);
    console.log('📋 First ingredient structure:', recipe.recipe_ingredients[0]);
    
    recipe.recipe_ingredients.forEach((item: any, index: number) => {
      console.log(`📋 Ingredient ${index}:`, {
        has_ingredient_id: 'ingredient_id' in item,
        has_ingredient_object: 'ingredient' in item,
        ingredient_id_value: item.ingredient_id,
        ingredient_object: item.ingredient,
        ingredient_nested_id: item.ingredient?.id,
        amount: item.amount,
        unit: item.unit
      });
    });
  }
}

// Rufe diese Methode am Anfang von populateForm auf:
// this.debugBackendStructure(recipe);

  private populateForm(recipe: Recipe) {
  console.log('📝 populateForm called with recipe:', recipe);
  console.log('📝 Current ingredients state:', {
    type: typeof this.ingredients,
    isArray: Array.isArray(this.ingredients),
    length: this.ingredients?.length
  });
  
  // CRITICAL: Ensure ingredients is an array before proceeding
  if (!Array.isArray(this.ingredients)) {
    console.warn('⚠️ Ingredients is not an array in populateForm, initializing as empty array');
    this.ingredients = [];
    this.filteredIngredients = [];
  }
  
  // Set form values
  this.recipeForm.patchValue({
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    category_ids: recipe.categories?.map(cat => cat.id) || [], // FIX: categories structure
    is_public: recipe.is_public
  });

  // Set image preview if exists
  if (recipe.image) {
    this.previewUrl = recipe.image;
  }

  // Clear existing ingredients and add recipe ingredients
  this.recipeIngredients.clear();
  
  // CRITICAL: Ensure recipe_ingredients is always treated as array
  let recipeIngredientsArray: any[] = [];
  
  if (recipe.recipe_ingredients) {
    if (Array.isArray(recipe.recipe_ingredients)) {
      recipeIngredientsArray = recipe.recipe_ingredients;
    } else if (typeof recipe.recipe_ingredients === 'object') {
      // Convert object to array if needed
      recipeIngredientsArray = Object.values(recipe.recipe_ingredients);
    }
  }
  
  console.log('📝 Processing recipe ingredients array:', recipeIngredientsArray);
  
  // Add each recipe ingredient WITH DELAY for better change detection
  recipeIngredientsArray.forEach((recipeIngredient: any, index: number) => {
    console.log(`📝 Adding ingredient ${index}:`, recipeIngredient);
    if (recipeIngredient && typeof recipeIngredient === 'object') {
      
      // CRITICAL FIX: Extract ingredient_id from the correct structure
      let ingredientId: number | undefined;
      
      if (recipeIngredient.ingredient_id) {
        // Direct ingredient_id (old structure)
        ingredientId = recipeIngredient.ingredient_id;
      } else if (recipeIngredient.ingredient && recipeIngredient.ingredient.id) {
        // Nested ingredient.id (current backend structure)
        ingredientId = recipeIngredient.ingredient.id;
      }
      
      console.log(`📝 Extracted ingredient ID: ${ingredientId} for ingredient:`, recipeIngredient);
      
      // Use setTimeout to ensure DOM is updated between additions
      setTimeout(() => {
        this.addRecipeIngredient(
          ingredientId,
          recipeIngredient.amount,
          recipeIngredient.unit,
          recipeIngredient.notes
        );
        
        // Log the current state after each addition
        console.log(`📝 After adding ingredient ${index}, form value:`, 
          this.recipeIngredients.at(this.recipeIngredients.length - 1)?.value
        );
      }, index * 50); // 50ms delay between each ingredient
    }
  });
  
  console.log('📝 Form populated, recipe ingredients count:', this.recipeIngredients.length);
  
  // Check form state after loading
  this.checkFormAfterLoad();
}

  // Recipe Ingredients Management
  createRecipeIngredientForm(ingredientId?: number, amount?: number, unit?: string, notes?: string): FormGroup {
    return this.formBuilder.group({
      ingredient_id: [ingredientId || '', [Validators.required]],
      amount: [amount || 1, [Validators.required, Validators.min(0.01)]],
      unit: [unit || '', [Validators.required]],
      notes: [notes || '']
    });
  }

  addRecipeIngredient(ingredientId?: number, amount?: number, unit?: string, notes?: string) {
    console.log('➕ Adding recipe ingredient:', { ingredientId, amount, unit, notes });
    console.log('➕ Available ingredients:', this.ingredients.map(ing => ({ id: ing.id, name: ing.name })));
    
    // Validate that ingredient exists in our loaded ingredients
    if (ingredientId && !this.ingredients.find(ing => ing.id === ingredientId)) {
      console.warn(`⚠️ Ingredient with ID ${ingredientId} not found in loaded ingredients`);
    }
    
    const ingredientForm = this.createRecipeIngredientForm(ingredientId, amount, unit, notes);
    this.recipeIngredients.push(ingredientForm);
    
    console.log('➕ Recipe ingredient added, total count:', this.recipeIngredients.length);
    console.log('➕ Added ingredient form value:', ingredientForm.value);
  }

  removeRecipeIngredient(index: number) {
    this.recipeIngredients.removeAt(index);
  }

  getIngredientName(ingredientId: number): string {
    if (!Array.isArray(this.ingredients)) {
      return 'Unbekannte Zutat';
    }
    
    const ingredient = this.ingredients.find(ing => ing && ing.id === ingredientId);
    return ingredient ? ingredient.name : 'Unbekannte Zutat';
  }

  filterIngredients(searchTerm: string, index: number) {
    console.log('🔍 filterIngredients called with:', searchTerm, 'ingredients type:', typeof this.ingredients, 'isArray:', Array.isArray(this.ingredients));
    
    // CRITICAL: Ensure ingredients is always an array
    if (!Array.isArray(this.ingredients)) {
      console.error('❌ this.ingredients is not an array! Type:', typeof this.ingredients, 'Value:', this.ingredients);
      this.ingredients = [];
      this.filteredIngredients = [];
      return;
    }
    
    if (!searchTerm || !searchTerm.trim()) {
      this.filteredIngredients = [...this.ingredients];
      return;
    }
    
    this.filteredIngredients = this.ingredients.filter(ingredient =>
      ingredient && ingredient.name && 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('✅ Filtered ingredients result:', this.filteredIngredients.length, 'items');
  }

  // Debug-Methoden
  debugFormState() {
    console.log('🔍 DEBUG: Current form state');
    console.log('📋 Ingredients loaded:', this.ingredients.length);
    console.log('📋 Recipe ingredients count:', this.recipeIngredients.length);
    
    this.recipeIngredients.controls.forEach((control, index) => {
      const value = control.value;
      const ingredientName = this.getIngredientName(value.ingredient_id);
      console.log(`📝 Ingredient ${index}:`, {
        id: value.ingredient_id,
        name: ingredientName,
        amount: value.amount,
        unit: value.unit,
        notes: value.notes,
        isValid: control.valid,
        errors: control.errors
      });
    });
  }

  // Methode um Form-Status nach dem Laden zu prüfen
  checkFormAfterLoad() {
    setTimeout(() => {
      console.log('🔍 Checking form 2 seconds after load...');
      this.debugFormState();
      
      // Check if dropdowns have the right options
      const firstIngredientControl = this.recipeIngredients.at(0);
      if (firstIngredientControl) {
        const selectedId = firstIngredientControl.get('ingredient_id')?.value;
        console.log('📝 First ingredient selected ID:', selectedId);
        console.log('📝 Does this ID exist in ingredients?', 
          this.ingredients.some(ing => ing.id == selectedId));
      }
    }, 2000);
  }

  // Image Handling
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Bitte wählen Sie eine gültige Bilddatei aus.';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Das Bild ist zu groß. Maximale Größe: 5MB.';
        return;
      }

      this.selectedImage = file;
      this.errorMessage = '';

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Category Selection
  onCategoryChange(categoryId: number, isChecked: boolean) {
    const currentCategories = this.recipeForm.get('category_ids')?.value || [];
    
    if (isChecked) {
      if (!currentCategories.includes(categoryId)) {
        this.recipeForm.patchValue({
          category_ids: [...currentCategories, categoryId]
        });
      }
    } else {
      this.recipeForm.patchValue({
        category_ids: currentCategories.filter((id: number) => id !== categoryId)
      });
    }
  }

  isCategorySelected(categoryId: number): boolean {
    const selectedCategories = this.recipeForm.get('category_ids')?.value || [];
    return selectedCategories.includes(categoryId);
  }

private validateFormBeforeSubmit(): boolean {
  console.log('🔍 Validating form before submit...');
  console.log('🔍 Form valid:', this.recipeForm.valid);
  console.log('🔍 Form value:', this.recipeForm.value);
  
  // Check recipe ingredients specifically
  const ingredients = this.recipeForm.get('recipe_ingredients')?.value || [];
  console.log('🔍 Recipe ingredients:', ingredients);
  
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    console.log(`🔍 Ingredient ${i}:`, ingredient);
    
    if (!ingredient.ingredient_id || ingredient.ingredient_id === '') {
      console.error(`❌ Ingredient ${i} has no ingredient_id`);
      this.errorMessage = `Zutat ${i + 1}: Bitte wählen Sie eine Zutat aus.`;
      return false;
    }
    
    if (!ingredient.amount || ingredient.amount <= 0) {
      console.error(`❌ Ingredient ${i} has invalid amount`);
      this.errorMessage = `Zutat ${i + 1}: Bitte geben Sie eine gültige Menge ein.`;
      return false;
    }
    
    if (!ingredient.unit || ingredient.unit.trim() === '') {
      console.error(`❌ Ingredient ${i} has no unit`);
      this.errorMessage = `Zutat ${i + 1}: Bitte geben Sie eine Einheit ein.`;
      return false;
    }
  }
  
  return true;
}

  // Form Submission
  onSubmit() {
  console.log('📝 Form submission started...');
  
  if (this.recipeForm.valid && !this.isSaving) {
    // Additional validation
    if (!this.validateFormBeforeSubmit()) {
      return;
    }
    
    this.isSaving = true;
    this.errorMessage = '';

    const formData = this.prepareFormData();
    
    if (this.isEditMode && this.recipeId) {
      this.updateRecipe(this.recipeId, formData);
    } else {
      this.createRecipe(formData);
    }
  } else {
    console.log('❌ Form is invalid, marking fields as touched');
    this.markFormGroupTouched();
  }
}

  private prepareFormData(): any {
  const formValue = this.recipeForm.value;
  
  console.log('🔄 Preparing form data from:', formValue);
  
  // Transform recipe ingredients to the format expected by backend
  const recipeIngredients = formValue.recipe_ingredients.map((ingredient: any) => ({
    ingredient_id: parseInt(ingredient.ingredient_id),
    amount: parseFloat(ingredient.amount),
    unit: ingredient.unit.trim(),
    notes: ingredient.notes ? ingredient.notes.trim() : ''
  }));
  
  console.log('🔄 Transformed recipe ingredients:', recipeIngredients);
  
  const recipeData: any = {
    title: formValue.title.trim(),
    description: formValue.description.trim(),
    instructions: formValue.instructions.trim(),
    prep_time: parseInt(formValue.prep_time),
    cook_time: parseInt(formValue.cook_time),
    servings: parseInt(formValue.servings),
    difficulty: formValue.difficulty,
    category_ids: formValue.category_ids,
    is_public: formValue.is_public,
    recipe_ingredients: recipeIngredients
  };

  // Add image if selected
  if (this.selectedImage) {
    recipeData.image = this.selectedImage;
  }
  
  console.log('📤 Final recipe data to send:', recipeData);

  return recipeData;
}

  private createRecipe(recipeData: any) {
    const createSubscription = this.recipeService.createRecipe(recipeData as RecipeCreate).subscribe({
      next: (recipe) => {
        console.log('Rezept erfolgreich erstellt:', recipe);
        this.router.navigate(['/recipes', recipe.id]);
      },
      error: (error) => {
        console.error('Fehler beim Erstellen des Rezepts:', error);
        this.errorMessage = 'Fehler beim Erstellen des Rezepts. Bitte versuchen Sie es erneut.';
        this.isSaving = false;
      }
    });

    this.subscriptions.add(createSubscription);
  }

  private updateRecipe(id: number, recipeData: any) {
  console.log('📤 Sending update request for recipe ID:', id);
  console.log('📤 Update data:', recipeData);
  
  const updateSubscription = this.recipeService.updateRecipe(id, recipeData as RecipeUpdate).subscribe({
    next: (recipe) => {
      console.log('✅ Recipe successfully updated:', recipe);
      this.router.navigate(['/recipes', recipe.id]);
    },
    error: (error) => {
      console.error('❌ Error updating recipe:', error);
      
      // Detaillierte Fehlerbehandlung
      if (error.status === 400) {
        this.errorMessage = 'Ungültige Daten. Bitte überprüfen Sie Ihre Eingaben.';
        console.error('❌ Validation errors:', error.error);
      } else if (error.status === 500) {
        this.errorMessage = 'Serverfehler beim Aktualisieren des Rezepts. Bitte versuchen Sie es erneut.';
        console.error('❌ Server error details:', error.error);
      } else {
        this.errorMessage = 'Fehler beim Aktualisieren des Rezepts. Bitte versuchen Sie es erneut.';
      }
      
      this.isSaving = false;
    }
  });

  this.subscriptions.add(updateSubscription);
}

  // Form Validation Helpers
  private markFormGroupTouched() {
    Object.keys(this.recipeForm.controls).forEach(key => {
      const control = this.recipeForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          Object.keys((arrayControl as FormGroup).controls).forEach(arrayControlKey => {
            arrayControl.get(arrayControlKey)?.markAsTouched();
          });
        });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.recipeForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} ist erforderlich.`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} ist zu kurz.`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} ist zu lang.`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} muss größer sein.`;
      if (field.errors['max']) return `${this.getFieldLabel(fieldName)} ist zu groß.`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      title: 'Titel',
      description: 'Beschreibung',
      instructions: 'Anleitung',
      prep_time: 'Vorbereitungszeit',
      cook_time: 'Kochzeit',
      servings: 'Portionen',
      difficulty: 'Schwierigkeit'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.recipeForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  // Navigation
  onCancel() {
    if (this.isEditMode && this.recipeId) {
      this.router.navigate(['/recipes', this.recipeId]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  // Helper Methods
  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByRecipeId(index: number, recipe: any): number {
    return recipe?.id || index;
  }

  trackByCategoryId(index: number, category: Category): number {
    return category?.id || index;
  }

  trackByIngredientId(index: number, ingredient: Ingredient): number {
    return ingredient?.id || index;
  }

  getDifficultyOption(value: DifficultyLevel): DifficultyOption {
    return this.difficultyOptions.find(option => option.value === value) || this.difficultyOptions[1];
  }
}