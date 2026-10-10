import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoMarcelComponent } from './tuto-marcel.component';
import { TranslationService } from '../../services/translation.service';
import { Language } from '../i18n/translations';

export type UserRole = 'gestionnaire' | 'recruiter';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, TutoMarcelComponent],
  templateUrl: './role-selection.component.html'
})
export class RoleSelectionComponent {
  @Output() roleSelected = new EventEmitter<UserRole>();

  public translationService = inject(TranslationService);
  showTutoMarcel = false;

  openTutoMarcel(): void {
    this.showTutoMarcel = true;
  }

  closeTutoMarcel(): void {
    this.showTutoMarcel = false;
  }

  chooseRole(role: UserRole): void {
    this.roleSelected.emit(role);
  }

  setLang(lang: Language): void {
    this.translationService.setLanguage(lang);
  }
}
