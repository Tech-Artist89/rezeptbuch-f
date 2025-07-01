// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api', // Hier später deine Production URL
  endpoints: {
    // Users API
    users: '/users',
    userProfile: '/users/profiles/my_profile',
    userMe: '/users/users/me',
    
    // Recipes API  
    recipes: '/recipes',
    
    // Ingredients API
    ingredients: '/ingredients',
    
    // Categories API
    categories: '/categories',
    
    // Meal Planner API
    mealPlans: '/planner',
    mealPlansCurrentWeek: '/planner/current_week',
    mealPlansWeek: '/planner/week',
    
    // Shopping Lists API
    shoppingLists: '/shopping/lists',
    shoppingListItems: '/shopping/items',
    generateShoppingList: (id: number) => `/shopping/lists/${id}/generate_from_meal_plans`,
    togglePurchased: (id: number) => `/shopping/items/${id}/toggle_purchased`
  }
};