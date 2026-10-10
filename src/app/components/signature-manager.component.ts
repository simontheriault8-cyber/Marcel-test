import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedStateService } from '../../services/shared-state.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-signature-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signature-manager.component.html'
})
export class SignatureManagerComponent {
  @Output() close = new EventEmitter<void>();

  private sharedState = inject(SharedStateService);
  public translationService = inject(TranslationService);

  signatureSection: 'normal' | 'ota' = 'normal';
  showToast = false;

  sigFrTemp = this.sharedState.customSigFr() ?? this.sharedState.getSignatureFr();
  sigEnTemp = this.sharedState.customSigEn() ?? this.sharedState.getSignatureEn();
  sigOtaFrTemp = this.sharedState.customSigOtaFr() ?? this.sharedState.getSignatureOtaFr();
  sigOtaEnTemp = this.sharedState.customSigOtaEn() ?? this.sharedState.getSignatureOtaEn();

  setSignatureSection(section: 'normal' | 'ota'): void {
    this.signatureSection = section;
  }

  resetSignatures(): void {
    if (this.signatureSection === 'normal') {
      this.sharedState.resetToDefault('normal');
      this.sigFrTemp = this.sharedState.getSignatureFr();
      this.sigEnTemp = this.sharedState.getSignatureEn();
    } else {
      this.sharedState.resetToDefault('ota');
      this.sigOtaFrTemp = this.sharedState.getSignatureOtaFr();
      this.sigOtaEnTemp = this.sharedState.getSignatureOtaEn();
    }
  }

  saveSignatures(): void {
    if (this.signatureSection === 'normal') {
      this.sharedState.saveCustomSignatures(this.sigFrTemp, this.sigEnTemp);
    } else {
      this.sharedState.saveCustomOtaSignatures(this.sigOtaFrTemp, this.sigOtaEnTemp);
    }
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  closePage(): void {
    this.close.emit();
  }
}
