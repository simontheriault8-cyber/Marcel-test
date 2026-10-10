import { Component, computed, signal, inject, effect, untracked } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { JobDatabaseService } from "../../services/job-database.service";
import { SharedStateService } from "../../services/shared-state.service";
import { MelService } from "../../services/mel.service";
import { ReorientationCriteriaService } from "../../services/reorientation-criteria.service";
import { ScolariteExperienceComponent } from "./scolarite-experience.component";
import { JobEntry } from "../../services/jobs-data";
import { JOB_URLS } from "../data/job-urls.data";
import { MATH_COURSES } from "../data/reorientation-criteria.data";

export const CMR_JOB_DOMAINS: Record<
  string,
  { arts: boolean; genie: boolean; science: boolean }
> = {
  "00178": { arts: true, genie: true, science: true }, // Pilote
  "00179": { arts: true, genie: true, science: true }, // OSRAC (Air Combat Systems Officer)
  "00180": { arts: true, genie: true, science: true }, // OCA (Aerospace Control Officer)
  "00181": { arts: false, genie: true, science: true }, // Officier du génie aérospatial (AERE)
  "00182": { arts: true, genie: true, science: true }, // Blindé (Armour)
  "00183": { arts: true, genie: true, science: true }, // Artillerie
  "00184": { arts: true, genie: true, science: true }, // Infanterie
  "00185": { arts: false, genie: true, science: true }, // Génie de combat
  "00187": { arts: false, genie: true, science: true }, // Officier des transmissions (Sigs)
  "00189": { arts: false, genie: true, science: false }, // Officier du génie électrique et mécanique (GEM)
  "00203": { arts: true, genie: false, science: false }, // Logistique
  "00207": { arts: true, genie: true, science: true }, // Officier de guerre navale (OGN)
  "00208": { arts: true, genie: false, science: false }, // Officier de développement de l'instruction (ODI)
  "00213": { arts: true, genie: true, science: true }, // Renseignement (Int)
  "00214": { arts: true, genie: false, science: false }, // Police militaire (PM)
  "00328": { arts: true, genie: true, science: true }, // Opérations maritimes et de surface
  "00340": { arts: false, genie: true, science: true }, // Génie maritime des systèmes de combat
  "00341": { arts: false, genie: true, science: true }, // Génie maritime des systèmes de coque et de propulsion
  "00344": { arts: false, genie: true, science: true }, // Cyberopérations
  "00345": { arts: false, genie: true, science: true }, // Opérations spatiales
  "00389": { arts: true, genie: true, science: true }, // Affaires publiques (PAO)
  "00398": { arts: true, genie: false, science: false }, // Administration du personnel
};

@Component({
  selector: "app-pfor",
  standalone: true,
  imports: [CommonModule, FormsModule, ScolariteExperienceComponent],
  host: { "(document:click)": "onDocumentClick($event)" },
  templateUrl: './pfor.component.html',
})
export class PforComponent {
  jobService = inject(JobDatabaseService);
  sharedState = inject(SharedStateService);
  melService = inject(MelService);
  sanitizer = inject(DomSanitizer);
  reorientationCriteria = inject(ReorientationCriteriaService);

  constructor() {
    effect(() => {
      if (!this.sharedState.isPostulantPfor()) {
        return;
      }
      const isReoGenerated = this.showResultsPanel();
      untracked(() => {
        this.sharedState.hasReoEmailGenerated.set(isReoGenerated);
      });

      if (!isReoGenerated) {
        untracked(() => {
          this.sharedState.reoMergedEmailHtml.set("");
          this.sharedState.reoMergedEmailPlain.set("");
          this.sharedState.reoMergedNote.set("");
        });
        return;
      }

      const html = this.buildBilingualEmail(true);
      if (html.includes("Veuillez renseigner les critères")) {
        return;
      }
      const plain = this.buildBilingualEmail(false);
      const note = this.generateNoteRegistry();
      untracked(() => {
        this.sharedState.reoMergedEmailHtml.set(html);
        this.sharedState.reoMergedEmailPlain.set(plain);
        this.sharedState.reoMergedNote.set(note);
      });
    });

    effect(() => {
      const trigger = this.sharedState.recruiterResetTrigger();
      if (trigger > 0) {
        untracked(() => {
          this.resetAll();
        });
      }
    });
  }

  // Inputs & Signals
  age = signal<number | null>(18);
  citizenship = signal<string>("Canadian Citizen");
  pforType = signal<"cmr" | "civil">("cmr");

  cmrArts = signal<boolean>(false);
  cmrScience = signal<boolean>(false);
  cmrGenie = signal<boolean>(false);
  cmrRefused = signal<boolean>(false);
  cmrMinCriteriaNotMet = signal<boolean>(false);

  selectedDossierJobId1 = signal<string>("");
  selectedDossierJobId2 = signal<string>("");
  selectedDossierJobId3 = signal<string>("");

  attentesJobsInDossier = computed(() => {
    const dossierIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean).filter((id) => id !== "00003");
    return dossierIds.filter((id) => this.jobService.isJobInGestionDesAttentes(id));
  });

  isAttentesMode = computed(() => {
    return this.attentesJobsInDossier().length > 0;
  });

  attentesSituation = computed<1 | 2>(() => {
    const jobs = this.attentesJobsInDossier();
    for (const jId of jobs) {
      const pforStatus = this.jobService.getJobPforStatus(jId);
      // Situation 2: operation de traitement est ferme ('f')
      if (pforStatus && pforStatus.traitement === "f") {
        return 2;
      }
    }
    // Situation 1: operation d'admission est ouvert ou ferme et operation de traitement est ouvert ('o')
    return 1;
  });

  attentesSituationsNoteLabel = computed<string>(() => {
    const jobs = this.attentesJobsInDossier();
    const sits = Array.from(new Set(jobs.map((j) => this.getJobAttentesSituation(j))));
    if (sits.length === 0) return "Situation 1";
    if (sits.length === 1) return `Situation ${sits[0]}`;
    return `Situations ${sits.sort().join(" et ")}`;
  });

  attentesSituationsSummary = computed<string>(() => {
    const jobs = this.attentesJobsInDossier();
    const sits = Array.from(new Set(jobs.map((j) => this.getJobAttentesSituation(j))));
    if (sits.length === 0) return "Situation 1 : Traitement ouvert";
    if (sits.length === 1) {
      const s = sits[0];
      return `Situation ${s} : ${s === 1 ? "Traitement ouvert" : "Traitement fermé"}`;
    }
    return `Situations ${sits.sort().join(" & ")}`;
  });

  getJobContractDuration(jobId: string): number {
    const job = this.jobService.getJobById(jobId);
    if (!job || !job.contracts || job.contracts.length === 0) return 10;
    const pforContract =
      job.contracts.find((c) => (c.program || "").toUpperCase().includes("PFOR")) ||
      job.contracts[0];

    if (pforContract && pforContract.duration) {
      const match = pforContract.duration.match(/(\d+)\s*an/);
      if (match) return parseInt(match[1], 10);
    }
    return 10;
  }

  isCandidateTooOld = computed(() => {
    const ageVal = this.age();
    if (ageVal === null || ageVal <= 0) return false;
    if (ageVal > 56) return true;

    const dossierIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean).filter((id) => id !== "00003");

    if (dossierIds.length > 0) {
      const allDossierExceedAge = dossierIds.every((id) => {
        const s = this.evaluateJobAdmissibility(id);
        return s && !s.isAgeAdmissible;
      });
      if (allDossierExceedAge) return true;
    } else {
      // If no dossier jobs selected yet, check if age reaches limit for any standard PFOR job (min 10 ans => >= 50)
      if (ageVal >= 50) return true;
    }
    return false;
  });

  getJobAttentesSituation(jobId: string): 1 | 2 {
    const pforStatus = this.jobService.getJobPforStatus(jobId);
    if (pforStatus && pforStatus.traitement === "f") {
      return 2;
    }
    return 1;
  }

  getJobGestionDesAttentesReasonsFr(id: string): string[] {
    const reasons: string[] = [];
    if (this.jobService.isJobInGestionDesAttentes(id)) {
      const sit = this.getJobAttentesSituation(id);
      if (sit === 1) {
        reasons.push(
          "Malheureusement, toutes les places disponibles de ce métier ont été comblées. Bien que certaines places puissent se libérer si des candidats refusent leur offre, cela demeure peu probable en raison du nombre de candidats déjà admis.",
        );
      } else {
        reasons.push(
          "À l’heure actuelle, nous avons reçu suffisamment de candidatures pour combler les positions restantes de ce métier. Votre candidature ne peut donc pas progresser davantage pour le moment.",
        );
      }
      const s = this.evaluateJobAdmissibility(id);
      if (s && !s.isAgeAdmissible) {
        reasons.push(s.ageReason);
      }
      if (s && !s.isEducationAdmissible && s.educationReason) {
        reasons.push(s.educationReason);
      }
    } else {
      const s = this.evaluateJobAdmissibility(id);
      if (s) {
        if (s.isJobClosed) {
          reasons.push(
            "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).",
          );
        }
        if (!s.isAgeAdmissible) {
          reasons.push(s.ageReason);
        }
        if (!s.isCitizenshipAdmissible) {
          reasons.push(
            "Pour diverses raisons, ce métier n'est pas accessible aux résidents permanents.",
          );
        }
        if (!s.isEducationAdmissible) {
          reasons.push(s.educationReason);
        }
        if (!s.isMedicalAdmissible) {
          reasons.push(s.medicalReason);
        }
      }
    }
    return reasons;
  }

  getJobGestionDesAttentesReasonsEn(id: string): string[] {
    const reasons: string[] = [];
    if (this.jobService.isJobInGestionDesAttentes(id)) {
      const sit = this.getJobAttentesSituation(id);
      if (sit === 1) {
        reasons.push(
          "Unfortunately, all available positions in this occupation have been filled. While some positions may become available if candidates decline their offers, this remains unlikely given the number of applicants who have already been selected.",
        );
      } else {
        reasons.push(
          "At this time, we have received a sufficient number of applications to fill the remaining positions for this occupation. As a result, your application cannot proceed any further at this time.",
        );
      }
      const s = this.evaluateJobAdmissibility(id);
      if (s && !s.isAgeAdmissible) {
        reasons.push(s.ageReasonEn);
      }
      if (s && !s.isEducationAdmissible && s.educationReasonEn) {
        reasons.push(s.educationReasonEn);
      }
    } else {
      const s = this.evaluateJobAdmissibility(id);
      if (s) {
        if (s.isJobClosed) {
          reasons.push(
            "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).",
          );
        }
        if (!s.isAgeAdmissible) {
          reasons.push(s.ageReasonEn);
        }
        if (!s.isCitizenshipAdmissible) {
          reasons.push(
            "For various reasons, this occupation is not open to permanent residents.",
          );
        }
        if (!s.isEducationAdmissible) {
          reasons.push(s.educationReasonEn);
        }
        if (!s.isMedicalAdmissible) {
          reasons.push(s.medicalReasonEn);
        }
      }
    }
    return reasons;
  }

  getCmrAdmittedDomainsAttentesFr(): string {
    const parts: string[] = [];
    if (this.cmrArts()) parts.push("Sciences humaines et sociales");
    if (this.cmrGenie()) parts.push("Génie");
    if (this.cmrScience()) parts.push("Sciences");
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} et ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} et ${parts[2]}`;
  }

  getCmrAdmittedDomainsAttentesEn(): string {
    const parts: string[] = [];
    if (this.cmrArts()) parts.push("Social Sciences and Humanities");
    if (this.cmrGenie()) parts.push("Engineering");
    if (this.cmrScience()) parts.push("Science");
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
  }

  // Options
  showOptionsDropdown = signal<boolean>(false);
  ignoreSip = signal<boolean>(false);
  includeTraitement = signal<boolean>(false);
  hasMedicalLimitation = signal<boolean>(false);

  // Medical
  medicalV = signal<string>("2");
  medicalCV = signal<string>("2");
  medicalH = signal<string>("2");

  // Status feedback
  copied = signal<boolean>(false);
  noteCopied = signal<boolean>(false);

  readonly JOB_URLS = JOB_URLS;

  allPforJobs = computed(() => {
    return this.jobService.getAllJobs().filter((j) => {
      return this.jobService.isPforJob(j);
    });
  });

  currentSipPhase = computed<"admission" | "traitement" | "both">(() => {
    return this.includeTraitement() ? "both" : "admission";
  });

  activeHeaderOptionsCount = computed(() => {
    let count = 0;
    if (this.hasMedicalLimitation()) count++;
    return count;
  });

  onCmrRefusedChange(checked: boolean) {
    this.cmrRefused.set(checked);
    if (checked) {
      this.cmrMinCriteriaNotMet.set(false);
      this.cmrArts.set(false);
      this.cmrScience.set(false);
      this.cmrGenie.set(false);
    }
  }

  onCmrMinCriteriaChange(checked: boolean) {
    this.cmrMinCriteriaNotMet.set(checked);
    if (checked) {
      this.cmrRefused.set(false);
      this.cmrArts.set(false);
      this.cmrScience.set(false);
      this.cmrGenie.set(false);
    }
  }

  eligibleNcmEvaluation = computed(() => {
    return this.reorientationCriteria.evaluateEligibleNcmJobs({
      age: this.age(),
      citizenship: this.citizenship(),
      ignoreSip: this.ignoreSip(),
      currentSipPhase: this.currentSipPhase(),
      hasMedicalLimitation: this.hasMedicalLimitation(),
      medicalV: this.medicalV(),
      medicalCV: this.medicalCV(),
      medicalH: this.medicalH(),
    });
  });

  hasAgeInadmissibilityInDossier = computed(() => {
    const ageVal = this.age();
    if (ageVal === null || ageVal <= 0 || ageVal >= 57) return false;

    const dossierIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean).filter((id) => id !== "00003");

    if (dossierIds.length > 0) {
      return dossierIds.some((id) => {
        const s = this.evaluateJobAdmissibility(id);
        return s && !s.isAgeAdmissible;
      });
    }

    return false;
  });

  showScolariteExperiencePanel = computed(() => {
    if (this.pforType() === "cmr" && (this.cmrRefused() || this.cmrMinCriteriaNotMet())) {
      return true;
    }

    const ageVal = this.age();
    if (ageVal !== null && ageVal > 0 && ageVal < 57) {
      if (this.isCandidateTooOld() || this.hasAgeInadmissibilityInDossier()) {
        return true;
      }
    }

    return false;
  });

  showResultsPanel = computed(() => {
    if (this.citizenship() === "PR < 3 years") {
      return true;
    }
    if (this.age() !== null && this.age()! >= 57) {
      return true;
    }
    if (this.cmrRefused() || this.cmrMinCriteriaNotMet()) {
      return true;
    }

    const hasDossierJob = !!(
      this.selectedDossierJobId1() ||
      this.selectedDossierJobId2() ||
      this.selectedDossierJobId3()
    );

    if (!hasDossierJob) {
      return false;
    }

    if (this.isCandidateTooOld()) {
      return true;
    }

    if (this.pforType() === "cmr") {
      const hasCmrDomain =
        this.cmrArts() || this.cmrScience() || this.cmrGenie();
      return hasCmrDomain || this.eligiblePforJobs().length > 0;
    } else {
      return true;
    }
  });

  eligiblePforJobs = computed<JobEntry[]>(() => {
    if (this.citizenship() === "PR < 3 years") return [];
    const ageVal = this.age();
    if (ageVal !== null && (ageVal > 56 || ageVal >= 60)) return [];

    let candidateJobIds: string[] = [];

    if (this.pforType() === "cmr") {
      if (this.cmrRefused() || this.cmrMinCriteriaNotMet()) {
        return [];
      }

      const arts = this.cmrArts();
      const science = this.cmrScience();
      const genie = this.cmrGenie();

      if (!arts && !science && !genie) {
        return [];
      }

      for (const [jId, cmrInfo] of Object.entries(CMR_JOB_DOMAINS)) {
        const match =
          (arts && cmrInfo.arts) ||
          (science && cmrInfo.science) ||
          (genie && cmrInfo.genie);
        if (match) candidateJobIds.push(jId);
      }
    } else {
      // PFOR Civil
      for (const j of this.jobService.getAllJobs()) {
        if (this.jobService.hasPforProgram(j.id, this.currentSipPhase())) {
          candidateJobIds.push(j.id);
        }
      }
    }

    const result: JobEntry[] = [];
    for (const jId of candidateJobIds) {
      if (!this.jobService.hasPforProgram(jId, this.currentSipPhase())) continue;
      if (this.citizenship() === "PR > 3 years" && !this.jobService.isJobRp(jId)) continue;
      if (!this.ignoreSip() && this.jobService.isPforJobClosed(jId, this.currentSipPhase())) continue;

      const job = this.jobService.getJobById(jId);
      if (job) {
        if (ageVal !== null && ageVal > 0) {
          const durationYears = this.getJobContractDuration(jId);
          if (ageVal + durationYears >= 60) continue;
        }
        result.push(job);
      }
    }

    return result;
  });

  analyzedDossierChoices = computed(() => {
    const selectedIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean);

    return selectedIds.map((id) => {
      const job = this.jobService.getJobById(id) || ({
        id,
        title: id,
        abbreviation: "",
      } as JobEntry);

      const hasPfor = this.jobService.hasPforProgram(id, this.currentSipPhase());
      const isPforClosed = this.jobService.isPforJobClosed(id, this.currentSipPhase());

      let isEligible = true;
      let reasonFr = "";
      let reasonEn = "";

      if (id === "00003") {
        return {
          job,
          isEligible: false,
          reasonFr: "Sans métier",
          reasonEn: "No occupation",
        };
      }

      const s = this.evaluateJobAdmissibility(id);

      if (this.citizenship() === "PR < 3 years") {
        isEligible = false;
        reasonFr = "Résident permanent de moins de 3 ans";
        reasonEn = "Permanent resident under 3 years";
      } else if (this.citizenship() === "PR > 3 years" && !this.jobService.isJobRp(id)) {
        isEligible = false;
        reasonFr = "Pour diverses raisons, ce métier n'est pas accessible aux résidents permanents.";
        reasonEn = "For various reasons, this occupation is not open to permanent residents.";
      } else if (s && !s.isAgeAdmissible) {
        isEligible = false;
        reasonFr = s.ageReason;
        reasonEn = s.ageReasonEn;
      } else if (this.pforType() === "cmr") {
        if (this.cmrRefused()) {
          isEligible = false;
          reasonFr = "Candidat non admis au Collège militaire royal du Canada (CMR). Réorientation nécessaire.";
          reasonEn = "Candidate not admitted to the Royal Military College of Canada (RMC). Reorientation required.";
        } else if (this.cmrMinCriteriaNotMet()) {
          isEligible = false;
          reasonFr = "Critère minimal pour le PFOR non rencontré (DES requis). Réorientation nécessaire.";
          reasonEn = "Minimum requirement for ROTP not met (High school diploma required). Reorientation required.";
        } else {
          const cmrInfo = CMR_JOB_DOMAINS[id];
          if (!cmrInfo) {
            isEligible = false;
            reasonFr = "Ce métier n'est pas offert au CMR sous le PFOR.";
            reasonEn = "This occupation is not offered at RMC under ROTP.";
          } else {
          const arts = this.cmrArts();
          const science = this.cmrScience();
          const genie = this.cmrGenie();
          const match =
            (arts && cmrInfo.arts) ||
            (science && cmrInfo.science) ||
            (genie && cmrInfo.genie);

          if (!match) {
            isEligible = false;
            const reqFr = this.getCmrJobRequiredDomainsFr(id);
            const admFr = this.getCmrAdmittedDomainsFr();
            reasonFr = `Requiert admission au CMR en ${reqFr} (actuellement admis en : ${admFr || "aucun"}).`;
            reasonEn = `Requires admission to RMC in ${this.getCmrJobRequiredDomainsEn(id)}.`;
          } else if (!hasPfor || isPforClosed) {
            isEligible = false;
            reasonFr = "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).";
            reasonEn = "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).";
          }
        }
      }
    } else {
        // Civil
        if (!hasPfor) {
          isEligible = false;
          reasonFr = "Ce métier ne comporte aucune position pour le PFOR Civil.";
          reasonEn = "No positions available for Civil ROTP.";
        } else if (isPforClosed) {
          isEligible = false;
          reasonFr = "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).";
          reasonEn = "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).";
        }
      }

      return {
        job,
        isEligible,
        reasonFr,
        reasonEn,
      };
    });
  });

  needsReorientation = computed(() => {
    const choices = this.analyzedDossierChoices();
    if (choices.length === 0) return true;
    return choices.some((c) => !c.isEligible);
  });

  getCmrAdmittedDomainsNoteFr(): string {
    const domains: string[] = [];
    if (this.cmrArts()) domains.push("Arts");
    if (this.cmrScience()) domains.push("Sciences");
    if (this.cmrGenie()) domains.push("Génie");
    if (domains.length === 0) return "";
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} et ${domains[1]}`;
    return `${domains[0]}, ${domains[1]} et ${domains[2]}`;
  }

  getCmrAdmittedDomainsFr(): string {
    const domains: string[] = [];
    if (this.cmrArts()) domains.push("Sciences humaines et sociales");
    if (this.cmrScience()) domains.push("Sciences");
    if (this.cmrGenie()) domains.push("Génie");
    if (domains.length === 0) return "";
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} et ${domains[1]}`;
    return `${domains[0]}, ${domains[1]} et ${domains[2]}`;
  }

  getCmrAdmittedDomainsEn(): string {
    const domains: string[] = [];
    if (this.cmrArts()) domains.push("Social Sciences and Humanities");
    if (this.cmrScience()) domains.push("Science");
    if (this.cmrGenie()) domains.push("Engineering");
    if (domains.length === 0) return "";
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} and ${domains[1]}`;
    return `${domains[0]}, ${domains[1]}, and ${domains[2]}`;
  }

  getCmrJobRequiredDomainsFr(jobId: string): string {
    const cmrInfo = CMR_JOB_DOMAINS[jobId];
    if (!cmrInfo) return "";
    const domains: string[] = [];
    if (cmrInfo.arts) domains.push("Sciences humaines et sociales");
    if (cmrInfo.science) domains.push("Sciences");
    if (cmrInfo.genie) domains.push("Génie");
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} ou ${domains[1]}`;
    return `${domains[0]}, ${domains[1]} ou ${domains[2]}`;
  }

  getCmrJobRequiredDomainsEn(jobId: string): string {
    const cmrInfo = CMR_JOB_DOMAINS[jobId];
    if (!cmrInfo) return "";
    const domains: string[] = [];
    if (cmrInfo.arts) domains.push("Social Sciences and Humanities");
    if (cmrInfo.science) domains.push("Science");
    if (cmrInfo.genie) domains.push("Engineering");
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} or ${domains[1]}`;
    return `${domains[0]}, ${domains[1]} or ${domains[2]}`;
  }

  toggleIgnoreSip() {
    this.ignoreSip.update((v) => !v);
  }

  toggleIncludeTraitement() {
    this.includeTraitement.update((v) => !v);
  }

  toggleMedicalLimitation() {
    this.hasMedicalLimitation.update((v) => !v);
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showOptionsDropdown() && !target.closest(".pfor-options-dropdown-container")) {
      this.showOptionsDropdown.set(false);
    }
  }

  resetAll() {
    this.age.set(18);
    this.citizenship.set("Canadian Citizen");
    this.pforType.set("cmr");
    this.cmrArts.set(false);
    this.cmrScience.set(false);
    this.cmrGenie.set(false);
    this.cmrRefused.set(false);
    this.cmrMinCriteriaNotMet.set(false);
    this.selectedDossierJobId1.set("");
    this.selectedDossierJobId2.set("");
    this.selectedDossierJobId3.set("");
    this.ignoreSip.set(false);
    this.includeTraitement.set(false);
    this.hasMedicalLimitation.set(false);
    this.reorientationCriteria.resetAll();
  }

  getJobLinkMarkup(jobId: string, isFrench: boolean, isHtml: boolean): string {
    const job = this.jobService.getAllJobs().find((j) => j.id === jobId);
    const urlInfo = this.JOB_URLS[jobId];

    let titleText = jobId;
    if (job) {
      titleText = job.title;
      if (!isFrench && urlInfo) {
        let slug =
          urlInfo.en.split("/career/")[1] ||
          urlInfo.en.split(".ca/en/")[1] ||
          "";
        slug = slug
          .replace(/\//g, "")
          .replace(/\?slug=nep/, "")
          .replace(/-/g, " ");
        if (slug) {
          titleText = slug
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        } else if (job.titleEn) {
          titleText = job.titleEn;
        }
      } else if (!isFrench && job.titleEn) {
        titleText = job.titleEn;
      }
    }

    if (urlInfo) {
      const url = isFrench ? urlInfo.fr : urlInfo.en;
      if (isHtml) {
        return `<a href="${url}" target="_blank" class="text-blue-600 hover:underline hover:text-blue-800" style="color: #2563eb; text-decoration: underline;">${titleText}</a>`;
      } else {
        return `${titleText} (${url})`;
      }
    }
    return titleText;
  }

  evaluateJobAdmissibility(jobId: string) {
    const job = this.jobService.getJobById(jobId);
    const isJobClosed = this.jobService.isPforJobClosed(jobId, this.currentSipPhase());
    
    const ageVal = this.age();
    let isAgeAdmissible = true;
    let ageReason = "";
    let ageReasonEn = "";

    const durationYears = this.getJobContractDuration(jobId);

    if (ageVal !== null && ageVal > 0) {
      if (ageVal >= 57) {
        isAgeAdmissible = false;
        ageReason = "L'âge maximal d'admissibilité est de 56 ans (57 ans et plus est automatiquement inadmissible).";
        ageReasonEn = "Maximum eligibility age is 56 (57 and older is automatically ineligible).";
      } else if (ageVal + durationYears >= 60) {
        isAgeAdmissible = false;
        ageReason = "Vous dépassez l'âge maximal d'admissibilité pour ce métier.";
        ageReasonEn = "You exceed the maximum eligibility age for this occupation.";
      }
    }

    let isCitizenshipAdmissible = true;
    if (this.citizenship() === "PR < 3 years") {
      isCitizenshipAdmissible = false;
    } else if (this.citizenship() === "PR > 3 years" && !this.jobService.isJobRp(jobId)) {
      isCitizenshipAdmissible = false;
    }

    let isEducationAdmissible = true;
    let educationReason = "";
    let educationReasonEn = "";

    if (this.pforType() === "cmr") {
      if (this.cmrRefused()) {
        isEducationAdmissible = false;
        educationReason = "Admissibilité refusée par le CMR pour le Programme de formation des officiers (PFOR).";
        educationReasonEn = "Admission refused by RMC for the Regular Officer Training Plan (ROTP).";
      } else if (this.cmrMinCriteriaNotMet()) {
        isEducationAdmissible = false;
        educationReason = "Critère minimal pour le PFOR non rencontré (diplôme d'études secondaires requis).";
        educationReasonEn = "Minimum requirement for ROTP not met (High school diploma required).";
      } else {
        const cmrInfo = CMR_JOB_DOMAINS[jobId];
        if (!cmrInfo) {
          isEducationAdmissible = false;
          educationReason = "Ce métier n'est pas offert au CMR sous le PFOR.";
          educationReasonEn = "This occupation is not offered at RMC under ROTP.";
        } else {
          const arts = this.cmrArts();
          const science = this.cmrScience();
          const genie = this.cmrGenie();
          const match =
            (arts && cmrInfo.arts) ||
            (science && cmrInfo.science) ||
            (genie && cmrInfo.genie);

          if (!match) {
            isEducationAdmissible = false;
            const reqFr = this.getCmrJobRequiredDomainsFr(jobId);
            const admFr = this.getCmrAdmittedDomainsFr();
            educationReason = `Requiert admission au CMR en ${reqFr} (actuellement admis en : ${admFr || "aucun"}).`;
            educationReasonEn = `Requires admission to RMC in ${this.getCmrJobRequiredDomainsEn(jobId)}.`;
          }
        }
      }
    } else {
      // Civil
      const hasPfor = this.jobService.hasPforProgram(jobId, this.currentSipPhase());
      if (!hasPfor) {
        isEducationAdmissible = false;
        educationReason = "Ce métier ne comporte aucune position pour le PFOR Civil.";
        educationReasonEn = "No positions available for Civil ROTP.";
      }
    }

    let isMedicalAdmissible = true;
    const medicalReason = "Votre profil médical actuel ne rencontre pas le standard minimal pour ce métier.";
    const medicalReasonEn = "Your current medical profile does not meet the minimum requirement for this occupation.";

    if (this.hasMedicalLimitation() && job && job.medicalStandard) {
      const reqV = job.medicalStandard.v;
      const reqCV = job.medicalStandard.cv;
      const reqH = job.medicalStandard.h;
      const userV = parseInt(this.medicalV(), 10);
      const userCV = parseInt(this.medicalCV(), 10);
      const userH = parseInt(this.medicalH(), 10);

      if (!isNaN(reqV) && !isNaN(userV) && userV > reqV) isMedicalAdmissible = false;
      if (!isNaN(reqCV) && !isNaN(userCV) && userCV > reqCV) isMedicalAdmissible = false;
      if (!isNaN(reqH) && !isNaN(userH) && userH > reqH) isMedicalAdmissible = false;
    }

    return {
      isJobClosed,
      isAgeAdmissible,
      isCitizenshipAdmissible,
      isEducationAdmissible,
      isMedicalAdmissible,
      isExtraTestRequired: false,
      isExtraTestAdmissible: true,
      educationReason,
      educationReasonEn,
      medicalReason,
      medicalReasonEn,
      extraTestReasonFr: "",
      extraTestReasonEn: "",
      durationYears,
      ageReason,
      ageReasonEn,
    };
  }

  generateNoteRegistry(): string {
    if (this.age() !== null && this.age()! >= 57) {
      return "Étape 1 (En cours) - Âge maximal d'admissibilité dépassé (57 ans et plus) : Inadmissible pour un enrôlement dans les FAC, courriel envoyé, fermeture du dossier.";
    }

    if (this.citizenship() === "PR < 3 years") {
      return "Étape 1 (En cours) - Résident permanent de moins de 3 ans (Inadmissible) : Courriel d'inadmissibilité envoyé (résultat du calculateur IRCC +3 ans ou citoyenneté requis avant de repostuler), fermeture du dossier.";
    }

    const dossierIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean);

    let reoNote = "";

    if (this.isAttentesMode()) {
      let admissionPart = "";
      if (this.isCandidateTooOld()) {
        admissionPart = "PFOR - Âge limite dépassé";
      } else if (this.pforType() === "cmr") {
        const cmrDomains = this.getCmrAdmittedDomainsNoteFr();
        if (cmrDomains) {
          admissionPart = `Admis CMR (${cmrDomains})`;
        } else {
          admissionPart = "PFOR CMR";
        }
      } else {
        admissionPart = "PFOR Civil";
      }

      const jobParts: string[] = [];
      for (const id of dossierIds) {
        if (id === "00003") {
          jobParts.push("00003 - Sans métier");
        } else {
          const sit = this.getJobAttentesSituation(id);
          const sitLabel = sit === 1 ? "Intake fermé" : "Traitement fermé";
          jobParts.push(`${id} - ${sitLabel}`);
        }
      }
      const jobsFormatted =
        jobParts.length > 0 ? jobParts.join(", ") : "aucun métier sélectionné";

      reoNote = `Étape 1 (En cours) - ${admissionPart} - Courriel de gestion des attentes envoyé, ${jobsFormatted}. Traitement continu, possible changement de métier selon choix du postulant.`;
    } else {
      let metierRaison = "";

      if (dossierIds.length === 0) {
        metierRaison = "aucun métier sélectionné au dossier";
      } else {
        const parts: string[] = [];
        const choices = this.analyzedDossierChoices();
        for (const c of choices) {
          if (c.job.id === "00003") {
            parts.push(`00003 : Sans métier`);
            continue;
          }
          parts.push(
            `(${c.job.id} : ${c.isEligible ? "Admissible" : c.reasonFr})`,
          );
        }
        metierRaison = parts.join(", ");
      }

      const isPRAdmissible = this.citizenship() === "PR > 3 years";
      const prDemandText = isPRAdmissible
        ? " et relevés de notes du pays d'origine demandés"
        : "";

      let reoPrefix = "Réorientation nécessaire car";
      if (this.isCandidateTooOld()) {
        reoPrefix = "PFOR - Âge limite dépassé - Réorientation nécessaire car";
      } else if (this.pforType() === "cmr") {
        if (this.cmrRefused()) {
          reoPrefix = "Refus d'admission CMR - Réorientation nécessaire";
        } else if (this.cmrMinCriteriaNotMet()) {
          reoPrefix = "Critère minimal PFOR non rencontré (DES manquant) - Réorientation nécessaire";
        } else {
          const cmrDomains = this.getCmrAdmittedDomainsNoteFr();
          if (cmrDomains) {
            reoPrefix = `Admis CMR (${cmrDomains}) - Réorientation nécessaire car`;
          } else {
            reoPrefix = "PFOR CMR - Réorientation nécessaire car";
          }
        }
      } else {
        reoPrefix = "PFOR Civil - Réorientation nécessaire car";
      }

      if (!this.isCandidateTooOld() && this.pforType() === "cmr" && (this.cmrRefused() || this.cmrMinCriteriaNotMet())) {
        reoNote = `Étape 1 (En cours) - ${reoPrefix}, courriel de réo envoyé${prDemandText}, en attente de la réponse du postulant. Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.`;
      } else {
        reoNote = `Étape 1 (En cours) - ${reoPrefix} : ${metierRaison}, courriel de réo envoyé${prDemandText}, en attente de la réponse du postulant. Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.`;
      }
    }

    if ((this.sharedState.includeLinkedEmail() || (this.sharedState.hasReassignedTasks() && this.showResultsPanel())) && this.sharedState.taskNote()) {
      const taskNoteRaw = this.sharedState.taskNote();

      let medicalSuffix = "";
      const medicalMarker = "MÉDICAL - TRIAGE PAR MED CHU REQUIS";
      if (taskNoteRaw.toUpperCase().includes(medicalMarker)) {
        medicalSuffix = "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }

      const prefixRegex = /^Étape 1 \((En cours|en cours)\)\s*-\s*/i;
      const suffixString = this.isAttentesMode()
        ? "Traitement continu, possible changement de métier selon choix du postulant."
        : "Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.";

      const taskHasPrefix = prefixRegex.test(taskNoteRaw);
      let taskClean = taskNoteRaw.replace(prefixRegex, "").trim();
      const medicalIndex = taskClean.toUpperCase().indexOf(medicalMarker);
      if (medicalIndex !== -1) {
        taskClean = taskClean.substring(0, medicalIndex).trim();
      }
      const suffixIndexTask = taskClean
        .toLowerCase()
        .indexOf(suffixString.toLowerCase());
      if (suffixIndexTask !== -1) {
        taskClean = taskClean.substring(0, suffixIndexTask).trim();
      }
      if (taskClean.endsWith(".")) {
        taskClean = taskClean.slice(0, -1).trim();
      }

      const reoHasPrefix = prefixRegex.test(reoNote);
      let reoClean = reoNote.replace(prefixRegex, "").trim();
      const suffixIndexReo = reoClean
        .toLowerCase()
        .indexOf(suffixString.toLowerCase());
      if (suffixIndexReo !== -1) {
        reoClean = reoClean.substring(0, suffixIndexReo).trim();
      }
      if (reoClean.endsWith(".")) {
        reoClean = reoClean.slice(0, -1).trim();
      }

      let combinedCore = "";
      if (taskClean && reoClean) {
        if (taskClean === reoClean) {
          combinedCore = taskClean;
        } else {
          combinedCore = `${taskClean} ET ${reoClean}`;
        }
      } else {
        combinedCore = taskClean || reoClean;
      }

      const hasPrefix = taskHasPrefix || reoHasPrefix;
      const finalPrefix = hasPrefix ? "Étape 1 (En cours) - " : "";

      return `${finalPrefix}${combinedCore}. ${suffixString}${medicalSuffix}`;
    }

    return reoNote;
  }

  async copyNoteRegistry() {
    const text = this.generateNoteRegistry();
    try {
      await navigator.clipboard.writeText(text);
      this.noteCopied.set(true);
      setTimeout(() => this.noteCopied.set(false), 2000);
    } catch (err) {
      console.error("Failed to copy note", err);
    }
  }

  buildGestionDesAttentesEmail(isHtml: boolean): string {
    const dossierChoices = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean);
    const realDossierIds = dossierChoices.filter((id) => id !== "00003");

    if (!this.showResultsPanel() && realDossierIds.length === 0) {
      return isHtml
        ? '<p class="text-slate-500 italic">Veuillez renseigner les critères d\'admission du postulant PFOR pour générer le courriel de gestion des attentes.</p>'
        : "Veuillez renseigner les critères d'admission du postulant PFOR pour générer le courriel de gestion des attentes.";
    }

    const situation = this.attentesSituation();
    const cmrAdmittedFr = this.getCmrAdmittedDomainsAttentesFr();
    const cmrAdmittedEn = this.getCmrAdmittedDomainsAttentesEn();

    const rawHtml = this.sharedState.taskEmailHtmlFr();
    const rawTxt = this.sharedState.taskEmailFr();
    const hasTasks =
      !!rawHtml &&
      this.sharedState.hasReassignedTasks() &&
      rawHtml.includes("Bonjour,");
    const mergeTasks = (this.sharedState.includeLinkedEmail() || (this.sharedState.hasReassignedTasks() && this.showResultsPanel())) && hasTasks;

    const allEligibleJobs = this.eligiblePforJobs().filter(
      (j) => !dossierChoices.includes(j.id),
    );
    let listOFF: JobEntry[] = [];
    let listClosedOFF: JobEntry[] = [];

    if (this.ignoreSip()) {
      for (const j of allEligibleJobs) {
        if (this.jobService.isPforJobClosed(j.id, this.currentSipPhase())) {
          listClosedOFF.push(j);
        } else {
          listOFF.push(j);
        }
      }
    } else {
      listOFF = allEligibleJobs;
    }

    if (isHtml) {
      let h = "";
      h +=
        '<p><span style="background-color: yellow; font-weight: bold; padding: 2px 4px; border-radius: 3px;">English message will follow.</span></p>\n';

      // FRENCH SECTION
      h += '<p class="mt-4">Bonjour,</p>\n';
      if (this.isCandidateTooOld()) {
        h += '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR)</strong>, nous constatons que vous devez faire l\'objet d\'une réorientation. En effet, vous dépassez l\'âge maximal d\'admissibilité pour ce programme.</p>\n';
      } else if (this.pforType() === "cmr" && cmrAdmittedFr) {
        h += `<p class="mt-4">Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), <strong>vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} !</strong> Nous tenons à vous féliciter chaleureusement pour cette admission.</p>\n`;
      } else {
        h += `<p class="mt-4">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR${this.pforType() === 'civil' ? ' - Universités civiles' : ''})</strong>, nous constatons que vous devez faire l'objet d'une réorientation.</p>\n`;
      }

      if (mergeTasks) {
        let taskPartHtml = "";
        if (rawHtml.includes("<!-- START_TASK_BODY_FR -->")) {
          const frParts = rawHtml.split("<!-- START_TASK_BODY_FR -->");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<!-- END_TASK_BODY_FR -->");
            if (frBodyPart.length > 0) {
              taskPartHtml = frBodyPart[0].trim();
            }
          }
        } else {
          const frParts = rawHtml.split("<p>Bonjour,</p>");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<p>En raison du volume");
            if (frBodyPart.length > 0 && frBodyPart[0].trim().length > 0) {
              taskPartHtml = frBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtml) {
          h +=
            '<div class="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm">\n';
          h +=
            '<p class="font-bold text-black border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :</p>\n';
          h += taskPartHtml + "\n";
          h += "</div>\n";
        }
      }

      if (this.pforType() === "cmr" && cmrAdmittedFr) {
        h +=
          '<p class="mt-4">Toutefois, suite à l\'analyse de vos choix de métiers actuels, nous constatons qu\'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n';
      } else {
        h +=
          '<p class="mt-4">Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n';
      }

      h += '<ul class="list-disc pl-5 mt-2 mb-4 space-y-2">\n';
      for (const id of realDossierIds) {
        const link = this.getJobLinkMarkup(id, true, true);
        const name = `${id} - ${link}`;
        const reasons = this.getJobGestionDesAttentesReasonsFr(id);
        let reasonMarkup = "";
        if (reasons.length > 0) {
          reasonMarkup = `\n    <ul class="list-disc pl-5 mt-1 text-sm text-slate-600">\n      <li>${reasons.join("</li>\n      <li>")}</li>\n    </ul>`;
        }
        h += `  <li class="mt-1"><strong>${name}</strong>${reasonMarkup}</li>\n`;
      }
      h += '</ul>\n';

      h +=
        '<p class="mt-4 font-semibold text-slate-800">Voici les options qui s\'offrent à vous:</p>\n';
      h += '<ul class="list-disc pl-5 mt-2 mb-4 space-y-2">\n';
      h +=
        '  <li><strong>Conserver le métier actuel.</strong> Vous pouvez garder ce choix de métier, des positions pourraient de nouveau être disponibles dans les prochaines semaines, mais rien n’est garantie.</li>\n';
      h +=
        '  <li><strong>Choisir un autre métier.</strong> Vous devez réorienter votre candidature vers un choix de métier pour lequel vous êtes admissible afin de poursuivre le processus d\'enrôlement. Il faut comprendre que la situation évolue rapidement et que les métiers de la liste suivante peuvent également se voir être fermés dans les prochains jours/semaines.</li>\n';
      h += '</ul>\n';

      h +=
        '<p class="mt-4 font-semibold text-slate-800">Veuillez consulter la liste des métiers pour lesquels vous rencontrez les critères d\'admissibilité :</p>\n';

      h += '<div class="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      h += '  <p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">Officiers:</p>\n';
      if (listOFF.length === 0 && listClosedOFF.length === 0) {
        h += '  <p class="mt-2 text-slate-700 italic">Aucun métier PFOR ouvert correspondant n\'est disponible actuellement pour la sélection effectuée.</p>\n';
      } else {
        h += '  <ul class="list-disc pl-5 space-y-1">\n';
        for (const j of listOFF) {
          const link = this.getJobLinkMarkup(j.id, true, true);
          h += `    <li><strong>${j.id} - ${link}</strong></li>\n`;
        }
        for (const j of listClosedOFF) {
          const link = this.getJobLinkMarkup(j.id, true, true);
          h += `    <li class="text-red-700" style="color: #b91c1c;"><strong>${j.id} - ${link}</strong> <span style="background-color: #fecaca; color: #991b1b; font-size: 11px; padding: 1px 4px; border-radius: 3px; font-weight: bold;">(FERMÉ)</span></li>\n`;
        }
        h += '  </ul>\n';
      }
      h += '</div>\n';

      h +=
        '<p class="mt-4">Nous vous remercions pour votre intérêt envers les Forces armées canadiennes. Veuillez nous faire part de votre décision en répondant directement à ce courriel afin de poursuivre ou de mettre à jour votre dossier.</p>\n';

      h += '<p>' + this.sharedState.getHtmlSignatureFr() + '</p>\n';

      h += '<hr class="my-6 border-slate-200" />\n';

      // ENGLISH SECTION
      h += '<p class="mt-4">Hello,</p>\n';
      if (this.isCandidateTooOld()) {
        h += '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP)</strong>, we note that you require a reorientation. Indeed, you exceed the maximum eligibility age for this program.</p>\n';
      } else if (this.pforType() === "cmr" && cmrAdmittedEn) {
        h += `<p class="mt-4">We are pleased to inform you that, following the assessment of your transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), <strong>you have been admitted to RMC in the following field(s) of study: ${cmrAdmittedEn}!</strong> We would like to warmly congratulate you on your admission.</p>\n`;
      } else {
        h += `<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP${this.pforType() === 'civil' ? ' - Civilian Universities' : ''})</strong>, we note that you require a reorientation.</p>\n`;
      }

      if (mergeTasks) {
        const rawHtmlEn = this.sharedState.taskEmailHtmlEn();
        let taskPartHtmlEn = "";
        if (rawHtmlEn.includes("<!-- START_TASK_BODY_EN -->")) {
          const enParts = rawHtmlEn.split("<!-- START_TASK_BODY_EN -->");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<!-- END_TASK_BODY_EN -->");
            if (enBodyPart.length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        } else {
          const enParts = rawHtmlEn.split("<p>Hello,</p>");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<p>Due to a high volume");
            if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtmlEn) {
          h +=
            '<div class="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm">\n';
          h +=
            '<p class="font-bold text-black border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL:</p>\n';
          h += taskPartHtmlEn + "\n";
          h += "</div>\n";
        }
      }

      if (this.pforType() === "cmr" && cmrAdmittedEn) {
        h +=
          '<p class="mt-4">However, following the review of your current occupation choices, a reorientation is required.<br>Here is the current status of the occupations in your file:</p>\n';
      } else {
        h +=
          '<p class="mt-4">Here is the status of the occupations currently in your file:</p>\n';
      }

      h += '<ul class="list-disc pl-5 mt-2 mb-4 space-y-2">\n';
      for (const id of realDossierIds) {
        const link = this.getJobLinkMarkup(id, false, true);
        const name = `${id} - ${link}`;
        const reasons = this.getJobGestionDesAttentesReasonsEn(id);
        let reasonMarkup = "";
        if (reasons.length > 0) {
          reasonMarkup = `\n    <ul class="list-disc pl-5 mt-1 text-sm text-slate-600">\n      <li>${reasons.join("</li>\n      <li>")}</li>\n    </ul>`;
        }
        h += `  <li class="mt-1"><strong>${name}</strong>${reasonMarkup}</li>\n`;
      }
      h += '</ul>\n';

      h +=
        '<p class="mt-4 font-semibold text-slate-800">Here are the options available to you:</p>\n';
      h += '<ul class="list-disc pl-5 mt-2 mb-4 space-y-2">\n';
      h +=
        '  <li><strong>Maintain Your Current Occupation Choice.</strong> You may keep your current occupation choice, as positions could become available again in the coming weeks. However, there is no guarantee that vacancies will reopen.</li>\n';
      h +=
        '  <li><strong>Choose Another Occupation.</strong> You must redirect your application to an occupation for which you are eligible in order to continue the enrolment process. Please note that the situation changes rapidly, and occupations listed below may also close within the coming days or weeks.</li>\n';
      h += '</ul>\n';

      h += '<div class="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      h += '  <p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2 uppercase">ELIGIBLE OCCUPATIONS:</p>\n';
      h += '  <p class="font-bold text-slate-800 mt-2 mb-1">Officers:</p>\n';
      if (listOFF.length === 0 && listClosedOFF.length === 0) {
        h += '  <p class="mt-2 text-slate-700 italic">No matching open ROTP occupations are currently available for the selected options.</p>\n';
      } else {
        h += '  <ul class="list-disc pl-5 space-y-1">\n';
        for (const j of listOFF) {
          const link = this.getJobLinkMarkup(j.id, false, true);
          h += `    <li><strong>${j.id} - ${link}</strong></li>\n`;
        }
        for (const j of listClosedOFF) {
          const link = this.getJobLinkMarkup(j.id, false, true);
          h += `    <li class="text-red-700" style="color: #b91c1c;"><strong>${j.id} - ${link}</strong> <span style="background-color: #fecaca; color: #991b1b; font-size: 11px; padding: 1px 4px; border-radius: 3px; font-weight: bold;">(CLOSED)</span></li>\n`;
        }
        h += '  </ul>\n';
      }
      h += '</div>\n';

      h +=
        '<p class="mt-4">We thank you for your interest in the Canadian Armed Forces. Please let us know your decision by replying directly to this email so that we can update your file.</p>\n';

      h +=
        '<p class="mt-4">Furthermore, please note that these occupations are available as of today; however, they may no longer be available in the coming days.</p>\n';

      h += '<p>' + this.sharedState.getHtmlSignatureEn() + '</p>\n';

      return h;
    } else {
      // PLAIN TEXT VERSION
      let t = "";
      t += "English message will follow.\n\n";

      // FRENCH PLAIN
      t += "Bonjour,\n\n";
      if (this.isCandidateTooOld()) {
        t += "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR), nous constatons que vous devez faire l'objet d'une réorientation. En effet, vous dépassez l'âge maximal d'admissibilité pour ce programme.\n\n";
      } else if (this.pforType() === "cmr" && cmrAdmittedFr) {
        t += `Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} ! Nous tenons à vous féliciter chaleureusement pour cette admission.\n\n`;
      } else {
        t += `Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR${this.pforType() === 'civil' ? ' - Universités civiles' : ''}), nous constatons que vous devez faire l'objet d'une réorientation.\n\n`;
      }

      if (mergeTasks && rawTxt) {
        let taskPartTxt = "";
        if (rawTxt.includes("--- DÉBUT DES TÂCHES ---")) {
          const parts = rawTxt.split("--- DÉBUT DES TÂCHES ---");
          if (parts.length > 1) {
            const body = parts[1].split("--- FIN DES TÂCHES ---");
            if (body.length > 0) {
              taskPartTxt = body[0].trim();
            }
          }
        }
        if (taskPartTxt) {
          t += "TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :\n";
          t += "----------------------------------------------------------------------\n";
          t += taskPartTxt + "\n\n";
        }
      }

      if (this.pforType() === "cmr" && cmrAdmittedFr) {
        t +=
          "Toutefois, suite à l'analyse de vos choix de métiers actuels, nous constatons qu'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :\n";
      } else {
        t +=
          "Voici le statut des métiers actuellement inscrits à votre dossier :\n";
      }
      for (const id of realDossierIds) {
        const link = this.getJobLinkMarkup(id, true, false);
        const name = `${id} - ${link}`;
        const reasons = this.getJobGestionDesAttentesReasonsFr(id);
        let reasonTxt = "";
        if (reasons.length > 0) {
          reasonTxt = `\n    - ${reasons.join("\n    - ")}`;
        }
        t += `- ${name}${reasonTxt}\n`;
      }
      t += "\n";

      t += "Voici les options qui s'offrent à vous:\n";
      t +=
        "• Conserver le métier actuel. Vous pouvez garder ce choix de métier, des positions pourraient de nouveau être disponibles dans les prochaines semaines, mais rien n’est garantie.\n";
      t +=
        "• Choisir un autre métier. Vous devez réorienter votre candidature vers un choix de métier pour lequel vous êtes admissible afin de poursuivre le processus d'enrôlement. Il faut comprendre que la situation évolue rapidement et que les métiers de la liste suivante peuvent également se voir être fermés dans les prochains jours/semaines.\n\n";

      t +=
        "Veuillez consulter la liste des métiers pour lesquels vous rencontrez les critères d'admissibilité :\n";
      t += "Officiers:\n";
      if (listOFF.length === 0 && listClosedOFF.length === 0) {
        t +=
          "Aucun métier PFOR ouvert correspondant n'est disponible actuellement pour la sélection effectuée.\n\n";
      } else {
        for (const j of listOFF) {
          const link = this.getJobLinkMarkup(j.id, true, false);
          t += `• ${j.id} - ${link}\n`;
        }
        for (const j of listClosedOFF) {
          const link = this.getJobLinkMarkup(j.id, true, false);
          t += `• ${j.id} - ${link} (FERMÉ)\n`;
        }
        t += "\n";
      }

      t +=
        "Nous vous remercions pour votre intérêt envers les Forces armées canadiennes. Veuillez nous faire part de votre décision en répondant directement à ce courriel afin de poursuivre ou de mettre à jour votre dossier.\n\n";

      t += this.sharedState.getSignatureFr() + "\n\n";

      t += "========================================\n\n";

      // ENGLISH PLAIN
      t += "Hello,\n\n";
      if (this.isCandidateTooOld()) {
        t += "Following the analysis of your application file for the Regular Officer Training Plan (ROTP), we note that you require a reorientation. Indeed, you exceed the maximum eligibility age for this program.\n\n";
      } else if (this.pforType() === "cmr" && cmrAdmittedEn) {
        t += `We are pleased to inform you that, following the assessment of your transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), you have been admitted to RMC in the following field(s) of study: ${cmrAdmittedEn}! We would like to warmly congratulate you on your admission.\n\n`;
      } else {
        t += `Following the analysis of your application file for the Regular Officer Training Plan (ROTP${this.pforType() === 'civil' ? ' - Civilian Universities' : ''}), we note that you require a reorientation.\n\n`;
      }

      if (mergeTasks) {
        const rawTxtEn = this.sharedState.taskEmailEn();
        let taskPartTxtEn = "";
        if (rawTxtEn.includes("--- START OF TASKS ---")) {
          const parts = rawTxtEn.split("--- START OF TASKS ---");
          if (parts.length > 1) {
            const body = parts[1].split("--- END OF TASKS ---");
            if (body.length > 0) {
              taskPartTxtEn = body[0].trim();
            }
          }
        }
        if (taskPartTxtEn) {
          t += "TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL:\n";
          t += "----------------------------------------------------------------------\n";
          t += taskPartTxtEn + "\n\n";
        }
      }

      if (this.pforType() === "cmr" && cmrAdmittedEn) {
        t +=
          "However, following the review of your current occupation choices, a reorientation is required.\nHere is the current status of the occupations in your file:\n";
      } else {
        t +=
          "Here is the status of the occupations in your file:\n";
      }
      for (const id of realDossierIds) {
        const link = this.getJobLinkMarkup(id, false, false);
        const name = `${id} - ${link}`;
        const reasons = this.getJobGestionDesAttentesReasonsEn(id);
        let reasonTxt = "";
        if (reasons.length > 0) {
          reasonTxt = `\n    - ${reasons.join("\n    - ")}`;
        }
        t += `- ${name}${reasonTxt}\n`;
      }
      t += "\n";

      t += "Here are the options available to you:\n";
      t +=
        "• Maintain Your Current Occupation Choice. You may keep your current occupation choice, as positions could become available again in the coming weeks. However, there is no guarantee that vacancies will reopen.\n";
      t +=
        "• Choose Another Occupation. You must redirect your application to an occupation for which you are eligible in order to continue the enrolment process. Please note that the situation changes rapidly, and occupations listed below may also close within the coming days or weeks.\n\n";

      t += "ELIGIBLE OCCUPATIONS:\n";
      t += "Officers:\n";
      if (listOFF.length === 0 && listClosedOFF.length === 0) {
        t +=
          "No matching open ROTP occupations are currently available for the selected options.\n\n";
      } else {
        for (const j of listOFF) {
          const link = this.getJobLinkMarkup(j.id, false, false);
          t += `• ${j.id} - ${link}\n`;
        }
        for (const j of listClosedOFF) {
          const link = this.getJobLinkMarkup(j.id, false, false);
          t += `• ${j.id} - ${link} (CLOSED)\n`;
        }
        t += "\n";
      }

      t +=
        "We thank you for your interest in the Canadian Armed Forces. Please let us know your decision by replying directly to this email so that we can update your file.\n\n";

      t +=
        "Furthermore, please note that these occupations are available as of today; however, they may no longer be available in the coming days.\n\n";

      t += this.sharedState.getSignatureEn() + "\n";

      return t;
    }
  }

  getCmrMinMissingCriteriaFr(): string[] {
    const selected = this.reorientationCriteria.selectedCriteriaIds();
    const missing: string[] = [];

    if (!selected.has("des_12e_annee") && !selected.has("aens")) {
      missing.push("posséder au minimum un diplôme d’études secondaires (DES)");
    }
    if (!selected.has("histoire_sec4")) {
      missing.push("avoir réussi le cours d'histoire de la 4e secondaire");
    }
    if (!selected.has("francais_sec5_11e")) {
      missing.push("avoir réussi le cours de langue d'enseignement primaire de 5e secondaire");
    }
    if (!selected.has("anglais_sec5_12e")) {
      missing.push("avoir réussi le cours de langue seconde de 5e secondaire");
    }

    const allMathIds = Object.values(MATH_COURSES).flat().map((m) => m.id);
    const hasMath = allMathIds.some((mId) => selected.has(mId));
    if (!hasMath) {
      missing.push("avoir réussi un cours de mathématique SN,TS,CST ou 426 avec une note de 70% ou mieux");
    }

    return missing;
  }

  formatCmrMinCriteriaParagraphFr(): string {
    const missing = this.getCmrMinMissingCriteriaFr();
    if (missing.length === 0) {
      return "En effet, vous devez posséder au minimum un diplôme d’études secondaires (DES) pour être admissible au Collège militaire royal du Canada (CMR).";
    }
    let listStr = "";
    if (missing.length === 1) {
      listStr = missing[0];
    } else if (missing.length === 2) {
      listStr = `${missing[0]} et ${missing[1]}`;
    } else {
      listStr = `${missing.slice(0, -1).join(", ")} et ${missing[missing.length - 1]}`;
    }
    return `En effet, vous devez ${listStr} pour être admissible au Collège militaire royal du Canada (CMR).`;
  }

  getCmrMinMissingCriteriaEn(): string[] {
    const selected = this.reorientationCriteria.selectedCriteriaIds();
    const missing: string[] = [];

    if (!selected.has("des_12e_annee") && !selected.has("aens")) {
      missing.push("have at least a high school diploma");
    }
    if (!selected.has("histoire_sec4")) {
      missing.push("have passed Grade 10 / Secondary 4 History");
    }
    if (!selected.has("francais_sec5_11e")) {
      missing.push("have passed the Secondary 5 / Grade 11 primary language of instruction course");
    }
    if (!selected.has("anglais_sec5_12e")) {
      missing.push("have passed the Secondary 5 / Grade 11 second language course");
    }

    const allMathIds = Object.values(MATH_COURSES).flat().map((m) => m.id);
    const hasMath = allMathIds.some((mId) => selected.has(mId));
    if (!hasMath) {
      missing.push("have passed a mathematics course (SN, TS, CST, or 426) with a grade of 70% or higher");
    }

    return missing;
  }

  formatCmrMinCriteriaParagraphEn(): string {
    const missing = this.getCmrMinMissingCriteriaEn();
    if (missing.length === 0) {
      return "Specifically, you must have at least a high school diploma to be eligible for the Royal Military College of Canada (RMC).";
    }
    let listStr = "";
    if (missing.length === 1) {
      listStr = missing[0];
    } else if (missing.length === 2) {
      listStr = `${missing[0]} and ${missing[1]}`;
    } else {
      listStr = `${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]}`;
    }
    return `Specifically, you must ${listStr} to be eligible for the Royal Military College of Canada (RMC).`;
  }

  buildCmrRefusalEmail(isHtml: boolean): string {
    const ncmEval = this.eligibleNcmEvaluation();
    const openJobs = ncmEval.openJobs;
    const closedJobs = ncmEval.closedJobs;
    const mergeTasks =
      this.sharedState.includeLinkedEmail() &&
      this.sharedState.hasReassignedTasks();

    const renderHtmlNcmList = (
      jobs: (JobEntry | string)[],
      isClosed: boolean,
      isFr: boolean,
    ) => {
      if (jobs.length === 0) return "";
      let s = "";
      if (isClosed) {
        s += `<p class="mt-2 mb-1 font-bold text-red-600" style="color: #dc2626; font-weight: bold; margin-top: 8px; margin-bottom: 4px;">${isFr ? "Métiers fermés :" : "Closed occupations:"}</p>\n`;
      }
      s += '<ul class="list-disc pl-6 space-y-1 mb-2">\n';
      for (const item of jobs) {
        const jId = typeof item === "string" ? item : item.id;
        const link = this.getJobLinkMarkup(jId, isFr, true);
        if (isClosed) {
          s += `  <li class="mt-0.5 text-red-700" style="color: #b91c1c;"><strong>${jId} - ${link}</strong> <span style="background-color: #fecaca; color: #991b1b; font-size: 11px; padding: 1px 4px; border-radius: 3px; font-weight: bold;">(${isFr ? "FERMÉ" : "CLOSED"})</span></li>\n`;
        } else {
          s += `  <li class="mt-0.5"><strong>${jId} - ${link}</strong></li>\n`;
        }
      }
      s += "</ul>\n";
      return s;
    };

    const renderPlainNcmList = (
      jobs: (JobEntry | string)[],
      isClosed: boolean,
      isFr: boolean,
    ) => {
      if (jobs.length === 0) return "";
      let s = "";
      if (isClosed) {
        s += `\n${isFr ? "Métiers fermés :" : "Closed occupations:"}\n`;
      }
      for (const item of jobs) {
        const jId = typeof item === "string" ? item : item.id;
        const link = this.getJobLinkMarkup(jId, isFr, false);
        if (isClosed) {
          s += `  - ${jId} - ${link} (${isFr ? "FERMÉ" : "CLOSED"})\n`;
        } else {
          s += `  - ${jId} - ${link}\n`;
        }
      }
      return s;
    };

    if (isHtml) {
      let h = "";

      // Optional Linked Tasks if active
      if (mergeTasks) {
        let taskPartHtml = "";
        const rawHtml = this.sharedState.taskEmailHtmlFr();
        if (rawHtml.includes("<!-- START_TASK_BODY_FR -->")) {
          const frParts = rawHtml.split("<!-- START_TASK_BODY_FR -->");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<!-- END_TASK_BODY_FR -->");
            if (frBodyPart.length > 0) taskPartHtml = frBodyPart[0].trim();
          }
        } else {
          const frParts = rawHtml.split("<p>Bonjour,</p>");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<p>En raison du volume");
            if (frBodyPart.length > 0 && frBodyPart[0].trim().length > 0) {
              taskPartHtml = frBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtml) {
          h +=
            '<div class="mb-6 p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-sm">\n';
          h +=
            '<p class="font-bold text-amber-950 border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #78350f;">TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :</p>\n';
          h += taskPartHtml + "\n";
          h += "</div>\n";
        }
      }

      // ======================================
      // FRENCH SECTION (FROM PDF)
      // ======================================
      h +=
        '<p class="mb-4"><span style="background-color: #fef08a; padding: 2px 6px; font-weight: bold; border-radius: 2px;">English message will follow</span></p>\n';
      h += '<p class="mt-4 mb-4">Bonjour,</p>\n';
      if (this.cmrMinCriteriaNotMet()) {
        h +=
          `<p class="mt-4 mb-4">Malheureusement, si vous recevez ce courriel, c’est pour vous informer que vous ne rencontrez pas les critères minimaux d’admissibilité pour le Programme de formation des officiers de la force régulière (PFOR). <strong>${this.formatCmrMinCriteriaParagraphFr()}</strong></p>\n`;
      } else {
        h +=
          '<p class="mt-4 mb-4">Malheureusement, si vous recevez ce courriel, c’est pour vous informer que suite à l’évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royale du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), <strong>vous n’avez pas été admis(e) par le CMR.</strong></p>\n';
      }
      h +=
        '<p class="mt-4 mb-4">Toutefois, cela ne signifie pas que votre processus de recrutement doit se terminer maintenant.<br>Voici les différentes options qui s’offrent à vous :</p>\n';

      h += '<ul class="list-disc pl-6 space-y-2 mb-4">\n';
      if (this.cmrMinCriteriaNotMet()) {
        h +=
          "  <li>Vous pouvez choisir un métier de membre du rang parmi la liste suivante.</li>\n";
        h +=
          "  <li>Vous pouvez demander la fermeture de votre dossier et retenter votre chance pour le PFOR lorsque vous aurez obtenu votre diplôme d’études secondaires (DES).</li>\n";
      } else {
        h +=
          "  <li>Vous pouvez retentez votre chance lors de la prochaine campagne PFOR l’an prochain.</li>\n";
        h +=
          '  <li>Vous pouvez vous inscrire dans une Université civile dans un programme de Baccalauréat admissible pour les métiers qui vous intéressent et nous fournir la lettre d’admission à temps pleins et sans conditions. <span style="background-color: #fef08a; padding: 1px 3px;">(Cela ne garantit pas que vous serez admis dans le volet Civil du PFOR)</span> <a href="https://forces.ca/fr/programmes-admissibles/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Liste des programmes admissibles par métier</a></li>\n';
        h +=
          "  <li>Vous pouvez aussi choisir un métier de membre du rang parmi la liste suivante.</li>\n";
      }
      h += "</ul>\n";

      // NCM Jobs List
      h +=
        '<div class="my-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      h +=
        '<p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2 text-xs uppercase tracking-wider">Métiers de militaire du rang admissibles :</p>\n';
      if (
        openJobs.length === 0 &&
        (!this.ignoreSip() || closedJobs.length === 0)
      ) {
        h +=
          '<p class="text-xs text-slate-500 italic py-1">(Veuillez sélectionner vos critères de scolarité et d\'expérience dans les panneaux pour afficher les métiers admissibles)</p>\n';
      } else {
        h += renderHtmlNcmList(openJobs, false, true);
        if (this.ignoreSip() && closedJobs.length > 0) {
          h += renderHtmlNcmList(closedJobs, true, true);
        }
      }
      h += "</div>\n";

      if (!this.cmrMinCriteriaNotMet()) {
        h +=
          '<p class="mt-4 mb-4">Il existe aussi un programme d’étude subventionné pour certains métiers de militaire du rang. Si un tel programme vous intéresse, veuillez consulter les informations que vous trouverez à ce lien : <a href="https://forces.ca/fr/programmes-etudes-subventionnees/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">PIESMR | Programmes d’études subventionnées | Forces armées canadiennes</a>.</p>\n';
        h +=
          "<p class=\"mt-4 mb-6\">Si vous trouvez un métier qui vous intéresse dans ce programme ou si vous désirez avoir plus d’information, veuillez répondre directement à ce courriel.</p>\n";
      } else {
        h +=
          "<p class=\"mt-4 mb-6\">Si vous désirez poursuivre votre démarche vers l’un de ces métiers ou procéder à la fermeture de votre dossier, veuillez nous faire part de votre décision en répondant directement à ce courriel.</p>\n";
      }

      h += '<p class="mb-4">Cordialement,</p>\n';
      h += '<p class="text-sm leading-relaxed text-slate-800">\n';
      h += "  L’équipe de recrutement des Forces armées canadiennes<br>\n";
      h += "  Centre de recrutement des Forces canadiennes Québec<br>\n";
      h +=
        "  Commandement du Personnel militaire / Forces armées canadiennes<br>\n";
      h +=
        '  <a href="https://forces.ca/fr/centre-assistance/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a>\n';
      h += "</p>\n";

      h += '<hr class="my-8 border-slate-300" />\n';

      // Optional Linked Tasks (English) if active
      if (mergeTasks) {
        let taskPartHtmlEn = "";
        const rawHtmlEn = this.sharedState.taskEmailHtmlEn();
        if (rawHtmlEn.includes("<!-- START_TASK_BODY_EN -->")) {
          const enParts = rawHtmlEn.split("<!-- START_TASK_BODY_EN -->");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<!-- END_TASK_BODY_EN -->");
            if (enBodyPart.length > 0) taskPartHtmlEn = enBodyPart[0].trim();
          }
        } else {
          const enParts = rawHtmlEn.split("<p>Hello,</p>");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<p>Due to a high volume");
            if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtmlEn) {
          h +=
            '<div class="mb-6 p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-sm">\n';
          h +=
            '<p class="font-bold text-amber-950 border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #78350f;">TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL:</p>\n';
          h += taskPartHtmlEn + "\n";
          h += "</div>\n";
        }
      }

      // ======================================
      // ENGLISH SECTION (FROM PDF)
      // ======================================
      h += '<p class="mt-4 mb-4">Hello,</p>\n';
      if (this.cmrMinCriteriaNotMet()) {
        h +=
          `<p class="mt-4 mb-4">Unfortunately, if you have received this email, it is to inform you that you do not meet the minimum eligibility requirements for the Regular Officer Training Plan (ROTP). <strong>${this.formatCmrMinCriteriaParagraphEn()}</strong></p>\n`;
      } else {
        h +=
          '<p class="mt-4 mb-4">Unfortunately, if you have received this email, it is to inform you that, following the assessment of your academic transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), <strong>you have not been offered admission to RMC.</strong></p>\n';
      }
      h +=
        '<p class="mt-4 mb-4">However, this does not mean that your recruiting process must come to an end at this time.<br>The following options remain available to you:</p>\n';

      h += '<ul class="list-disc pl-6 space-y-2 mb-4">\n';
      if (this.cmrMinCriteriaNotMet()) {
        h +=
          "  <li>You may choose a Non-Commissioned Member (NCM) occupation from the following list.</li>\n";
        h +=
          "  <li>You may request to close your application file and reapply for the ROTP once you have obtained your high school diploma.</li>\n";
      } else {
        h +=
          "  <li>You may reapply during next year’s ROTP selection campaign.</li>\n";
        h +=
          '  <li>You may apply in a civilian university in a bachelor\'s degree program that meets the educational requirements for the occupations that interest you and provide us with an unconditional full-time letter of acceptance. <span style="background-color: #fef08a; padding: 1px 3px;">(Please note that this does not guarantee admission through the Civilian University ROTP entry plan.)</span> <a href="https://forces.ca/en/eligible-programmes/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">List of Eligible Programs by Occupation</a></li>\n';
        h +=
          "  <li>You may also choose a Non-Commissioned Member (NCM) occupation</li>\n";
      }
      h += "</ul>\n";

      // NCM Jobs List English
      h +=
        '<div class="my-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      h +=
        '<p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2 text-xs uppercase tracking-wider">Eligible Non-Commissioned Member occupations:</p>\n';
      if (
        openJobs.length === 0 &&
        (!this.ignoreSip() || closedJobs.length === 0)
      ) {
        h +=
          '<p class="text-xs text-slate-500 italic py-1">(Please select your education and experience criteria in the panels to display eligible occupations)</p>\n';
      } else {
        h += renderHtmlNcmList(openJobs, false, false);
        if (this.ignoreSip() && closedJobs.length > 0) {
          h += renderHtmlNcmList(closedJobs, true, false);
        }
      }
      h += "</div>\n";

      if (!this.cmrMinCriteriaNotMet()) {
        h +=
          '<p class="mt-4 mb-4">There is also a subsidized education program available for certain Non-Commissioned Member (NCM) occupations. If such a program interests you, please consult the information available at the following link: <a href="https://forces.ca/en/paid-education-programs/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">NCMSTEP | Paid Education Programs | Canadian Armed Forces</a>.</p>\n';
        h +=
          "<p class=\"mt-4 mb-6\">If you find an occupation that interests you within this program, or if you would like more information, please reply directly to this email.</p>\n";
      } else {
        h +=
          "<p class=\"mt-4 mb-6\">If you wish to proceed with one of these occupations or request the closure of your file, please let us know by replying directly to this email.</p>\n";
      }

      h += '<p class="mb-4">Sincerely,</p>\n';
      h += '<p class="text-sm leading-relaxed text-slate-800">\n';
      h += "  The Canadian Armed Forces Recruiting Team<br>\n";
      h += "  Canadian Forces Recruiting Centre Quebec<br>\n";
      h +=
        "  Military Personnel Command / Canadian Armed Forces<br>\n";
      h +=
        '  <a href="https://forces.ca/en/help-centre/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a>\n';
      h += "</p>\n";

      return h;
    } else {
      // ======================================
      // PLAIN TEXT VERSION (FROM PDF)
      // ======================================
      let t = "";

      if (mergeTasks) {
        let taskPartTxt = "";
        const rawTxt = this.sharedState.taskEmailFr();
        if (rawTxt.includes("<!-- START_TASK_BODY_FR -->")) {
          const frParts = rawTxt.split("<!-- START_TASK_BODY_FR -->");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<!-- END_TASK_BODY_FR -->");
            if (frBodyPart.length > 0) taskPartTxt = frBodyPart[0].trim();
          }
        } else {
          const frParts = rawTxt.split("Bonjour,");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("En raison du volume");
            if (frBodyPart.length > 0 && frBodyPart[0].trim().length > 0) {
              taskPartTxt = frBodyPart[0].trim();
            }
          }
        }

        if (taskPartTxt) {
          t += "TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :\n";
          t +=
            "----------------------------------------------------------------------\n";
          t += taskPartTxt + "\n\n";
        }
      }

      t += "English message will follow\n\n";
      t += "Bonjour,\n\n";
      if (this.cmrMinCriteriaNotMet()) {
        t +=
          `Malheureusement, si vous recevez ce courriel, c’est pour vous informer que vous ne rencontrez pas les critères minimaux d’admissibilité pour le Programme de formation des officiers de la force régulière (PFOR). ${this.formatCmrMinCriteriaParagraphFr()}\n\n`;
      } else {
        t +=
          "Malheureusement, si vous recevez ce courriel, c’est pour vous informer que suite à l’évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royale du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), vous n’avez pas été admis(e) par le CMR.\n\n";
      }
      t +=
        "Toutefois, cela ne signifie pas que votre processus de recrutement doit se terminer maintenant.\n";
      t += "Voici les différentes options qui s’offrent à vous :\n\n";

      if (this.cmrMinCriteriaNotMet()) {
        t +=
          "• Vous pouvez choisir un métier de membre du rang parmi la liste suivante.\n";
        t +=
          "• Vous pouvez demander la fermeture de votre dossier et retenter votre chance pour le PFOR lorsque vous aurez obtenu votre diplôme d’études secondaires (DES).\n\n";
      } else {
        t +=
          "• Vous pouvez retentez votre chance lors de la prochaine campagne PFOR l’an prochain.\n";
        t +=
          "• Vous pouvez vous inscrire dans une Université civile dans un programme de Baccalauréat admissible pour les métiers qui vous intéressent et nous fournir la lettre d’admission à temps pleins et sans conditions. (Cela ne garantit pas que vous serez admis dans le volet Civil du PFOR) Liste des programmes admissibles par métier (https://forces.ca/fr/programmes-admissibles/)\n";
        t +=
          "• Vous pouvez aussi choisir un métier de membre du rang parmi la liste suivante.\n\n";
      }

      t += "Métiers de militaire du rang admissibles :\n";
      if (
        openJobs.length === 0 &&
        (!this.ignoreSip() || closedJobs.length === 0)
      ) {
        t +=
          "(Veuillez sélectionner vos critères de scolarité et d'expérience dans les panneaux pour afficher les métiers admissibles)\n";
      } else {
        t += renderPlainNcmList(openJobs, false, true);
        if (this.ignoreSip() && closedJobs.length > 0) {
          t += renderPlainNcmList(closedJobs, true, true);
        }
      }

      if (!this.cmrMinCriteriaNotMet()) {
        t +=
          "\nIl existe aussi un programme d’étude subventionné pour certains métiers de militaire du rang. Si un tel programme vous intéresse, veuillez consulter les informations que vous trouverez à ce lien : PIESMR | Programmes d’études subventionnées | Forces armées canadiennes (https://forces.ca/fr/programmes-etudes-subventionnees/).\n\n";
        t +=
          "Si vous trouvez un métier qui vous intéresse dans ce programme ou si vous désirez avoir plus d’information, veuillez répondre directement à ce courriel.\n\n";
      } else {
        t +=
          "\nSi vous désirez poursuivre votre démarche vers l’un de ces métiers ou procéder à la fermeture de votre dossier, veuillez nous faire part de votre décision en répondant directement à ce courriel.\n\n";
      }

      t += "Cordialement,\n\n";
      t += "L’équipe de recrutement des Forces armées canadiennes\n";
      t += "Centre de recrutement des Forces canadiennes Québec\n";
      t +=
        "Commandement du Personnel militaire / Forces armées canadiennes\n";
      t +=
        "Centre d’assistance | Forces armées canadiennes (https://forces.ca/fr/centre-assistance/)\n\n";

      t += "------------------------------------------------------------\n\n";

      if (mergeTasks) {
        let taskPartTxtEn = "";
        const rawTxtEn = this.sharedState.taskEmailEn();
        if (rawTxtEn.includes("<!-- START_TASK_BODY_EN -->")) {
          const enParts = rawTxtEn.split("<!-- START_TASK_BODY_EN -->");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<!-- END_TASK_BODY_EN -->");
            if (enBodyPart.length > 0) taskPartTxtEn = enBodyPart[0].trim();
          }
        } else {
          const enParts = rawTxtEn.split("Hello,");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("Due to a high volume");
            if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
              taskPartTxtEn = enBodyPart[0].trim();
            }
          }
        }

        if (taskPartTxtEn) {
          t += "TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL:\n";
          t +=
            "----------------------------------------------------------------------\n";
          t += taskPartTxtEn + "\n\n";
        }
      }

      t += "Hello,\n\n";
      if (this.cmrMinCriteriaNotMet()) {
        t +=
          `Unfortunately, if you have received this email, it is to inform you that you do not meet the minimum eligibility requirements for the Regular Officer Training Plan (ROTP). ${this.formatCmrMinCriteriaParagraphEn()}\n\n`;
      } else {
        t +=
          "Unfortunately, if you have received this email, it is to inform you that, following the assessment of your academic transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), you have not been offered admission to RMC.\n\n";
      }
      t +=
        "However, this does not mean that your recruiting process must come to an end at this time.\n";
      t += "The following options remain available to you:\n\n";

      if (this.cmrMinCriteriaNotMet()) {
        t +=
          "• You may choose a Non-Commissioned Member (NCM) occupation from the following list.\n";
        t +=
          "• You may request to close your application file and reapply for the ROTP once you have obtained your high school diploma.\n\n";
      } else {
        t +=
          "• You may reapply during next year’s ROTP selection campaign.\n";
        t +=
          "• You may apply in a civilian university in a bachelor's degree program that meets the educational requirements for the occupations that interest you and provide us with an unconditional full-time letter of acceptance. (Please note that this does not guarantee admission through the Civilian University ROTP entry plan.) List of Eligible Programs by Occupation (https://forces.ca/en/eligible-programmes/)\n";
        t +=
          "• You may also choose a Non-Commissioned Member (NCM) occupation\n\n";
      }

      t += "Eligible Non-Commissioned Member occupations:\n";
      if (
        openJobs.length === 0 &&
        (!this.ignoreSip() || closedJobs.length === 0)
      ) {
        t +=
          "(Please select your education and experience criteria in the panels to display eligible occupations)\n";
      } else {
        t += renderPlainNcmList(openJobs, false, false);
        if (this.ignoreSip() && closedJobs.length > 0) {
          t += renderPlainNcmList(closedJobs, true, false);
        }
      }

      if (!this.cmrMinCriteriaNotMet()) {
        t +=
          "\nThere is also a subsidized education program available for certain Non-Commissioned Member (NCM) occupations. If such a program interests you, please consult the information available at the following link: NCMSTEP | Paid Education Programs | Canadian Armed Forces (https://forces.ca/en/paid-education-programs/).\n\n";
        t +=
          "If you find an occupation that interests you within this program, or if you would like more information, please reply directly to this email.\n\n";
      } else {
        t +=
          "\nIf you wish to proceed with one of these occupations or request the closure of your file, please let us know by replying directly to this email.\n\n";
      }

      t += "Sincerely,\n\n";
      t += "The Canadian Armed Forces Recruiting Team\n";
      t += "Canadian Forces Recruiting Centre Quebec\n";
      t += "Military Personnel Command / Canadian Armed Forces\n";
      t +=
        "Help Centre | Canadian Armed Forces (https://forces.ca/en/help-centre/)\n";

      return t;
    }
  }

  buildBilingualEmail(isHtml: boolean): string {
    if (this.age() !== null && this.age()! >= 57) {
      if (isHtml) {
        let h = "";
        h +=
          '<p><span style="background-color: yellow; font-weight: bold; padding: 2px 4px; border-radius: 3px;">English message will follow.</span></p>\n';
        h += '<p class="mt-4">Bonjour,</p>\n';
        h +=
          '<p class="mt-4">Suite à l’analyse de votre dossier de candidature, nous constatons que vous dépassez l’âge maximal d’admissibilité (56 ans) pour un enrôlement dans les Forces armées canadiennes (FAC). Toute personne ayant 57 ans ou plus est automatiquement inadmissible à un emploie dans les FAC.</p>\n';
        h += '<p class="mt-4">Votre dossier sera fermé.</p>\n';
        h +=
          '<p class="mt-4">Merci de votre intérêt à joindre les Forces armées canadienne!</p>\n';
        h += '<p class="mt-4">' + this.sharedState.getHtmlSignatureFr() + '</p>\n';
        h +=
          '<p class="my-6 border-t border-slate-300" style="margin-top: 24px; margin-bottom: 24px; border-top: 1px solid #cbd5e1;"></p>\n';
        h += '<p class="mt-4">Hello,</p>\n';
        h +=
          '<p class="mt-4">Following the analysis of your application file, we have determined that you exceed the maximum eligibility age (56 years) for enrollment in the Canadian Armed Forces (CAF). Anyone aged 57 or older is automatically ineligible for employment in the CAF.</p>\n';
        h += '<p class="mt-4">Your file will be closed.</p>\n';
        h +=
          '<p class="mt-4">Thank you for your interest in joining the Canadian Armed Forces!</p>\n';
        h += '<p class="mt-4">' + this.sharedState.getHtmlSignatureEn() + '</p>\n';
        return h;
      } else {
        let p = "";
        p += "English message will follow.\n\n";
        p += "Bonjour,\n\n";
        p +=
          "Suite à l’analyse de votre dossier de candidature, nous constatons que vous dépassez l’âge maximal d’admissibilité (56 ans) pour un enrôlement dans les Forces armées canadiennes (FAC). Toute personne ayant 57 ans ou plus est automatiquement inadmissible à un emploie dans les FAC.\n\n";
        p += "Votre dossier sera fermé.\n\n";
        p += "Merci de votre intérêt à joindre les Forces armées canadienne!\n\n";
        p += this.sharedState.getSignatureFr() + "\n\n";
        p +=
          "______________________________________________________________________________\n\n";
        p += "Hello,\n\n";
        p +=
          "Following the analysis of your application file, we have determined that you exceed the maximum eligibility age (56 years) for enrollment in the Canadian Armed Forces (CAF). Anyone aged 57 or older is automatically ineligible for employment in the CAF.\n\n";
        p += "Your file will be closed.\n\n";
        p += "Thank you for your interest in joining the Canadian Armed Forces!\n\n";
        p += this.sharedState.getSignatureEn();
        return p;
      }
    }

    if (this.citizenship() === "PR < 3 years") {
      if (isHtml) {
        let h = "";
        h +=
          '<p><span style="background-color: yellow; font-weight: bold; padding: 2px 4px; border-radius: 3px;">English message will follow.</span></p>\n';
        h += '<p class="mt-4">Bonjour,</p>\n';
        h +=
          '<p class="mt-4">Suite à l’analyse de votre dossier de candidature, nous constatons que vous êtes présentement inadmissible à un enrôlement dans les Forces armées canadiennes (FAC) sous le statut de résident permanent.</p>\n';
        h +=
          '<p class="mt-4">Pour être admissible à un enrôlement dans les FAC à titre de résident permanent, vous devez avoir accumulé au moins trois ans (1 095 jours) de présence physique au Canada.</p>\n';
        h +=
          '<p class="mt-4">Pour devenir admissible et pouvoir poser à nouveau votre candidature ou poursuivre votre processus à l\'avenir, vous devez :</p>\n';
        h += '<ul class="list-disc pl-5 mt-2 mb-4 text-sm text-slate-700" style="padding-left: 20px; margin-top: 8px; margin-bottom: 16px;">\n';
        h += '  <li><strong>Soit obtenir la citoyenneté canadienne ;</strong></li>\n';
        h += '  <li><strong>Soit fournir le résultat officiel du calculateur de présence physique d\'Immigration, Réfugiés et Citoyenneté Canada (IRCC)</strong> prouvant que vous avez accumulé plus de trois ans (1 095 jours) sur le territoire canadien.</li>\n';
        h += '</ul>\n';
        h +=
          '<p class="mt-4">Puisque vous ne remplissez pas cette condition pour le moment, votre dossier de candidature actuel sera fermé. Dès que vous respecterez l\'une de ces conditions, nous vous invitons à déposer une nouvelle candidature.</p>\n';
        h +=
          '<p class="mt-4">Nous vous remercions sincèrement de votre intérêt envers les Forces armées canadiennes.</p>\n';
        h += '<p class="mt-4">' + this.sharedState.getHtmlSignatureFr() + '</p>\n';
        h +=
          '<p class="my-6 border-t border-slate-300" style="margin-top: 24px; margin-bottom: 24px; border-top: 1px solid #cbd5e1;"></p>\n';
        h += '<p class="mt-4">Hello,</p>\n';
        h +=
          '<p class="mt-4">Following the analysis of your application file, we regret to inform you that you are currently ineligible for enrolment in the Canadian Armed Forces (CAF) under permanent resident status.</p>\n';
        h +=
          '<p class="mt-4">To be eligible for enrolment in the CAF as a permanent resident, you must have accumulated at least three years (1,095 days) of physical presence in Canada.</p>\n';
        h +=
          '<p class="mt-4">In order to become eligible and be able to reapply or proceed with an application in the future, you must:</p>\n';
        h += '<ul class="list-disc pl-5 mt-2 mb-4 text-sm text-slate-700" style="padding-left: 20px; margin-top: 8px; margin-bottom: 16px;">\n';
        h += '  <li><strong>Either obtain Canadian citizenship;</strong></li>\n';
        h += '  <li><strong>Or provide the official result from the Immigration, Refugees and Citizenship Canada (IRCC) physical presence calculator</strong> proving that you have accumulated more than three years (1,095 days) on Canadian territory.</li>\n';
        h += '</ul>\n';
        h +=
          '<p class="mt-4">Since you do not meet this condition at this time, your current application file will be closed. As soon as you satisfy one of these requirements, you are welcome to submit a new application.</p>\n';
        h +=
          '<p class="mt-4">Thank you for your interest in the Canadian Armed Forces.</p>\n';
        h += '<p class="mt-4">' + this.sharedState.getHtmlSignatureEn() + '</p>\n';
        return h;
      } else {
        let p = "";
        p += "English message will follow.\n\n";
        p += "Bonjour,\n\n";
        p +=
          "Suite à l’analyse de votre dossier de candidature, nous constatons que vous êtes présentement inadmissible à un enrôlement dans les Forces armées canadiennes (FAC) sous le statut de résident permanent.\n\n";
        p +=
          "Pour être admissible à un enrôlement dans les FAC à titre de résident permanent, vous devez avoir accumulé au moins trois ans (1 095 jours) de présence physique au Canada.\n\n";
        p +=
          "Pour devenir admissible et pouvoir poser à nouveau votre candidature ou poursuivre votre processus à l'avenir, vous devez :\n";
        p += "  - Soit obtenir la citoyenneté canadienne ;\n";
        p += "  - Soit fournir le résultat officiel du calculateur de présence physique d'Immigration, Réfugiés et Citoyenneté Canada (IRCC) prouvant que vous avez accumulé plus de trois ans (1 095 jours) sur le territoire canadien.\n\n";
        p +=
          "Puisque vous ne remplissez pas cette condition pour le moment, votre dossier de candidature actuel sera fermé. Dès que vous respecterez l'une de ces conditions, nous vous invitons à déposer une nouvelle candidature.\n\n";
        p += "Nous vous remercions sincèrement de votre intérêt envers les Forces armées canadiennes.\n\n";
        p += this.sharedState.getSignatureFr() + "\n\n";
        p +=
          "______________________________________________________________________________\n\n";
        p += "Hello,\n\n";
        p +=
          "Following the analysis of your application file, we regret to inform you that you are currently ineligible for enrolment in the Canadian Armed Forces (CAF) under permanent resident status.\n\n";
        p +=
          "To be eligible for enrolment in the CAF as a permanent resident, you must have accumulated at least three years (1,095 days) of physical presence in Canada.\n\n";
        p +=
          "In order to become eligible and be able to reapply or proceed with an application in the future, you must:\n";
        p += "  - Either obtain Canadian citizenship;\n";
        p += "  - Or provide the official result from the Immigration, Refugees and Citizenship Canada (IRCC) physical presence calculator proving that you have accumulated more than three years (1,095 days) on Canadian territory.\n\n";
        p +=
          "Since you do not meet this condition at this time, your current application file will be closed. As soon as you satisfy one of these requirements, you are welcome to submit a new application.\n\n";
        p += "Thank you for your interest in the Canadian Armed Forces.\n\n";
        p += this.sharedState.getSignatureEn();
        return p;
      }
    }

    if (this.isAttentesMode()) {
      return this.buildGestionDesAttentesEmail(isHtml);
    }
    if (this.pforType() === "cmr" && (this.cmrRefused() || this.cmrMinCriteriaNotMet())) {
      return this.buildCmrRefusalEmail(isHtml);
    }

    const jobIds = this.eligiblePforJobs().map((j) => j.id);

    if (!this.showResultsPanel() && jobIds.length === 0) {
      return isHtml
        ? '<p class="text-slate-500 italic">Veuillez renseigner les critères d\'admission du postulant PFOR pour générer le courriel de réorientation.</p>'
        : "Veuillez renseigner les critères d'admission du postulant PFOR pour générer le courriel de réorientation.";
    }

    const isPilotEligible = jobIds.includes("00183");
    const isPRAdmissible = this.citizenship() === "PR > 3 years";

    const allEligibleJobs = this.eligiblePforJobs();
    let listOFF: JobEntry[] = [];
    let listClosedOFF: JobEntry[] = [];

    if (this.ignoreSip()) {
      for (const j of allEligibleJobs) {
        if (this.jobService.isPforJobClosed(j.id, this.currentSipPhase())) {
          listClosedOFF.push(j);
        } else {
          listOFF.push(j);
        }
      }
    } else {
      listOFF = allEligibleJobs;
    }

    const ncmEval = this.eligibleNcmEvaluation();
    const openScolariteOfficerJobs = ncmEval.openOfficerJobs.filter(
      (j) => !listOFF.some((o) => o.id === j.id)
    );
    const closedScolariteOfficerJobs = ncmEval.closedOfficerJobs.filter(
      (j) => !listClosedOFF.some((o) => o.id === j.id)
    );
    const openNcmJobs = ncmEval.openNcmJobs;
    const closedNcmJobs = ncmEval.closedNcmJobs;

    const allOpenOfficerJobs = [...listOFF, ...openScolariteOfficerJobs];
    const allClosedOfficerJobs = [
      ...listClosedOFF,
      ...closedScolariteOfficerJobs,
    ];

    const shouldIncludeNcm =
      this.isCandidateTooOld() ||
      this.hasAgeInadmissibilityInDossier() ||
      this.showScolariteExperiencePanel() ||
      ((openNcmJobs.length > 0 || openScolariteOfficerJobs.length > 0) &&
        listOFF.length === 0);

    const renderHtmlList = (
      jobsList: JobEntry[],
      isClosedList: boolean,
      isFr: boolean,
    ): string => {
      if (jobsList.length === 0) return "";
      let s = "";
      if (isClosedList) {
        s += `<p class="mt-3 mb-1 font-bold text-red-600" style="color: #dc2626; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">${isFr ? "Officiers (Fermés) :" : "Officers (Closed):"}</p>\n`;
      } else {
        s += `<p class="mt-3 mb-1 font-bold text-slate-800" style="color: #1e293b; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">${isFr ? "Officiers :" : "Officers:"}</p>\n`;
      }
      s += '<ul class="list-disc pl-5 space-y-1 mb-2">\n';
      for (const j of jobsList) {
        const link = this.getJobLinkMarkup(j.id, isFr, true);
        const reqDomain =
          this.pforType() === "cmr"
            ? isFr
              ? ` (CMR : ${this.getCmrJobRequiredDomainsFr(j.id)})`
              : ` (RMC: ${this.getCmrJobRequiredDomainsEn(j.id)})`
            : "";
        if (isClosedList) {
          s += `  <li class="mt-0.5 text-red-700" style="color: #b91c1c;"><strong>${j.id} - ${link}</strong>${reqDomain} <span style="background-color: #fecaca; color: #991b1b; font-size: 11px; padding: 1px 4px; border-radius: 3px; font-weight: bold;">(${isFr ? "FERMÉ" : "CLOSED"})</span></li>\n`;
        } else {
          s += `  <li class="mt-0.5"><strong>${j.id} - ${link}</strong>${reqDomain}</li>\n`;
        }
      }
      s += "</ul>\n";
      return s;
    };

    const renderPlainList = (
      jobsList: JobEntry[],
      isClosedList: boolean,
      isFr: boolean,
    ): string => {
      if (jobsList.length === 0) return "";
      let s = "";
      if (isClosedList) {
        s += `\n${isFr ? "Officiers (Fermés) :" : "Officers (Closed):"}\n`;
      } else {
        s += `\n${isFr ? "Officiers :" : "Officers:"}\n`;
      }
      for (const j of jobsList) {
        const link = this.getJobLinkMarkup(j.id, isFr, false);
        const reqDomain =
          this.pforType() === "cmr"
            ? isFr
              ? ` (CMR : ${this.getCmrJobRequiredDomainsFr(j.id)})`
              : ` (RMC: ${this.getCmrJobRequiredDomainsEn(j.id)})`
            : "";
        if (isClosedList) {
          s += `  - ${j.id} - ${link}${reqDomain} (${isFr ? "FERMÉ" : "CLOSED"})\n`;
        } else {
          s += `  - ${j.id} - ${link}${reqDomain}\n`;
        }
      }
      return s;
    };

    const renderHtmlNcmList = (
      jobsList: (JobEntry | string)[],
      isClosedList: boolean,
      isFr: boolean,
    ): string => {
      if (jobsList.length === 0) return "";
      let s = "";
      if (isClosedList) {
        s += `<p class="mt-3 mb-1 font-bold text-red-600" style="color: #dc2626; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">${isFr ? "Militaire du rang (Fermés) :" : "Non-Commissioned Member (Closed):"}</p>\n`;
      } else {
        s += `<p class="mt-3 mb-1 font-bold text-slate-800" style="color: #1e293b; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">${isFr ? "Militaire du rang :" : "Non-Commissioned Member:"}</p>\n`;
      }
      s += '<ul class="list-disc pl-5 space-y-1 mb-2">\n';
      for (const item of jobsList) {
        const jId = typeof item === "string" ? item : item.id;
        const link = this.getJobLinkMarkup(jId, isFr, true);
        if (isClosedList) {
          s += `  <li class="mt-0.5 text-red-700" style="color: #b91c1c;"><strong>${jId} - ${link}</strong> <span style="background-color: #fecaca; color: #991b1b; font-size: 11px; padding: 1px 4px; border-radius: 3px; font-weight: bold;">(${isFr ? "FERMÉ" : "CLOSED"})</span></li>\n`;
        } else {
          s += `  <li class="mt-0.5"><strong>${jId} - ${link}</strong></li>\n`;
        }
      }
      s += "</ul>\n";
      return s;
    };

    const renderPlainNcmList = (
      jobsList: (JobEntry | string)[],
      isClosedList: boolean,
      isFr: boolean,
    ): string => {
      if (jobsList.length === 0) return "";
      let s = "";
      if (isClosedList) {
        s += `\n${isFr ? "Militaire du rang (Fermés) :" : "Non-Commissioned Member (Closed):"}\n`;
      } else {
        s += `\n${isFr ? "Militaire du rang :" : "Non-Commissioned Member:"}\n`;
      }
      for (const item of jobsList) {
        const jId = typeof item === "string" ? item : item.id;
        const link = this.getJobLinkMarkup(jId, isFr, false);
        if (isClosedList) {
          s += `  - ${jId} - ${link} (${isFr ? "FERMÉ" : "CLOSED"})\n`;
        } else {
          s += `  - ${jId} - ${link}\n`;
        }
      }
      return s;
    };

    const dossierIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter(Boolean);

    const hasNoJobCode = dossierIds.includes("00003");
    const realDossierIds = dossierIds.filter((id) => id !== "00003");

    // Determine which dossier jobs are closed but otherwise admissible
    const closedTraitementJobs: string[] = [];
    const closedAdmissionOnlyJobs: string[] = [];
    for (const id of realDossierIds) {
      const s = this.evaluateJobAdmissibility(id);
      if (
        s &&
        s.isJobClosed &&
        s.isAgeAdmissible &&
        s.isCitizenshipAdmissible &&
        s.isEducationAdmissible &&
        s.isMedicalAdmissible
      ) {
        closedTraitementJobs.push(id);
      }
    }
    const hasTraitementClosed = closedTraitementJobs.length > 0;
    const hasAdmissionClosed = closedAdmissionOnlyJobs.length > 0;
    const hasClosedButAdmissibleJobs = hasTraitementClosed || hasAdmissionClosed;
    const closedButAdmissibleJobs = [...closedTraitementJobs, ...closedAdmissionOnlyJobs];
    const allRealDossierJobsAreClosedButAdmissible =
      realDossierIds.length > 0 &&
      closedButAdmissibleJobs.length === realDossierIds.length;

    const rawHtml = this.sharedState.taskEmailHtmlFr();
    const rawTxt = this.sharedState.taskEmailFr();
    const hasTasks =
      !!rawHtml &&
      this.sharedState.hasReassignedTasks() &&
      rawHtml.includes("Bonjour,");
    const mergeTasks = (this.sharedState.includeLinkedEmail() || (this.sharedState.hasReassignedTasks() && this.showResultsPanel())) && hasTasks;

    const isPforCmr = this.pforType() === "cmr";
    
    const cmrAdmittedFr = this.getCmrAdmittedDomainsFr();
    const cmrAdmittedEn = this.getCmrAdmittedDomainsEn();

    const hasAnyOffJobs =
      allOpenOfficerJobs.length > 0 ||
      (this.ignoreSip() && allClosedOfficerJobs.length > 0);
    const hasAnyNcmJobs =
      shouldIncludeNcm &&
      (openNcmJobs.length > 0 ||
        (this.ignoreSip() && closedNcmJobs.length > 0));

    if (isHtml) {
      let h = "";
      h +=
        '<p><span style="background-color: yellow; font-weight: bold; padding: 2px 4px; border-radius: 3px;">English message will follow.</span></p>\n';

      // FRENCH SECTION
      h += '<p class="mt-4">Bonjour,</p>\n';

      if (this.isCandidateTooOld()) {
        h += '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR)</strong>, nous constatons que vous devez faire l\'objet d\'une réorientation. En effet, vous dépassez l\'âge maximal d\'admissibilité pour ce programme.</p>\n';
      } else if (isPforCmr && cmrAdmittedFr) {
        h += `<p class="mt-4">Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), <strong>vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} !</strong> Nous tenons à vous féliciter chaleureusement pour cette admission.</p>\n`;
      }

      if (mergeTasks) {
        if (this.isCandidateTooOld()) {
          h +=
            '<p class="mt-4">De plus, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else if (isPforCmr && cmrAdmittedFr) {
          h +=
            '<p class="mt-4">Toutefois, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else if (isPforCmr) {
          h +=
            '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal)</strong>, nous constatons que certaines actions de votre part sont requises. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else {
          h +=
            '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Universités civiles)</strong>, nous constatons que certaines actions de votre part sont requises. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        }

        let taskPartHtml = "";
        if (rawHtml.includes("<!-- START_TASK_BODY_FR -->")) {
          const frParts = rawHtml.split("<!-- START_TASK_BODY_FR -->");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<!-- END_TASK_BODY_FR -->");
            if (frBodyPart.length > 0) {
              taskPartHtml = frBodyPart[0].trim();
            }
          }
        } else {
          const frParts = rawHtml.split("<p>Bonjour,</p>");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<p>En raison du volume");
            if (frBodyPart.length > 0 && frBodyPart[0].trim().length > 0) {
              taskPartHtml = frBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtml) {
          h +=
            '<div class="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm">\n';
          h +=
            '<p class="font-bold text-black border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">1. TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :</p>\n';
          h += taskPartHtml + "\n";
          h += "</div>\n";
        }

        h +=
          '<p class="mt-6 font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">2. STATUT DE VOS CHOIX DE MÉTIERS ACTUELS ET RÉORIENTATION REQUISE :</p>\n';
      } else {
        if (hasNoJobCode) {
          if (this.isCandidateTooOld()) {
            h +=
              "<p class=\"mt-4\">De plus, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.</p>\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            h +=
              "<p class=\"mt-4\">Toutefois, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.</p>\n";
          } else if (isPforCmr) {
            h +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.</p>\n";
          } else {
            h +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Universités civiles)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.</p>\n";
          }
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            h +=
              "<p class=\"mt-2\">Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (this.isCandidateTooOld()) {
            h +=
              "<p class=\"mt-4\">Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            h +=
              "<p class=\"mt-4\">Toutefois, suite à l'analyse de vos choix de métiers actuels, nous constatons qu'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (isPforCmr) {
            h +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else {
            h +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Universités civiles)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          }
        } else {
          h +=
            '<p class="mt-4">Voici le statut des autres métiers inscrits à votre dossier :</p>\n';
        }
        h += '<ul class="list-disc pl-5 mt-2 mb-4">\n';
        for (const id of realDossierIds) {
          const name = `${id} - ${this.getJobLinkMarkup(id, true, true)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonFr = "";
          if (s) {
            const reasonsFrList: string[] = [];
            if (s.isJobClosed) {
              reasonsFrList.push(
                "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).",
              );
            }
            if (!s.isAgeAdmissible) {
              reasonsFrList.push(s.ageReason);
            }
            if (!s.isCitizenshipAdmissible) {
              reasonsFrList.push(
                "Pour diverses raisons, ce métier n'est pas accessible aux résidents permanents.",
              );
            }
            if (!s.isEducationAdmissible) {
              reasonsFrList.push(s.educationReason);
            }
            if (!s.isMedicalAdmissible) {
              reasonsFrList.push(s.medicalReason);
            }

            if (reasonsFrList.length > 0) {
              reasonFr = `\n    <ul class="list-disc pl-5 mt-1 text-sm text-slate-600">\n      <li>${reasonsFrList.join("</li>\n      <li>")}</li>\n    </ul>`;
            } else {
              reasonFr =
                " : Admissible (réorientation lancée pour d'autres éléments du dossier).";
            }
          }
          h += `  <li class="mt-1"><strong>${name}</strong>${reasonFr}</li>\n`;
        }
        h += "</ul>\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          h +=
            "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles sous le PFOR ou requièrent un domaine d'études différent de votre admission au CMR.</p>\n";
        } else {
          h +=
            "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles sous le PFOR ou que vous n'y êtes pas admissible d'après nos critères.</p>\n";
        }
      }

      // Options French
      h +=
        '<p class="mt-4 font-semibold text-slate-800">Voici les options qui s\'offrent à vous :</p>\n';
      if (hasClosedButAdmissibleJobs) {
        const isPlural = closedButAdmissibleJobs.length > 1;
        const opt1Title = isPlural
          ? 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mes choix de métiers (' + closedButAdmissibleJobs.join(", ") + ')'
          : 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mon choix de métier (' + closedButAdmissibleJobs.join(", ") + ')';
        const opt1MetiersDesc = isPlural
          ? 'vos choix de métiers (<strong>' + closedButAdmissibleJobs.join(", ") + '</strong>)'
          : 'votre choix de métier (<strong>' + closedButAdmissibleJobs.join(", ") + '</strong>)';
        h +=
          '<p class="mt-2 text-sm"><strong>' + opt1Title + '</strong><br>Vous pouvez conserver ' + opt1MetiersDesc + ' et attendre que les prochaines positions ouvrent en avril prochain. Cependant, <span style="background-color: #fef08a; font-weight: bold;">votre dossier sera fermé dès maintenant</span> et il sera de <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de contacter votre centre de recrutement au début du mois de mars prochain pour rouvrir votre dossier et poursuivre le processus de recrutement</span>.</p>\n';
        h +=
          '<p class="mt-4 text-sm"><strong>Option 2 : Choisir un autre métier parmi la liste des métiers admissibles</strong><br>Vous pouvez réorienter votre candidature vers d\'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l\'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.</p>\n';
      } else {
        h +=
          '<p class="mt-2 text-sm"><strong>Choisir un autre métier parmi la liste des métiers admissibles</strong><br>Vous devez réorienter votre candidature vers un choix de métier pour lequel vous êtes admissible afin de poursuivre le processus d\'enrôlement. Pour ces métiers, l\'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Veuillez consulter la liste ci-dessous.</p>\n';
      }

      // Eligible Jobs French Division
      h +=
        '<div class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      h +=
        '<p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">MÉTIERS ADMISSIBLES :</p>\n';

      if (isPilotEligible) {
        h +=
          '<div class="mt-2 mb-3 p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs" style="margin-top: 8px; margin-bottom: 12px; padding: 10px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; font-size: 13px; color: #78350f;">\n' +
          '  <strong>Attention – Choix du métier de Pilote (00183) :</strong> Le métier de Pilote étant fortement contingenté (nombre de places très limité), si vous choisissez ce métier, vous devez obligatoirement sélectionner un deuxième métier parmi la liste des métiers admissibles.\n' +
          '</div>\n';
      }

      if (!hasAnyOffJobs && !hasAnyNcmJobs) {
        if (shouldIncludeNcm) {
          h +=
            '<p class="mt-2 text-slate-700 italic">(Veuillez renseigner les critères de scolarité et d\'expérience dans les panneaux ci-dessus pour afficher les métiers admissibles)</p>\n';
        } else {
          h +=
            '<p class="mt-2 text-slate-700 italic">Aucun métier PFOR ouvert correspondant n\'est disponible actuellement pour la sélection effectuée.</p>\n';
        }
      } else {
        if (allOpenOfficerJobs.length > 0) {
          h += renderHtmlList(allOpenOfficerJobs, false, true);
        }
        if (shouldIncludeNcm && openNcmJobs.length > 0) {
          h += renderHtmlNcmList(openNcmJobs, false, true);
        }
        if (this.ignoreSip() && (allClosedOfficerJobs.length > 0 || (shouldIncludeNcm && closedNcmJobs.length > 0))) {
          h +=
            '<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900" style="margin-top: 16px; padding: 12px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 4px; font-size: 14px; color: #713f12;">\n' +
            '  <strong>Note importante concernant les métiers fermés :</strong> La liste ci-dessous inclut des métiers actuellement ouverts et fermés. Si vous choisissez un <span style="background-color: #fef08a; font-weight: bold;">métier ouvert</span>, nous pourrons poursuivre le traitement de votre demande d\'emploi immédiatement. Par contre, si vous choisissez un <span style="background-color: #fecaca; color: #991b1b; font-weight: bold;">métier fermé</span> (marqué en rouge), nous devrons fermer votre dossier et ce sera <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de nous rappeler vers la fin du mois de mars prochain</span> pour faire rouvrir votre dossier dans ce métier.\n' +
            '</div>\n';
          if (allClosedOfficerJobs.length > 0) {
            h += renderHtmlList(allClosedOfficerJobs, true, true);
          }
          if (shouldIncludeNcm && closedNcmJobs.length > 0) {
            h += renderHtmlNcmList(closedNcmJobs, true, true);
          }
        }
      }
      h += "</div>\n";

      // Conclusion French
      if (mergeTasks) {
        h +=
          '<p class="mt-6 font-semibold text-slate-800">Prochaines étapes :</p>\n';
        h +=
          "<p>En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées. Nous vous invitons donc à :</p>\n";
        h += '<ul class="list-disc pl-5 mt-1 mb-2 text-sm text-slate-700">\n';
        h +=
          '  <li>Vous rendre sur votre portail (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) afin de corriger sans délai les tâches indiquées ci-dessus ;</li>\n';
        if (isPRAdmissible) {
          h +=
            '  <li>Si ce n\'est pas déjà fait, retourner sur votre portail (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) afin d\'y déposer les relevés de notes de votre pays d\'origine (dans leur langue d\'origine s\'ils sont en français ou en anglais, ou accompagnés d\'une traduction officielle au besoin) ;</li>\n';
        }
        h +=
          "  <li>Répondre directement à ce courriel avec votre choix de réorientation ou vos nouveaux choix de métiers pour mettre à jour votre dossier.</li>\n";
        h += "</ul>\n";
      } else {
        if (isPRAdmissible) {
          h +=
            '<p class="mt-4 text-sm text-slate-700">De plus, si ce n\'est pas déjà fait, veuillez retourner sur votre portail (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) afin d\'y déposer les relevés de notes de votre pays d\'origine. Ceux-ci doivent être rédigés en français ou en anglais, ou être accompagnés d\'une traduction officielle au besoin.</p>\n';
        }
        h +=
          '<p class="mt-4">Nous vous remercions pour votre intérêt envers les Forces armées canadiennes. Veuillez nous faire part de votre décision en répondant directement à ce courriel afin de poursuivre ou de mettre à jour votre dossier.</p>\n';
      }

      h +=
        '<p class="mt-4 text-sm text-slate-600">Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</p>\n';
      h += '<p>' + this.sharedState.getHtmlSignatureFr() + '</p>\n';
      h += '<hr class="my-6 border-slate-200" />\n';

      // ======================================
      // ENGLISH SECTION
      // ======================================
      h += '<p class="mt-4">Hello,</p>\n';

      if (this.isCandidateTooOld()) {
        if (this.age() !== null && this.age()! >= 57) {
          h += '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP)</strong>, we regret to inform you that you exceed the maximum eligibility age for enrolment in the Canadian Armed Forces (the maximum enrolment age is 56, and 57 or older is automatically ineligible).</p>\n';
        } else {
          h += '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP)</strong>, we have determined that you must undergo a reorientation. Indeed, you exceed the maximum eligibility age for this program.</p>\n';
        }
      } else if (isPforCmr && cmrAdmittedEn) {
        h += `<p class="mt-4">We are pleased to inform you that, following the assessment of your transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), <strong>you have been admitted to RMC in the following field(s) of study: ${cmrAdmittedEn}!</strong> We would like to warmly congratulate you on your admission.</p>\n`;
      }

      if (mergeTasks) {
        if (this.isCandidateTooOld()) {
          h +=
            '<p class="mt-4">In addition, certain actions on your part are required to allow us to continue processing your application. You must both <strong>correct the tasks that have been reassigned to you</strong> on your portal and undergo a <strong>reorientation for your occupation choices</strong>.</p>\n';
        } else if (isPforCmr && cmrAdmittedEn) {
          h +=
            '<p class="mt-4">However, certain actions on your part are required to allow us to continue processing your application. You must both <strong>correct the tasks that have been reassigned to you</strong> on your portal and undergo a <strong>reorientation for your occupation choices</strong>.</p>\n';
        } else if (isPforCmr) {
          h +=
            '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Royal Military College)</strong>, we note that certain actions are required. You must both <strong>correct the tasks that have been reassigned to you</strong> on your portal and undergo a <strong>reorientation for your occupation choices</strong>.</p>\n';
        } else {
          h +=
            '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Civilian Universities)</strong>, we note that certain actions are required. You must both <strong>correct the tasks that have been reassigned to you</strong> on your portal and undergo a <strong>reorientation for your occupation choices</strong>.</p>\n';
        }

        const rawHtmlEn = this.sharedState.taskEmailHtmlEn();
        let taskPartHtmlEn = "";
        if (rawHtmlEn.includes("<!-- START_TASK_BODY_EN -->")) {
          const enParts = rawHtmlEn.split("<!-- START_TASK_BODY_EN -->");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<!-- END_TASK_BODY_EN -->");
            if (enBodyPart.length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        } else {
          const enParts = rawHtmlEn.split("<p>Hello,</p>");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<p>Due to a high volume");
            if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtmlEn) {
          h +=
            '<div class="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm">\n';
          h +=
            '<p class="font-bold text-black border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">1. TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL:</p>\n';
          h += taskPartHtmlEn + "\n";
          h += "</div>\n";
        }

        h +=
          '<p class="mt-6 font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">2. STATUS OF YOUR CURRENT OCCUPATION CHOICES AND REQUIRED REORIENTATION:</p>\n';
      } else {
        if (hasNoJobCode) {
          if (this.isCandidateTooOld()) {
            h +=
              "<p class=\"mt-4\">In addition, no occupation is currently selected on your file, and processing cannot continue without an eligible occupation choice on your part.</p>\n";
          } else if (isPforCmr && cmrAdmittedEn) {
            h +=
              "<p class=\"mt-4\">However, no occupation is currently selected on your file, and processing cannot continue without an eligible occupation choice on your part.</p>\n";
          } else if (isPforCmr) {
            h +=
              "<p class=\"mt-4\">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Royal Military College)</strong>, we note that you require a reorientation. Indeed, no occupation is currently selected on your file, and processing cannot continue without an occupation choice on your part.</p>\n";
          } else {
            h +=
              "<p class=\"mt-4\">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Civilian Universities)</strong>, we note that you require a reorientation. Indeed, no occupation is currently selected on your file, and processing cannot continue without an occupation choice on your part.</p>\n";
          }
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            h +=
              "<p class=\"mt-2\">Here is the status of the occupations currently on your file:</p>\n";
          } else if (this.isCandidateTooOld()) {
            h +=
              "<p class=\"mt-4\">Here is the status of the occupations currently on your file:</p>\n";
          } else if (isPforCmr && cmrAdmittedEn) {
            h +=
              "<p class=\"mt-4\">However, following the review of your current occupation choices, we find that a reorientation is required. Here is the status of the occupations currently on your file:</p>\n";
          } else if (isPforCmr) {
            h +=
              "<p class=\"mt-4\">Following the review of your application file for the <strong>Regular Officer Training Plan (ROTP - Royal Military College)</strong>, we find that a reorientation is required. Here is the status of the occupations currently on your file:</p>\n";
          } else {
            h +=
              "<p class=\"mt-4\">Following the review of your application file for the <strong>Regular Officer Training Plan (ROTP - Civilian Universities)</strong>, we find that a reorientation is required. Here is the status of the occupations currently on your file:</p>\n";
          }
        } else {
          h +=
            '<p class="mt-4">Here is the status of the other occupations on your file:</p>\n';
        }
        h += '<ul class="list-disc pl-5 mt-2 mb-4">\n';
        for (const id of realDossierIds) {
          const name = `${id} - ${this.getJobLinkMarkup(id, false, true)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonEn = "";
          if (s) {
            const reasonsEnList: string[] = [];
            if (s.isJobClosed) {
              reasonsEnList.push(
                "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).",
              );
            }
            if (!s.isAgeAdmissible) {
              reasonsEnList.push(s.ageReasonEn);
            }
            if (!s.isCitizenshipAdmissible) {
              reasonsEnList.push(
                "For various reasons, this occupation is not open to permanent residents.",
              );
            }
            if (!s.isEducationAdmissible) {
              reasonsEnList.push(s.educationReasonEn);
            }
            if (!s.isMedicalAdmissible) {
              reasonsEnList.push(s.medicalReasonEn);
            }

            if (reasonsEnList.length > 0) {
              reasonEn = `\n    <ul class="list-disc pl-5 mt-1 text-sm text-slate-600">\n      <li>${reasonsEnList.join("</li>\n      <li>")}</li>\n    </ul>`;
            } else {
              reasonEn =
                " : Eligible (reorientation initiated for other elements of the file).";
            }
          }
          h += `  <li class="mt-1"><strong>${name}</strong>${reasonEn}</li>\n`;
        }
        h += "</ul>\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          h +=
            "<p class=\"mt-4\">Following the review of your application file, we note that your current occupation choices are not available under ROTP or require a field of study different from your admission to RMC.</p>\n";
        } else {
          h +=
            "<p class=\"mt-4\">Following the review of your application file, we note that your current occupation choices are not available or you are not eligible based on our criteria.</p>\n";
        }
      }

      // Options English
      h +=
        '<p class="mt-4 font-semibold text-slate-800">Here are the options available to you:</p>\n';
      if (hasClosedButAdmissibleJobs) {
        const isPluralEn = closedButAdmissibleJobs.length > 1;
        const opt1TitleEn = isPluralEn
          ? 'Option 1: Close my file and wait for the next open positions for my occupational choices (' + closedButAdmissibleJobs.join(", ") + ')'
          : 'Option 1: Close my file and wait for the next open positions for my occupational choice (' + closedButAdmissibleJobs.join(", ") + ')';
        const opt1OccupationsEn = isPluralEn
          ? 'your occupational choices (<strong>' + closedButAdmissibleJobs.join(", ") + '</strong>)'
          : 'your occupational choice (<strong>' + closedButAdmissibleJobs.join(", ") + '</strong>)';
        h +=
          '<p class="mt-2 text-sm"><strong>' + opt1TitleEn + '</strong><br>You can retain ' + opt1OccupationsEn + ' and wait until next April for positions to open. However, <span style="background-color: #fef08a; font-weight: bold;">your file will be closed immediately</span> and it will be <span style="background-color: #fef08a; font-weight: bold;">your sole responsibility to contact your recruiting centre at the beginning of next March to reopen your file and continue the recruitment process</span>.</p>\n';
        h +=
          '<p class="mt-4 text-sm"><strong>Option 2: Choose another occupation from the list of eligible occupations</strong><br>You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.</p>\n';
      } else {
        h +=
          '<p class="mt-2 text-sm"><strong>Choose another occupation from the list of eligible occupations</strong><br>You must redirect your application to an occupational choice for which you are eligible to continue the enrollment process. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.</p>\n';
      }

      // Eligible Jobs English Division
      h +=
        '<div class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      h +=
        '<p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">ELIGIBLE OCCUPATIONS:</p>\n';

      if (isPilotEligible) {
        h +=
          '<div class="mt-2 mb-3 p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs" style="margin-top: 8px; margin-bottom: 12px; padding: 10px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; font-size: 13px; color: #78350f;">\n' +
          '  <strong>Notice – Choice of Pilot (00183):</strong> Since the Pilot occupation is highly competitive (very limited vacancies), if you select this occupation, you must mandatory choose a second occupation from the list of eligible occupations.\n' +
          '</div>\n';
      }

      if (!hasAnyOffJobs && !hasAnyNcmJobs) {
        if (shouldIncludeNcm) {
          h +=
            '<p class="mt-2 text-slate-700 italic">(Please fill out the education and experience criteria in the panels above to display eligible occupations)</p>\n';
        } else {
          h +=
            '<p class="mt-2 text-slate-700 italic">No open ROTP occupations currently available for the selected profile.</p>\n';
        }
      } else {
        if (allOpenOfficerJobs.length > 0) {
          h += renderHtmlList(allOpenOfficerJobs, false, false);
        }
        if (shouldIncludeNcm && openNcmJobs.length > 0) {
          h += renderHtmlNcmList(openNcmJobs, false, false);
        }
        if (this.ignoreSip() && (allClosedOfficerJobs.length > 0 || (shouldIncludeNcm && closedNcmJobs.length > 0))) {
          h +=
            '<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900" style="margin-top: 16px; padding: 12px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 4px; font-size: 14px; color: #713f12;">\n' +
            '  <strong>Important note regarding closed occupations:</strong> The list below includes occupations that are currently open and closed. If you choose an <span style="background-color: #fef08a; font-weight: bold;">open occupation</span>, we can continue processing your application immediately. However, if you choose a <span style="background-color: #fecaca; color: #991b1b; font-weight: bold;">closed occupation</span> (marked in red), we will have to close your file and it will be <span style="background-color: #fef08a; font-weight: bold;">your full responsibility to call us back near the end of next March</span> to reopen your file in that occupation.\n' +
            '</div>\n';
          if (allClosedOfficerJobs.length > 0) {
            h += renderHtmlList(allClosedOfficerJobs, true, false);
          }
          if (shouldIncludeNcm && closedNcmJobs.length > 0) {
            h += renderHtmlNcmList(closedNcmJobs, true, false);
          }
        }
      }
      h += "</div>\n";

      // Conclusion English
      if (mergeTasks) {
        h +=
          '<p class="mt-6 font-semibold text-slate-800">Next Steps:</p>\n';
        h +=
          "<p>Due to a high volume of applications, we must prioritize files where all tasks are completed. We invite you to:</p>\n";
        h += '<ul class="list-disc pl-5 mt-1 mb-2 text-sm text-slate-700">\n';
        h +=
          '  <li>Visit your portal (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) to correct without delay the tasks indicated above;</li>\n';
        if (isPRAdmissible) {
          h +=
            '  <li>If not already done, return to your portal (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) to upload the transcripts from your country of origin (in their original language if in English or French, or accompanied by an official translation if needed);</li>\n';
        }
        h +=
          "  <li>Reply directly to this email with your reorientation choice or your new occupation choices to update your file.</li>\n";
        h += "</ul>\n";
      } else {
        if (isPRAdmissible) {
          h +=
            '<p class="mt-4 text-sm text-slate-700">Additionally, if you have not already done so, please return to your portal (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) to upload your transcripts from your country of origin. These must be in English or French, or accompanied by an official translation if necessary.</p>\n';
        }
        h +=
          '<p class="mt-4">Thank you for your interest in the Canadian Armed Forces. Please inform us of your decision by replying directly to this email in order to continue or update your file.</p>\n';
      }

      h +=
        '<p class="mt-4 text-sm text-slate-600">If you take no action, your file will be automatically deactivated after 30 days.</p>\n';
      h += '<p>' + this.sharedState.getHtmlSignatureEn() + '</p>\n';

      return h;
    } else {
      // PLAIN TEXT VERSION
      let t = "";
      t += "English message will follow.\n";
      t += "========================================\n\n";

      // French Plain Text
      t += "Bonjour,\n\n";

      if (this.isCandidateTooOld()) {
        if (this.age() !== null && this.age()! >= 57) {
          t += "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR), nous vous informons que vous dépassez l'âge maximal d'admissibilité pour l'enrôlement dans les Forces armées canadiennes (l'âge maximal d'admissibilité est de 56 ans, 57 ans et plus étant automatiquement inadmissible).\n\n";
        } else {
          t += "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR), nous constatons que vous devez faire l'objet d'une réorientation. En effet, vous dépassez l'âge maximal d'admissibilité pour ce programme.\n\n";
        }
      } else if (isPforCmr && cmrAdmittedFr) {
        t += `Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} ! Nous tenons à vous féliciter chaleureusement pour cette admission.\n\n`;
      }

      if (mergeTasks) {
        if (this.isCandidateTooOld()) {
          t +=
            "De plus, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        } else if (isPforCmr && cmrAdmittedFr) {
          t +=
            "Toutefois, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        } else if (isPforCmr) {
          t +=
            "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal), nous constatons que certaines actions de votre part sont requises. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        } else {
          t +=
            "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Universités civiles), nous constatons que certaines actions de votre part sont requises. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        }

        let taskPartTxt = "";
        if (rawTxt.includes("<!-- START_TASK_BODY_FR -->")) {
          const frParts = rawTxt.split("<!-- START_TASK_BODY_FR -->");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("<!-- END_TASK_BODY_FR -->");
            if (frBodyPart.length > 0) {
              taskPartTxt = frBodyPart[0].trim();
            }
          }
        } else {
          const frParts = rawTxt.split("Bonjour,");
          if (frParts.length > 1) {
            const frBodyPart = frParts[1].split("En raison du volume");
            if (frBodyPart.length > 0 && frBodyPart[0].trim().length > 0) {
              taskPartTxt = frBodyPart[0].trim();
            }
          }
        }

        if (taskPartTxt) {
          t += "1. TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :\n";
          t +=
            "----------------------------------------------------------------------\n";
          t += taskPartTxt + "\n\n";
        }

        t +=
          "2. STATUT DE VOS CHOIX DE MÉTIERS ACTUELS ET RÉORIENTATION REQUISE :\n";
        t +=
          "----------------------------------------------------------------------\n";
      } else {
        if (hasNoJobCode) {
          if (this.isCandidateTooOld()) {
            t +=
              "De plus, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.\n\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            t +=
              "Toutefois, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.\n\n";
          } else if (isPforCmr) {
            t +=
              "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal), nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.\n\n";
          } else {
            t +=
              "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Universités civiles), nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.\n\n";
          }
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            t +=
              "Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (this.isCandidateTooOld()) {
            t +=
              "Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            t +=
              "Toutefois, suite à l'analyse de vos choix de métiers actuels, nous constatons qu'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (isPforCmr) {
            t +=
              "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal), nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else {
            t +=
              "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Universités civiles), nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :\n";
          }
        } else {
          t +=
            "Voici le statut des autres métiers inscrits à votre dossier :\n";
        }
        for (const id of realDossierIds) {
          const name = `${id} - ${this.getJobLinkMarkup(id, true, false)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonFr = "";
          if (s) {
            const reasonsFrList: string[] = [];
            if (s.isJobClosed) {
              reasonsFrList.push(
                "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).",
              );
            }
            if (!s.isAgeAdmissible) {
              reasonsFrList.push(s.ageReason);
            }
            if (!s.isCitizenshipAdmissible) {
              reasonsFrList.push(
                "Pour diverses raisons, ce métier n'est pas accessible aux résidents permanents.",
              );
            }
            if (!s.isEducationAdmissible) {
              reasonsFrList.push(s.educationReason);
            }
            if (!s.isMedicalAdmissible) {
              reasonsFrList.push(s.medicalReason);
            }

            if (reasonsFrList.length > 0) {
              reasonFr = `\n    - ${reasonsFrList.join("\n    - ")}`;
            } else {
              reasonFr =
                " : Admissible (réorientation lancée pour d'autres éléments du dossier).";
            }
          }
          t += `- ${name}${reasonFr}\n`;
        }
        t += "\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          t +=
            "Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles sous le PFOR ou requièrent un domaine d'études différent de votre admission au CMR.\n\n";
        } else {
          t +=
            "Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles sous le PFOR ou que vous n'y êtes pas admissible d'après nos critères.\n\n";
        }
      }

      t += "Voici les options qui s'offrent à vous :\n";
      if (hasClosedButAdmissibleJobs) {
        const isPlural = closedButAdmissibleJobs.length > 1;
        const opt1Title = isPlural
          ? 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mes choix de métiers (' + closedButAdmissibleJobs.join(", ") + ')'
          : 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mon choix de métier (' + closedButAdmissibleJobs.join(", ") + ')';
        const opt1MetiersDesc = isPlural
          ? 'vos choix de métiers (' + closedButAdmissibleJobs.join(", ") + ')'
          : 'votre choix de métier (' + closedButAdmissibleJobs.join(", ") + ')';
        t += opt1Title + "\n";
        t += "Vous pouvez conserver " + opt1MetiersDesc + " et attendre que les prochaines positions ouvrent en avril prochain. Cependant, votre dossier sera fermé dès maintenant et il sera de votre entière responsabilité de contacter votre centre de recrutement au début du mois de mars prochain pour rouvrir votre dossier et poursuivre le processus de recrutement.\n\n";
        t += "Option 2 : Choisir un autre métier parmi la liste des métiers admissibles\n";
        t += "Vous pouvez réorienter votre candidature vers d'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.\n\n";
      } else {
        t += "Choisir un autre métier parmi la liste des métiers admissibles\n";
        t += "Vous devez réorienter votre candidature vers un choix de métier pour lequel vous êtes admissible afin de poursuivre le processus d'enrôlement. Pour ces métiers, l'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Veuillez consulter la liste ci-dessous.\n\n";
      }

      t += "MÉTIERS ADMISSIBLES :\n";
      if (isPilotEligible) {
        t +=
          "Attention – Choix du métier de Pilote (00183) : Le métier de Pilote étant fortement contingenté (nombre de places très limité), si vous choisissez ce métier, vous devez obligatoirement sélectionner un deuxième métier parmi la liste des métiers admissibles.\n\n";
      }

      if (!hasAnyOffJobs && !hasAnyNcmJobs) {
        if (shouldIncludeNcm) {
          t +=
            "(Veuillez renseigner les critères de scolarité et d'expérience dans les panneaux ci-dessus pour afficher les métiers admissibles)\n";
        } else {
          t +=
            "Aucun métier PFOR ouvert correspondant n'est disponible actuellement pour la sélection effectuée.\n";
        }
      } else {
        if (allOpenOfficerJobs.length > 0) {
          t += renderPlainList(allOpenOfficerJobs, false, true);
        }
        if (shouldIncludeNcm && openNcmJobs.length > 0) {
          t += renderPlainNcmList(openNcmJobs, false, true);
        }
        if (this.ignoreSip() && (allClosedOfficerJobs.length > 0 || (shouldIncludeNcm && closedNcmJobs.length > 0))) {
          t +=
            "\nNote importante concernant les métiers fermés : La liste ci-dessous inclut des métiers actuellement ouverts et fermés. Si vous choisissez un métier ouvert, nous pourrons poursuivre le traitement de votre demande d'emploi immédiatement. Par contre, si vous choisissez un métier fermé (marqué FERMÉ), nous devrons fermer votre dossier et ce sera votre entière responsabilité de nous rappeler vers la fin du mois de mars prochain pour faire rouvrir votre dossier dans ce métier.\n\n";
          if (allClosedOfficerJobs.length > 0) {
            t += renderPlainList(allClosedOfficerJobs, true, true);
          }
          if (shouldIncludeNcm && closedNcmJobs.length > 0) {
            t += renderPlainNcmList(closedNcmJobs, true, true);
          }
        }
      }

      if (mergeTasks) {
        t += "\nProchaines étapes :\n";
        t +=
          "En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées. Nous vous invitons donc à :\n";
        t +=
          "  - Vous rendre sur votre portail (https://www.cafoap-pclfac.forces.gc.ca/) afin de corriger sans délai les tâches indiquées ci-dessus ;\n";
        if (isPRAdmissible) {
          t +=
            "  - Si ce n'est pas déjà fait, retourner sur votre portail (https://www.cafoap-pclfac.forces.gc.ca/) afin d'y déposer les relevés de notes de votre pays d'origine (dans leur langue d'origine s'ils sont en français ou en anglais, ou accompagnés d'une traduction officielle au besoin) ;\n";
        }
        t +=
          "  - Répondre directement à ce courriel avec votre choix de réorientation ou vos nouveaux choix de métiers pour mettre à jour votre dossier.\n";
      } else {
        if (isPRAdmissible) {
          t +=
            "\nDe plus, si ce n'est pas déjà fait, veuillez retourner sur votre portail (https://www.cafoap-pclfac.forces.gc.ca/) afin d'y déposer les relevés de notes de votre pays d'origine. Ceux-ci doivent être rédigés en français ou en anglais, ou être accompagnés d'une traduction officielle au besoin.\n";
        }
        t +=
          "\nNous vous remercions pour votre intérêt envers les Forces armées canadiennes. Veuillez nous faire part de votre décision en répondant directement à ce courriel afin de poursuivre ou de mettre à jour votre dossier.\n";
      }

      t +=
        "\nSi vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.\n\n";
      t += this.sharedState.getSignatureFr() + "\n\n";
      t += "------------------------------------------------------------\n\n";

      // English Plain Text
      t += "Hello,\n\n";

      if (this.isCandidateTooOld()) {
        if (this.age() !== null && this.age()! >= 57) {
          t += "Following the analysis of your application file for the Regular Officer Training Plan (ROTP), we regret to inform you that you exceed the maximum eligibility age for enrolment in the Canadian Armed Forces (the maximum enrolment age is 56, and 57 or older is automatically ineligible).\n\n";
        } else {
          t += "Following the analysis of your application file for the Regular Officer Training Plan (ROTP), we have determined that you must undergo a reorientation. Indeed, you exceed the maximum eligibility age for this program.\n\n";
        }
      } else if (isPforCmr && cmrAdmittedEn) {
        t += `We are pleased to inform you that, following the assessment of your transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), you have been admitted to RMC in the following field(s) of study: ${cmrAdmittedEn}! We would like to warmly congratulate you on your admission.\n\n`;
      }

      if (mergeTasks) {
        if (this.isCandidateTooOld()) {
          t +=
            "In addition, certain actions on your part are required to allow us to continue processing your application. You must both correct the tasks that have been reassigned to you on your portal and undergo a reorientation for your occupation choices.\n\n";
        } else if (isPforCmr && cmrAdmittedEn) {
          t +=
            "However, certain actions on your part are required to allow us to continue processing your application. You must both correct the tasks that have been reassigned to you on your portal and undergo a reorientation for your occupation choices.\n\n";
        } else if (isPforCmr) {
          t +=
            "Following the analysis of your application file for the Regular Officer Training Plan (ROTP - Royal Military College), we note that certain actions are required. You must both correct the tasks that have been reassigned to you on your portal and undergo a reorientation for your occupation choices.\n\n";
        } else {
          t +=
            "Following the analysis of your application file for the Regular Officer Training Plan (ROTP - Civilian Universities), we note that certain actions are required. You must both correct the tasks that have been reassigned to you on your portal and undergo a reorientation for your occupation choices.\n\n";
        }

        const rawTxtEn = this.sharedState.taskEmailEn();
        let taskPartTxtEn = "";
        if (rawTxtEn.includes("<!-- START_TASK_BODY_EN -->")) {
          const enParts = rawTxtEn.split("<!-- START_TASK_BODY_EN -->");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<!-- END_TASK_BODY_EN -->");
            if (enBodyPart.length > 0) {
              taskPartTxtEn = enBodyPart[0].trim();
            }
          }
        } else {
          const enParts = rawTxtEn.split("Hello,");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("Due to a high volume");
            if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
              taskPartTxtEn = enBodyPart[0].trim();
            }
          }
        }

        if (taskPartTxtEn) {
          t += "1. TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL:\n";
          t +=
            "----------------------------------------------------------------------\n";
          t += taskPartTxtEn + "\n\n";
        }

        t +=
          "2. STATUS OF YOUR CURRENT OCCUPATION CHOICES AND REQUIRED REORIENTATION:\n";
        t +=
          "----------------------------------------------------------------------\n";
      } else {
        if (hasNoJobCode) {
          if (this.isCandidateTooOld()) {
            t +=
              "In addition, no occupation is currently selected on your file, and processing cannot continue without an eligible occupation choice on your part.\n\n";
          } else if (isPforCmr && cmrAdmittedEn) {
            t +=
              "However, no occupation is currently selected on your file, and processing cannot continue without an eligible occupation choice on your part.\n\n";
          } else if (isPforCmr) {
            t +=
              "Following the analysis of your application file for the Regular Officer Training Plan (ROTP - Royal Military College), we note that you require a reorientation. Indeed, no occupation is currently selected on your file, and processing cannot continue without an occupation choice on your part.\n\n";
          } else {
            t +=
              "Following the analysis of your application file, we note that you require a reorientation. Indeed, no occupation is currently selected on your file, and processing cannot continue without an occupation choice on your part.\n\n";
          }
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            t +=
              "Here is the status of the occupations currently on your file:\n";
          } else if (this.isCandidateTooOld()) {
            t +=
              "Here is the status of the occupations currently on your file:\n";
          } else if (isPforCmr && cmrAdmittedEn) {
            t +=
              "However, following the review of your current occupation choices, we find that a reorientation is required. Here is the status of the occupations currently on your file:\n";
          } else if (isPforCmr) {
            t +=
              "Following the review of your application file for the Regular Officer Training Plan (ROTP - Royal Military College), we find that a reorientation is required. Here is the status of the occupations currently on your file:\n";
          } else {
            t +=
              "Following the review of your application file for the Regular Officer Training Plan (ROTP - Civilian Universities), we find that a reorientation is required. Here is the status of the occupations currently on your file:\n";
          }
        } else {
          t +=
            "Here is the status of the other occupations on your file:\n";
        }
        for (const id of realDossierIds) {
          const name = `${id} - ${this.getJobLinkMarkup(id, false, false)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonEn = "";
          if (s) {
            const reasonsEnList: string[] = [];
            if (s.isJobClosed) {
              reasonsEnList.push(
                "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).",
              );
            }
            if (!s.isAgeAdmissible) {
              reasonsEnList.push(s.ageReasonEn);
            }
            if (!s.isCitizenshipAdmissible) {
              reasonsEnList.push(
                "For various reasons, this occupation is not open to permanent residents.",
              );
            }
            if (!s.isEducationAdmissible) {
              reasonsEnList.push(s.educationReasonEn);
            }
            if (!s.isMedicalAdmissible) {
              reasonsEnList.push(s.medicalReasonEn);
            }

            if (reasonsEnList.length > 0) {
              reasonEn = `\n    - ${reasonsEnList.join("\n    - ")}`;
            } else {
              reasonEn =
                " : Eligible (reorientation initiated for other elements of the file).";
            }
          }
          t += `- ${name}${reasonEn}\n`;
        }
        t += "\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          t +=
            "Following the review of your application file, we note that your current occupation choices are not available under ROTP or require a field of study different from your admission to RMC.\n\n";
        } else {
          t +=
            "Following the review of your application file, we note that your current occupation choices are not available or you are not eligible based on our criteria.\n\n";
        }
      }

      t += "Here are the options available to you:\n";
      if (hasClosedButAdmissibleJobs) {
        const isPluralEn = closedButAdmissibleJobs.length > 1;
        const opt1TitleEn = isPluralEn
          ? 'Option 1: Close my file and wait for the next open positions for my occupational choices (' + closedButAdmissibleJobs.join(", ") + ')'
          : 'Option 1: Close my file and wait for the next open positions for my occupational choice (' + closedButAdmissibleJobs.join(", ") + ')';
        const opt1OccupationsEn = isPluralEn
          ? 'your occupational choices (' + closedButAdmissibleJobs.join(", ") + ')'
          : 'your occupational choice (' + closedButAdmissibleJobs.join(", ") + ')';
        t += opt1TitleEn + "\n";
        t += "You can retain " + opt1OccupationsEn + " and wait until next April for positions to open. However, your file will be closed immediately and it will be your sole responsibility to contact your recruiting centre at the beginning of next March to reopen your file and continue the recruitment process.\n\n";
        t += "Option 2: Choose another occupation from the list of eligible occupations\n";
        t += "You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.\n\n";
      } else {
        t += "Choose another occupation from the list of eligible occupations\n";
        t += "You must redirect your application to an occupational choice for which you are eligible to continue the enrollment process. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.\n\n";
      }

      t += "ELIGIBLE OCCUPATIONS:\n";
      if (isPilotEligible) {
        t +=
          "Notice – Choice of Pilot (00183): Since the Pilot occupation is highly competitive (very limited vacancies), if you select this occupation, you must mandatory choose a second occupation from the list of eligible occupations.\n\n";
      }

      if (!hasAnyOffJobs && !hasAnyNcmJobs) {
        if (shouldIncludeNcm) {
          t +=
            "(Please fill out the education and experience criteria in the panels above to display eligible occupations)\n";
        } else {
          t +=
            "No open ROTP occupations currently available for the selected profile.\n";
        }
      } else {
        if (allOpenOfficerJobs.length > 0) {
          t += renderPlainList(allOpenOfficerJobs, false, false);
        }
        if (shouldIncludeNcm && openNcmJobs.length > 0) {
          t += renderPlainNcmList(openNcmJobs, false, false);
        }
        if (this.ignoreSip() && (allClosedOfficerJobs.length > 0 || (shouldIncludeNcm && closedNcmJobs.length > 0))) {
          t +=
            "\nImportant note regarding closed occupations: The list below includes occupations that are currently open and closed. If you choose an open occupation, we can continue processing your application immediately. However, if you choose a closed occupation (marked CLOSED), we will have to close your file and it will be your full responsibility to call us back near the end of next March to reopen your file in that occupation.\n\n";
          if (allClosedOfficerJobs.length > 0) {
            t += renderPlainList(allClosedOfficerJobs, true, false);
          }
          if (shouldIncludeNcm && closedNcmJobs.length > 0) {
            t += renderPlainNcmList(closedNcmJobs, true, false);
          }
        }
      }

      if (mergeTasks) {
        t += "\nNext Steps:\n";
        t +=
          "Due to a high volume of applications, we must prioritize files where all tasks are completed. We invite you to:\n";
        t +=
          "  - Visit your portal (https://www.cafoap-pclfac.forces.gc.ca/) to correct without delay the tasks indicated above;\n";
        if (isPRAdmissible) {
          t +=
            "  - If not already done, return to your portal (https://www.cafoap-pclfac.forces.gc.ca/) to upload the transcripts from your country of origin (in their original language if in English or French, or accompanied by an official translation if needed);\n";
        }
        t +=
          "  - Reply directly to this email with your reorientation choice or your new occupation choices to update your file.\n";
      } else {
        if (isPRAdmissible) {
          t +=
            "\nAdditionally, if you have not already done so, please return to your portal (https://www.cafoap-pclfac.forces.gc.ca/) to upload your transcripts from your country of origin. These must be in English or French, or accompanied by an official translation if necessary.\n";
        }
        t +=
          "\nThank you for your interest in the Canadian Armed Forces. Please inform us of your decision by replying directly to this email in order to continue or update your file.\n";
      }

      t +=
        "\nIf you take no action, your file will be automatically deactivated after 30 days.\n\n";
      t += this.sharedState.getSignatureEn() + "\n";

      return t;
    }
  }

  getReoContentHtmlFr(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      this.buildBilingualEmail(true),
    );
  }

  async exportToOutlook() {
    const html = this.buildBilingualEmail(true);
    const plain = this.buildBilingualEmail(false);
    const subject = "Forces armées canadiennes/Canadian Armed Forces";

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const typeHtml = "text/html";
        const typeText = "text/plain";
        const blobHtml = new Blob([html], { type: typeHtml });
        const blobText = new Blob([plain], { type: typeText });
        const data = [
          new ClipboardItem({
            [typeHtml]: blobHtml,
            [typeText]: blobText,
          }),
        ];
        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);

      // Open email client (Outlook)
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}`;
      window.location.href = mailtoLink;
    } catch (err) {
      console.error("Failed to export PFOR email to Outlook", err);
    }
  }

  async copyBilingualEmail() {
    return this.exportToOutlook();
  }
}
