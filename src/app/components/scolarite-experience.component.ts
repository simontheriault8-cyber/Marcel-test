import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ReorientationCriteriaService } from "../../services/reorientation-criteria.service";
import { SharedStateService } from "../../services/shared-state.service";

@Component({
  selector: "app-scolarite-experience",
  imports: [CommonModule, FormsModule],
  templateUrl: './scolarite-experience.component.html',
})
export class ScolariteExperienceComponent {
  criteriaService = inject(ReorientationCriteriaService);
  sharedState = inject(SharedStateService);

  selectedCriteriaIds = this.criteriaService.selectedCriteriaIds;
  activeScolariteTab = this.criteriaService.activeScolariteTab;
  selectedProvince = this.criteriaService.selectedProvince;
  PROVINCES = this.criteriaService.PROVINCES;

  mathCoursesForProvince = this.criteriaService.mathCoursesForProvince;
  criteriaAnneeScolaire = this.criteriaService.criteriaAnneeScolaire;
  criteriaHistoire = this.criteriaService.criteriaHistoire;
  criteriaLangue = this.criteriaService.criteriaLangue;
  criteriaScience = this.criteriaService.criteriaScience;
  criteriaInformatique = this.criteriaService.criteriaInformatique;
  criteriaCoursSpecialise = this.criteriaService.criteriaCoursSpecialise;
  criteriaUniversitaire1erCycleGenie = this.criteriaService.criteriaUniversitaire1erCycleGenie;
  criteriaUniversitaire1erCycleSciences = this.criteriaService.criteriaUniversitaire1erCycleSciences;
  criteriaUniversitaire1erCycleArts = this.criteriaService.criteriaUniversitaire1erCycleArts;
  criteriaUniversitaire1erCycleSante = this.criteriaService.criteriaUniversitaire1erCycleSante;
  criteriaUniversitaireCycleSuperieurMaitrise = this.criteriaService.criteriaUniversitaireCycleSuperieurMaitrise;
  criteriaUniversitaireCycleSuperieurDoctorat = this.criteriaService.criteriaUniversitaireCycleSuperieurDoctorat;
  criteriaExperience = this.criteriaService.criteriaExperience;

  expandedDomaines = signal<Set<string>>(new Set<string>());

  dossierJobIds = computed(() =>
    [
      this.sharedState.selectedDossierJobId1(),
      this.sharedState.selectedDossierJobId2(),
      this.sharedState.selectedDossierJobId3(),
    ].filter(Boolean)
  );

  hasEceJob = computed(() => this.dossierJobIds().includes("00203"));
  hasEsomJob = computed(() => this.dossierJobIds().includes("00207"));
  hasCeopmJob = computed(() => this.dossierJobIds().includes("00214"));
  hasCspnJob = computed(() =>
    this.dossierJobIds().some((id) => id === "00182" || id === "00183" || id === "00184")
  );
  hasAnyExtraTest = computed(
    () =>
      this.hasEceJob() ||
      this.hasEsomJob() ||
      this.hasCeopmJob() ||
      this.hasCspnJob()
  );

  testEcePassed = this.sharedState.testEcePassed;
  testEsomPassed = this.sharedState.testEsomPassed;
  testCeopmPassed = this.sharedState.testCeopmPassed;
  testCspnPassed = this.sharedState.testCspnPassed;
  testCspnNotCompleted = this.sharedState.testCspnNotCompleted;
  testCspn00182Passed = this.sharedState.testCspn00182Passed;
  testCspn00183Passed = this.sharedState.testCspn00183Passed;
  testCspn00184Passed = this.sharedState.testCspn00184Passed;

  toggleManualCriterion(id: string) {
    this.criteriaService.toggleManualCriterion(id);
  }

  toggleDomaine(domaine: string) {
    const next = new Set(this.expandedDomaines());
    if (next.has(domaine)) {
      next.delete(domaine);
    } else {
      next.add(domaine);
    }
    this.expandedDomaines.set(next);
  }

  onCspnMainToggle(checked: boolean) {
    this.testCspnPassed.set(checked);
    if (checked) {
      this.testCspnNotCompleted.set(false);
    } else {
      this.testCspn00182Passed.set(false);
      this.testCspn00183Passed.set(false);
      this.testCspn00184Passed.set(false);
    }
  }

  onCspnNotCompletedToggle(checked: boolean) {
    this.testCspnNotCompleted.set(checked);
    if (checked) {
      this.testCspnPassed.set(false);
      this.testCspn00182Passed.set(false);
      this.testCspn00183Passed.set(false);
      this.testCspn00184Passed.set(false);
    }
  }
}
