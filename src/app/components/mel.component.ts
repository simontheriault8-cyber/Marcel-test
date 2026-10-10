import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MelService, MEL_LIMITATIONS, ARMY_OCCUPATIONS, RCN_OCCUPATIONS, RCAF_OCCUPATIONS, CMP_OCCUPATIONS } from '../../services/mel.service';

@Component({
  selector: 'app-mel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mel.component.html',
})
export class MelComponent {
  private melService = inject(MelService);

  limitations = MEL_LIMITATIONS;
  
  armyOccupations = ARMY_OCCUPATIONS;
  armyOfficers = ARMY_OCCUPATIONS.filter(o => o.type === 'Officers');
  armyNcms = ARMY_OCCUPATIONS.filter(o => o.type === 'NCMs');

  rcnOccupations = RCN_OCCUPATIONS;
  rcnOfficers = RCN_OCCUPATIONS.filter(o => o.type === 'Officers');
  rcnNcms = RCN_OCCUPATIONS.filter(o => o.type === 'NCMs');

  rcafOccupations = RCAF_OCCUPATIONS;
  rcafOfficers = RCAF_OCCUPATIONS.filter(o => o.type === 'Officers');
  rcafNcms = RCAF_OCCUPATIONS.filter(o => o.type === 'NCMs');

  cmpOccupations = CMP_OCCUPATIONS;
  cmpOfficers = CMP_OCCUPATIONS.filter(o => o.type === 'Officers');
  cmpNcms = CMP_OCCUPATIONS.filter(o => o.type === 'NCMs');

  matrix = this.melService.acceptabilityMatrix;

  isAcceptable(melId: string, occId: string): boolean {
    return this.matrix()[melId]?.[occId] ?? true;
  }

  toggleAcceptability(melId: string, occId: string) {
    const current = this.isAcceptable(melId, occId);
    this.melService.setAcceptability(melId, occId, !current);
  }
}
