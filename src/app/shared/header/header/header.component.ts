import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../services/auth.service';

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Navigation state
  isNavOpen = false;
  currentRoute = '';
  isScrolled = false;
  
  // User state
  isAuthenticated = false;
  currentUser: any = null;
  showUserMenu = false;
  
  private subscriptions = new Subscription();
  
  // Navigation items
  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'bi bi-house',
      description: 'Übersicht und Statistiken'
    },
    {
      label: 'Rezepte',
      route: '/recipes',
      icon: 'bi bi-book',
      description: 'Meine Rezeptsammlung'
    },
    {
      label: 'Kategorien',
      route: '/categories',
      icon: 'bi bi-tags',
      description: 'Rezeptkategorien verwalten'
    },
    {
      label: 'Zutaten',
      route: '/ingredients',
      icon: 'bi bi-basket',
      description: 'Zutatenverwaltung'
    },
    {
      label: 'Einkaufslisten',
      route: '/shopping',
      icon: 'bi bi-cart',
      description: 'Einkaufsplanung'
    },
    {
      label: 'Meal Planner',
      route: '/planner',
      icon: 'bi bi-calendar-week',
      description: 'Mahlzeitenplanung'
    }
  ];
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    this.initializeComponent();
    this.subscribeToRouteChanges();
    this.subscribeToAuthState();
    
    // Document click listener
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }
  
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }
  
  private initializeComponent() {
    this.currentRoute = this.router.url;
    this.checkAuthenticationState();
  }
  
  private subscribeToRouteChanges() {
    const routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.closeNavigation();
      this.closeUserMenu();
    });
    
    this.subscriptions.add(routeSubscription);
  }
  
  private subscribeToAuthState() {
    // Mock authentication state for now
    // In a real app, you would subscribe to the auth service
    this.isAuthenticated = true;
    this.currentUser = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      avatar: null
    };
  }
  
  private checkAuthenticationState() {
    // Check if user is authenticated
    // This would typically check a token or session
    this.isAuthenticated = true;
  }
  
  private handleDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    
    // Close navigation if clicking outside
    if (!target.closest('.mobile-nav') && !target.closest('.nav-toggle')) {
      this.closeNavigation();
    }
    
    // Close user menu if clicking outside
    if (!target.closest('.user-menu') && !target.closest('.user-avatar')) {
      this.closeUserMenu();
    }
  }
  
  // Navigation methods
  toggleNavigation() {
    this.isNavOpen = !this.isNavOpen;
    this.closeUserMenu();
  }
  
  closeNavigation() {
    this.isNavOpen = false;
  }
  
  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }
  
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeNavigation();
  }
  
  // User menu methods
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.closeNavigation();
  }
  
  closeUserMenu() {
    this.showUserMenu = false;
  }
  
  // User actions
  navigateToProfile() {
    this.router.navigate(['/profile']);
    this.closeUserMenu();
  }
  
  navigateToSettings() {
    this.router.navigate(['/settings']);
    this.closeUserMenu();
  }
  
  logout() {
    // Implement logout logic
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
        this.closeUserMenu();
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still navigate to login even if logout fails
        this.router.navigate(['/login']);
        this.closeUserMenu();
      }
    });
  }
  
  // Utility methods
  getRouteTitle(): string {
    const activeItem = this.navigationItems.find(item => this.isActiveRoute(item.route));
    return activeItem ? activeItem.label : 'Rezeptbuch';
  }
  
  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.name) return 'U';
    
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0] || 'U';
  }
  
  // Quick actions
  quickCreateRecipe() {
    this.router.navigate(['/recipes/new']);
  }
  
  quickCreateShoppingList() {
    this.router.navigate(['/shopping/new']);
  }
  
  openSearch() {
    // Implement global search functionality
    console.log('Open global search');
  }
}
