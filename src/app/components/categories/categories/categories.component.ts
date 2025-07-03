import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { CategoryService } from '../../../services/category.service';
import { Category, CategoryCreate } from '../../../models/category.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit, OnDestroy {
  // Data Properties
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  isLoading = true;
  
  // Search Properties
  searchTerm = '';
  
  // Modal Properties
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  categoryToEdit: Category | null = null;
  categoryToDelete: Category | null = null;
  
  // Form Properties
  categoryForm: CategoryCreate = {
    name: '',
    description: ''
  };
  
  // Search Subject for debouncing
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  
  // Debug Properties
  debugMode = false;
  
  constructor(private categoryService: CategoryService) {}
  
  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadCategories();
    
    // Document click listener for modal close
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
    
    // Close modals if clicking outside
    if (target.classList.contains('modal-overlay')) {
      this.closeAllModals();
    }
  }
  
  // Data Loading
  loadCategories() {
    this.isLoading = true;
    this.log('Loading categories...');
    
    const subscription = this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.filteredCategories = [...this.categories];
        this.isLoading = false;
        this.log('Categories loaded successfully:', data);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
        alert('Fehler beim Laden der Kategorien');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // Search & Filter Functions
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }
  
  private applyFilters() {
    let filtered = [...this.categories];
    
    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredCategories = filtered;
    this.log('Filtered categories:', filtered);
  }
  
  // Modal Functions
  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
    this.log('Opened add modal');
  }
  
  openEditModal(category: Category) {
    this.categoryToEdit = category;
    this.categoryForm = {
      name: category.name,
      description: category.description
    };
    this.showEditModal = true;
    this.log('Opened edit modal for category:', category);
  }
  
  openDeleteModal(category: Category) {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
    this.log('Opened delete modal for category:', category);
  }
  
  closeAllModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.categoryToEdit = null;
    this.categoryToDelete = null;
    this.resetForm();
    this.log('Closed all modals');
  }
  
  // Form Functions
  resetForm() {
    this.categoryForm = {
      name: '',
      description: ''
    };
  }
  
  validateForm(): boolean {
    if (!this.categoryForm.name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return false;
    }
    
    if (this.categoryForm.name.trim().length < 2) {
      alert('Der Name muss mindestens 2 Zeichen lang sein');
      return false;
    }
    
    return true;
  }
  
  // CRUD Functions
  saveCategory() {
    if (!this.validateForm()) return;
    
    if (this.showAddModal) {
      this.createCategory();
    } else if (this.showEditModal && this.categoryToEdit) {
      this.updateCategory();
    }
  }
  
  private createCategory() {
    this.log('Creating category:', this.categoryForm);
    
    const subscription = this.categoryService.createCategory(this.categoryForm).subscribe({
      next: (newCategory) => {
        this.categories.push(newCategory);
        this.applyFilters();
        this.closeAllModals();
        alert('Kategorie erfolgreich erstellt');
        this.log('Category created successfully:', newCategory);
      },
      error: (error) => {
        console.error('Error creating category:', error);
        alert('Fehler beim Erstellen der Kategorie');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  private updateCategory() {
    if (!this.categoryToEdit) return;
    
    this.log('Updating category:', { id: this.categoryToEdit.id, form: this.categoryForm });
    
    const subscription = this.categoryService.updateCategory(
      this.categoryToEdit.id,
      this.categoryForm
    ).subscribe({
      next: (updatedCategory) => {
        const index = this.categories.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
          this.categories[index] = updatedCategory;
          this.applyFilters();
        }
        this.closeAllModals();
        alert('Kategorie erfolgreich aktualisiert');
        this.log('Category updated successfully:', updatedCategory);
      },
      error: (error) => {
        console.error('Error updating category:', error);
        alert('Fehler beim Aktualisieren der Kategorie');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  confirmDelete() {
    if (!this.categoryToDelete) return;
    
    this.log('Deleting category:', this.categoryToDelete);
    
    const subscription = this.categoryService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== this.categoryToDelete!.id);
        this.applyFilters();
        this.closeAllModals();
        alert('Kategorie erfolgreich gelöscht');
        this.log('Category deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        alert('Fehler beim Löschen der Kategorie');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // Utility Functions
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  trackByCategory(_index: number, category: Category): number {
    return category.id;
  }
  
  private log(message: string, data?: any) {
    if (this.debugMode) {
      if (data) {
        console.log(`[CategoriesComponent] ${message}`, data);
      } else {
        console.log(`[CategoriesComponent] ${message}`);
      }
    }
  }
  
  // Toggle Debug Mode
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.log('Debug mode toggled:', this.debugMode);
  }
}