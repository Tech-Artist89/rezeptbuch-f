import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-user-registrierung',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-registrierung.component.html',
  styleUrl: './user-registrierung.component.scss'
})
export class UserRegistrierungComponent implements OnInit, OnDestroy {
  registrationForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  
  private subscriptions = new Subscription();
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}
  
  ngOnInit() {
    this.initializeForm();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  private initializeForm() {
    this.registrationForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }
  
  // Form getters for easy access
  get firstName() { return this.registrationForm.get('firstName'); }
  get lastName() { return this.registrationForm.get('lastName'); }
  get email() { return this.registrationForm.get('email'); }
  get password() { return this.registrationForm.get('password'); }
  get confirmPassword() { return this.registrationForm.get('confirmPassword'); }
  get acceptTerms() { return this.registrationForm.get('acceptTerms'); }
  
  // Password visibility toggles
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  // Form submission
  onSubmit() {
    if (this.registrationForm.valid && !this.isLoading) {
      this.registerUser();
    } else {
      this.markFormGroupTouched();
    }
  }
  
  private registerUser() {
    this.isLoading = true;
    
    const formData = this.registrationForm.value;
    const userData = {
      username: formData.email, // Use email as username
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password
    };
    
    const subscription = this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration successful:', response);
        
        // Show success message
        alert('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
        
        // Redirect to login page
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        // Handle different error types
        if (error.status === 400 && error.error) {
          if (error.error.email) {
            this.email?.setErrors({ emailTaken: true });
          }
          if (error.error.password) {
            this.password?.setErrors({ weakPassword: true });
          }
        } else {
          alert('Fehler bei der Registrierung. Bitte versuchen Sie es erneut.');
        }
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  private markFormGroupTouched() {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }
  
  // Navigation
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  
  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Dieses Feld ist erforderlich';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mindestens ${requiredLength} Zeichen erforderlich`;
      }
      if (field.errors['email']) {
        return 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      }
      if (field.errors['emailTaken']) {
        return 'Diese E-Mail-Adresse ist bereits registriert';
      }
      if (field.errors['weakPassword']) {
        return 'Das Passwort entspricht nicht den Sicherheitsanforderungen';
      }
      if (field.errors['passwordMismatch']) {
        return 'Die Passwörter stimmen nicht überein';
      }
    }
    
    return '';
  }
  
  // Password strength indicator
  getPasswordStrength(): number {
    const password = this.password?.value || '';
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  }
  
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    
    switch (strength) {
      case 0:
      case 1:
        return 'Sehr schwach';
      case 2:
        return 'Schwach';
      case 3:
        return 'Mittel';
      case 4:
        return 'Stark';
      case 5:
        return 'Sehr stark';
      default:
        return '';
    }
  }
  
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    
    switch (strength) {
      case 0:
      case 1:
        return 'very-weak';
      case 2:
        return 'weak';
      case 3:
        return 'medium';
      case 4:
        return 'strong';
      case 5:
        return 'very-strong';
      default:
        return '';
    }
  }
}
