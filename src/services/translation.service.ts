import { Injectable, signal, computed } from '@angular/core';
import { TRANSLATIONS, Language, Translations } from '../app/i18n/translations';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private initialLang: Language = (localStorage.getItem('marcel_lang') as Language) || 'fr';
  currentLang = signal<Language>(this.initialLang);

  translations = computed<Translations>(() => {
    return TRANSLATIONS[this.currentLang()];
  });

  isEnglish = computed<boolean>(() => this.currentLang() === 'en');
  isFrench = computed<boolean>(() => this.currentLang() === 'fr');

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    localStorage.setItem('marcel_lang', lang);
  }

  toggleLanguage(): void {
    const next: Language = this.currentLang() === 'fr' ? 'en' : 'fr';
    this.setLanguage(next);
  }

  /**
   * Helper pour formater un courriel bilingue selon la langue active
   */
  formatBilingualEmail(params: {
    frBody: string;
    enBody: string;
    sigFr: string;
    sigEn: string;
    isHtml: boolean;
  }): string {
    const lang = this.currentLang();
    const divider = params.isHtml
      ? '<p style="margin-top: 12.0pt; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">______________________________________________________________________________</p>'
      : '\n\n______________________________________________________________________________\n\n';

    if (lang === 'fr') {
      // Ordre normal : Français en premier, Anglais en second
      const headerNotice = params.isHtml
        ? '<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>English message will follow.</strong></p>'
        : 'English message will follow.\n\n';

      if (params.isHtml) {
        return `<div style="font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000; line-height: normal;">${headerNotice}${params.frBody}<p style="margin-top: 12.0pt;">${params.sigFr}</p>${divider}${params.enBody}<p style="margin-top: 12.0pt;">${params.sigEn}</p></div>`;
      } else {
        return `${headerNotice}${params.frBody}\n\n${params.sigFr}${divider}${params.enBody}\n\n${params.sigEn}`;
      }
    } else {
      // Ordre inversé pour l'utilisateur anglophone : Anglais en premier, Français en second
      const headerNotice = params.isHtml
        ? '<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>Le message en français suivra.</strong></p>'
        : 'Le message en français suivra.\n\n';

      if (params.isHtml) {
        return `<div style="font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000; line-height: normal;">${headerNotice}${params.enBody}<p style="margin-top: 12.0pt;">${params.sigEn}</p>${divider}${params.frBody}<p style="margin-top: 12.0pt;">${params.sigFr}</p></div>`;
      } else {
        return `${headerNotice}${params.enBody}\n\n${params.sigEn}${divider}${params.frBody}\n\n${params.sigFr}`;
      }
    }
  }
}
