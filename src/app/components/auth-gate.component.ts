import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-auth-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-gate.component.html'
})
export class AuthGateComponent {
  @Output() authenticated = new EventEmitter<void>();

  public translationService = inject(TranslationService);

  passwordInput = '';
  showPassword = false;
  authError = false;

  private readonly HASH_TARGET = '4b65e209bce165f2be7ddc7a5347453f200afaca8c590dc411c3dc886bf02635';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async checkPassword(event: Event): Promise<void> {
    event.preventDefault();
    const encoder = new TextEncoder();
    const data = encoder.encode(this.passwordInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === this.HASH_TARGET) {
      this.authError = false;
      localStorage.setItem('marcel_auth', 'true');
      this.authenticated.emit();
    } else {
      this.authError = true;
    }
  }
}
