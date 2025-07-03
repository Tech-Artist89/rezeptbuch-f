import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { ShoppingListService, ShoppingListFilters } from '../../../../services/shopping-list.service';
import { ShoppingList, ShoppingListItem, ShoppingListCreate } from '../../../../models/shopping-list.model';
import { IngredientService } from '../../../../services/ingredient.service';
import { Ingredient } from '../../../../models/ingredient.model';

interface StatusOption {
  value: boolean | null;
  label: string;
  icon: string;
}

interface SortOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  // Data Properties
  shoppingLists: ShoppingList[] = [];
  filteredShoppingLists: ShoppingList[] = [];
  ingredients: Ingredient[] = [];
  isLoading = true;
  
  // Search and Filter Properties
  searchTerm = '';
  selectedStatus: boolean | null = null;
  selectedDateRange: string = '';
  showSortMenu = false;
  
  // Modal Properties
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showItemsModal = false;
  shoppingListToEdit: ShoppingList | null = null;
  shoppingListToDelete: ShoppingList | null = null;
  shoppingListToViewItems: ShoppingList | null = null;
  
  // Form Properties
  shoppingListForm: ShoppingListCreate = {
    name: '',
    start_date: '',
    end_date: ''
  };
  
  // Search Subject for debouncing
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  
  // Debug Properties
  debugMode = false;
  
  // Status Options
  statusOptions: StatusOption[] = [
    { value: null, label: 'Alle', icon: 'bi bi-list' },
    { value: false, label: 'Aktiv', icon: 'bi bi-play-circle' },
    { value: true, label: 'Abgeschlossen', icon: 'bi bi-check-circle' }
  ];
  
  // Sort Options
  sortOptions: SortOption[] = [
    { value: 'created_desc', label: 'Neueste zuerst', icon: 'bi bi-sort-down' },
    { value: 'created_asc', label: 'Älteste zuerst', icon: 'bi bi-sort-up' },
    { value: 'name_asc', label: 'A-Z', icon: 'bi bi-sort-alpha-down' },
    { value: 'name_desc', label: 'Z-A', icon: 'bi bi-sort-alpha-up' },
    { value: 'start_date_asc', label: 'Startdatum aufsteigend', icon: 'bi bi-calendar' },
    { value: 'start_date_desc', label: 'Startdatum absteigend', icon: 'bi bi-calendar-fill' }
  ];
  
  currentSort: SortOption = this.sortOptions[0];
  
  constructor(
    private shoppingListService: ShoppingListService,
    private ingredientService: IngredientService
  ) {}
  
  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadShoppingLists();
    this.loadIngredients();
    this.initializeDateRange();
    
    // Document click listener for modals and menus
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
    
    // Close sort menu if clicking outside
    if (!target.closest('.sort-dropdown')) {
      this.showSortMenu = false;
    }
  }
  
  private initializeDateRange() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    this.shoppingListForm.start_date = this.formatDateForInput(startOfWeek);
    this.shoppingListForm.end_date = this.formatDateForInput(endOfWeek);
  }
  
  // Data Loading
  loadShoppingLists() {
    this.isLoading = true;
    this.log('Loading shopping lists...');
    
    const filters: ShoppingListFilters = {};
    
    if (this.selectedStatus !== null) {
      filters.is_completed = this.selectedStatus;
    }
    
    if (this.selectedDateRange) {
      const [start, end] = this.selectedDateRange.split(' - ');
      if (start && end) {
        filters.date_range = { start, end };
      }
    }
    
    const subscription = this.shoppingListService.getShoppingLists(filters).subscribe({
      next: (data) => {
        this.shoppingLists = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.isLoading = false;
        this.log('Shopping lists loaded successfully:', data);
      },
      error: (error) => {
        console.error('Error loading shopping lists:', error);
        this.shoppingLists = [];
        this.filteredShoppingLists = [];
        this.isLoading = false;
        alert('Fehler beim Laden der Einkaufslisten');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  loadIngredients() {
    const subscription = this.ingredientService.getIngredients().subscribe({
      next: (data) => {
        this.ingredients = data;
        this.log('Ingredients loaded:', data);
      },
      error: (error) => {
        console.error('Error loading ingredients:', error);
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
  
  onStatusChange(status: boolean | null) {
    this.selectedStatus = status;
    this.loadShoppingLists();
  }
  
  onDateRangeChange() {
    this.loadShoppingLists();
  }
  
  private applyFilters() {
    let filtered = [...(this.shoppingLists || [])];
    
    // Search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(list => 
        list && list.name && list.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    this.applySorting(filtered);
    
    this.filteredShoppingLists = filtered;
    this.log('Filtered shopping lists:', filtered);
  }
  
  private applySorting(lists: ShoppingList[]) {
    switch (this.currentSort.value) {
      case 'created_desc':
        lists.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'created_asc':
        lists.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'name_asc':
        lists.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        lists.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'start_date_asc':
        lists.sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'start_date_desc':
        lists.sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }
  }
  
  // Sorting Functions
  selectSort(option: SortOption) {
    this.currentSort = option;
    this.showSortMenu = false;
    this.applyFilters();
    this.log('Sort changed to:', option);
  }
  
  toggleSortMenu() {
    this.showSortMenu = !this.showSortMenu;
  }
  
  // Modal Functions
  openCreateModal() {
    this.resetForm();
    this.initializeDateRange();
    this.showCreateModal = true;
    this.log('Opened create modal');
  }
  
  openEditModal(shoppingList: ShoppingList) {
    this.shoppingListToEdit = shoppingList;
    this.shoppingListForm = {
      name: shoppingList.name,
      start_date: shoppingList.start_date,
      end_date: shoppingList.end_date
    };
    this.showEditModal = true;
    this.log('Opened edit modal for shopping list:', shoppingList);
  }
  
  openDeleteModal(shoppingList: ShoppingList) {
    this.shoppingListToDelete = shoppingList;
    this.showDeleteModal = true;
    this.log('Opened delete modal for shopping list:', shoppingList);
  }
  
  openItemsModal(shoppingList: ShoppingList) {
    this.shoppingListToViewItems = shoppingList;
    this.showItemsModal = true;
    this.log('Opened items modal for shopping list:', shoppingList);
  }
  
  closeAllModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showItemsModal = false;
    this.shoppingListToEdit = null;
    this.shoppingListToDelete = null;
    this.shoppingListToViewItems = null;
    this.resetForm();
    this.log('Closed all modals');
  }
  
  // Form Functions
  resetForm() {
    this.shoppingListForm = {
      name: '',
      start_date: '',
      end_date: ''
    };
  }
  
  validateForm(): boolean {
    if (!this.shoppingListForm || !this.shoppingListForm.name || !this.shoppingListForm.name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return false;
    }
    
    if (!this.shoppingListForm.start_date) {
      alert('Bitte geben Sie ein Startdatum ein');
      return false;
    }
    
    if (!this.shoppingListForm.end_date) {
      alert('Bitte geben Sie ein Enddatum ein');
      return false;
    }
    
    try {
      const startDate = new Date(this.shoppingListForm.start_date);
      const endDate = new Date(this.shoppingListForm.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Ungültiges Datumsformat');
        return false;
      }
      
      if (startDate > endDate) {
        alert('Das Startdatum muss vor dem Enddatum liegen');
        return false;
      }
    } catch {
      alert('Fehler bei der Datumsvalidierung');
      return false;
    }
    
    return true;
  }
  
  // CRUD Functions
  saveShoppingList() {
    if (!this.validateForm()) return;
    
    if (this.showCreateModal) {
      this.createShoppingList();
    } else if (this.showEditModal && this.shoppingListToEdit) {
      this.updateShoppingList();
    }
  }
  
  private createShoppingList() {
    this.log('Creating shopping list:', this.shoppingListForm);
    
    const subscription = this.shoppingListService.createShoppingList(this.shoppingListForm).subscribe({
      next: (newShoppingList) => {
        this.shoppingLists.push(newShoppingList);
        this.applyFilters();
        this.closeAllModals();
        alert('Einkaufsliste erfolgreich erstellt');
        this.log('Shopping list created successfully:', newShoppingList);
      },
      error: (error) => {
        console.error('Error creating shopping list:', error);
        alert('Fehler beim Erstellen der Einkaufsliste');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  private updateShoppingList() {
    if (!this.shoppingListToEdit) return;
    
    this.log('Updating shopping list:', { id: this.shoppingListToEdit.id, form: this.shoppingListForm });
    
    const subscription = this.shoppingListService.updateShoppingList(
      this.shoppingListToEdit.id,
      this.shoppingListForm
    ).subscribe({
      next: (updatedShoppingList) => {
        const index = this.shoppingLists.findIndex(sl => sl.id === updatedShoppingList.id);
        if (index !== -1) {
          this.shoppingLists[index] = updatedShoppingList;
          this.applyFilters();
        }
        this.closeAllModals();
        alert('Einkaufsliste erfolgreich aktualisiert');
        this.log('Shopping list updated successfully:', updatedShoppingList);
      },
      error: (error) => {
        console.error('Error updating shopping list:', error);
        alert('Fehler beim Aktualisieren der Einkaufsliste');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  confirmDelete() {
    if (!this.shoppingListToDelete) return;
    
    this.log('Deleting shopping list:', this.shoppingListToDelete);
    
    const subscription = this.shoppingListService.deleteShoppingList(this.shoppingListToDelete.id).subscribe({
      next: () => {
        this.shoppingLists = this.shoppingLists.filter(sl => sl.id !== this.shoppingListToDelete!.id);
        this.applyFilters();
        this.closeAllModals();
        alert('Einkaufsliste erfolgreich gelöscht');
        this.log('Shopping list deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting shopping list:', error);
        alert('Fehler beim Löschen der Einkaufsliste');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // Status Toggle Functions
  toggleShoppingListStatus(shoppingList: ShoppingList) {
    const newStatus = !shoppingList.is_completed;
    
    this.log('Toggling shopping list status:', { id: shoppingList.id, newStatus });
    
    const subscription = this.shoppingListService.patchShoppingList(
      shoppingList.id,
      { is_completed: newStatus }
    ).subscribe({
      next: (updatedShoppingList) => {
        const index = this.shoppingLists.findIndex(sl => sl.id === updatedShoppingList.id);
        if (index !== -1) {
          this.shoppingLists[index] = updatedShoppingList;
          this.applyFilters();
        }
        this.log('Shopping list status toggled successfully');
      },
      error: (error) => {
        console.error('Error toggling shopping list status:', error);
        alert('Fehler beim Ändern des Status');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // Quick Actions
  createWeeklyShoppingList() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startDateString = this.formatDateForInput(startOfWeek);
    
    this.log('Creating weekly shopping list for:', startDateString);
    
    const subscription = this.shoppingListService.createWeeklyShoppingList(startDateString).subscribe({
      next: (newShoppingList) => {
        this.shoppingLists.push(newShoppingList);
        this.applyFilters();
        alert('Wöchentliche Einkaufsliste erfolgreich erstellt');
        this.log('Weekly shopping list created successfully:', newShoppingList);
      },
      error: (error) => {
        console.error('Error creating weekly shopping list:', error);
        alert('Fehler beim Erstellen der wöchentlichen Einkaufsliste');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  generateFromMealPlans(shoppingList: ShoppingList) {
    this.log('Generating shopping list from meal plans:', shoppingList.id);
    
    const subscription = this.shoppingListService.generateFromMealPlans(shoppingList.id).subscribe({
      next: (response) => {
        alert(`${response.items_count} Artikel zur Einkaufsliste hinzugefügt`);
        this.loadShoppingLists(); // Reload to get updated data
        this.log('Shopping list generated from meal plans:', response);
      },
      error: (error) => {
        console.error('Error generating from meal plans:', error);
        alert('Fehler beim Generieren der Einkaufsliste aus Mahlzeitenplänen');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // Utility Functions
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
  
  formatDateForInput(date: Date): string {
    if (!date || !(date instanceof Date)) return '';
    try {
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  
  getProgressPercentage(shoppingList: ShoppingList): number {
    if (!shoppingList || !shoppingList.total_items || shoppingList.total_items === 0) return 0;
    const purchased = shoppingList.purchased_items || 0;
    return Math.round((purchased / shoppingList.total_items) * 100);
  }
  
  getStatusText(isCompleted: boolean): string {
    return isCompleted ? 'Abgeschlossen' : 'Aktiv';
  }
  
  getStatusIcon(isCompleted: boolean): string {
    return isCompleted ? 'bi bi-check-circle-fill' : 'bi bi-play-circle';
  }
  
  trackByShoppingList(_index: number, shoppingList: ShoppingList): number {
    return shoppingList.id;
  }
  
  getActiveListsCount(): number {
    return (this.shoppingLists || []).filter(list => list && !list.is_completed).length;
  }
  
  getCompletedListsCount(): number {
    return (this.shoppingLists || []).filter(list => list && list.is_completed).length;
  }
  
  private log(message: string, data?: any) {
    if (this.debugMode) {
      if (data) {
        console.log(`[ShoppingListComponent] ${message}`, data);
      } else {
        console.log(`[ShoppingListComponent] ${message}`);
      }
    }
  }
  
  // Toggle Debug Mode
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.log('Debug mode toggled:', this.debugMode);
  }
}
