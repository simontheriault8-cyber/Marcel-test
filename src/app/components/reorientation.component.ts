import { TranslationService } from '../../services/translation.service';
import { Component, computed, signal, inject, effect, untracked } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { JobDatabaseService } from "../../services/job-database.service";
import { SharedStateService } from "../../services/shared-state.service";
import { MelService, MEL_LIMITATIONS } from "../../services/mel.service";
import { ReorientationCriteriaService } from "../../services/reorientation-criteria.service";
import { JOB_URLS } from "../data/job-urls.data";

interface ManualCriterion {
  id: string;
  label: string;
  category:
    | "Scolarité"
    | "Expérience"
    | "Année scolaire"
    | "Histoire"
    | "Langue"
    | "Science"
    | "Informatique"
    | "Cours spécialisés"
    | "Universitaire 1er cycle"
    | "Universitaire cycle supérieur";
  subCategory?: string;
}

interface JobRule {
  requiredCriteriaIds?: string[];
  customCheck?: (
    selected: Set<string>,
    criteriaCoursSpecialiseIds: string[],
  ) => boolean | { passed: boolean; missingFr?: string; missingEn?: string };
  jobs: string[];
  allowPR?: boolean;
}

const CMR_JOB_DOMAINS: Record<
  string,
  { arts: boolean; genie: boolean; science: boolean }
> = {
  "00178": { arts: true, genie: true, science: true },
  "00179": { arts: true, genie: true, science: true },
  "00180": { arts: true, genie: true, science: true },
  "00181": { arts: false, genie: true, science: true },
  "00182": { arts: true, genie: true, science: true },
  "00183": { arts: true, genie: true, science: true },
  "00184": { arts: true, genie: true, science: true },
  "00185": { arts: false, genie: true, science: true },
  "00187": { arts: false, genie: true, science: true },
  "00189": { arts: false, genie: true, science: false },
  "00203": { arts: true, genie: false, science: false },
  "00207": { arts: true, genie: true, science: true },
  "00208": { arts: true, genie: false, science: false },
  "00213": { arts: true, genie: true, science: true },
  "00214": { arts: true, genie: false, science: false },
  "00328": { arts: true, genie: true, science: true },
  "00340": { arts: false, genie: true, science: true },
  "00341": { arts: false, genie: true, science: true },
  "00344": { arts: false, genie: true, science: true },
  "00345": { arts: false, genie: true, science: true },
  "00389": { arts: true, genie: true, science: true },
  "00398": { arts: true, genie: false, science: false },
};

@Component({
  selector: "app-reorientation",
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { "(document:click)": "onDocumentClick($event)" },
  templateUrl: './reorientation.component.html',
})
export class ReorientationComponent {
  jobService = inject(JobDatabaseService);
  sharedState = inject(SharedStateService);
  melService = inject(MelService);
  reorientationCriteria = inject(ReorientationCriteriaService);
  translationService = inject(TranslationService);

  showOptionsDropdown = signal<boolean>(false);

  activeHeaderOptionsCount = computed<number>(() => {
    let count = 0;
    if (this.ignoreSip()) count++;
    if (this.hasMedicalLimitation()) count++;
    if (this.isPforApplicant()) count++;
    if (this.includeTraitement()) count++;
    return count;
  });

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (target && !target.closest('.reo-options-dropdown-container')) {
      this.showOptionsDropdown.set(false);
    }
  }

  geographicLimitations = MEL_LIMITATIONS.filter(l => l.category === 'Geographic');
  occupationalLimitations = MEL_LIMITATIONS.filter(l => l.category === 'Occupational');

  hasMel(melId: string): boolean {
    return this.melService.applicantLimitations()[melId] || false;
  }

  toggleMel(melId: string) {
    this.melService.toggleApplicantLimitation(melId);
  }

  constructor() {
    effect(() => {
      if (this.isPforApplicant() || this.sharedState.isPostulantPfor()) {
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
          this.resetAllLocal();
        });
      }
    });
  }

  ignoreSip = signal<boolean>(false);

  toggleIgnoreSip() {
    this.ignoreSip.update((v) => !v);
  }

  includeTraitement = signal<boolean>(false);

  toggleIncludeTraitement() {
    this.includeTraitement.update((v) => !v);
  }

  currentSipPhase = computed<'admission' | 'both'>(() =>
    this.includeTraitement() ? 'both' : 'admission'
  );

  hasMedicalLimitation = signal<boolean>(false);

  toggleMedicalLimitation() {
    this.hasMedicalLimitation.update((v) => !v);
  }

  medicalV = signal<string>("");
  medicalCV = signal<string>("");
  medicalH = signal<string>("");
  medicalG = signal<string>("");
  medicalO = signal<string>("");
  medicalA = signal<string>("");
  medicalU = signal<string>("");

  age = signal<number | null>(null);
  citizenship = signal<string>("Canadian Citizen");
  selectedProvince = signal<string>("QC");

  readonly PROVINCES = [
    { id: "QC", name: "Québec" },
    { id: "ON", name: "Ontario" },
    { id: "BC", name: "C.-B. / Yukon" },
    { id: "AB", name: "Alberta / T.N.-O. / Nunavut" },
    { id: "NB_FR", name: "Nouveau-Brunswick (Franco)" },
  ];

  readonly MATH_COURSES: Record<
    string,
    { id: string; label: string; grade: number; diff: number }[]
  > = {
    QC: [
      {
        id: "qc_10_gen",
        label: "Math CST IV / 416 (10e Appliquée)",
        grade: 10,
        diff: 2,
      },
      {
        id: "qc_10_app",
        label: "Math TS IV / 426 (10e Avancée)",
        grade: 10,
        diff: 3,
      },
      {
        id: "qc_10_adv",
        label: "Math SN IV / 436 (10e Avancée/Théorique)",
        grade: 10,
        diff: 3,
      },
      {
        id: "qc_11_gen",
        label: "Math CST V / 514 (11e Générale)",
        grade: 11,
        diff: 1,
      },
      {
        id: "qc_11_app",
        label: "Math TS V / 526 (11e Appliquée)",
        grade: 11,
        diff: 3,
      },
      {
        id: "qc_11_adv",
        label: "Math SN V / 536 (11e Avancée/Théorique)",
        grade: 11,
        diff: 3,
      },
      {
        id: "qc_12_cegep201",
        label: "CEGEP 201 Appliquée ou Théoriques / 12e année",
        grade: 12,
        diff: 3,
      },
    ],
    ON: [
      { id: "on_10_app", label: "MFM2P (10e Appliquée)", grade: 10, diff: 2 },
      { id: "on_10_adv", label: "MPM2D (10e Avancée)", grade: 10, diff: 3 },
      { id: "on_11_gen", label: "MEL3E (11e Générale)", grade: 11, diff: 1 },
      { id: "on_11_app", label: "MBF3C (11e Appliquée)", grade: 11, diff: 2 },
      {
        id: "on_11_adv",
        label: "MCF3M / MCR3U (11e Avancée)",
        grade: 11,
        diff: 3,
      },
      { id: "on_12_gen", label: "MEL4E (12e Générale)", grade: 12, diff: 1 },
      { id: "on_12_app", label: "MAP4C (12e Appliquée)", grade: 12, diff: 2 },
      {
        id: "on_12_adv",
        label: "MCT4C / MDM4U / MCV4U / MHF4U (12e Avancée)",
        grade: 12,
        diff: 3,
      },
    ],
    BC: [
      {
        id: "bc_10_gen",
        label: "Math de base 10 / Milieu de travail 10 (10e Générale)",
        grade: 10,
        diff: 1,
      },
      {
        id: "bc_10_app",
        label: "Applications 10 (10e Appliquée)",
        grade: 10,
        diff: 2,
      },
      {
        id: "bc_10_adv",
        label: "Principes 10 / Fondements et pré-calcul 10 (10e Avancée)",
        grade: 10,
        diff: 3,
      },
      {
        id: "bc_11_gen",
        label: "Math de base 11 / Milieu de travail 11 (11e Générale)",
        grade: 11,
        diff: 1,
      },
      {
        id: "bc_11_app",
        label: "Applications 11 / Fondements 11 (11e Appliquée)",
        grade: 11,
        diff: 2,
      },
      {
        id: "bc_11_adv",
        label: "Principes 11 / Pré-calcul 11 (11e Avancée)",
        grade: 11,
        diff: 3,
      },
      {
        id: "bc_12_gen",
        label: "Fondements 12 / Informatique 12 (12e Générale)",
        grade: 12,
        diff: 1,
      },
      {
        id: "bc_12_app",
        label: "Applications 12 (12e Appliquée)",
        grade: 12,
        diff: 2,
      },
      {
        id: "bc_12_adv",
        label:
          "Principes 12 / Pré-calcul 12 / Calcul infinitésimal (12e Avancée)",
        grade: 12,
        diff: 3,
      },
    ],
    AB: [
      {
        id: "ab_10_gen",
        label: "Math 10-4 (10e Générale)",
        grade: 10,
        diff: 1,
      },
      {
        id: "ab_10_app",
        label: "Math 10-3 (10e Appliquée)",
        grade: 10,
        diff: 2,
      },
      { id: "ab_10_adv", label: "Math 10C (10e Avancée)", grade: 10, diff: 3 },
      {
        id: "ab_11_gen",
        label: "Math 20-4 (11e Générale)",
        grade: 11,
        diff: 1,
      },
      {
        id: "ab_11_app",
        label: "Math 20-3 / 20-2 (11e Appliquée)",
        grade: 11,
        diff: 2,
      },
      { id: "ab_11_adv", label: "Math 20-1 (11e Avancée)", grade: 11, diff: 3 },
      {
        id: "ab_12_app",
        label: "Math 30-3 / 30-2 (12e Appliquée)",
        grade: 12,
        diff: 2,
      },
      {
        id: "ab_12_adv",
        label: "Math 30-1 / Math 31 (12e Avancée)",
        grade: 12,
        diff: 3,
      },
    ],
    NB_FR: [
      { id: "nbfr_10_gen", label: "30231A (10e Générale)", grade: 10, diff: 1 },
      {
        id: "nbfr_10_app",
        label: "30231BC (10e Appliquée)",
        grade: 10,
        diff: 2,
      },
      {
        id: "nbfr_11_gen",
        label: "30311A / 30321A (11e Générale)",
        grade: 11,
        diff: 1,
      },
      {
        id: "nbfr_11_app",
        label: "30311B / 30321B (11e Appliquée)",
        grade: 11,
        diff: 2,
      },
      { id: "nbfr_11_adv", label: "30331C (11e Avancée)", grade: 11, diff: 3 },
      {
        id: "nbfr_12_app",
        label: "30411B (12e Appliquée)",
        grade: 12,
        diff: 2,
      },
      {
        id: "nbfr_12_adv",
        label: "30411C / 30421C / 31411 (12e Avancée)",
        grade: 12,
        diff: 3,
      },
    ],
  };

  mathCoursesForProvince = computed(() => {
    const prov = this.selectedProvince();
    return this.MATH_COURSES[prov] || [];
  });

  manualCriteria: ManualCriterion[] = [
    {
      id: "des_12e_annee",
      label: "DES/12e années complété",
      category: "Année scolaire",
    },
    {
      id: "aens",
      label: "AENS (Attestation d'équivalence de niveau de scolarité)",
      category: "Année scolaire",
    },
    {
      id: "sec4_24_credits",
      label: "24 crédit de sec 4/10e années complété",
      category: "Année scolaire",
    },
    {
      id: "histoire_sec4",
      label: "Histoire sec 4",
      category: "Histoire",
    },
    {
      id: "francais_sec4_10e",
      label: "Français ou Anglais de sec 4/10e année",
      category: "Langue",
    },
    {
      id: "francais_sec5_11e",
      label: "Français ou Anglais de sec 5/11e année",
      category: "Langue",
    },
    {
      id: "anglais_sec5_12e",
      label: "Anglais de sec 5 / 12 e année",
      category: "Langue",
    },
    {
      id: "etude_anglais",
      label: "Étude en anglais",
      category: "Langue",
    },
    {
      id: "etude_hors_canada",
      label: "Étude hors Canada",
      category: "Langue",
    },
    {
      id: "sci_tech4_sci10",
      label: "Science et technologie 4e/Science de 10e année",
      category: "Science",
    },
    {
      id: "chimie_sec5_11e",
      label: "Chimie de sec 5/11e année",
      category: "Science",
    },
    {
      id: "physique_sec5_11e",
      label: "Physique de sec 5/11e année",
      category: "Science",
    },
    {
      id: "info_sec5_12e",
      label: "Cours d'informatique de sec 5/12e année",
      category: "Informatique",
    },
    { id: "cs_autre_dep", label: "Autre DEP", category: "Cours spécialisés" },
    { id: "cs_autre_dec", label: "Autre DEC", category: "Cours spécialisés" },
    {
      id: "cs_photo_multimedia",
      label:
        "DEC en photographie, en photojournalisme, multimédia ou conception graphique",
      category: "Cours spécialisés",
    },
    {
      id: "cs_sec_incendie",
      label: "DEP/DEC en Technique de sécurité incendie",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tech_lab_med",
      label:
        "Diplôme dans un programme agréé de Technologie de laboratoire médical (DEC en technologie d'analyses biomédicales)",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tech_radio_med",
      label:
        "Diplôme dans un programme agréé de Technologie radiologique médicale (DEC en technologie de radiodiagnostic)",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tech_ing_biomed",
      label:
        "Diplôme de technologie accrédité en ingénierie biomédicale délivré par un établissement canadien (aucun au Québec)",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tech_policieres",
      label: "Techniques policières",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_cuisine",
      label: "DEP en cuisine",
      category: "Cours spécialisés",
    },
    {
      id: "cs_etude_musique",
      label: "Études postsecondaire en musique",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_refrigeration",
      label: "DEP en réfrigération",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_electricite",
      label: "DEP en électricité",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_plomberie_chauffage",
      label: "DEP en plomberie et chauffage",
      category: "Cours spécialisés",
    },
    {
      id: "cs_aec_eaux",
      label: "AEC en traitement des eaux",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_charpenterie",
      label: "DEP en charpenterie-menuiserie",
      category: "Cours spécialisés",
    },
    {
      id: "cs_cert_assist_dentaire",
      label:
        "Certificat du Bureau national d'examen d'assistance dentaire (pas possible au Québec)",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_arpentage_topo",
      label: "DEP en arpentage et topographie",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dep_sante_infirmiers",
      label: "DEP en Santé, assistance et soins infirmiers",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dip_cyber",
      label:
        "Diplôme d'études postsecondaire dans un domaine associé à la cybersécurité",
      category: "Cours spécialisés",
    },
    {
      id: "cs_dip_genie_sci_app",
      label:
        "Diplôme d’études postsecondaires en génie, en technologie du génie ou en sciences appliquées",
      category: "Cours spécialisés",
    },
    {
      id: "cs_cert_soins_param",
      label:
        "Certificat ou diplôme dans un programme de formation en soins paramédicaux agréé ou équivalent",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tea_m",
      label:
        "Un diplôme d’un programme TEA‑M (technicien d’entretien d’aéronefs - maintenance) accrédité par Transports Canada",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tea_e",
      label:
        "Un diplôme d’un programme TEA‑E (technicien d’entretien d’aéronefs - avionique) accrédité par Transports Canada",
      category: "Cours spécialisés",
    },
    {
      id: "cs_tea_s",
      label:
        "Un diplôme d’un programme TEA‑S (technicien d’entretien d’aéronefs - structures) accrédité par Transports Canada",
      category: "Cours spécialisés",
    },
    // Génie
    {
      id: "bacc_genie_aerospatiale_aeronautique",
      label: "Aérospatiale / Aéronautique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_architecture_navale",
      label: "Architecture navale",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_tech_fisheries_memorial",
      label:
        "Baccalauréat de technologie (Technique du génie et sciences appliquées) par la «Fisheries and Marine Institute of Memorial University» de Terre-Neuve",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_batiment",
      label: "Bâtiment",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_chimie_chimique",
      label: "Chimie / Chimique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_civil",
      label: "Civil",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_communications",
      label: "Communications",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_conception_systemes",
      label: "Conception de Systèmes",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_cyber_systemes",
      label: "Cyber systèmes",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_electricite_electrique",
      label: "Électricité / Électrique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_electromecanique",
      label: "Électromécanique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_energie",
      label: "Énergie",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_environnemental",
      label: "Environnemental / Environnement",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_fabrication",
      label: "Fabrication",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_electriques_genie",
      label: "Génie des systèmes électriques",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_electroniques_genie",
      label: "Génie des systèmes électroniques",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_geologie",
      label: "Géologie",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_geomatique",
      label: "Géomatique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_gestion",
      label: "Gestion",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_industriel_seul",
      label: "Industriel",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_informatique",
      label: "Informatique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_ingenierie_gestion",
      label: "Ingénierie et Gestion",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_integration",
      label: "Intégration",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_logiciel",
      label: "Logiciel",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_marine",
      label: "Marine",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_maritime",
      label: "Maritime",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_materiaux",
      label: "Matériaux",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_materiels",
      label: "Matériels",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_mecanique",
      label: "Mécanique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_mecatronique",
      label: "Mécatronique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_metallurgique",
      label: "Métallurgique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_microelectronique",
      label: "Microélectronique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_minier",
      label: "Minier",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_nanotechnologie",
      label: "Nanotechnologie",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_nucleaire",
      label: "Nucléaire",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_operations_logistique",
      label: "Opérations et Logistique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_ordinateurs",
      label: "Ordinateurs",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_physique",
      label: "Physique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_physique_technique",
      label: "Physique technique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_processus",
      label: "Processus",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_production_automatisee",
      label: "Production Automatisée",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_spatiale",
      label: "Spatiale",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_ingenierie_informatique",
      label: "Systèmes d’Ingénierie et Informatique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_electricite",
      label: "Systèmes Électricité",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_electromecaniques",
      label: "Systèmes Électromécaniques",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_electroniques",
      label: "Systèmes Électroniques",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_industriels",
      label: "Systèmes Industriels",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_informatique",
      label: "Systèmes Informatique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_logiciel",
      label: "Systèmes logiciels",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_mecanique",
      label: "Systèmes Mécanique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_systemes_mecatronique",
      label: "Systèmes Mécatronique",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_tech_sci_nautiques_cap_breton",
      label: "technologie –Sciences nautiques de l'Université du Cap-Breton",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },
    {
      id: "bacc_genie_vehicules_automoteurs",
      label: "Véhicules Automoteurs",
      category: "Universitaire 1er cycle",
      subCategory: "Génie",
    },

    // Sciences
    {
      id: "bacc_sci_arpentage",
      label: "Arpentage",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_bsc_genie_protection_incendie",
      label: "BSc Génie en Protection Incendie",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_chimie",
      label: "Chimie",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_donnees",
      label: "Données",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_environnementales",
      label: "Environnemental / Environnement",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_geologie",
      label: "Géologie",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_geomatique",
      label: "Géomatique",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_gestion_information",
      label: "Gestion de l’information",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_imagerie",
      label: "Imagerie",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_informatique_seul",
      label: "Informatique",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_mathematiques",
      label: "Mathématiques",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_mathematiques_appliquees",
      label: "Mathématiques appliquées",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_mathematiques_physique",
      label: "Mathématiques et physique",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_physique",
      label: "Physique",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_information",
      label: "Science de l’information",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_information_informatique",
      label: "Science de l’information en informatique",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_appliquees_general",
      label: "Sciences Appliquées / Général (75% en math ou en physique)",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_sciences_de_l_informatique",
      label: "Sciences de l’informatique",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_terre",
      label: "Sciences de la Terre",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_espace_seul",
      label: "Spatial / Espace",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_systemes_information",
      label: "Systèmes d’information",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_systemes_informatiques",
      label: "Systèmes informatiques",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_technologie_information",
      label: "Technologie de l’information",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },
    {
      id: "bacc_sci_technologie_surete_protection_incendie",
      label: "Technologie de Sûreté et Protection Incendie",
      category: "Universitaire 1er cycle",
      subCategory: "Sciences",
    },

    // Arts
    {
      id: "bacc_arts_admin_entreprise",
      label: "Administration d’entreprise",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_admin_affaires",
      label: "Administration des affaires",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_admin_publique",
      label: "Administration publique",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_anglais_francais",
      label: "Anglais ou français",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_anthropologie",
      label: "Anthropologie",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_commercialisation",
      label: "Commercialisation",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_communication_visuelle",
      label: "Communication visuelle",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_communications",
      label: "Communications",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_criminologie",
      label: "Criminologie",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_droit",
      label: "Droit (notamment Droit et Barreau)",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_education",
      label: "Éducation",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_education_adultes",
      label: "Éducation aux adultes",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_education_physique",
      label: "Éducation physique",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_education_professionnelle",
      label: "Éducation professionnelle",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_etudes_internationales_cmr",
      label: "Études internationales au CMR Saint Jean",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_etudes_judiciaires",
      label:
        "Études judiciaires (notamment Droit & justice et Justice humaine)",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_etudes_militaires",
      label: "Études militaires et stratégiques",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_gestion_urgences",
      label: "Gestion des urgences, crises et catastrophes",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_journalisme",
      label: "Journalisme",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_justice_criminelle",
      label: "Justice criminelle",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_linguistique",
      label: "Linguistique",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_medias_numeriques",
      label: "Médias numériques",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_philosophie",
      label: "Philosophie",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_psychologie",
      label: "Psychologie (4 ans)",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_relations_intern",
      label: "Relations internationales",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_relations_publiques",
      label: "Relations publiques",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_ressources_humaines",
      label: "Ressources humaines/gestion des ressources humaines",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_science_politique",
      label: "Science politique",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_sci_policieres",
      label: "Sciences/études policières",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_sec_policieres",
      label: "Sécurité et études policières",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_sec_publique",
      label: "Sécurité publique",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_sociologie",
      label: "Sociologie (4 ans)",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },
    {
      id: "bacc_arts_theologie",
      label: "Théologie",
      category: "Universitaire 1er cycle",
      subCategory: "Arts",
    },

    // Santé
    {
      id: "bacc_sante_adjoint_medecin",
      label: "Adjoint au médecin",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_admin_soins_sante",
      label: "Administration des soins de santé",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_biochimie",
      label: "Biochimie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_biologie",
      label: "Biologie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_biologie_humaine",
      label: "Biologie humaine",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_diplome_sciences_vie",
      label: "Diplôme dans une discipline des sciences de la vie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_genie_biomedical",
      label: "Génie biomédical",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_gestion_services_sante",
      label: "Gestion des services de santé",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_kinesiologie",
      label: "Kinésiologie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_medecine_dentaire",
      label: "Médecine Dentaire",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_microbiologie",
      label: "Microbiologie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_pharmacie",
      label: "Pharmacie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_physiologie_humaine",
      label: "Physiologie humaine",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_physiotherapie",
      label: "Physiothérapie",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_sciences_soins_infirmiers",
      label: "Sciences des soins infirmiers",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },
    {
      id: "bacc_sante_sciences_infirmieres",
      label: "Sciences infirmières",
      category: "Universitaire 1er cycle",
      subCategory: "Santé",
    },

    // Universitaire cycle supérieur
    {
      id: "doctorat_adjoint_medecin",
      label: "Adjoint au médecin",
      category: "Universitaire cycle supérieur",
      subCategory: "Doctorat",
    },
    {
      id: "doctorat_medecine",
      label: "Médecine",
      category: "Universitaire cycle supérieur",
      subCategory: "Doctorat",
    },
    {
      id: "doctorat_sante_pharmacie",
      label: "Pharmacie",
      category: "Universitaire cycle supérieur",
      subCategory: "Doctorat",
    },
    {
      id: "maitrise_adjoint_medecin",
      label: "Adjoint au médecin",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_admin_sante",
      label: "Administration de la santé",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_admin_affaires",
      label: "Administration des affaires",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_admin_soins_sante",
      label: "Administration des soins de santé",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_admin_publique",
      label: "Administration publique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_aeronautique",
      label: "Aéronautique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_aerospatial",
      label: "Aérospatial",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_alimentation",
      label: "Alimentation",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_anglais_francais",
      label: "Anglais ou français",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_anthropologie",
      label: "Anthropologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_anthropologie_sociale",
      label: "Anthropologie sociale",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_architecture_navale",
      label: "Architecture navale",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_biochimie",
      label: "Biochimie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_biologie",
      label: "Biologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_biologie_humaine",
      label: "Biologie humaine",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_chimie",
      label: "Chimie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_chimique",
      label: "Chimique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_commerce",
      label: "Commerce",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_commercialisation",
      label: "Commercialisation",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_communications",
      label: "Communications",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_comptabilite",
      label: "Comptabilité",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_diplome_sciences_vie",
      label: "Diplôme dans une discipline des sciences de la vie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_economie",
      label: "Économie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_education",
      label: "Éducation",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_espace",
      label: "Espace",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_etudes_internationales",
      label: "Études internationales",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_etudes_militaires",
      label: "Études militaires et stratégiques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_finance",
      label: "Finance",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_genie_biomedical",
      label: "Génie biomédical",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_civil",
      label: "Génie civil",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_environnement",
      label: "Génie de l'environnement",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_systemes_electriques",
      label: "Génie des systèmes électriques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_systemes_electroniques",
      label: "Génie des systèmes électroniques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_electrique",
      label: "Génie Électrique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_informatique",
      label: "Génie Informatique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_genie_physique",
      label: "Génie Physique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_gestion_chaine_approvisionnement",
      label: "Gestion de chaîne d’approvisionnement",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_gestion_entreprise_alimentaire",
      label: "Gestion d’entreprise alimentaire",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_gestion_ressources_humaines",
      label: "Gestion de ressources humaines",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_gestion_services_sante",
      label: "Gestion des services de santé",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_gestion_soins_sante",
      label: "Gestion des soins de santé",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_industriel",
      label: "Industriel",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_informatiques",
      label: "Informatiques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_integration_systemes_humains",
      label: "Intégration des systèmes humains (facteurs humains)",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_journalisme",
      label: "Journalisme",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_kinesiologie",
      label: "Kinésiologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_linguistique",
      label: "Linguistique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_logiciel",
      label: "Logiciel",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_logistique",
      label: "Logistique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_physiotherapie",
      label: "Maîtrise en Physiothérapie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_marine",
      label: "Marine",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_materiels",
      label: "Matériels",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_mathematiques",
      label: "Mathématiques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_mecanique",
      label: "Mécanique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_medias_numeriques",
      label: "Médias numériques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_metallurgique",
      label: "Métallurgique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_microbiologie",
      label: "Microbiologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_nucleaire",
      label: "Nucléaire",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_nutrition_dietetique",
      label: "Nutrition/diététique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_philosophie",
      label: "Philosophie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_physiologie_humaine",
      label: "Physiologie humaine",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_physique",
      label: "Physique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_physiques",
      label: "Physiques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie",
      label: "Psychologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_cognitive",
      label: "Psychologie cognitive",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_conseil",
      label: "Psychologie de conseil",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_recherche",
      label: "Psychologie de recherche",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_industrielle_orga",
      label: "Psychologie industrielle organisationnelle",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_sociale",
      label: "Psychologie sociale",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_sociale_applique",
      label: "Psychologie sociale appliqué",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_psychologie_sociale_culturale",
      label: "Psychologie sociale/culturale",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_relations_industrielles",
      label: "Relations industrielles",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_relations_internationales",
      label: "Relations internationales",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_relations_publiques",
      label: "Relations publiques",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_environnementale_professionnelle",
      label: "Santé environnementale et professionnelle (hygiène du travail)",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_publique",
      label: "Santé publique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_science_politique",
      label: "Science politique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_sante_service_social",
      label: "Service Social axé sur la pratique clinique",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_arts_sociologie",
      label: "Sociologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },
    {
      id: "maitrise_theologie",
      label: "Théologie",
      category: "Universitaire cycle supérieur",
      subCategory: "Maîtrise",
    },

    // Expérience
    {
      id: "exp_photo_design",
      label:
        "Expérience dans un ou plusieurs des domaines suivants : photographie, photojournalisme, conception graphique ou multimédia",
      category: "Expérience",
    },
    {
      id: "exp_permis_conduire",
      label: "Détenir un permis de conduire provincial/territorial en règle",
      category: "Expérience",
    },
    {
      id: "exp_scslm",
      label:
        "La certification de la Société canadienne de science de laboratoire médical (SCSLM)",
      category: "Expérience",
    },
    {
      id: "exp_acorplm",
      label:
        "La certification de l'alliance canadienne des organismes de réglementation des professionnels de laboratoire médical (ACORPLM), incluant la réussite des examens du «TLM généraliste» pour les technologistes de laboratoire médical (TLM)",
      category: "Expérience",
    },
    {
      id: "exp_permis_reglementation",
      label:
        "Permis ou inscription sans restriction (statut actif) délivré par l’autorité de réglementation provinciale ou territoriale",
      category: "Expérience",
    },
    {
      id: "exp_lettre_conformite",
      label:
        "Lettre de conformité (« Good Standing ») émise par l’autorité de réglementation du candidat",
      category: "Expérience",
    },
    {
      id: "exp_lab_6mois",
      label:
        "Au moins six mois d'expérience à temps plein ou à temps partiel dans un laboratoire médical clinique au cours des deux dernières années",
      category: "Expérience",
    },
    {
      id: "exp_permis_rad",
      label:
        "Détenir un permis, une certification ou autorisation sans restriction d’exercer comme technologue en radiation médicale (en règle et en vigueur) provenant d’un organisme de réglementation provincial/territorial reconnu",
      category: "Expérience",
    },
    {
      id: "exp_association_actrm",
      label:
        "Certification provenant d’un association professionnel ayant conclu une entente réciproque avec l’Association canadienne des technologues en radiation médicale (ACTRM)",
      category: "Expérience",
    },
    {
      id: "exp_lettre_reglementation_en_regle",
      label:
        "Lettre de l'organisme de réglementation de la profession du candidat attestant que ce dernier est « en règle »",
      category: "Expérience",
    },
    {
      id: "exp_tech_eb_6mois",
      label:
        "A travaillé en tant que technologue en électronique biomédicale pendant une période totale d’au moins six (6) mois au cours des deux (2) dernières années",
      category: "Expérience",
    },
    {
      id: "exp_mus_ensembles",
      label:
        "Expérience comme musicien dans une variété d’ensembles et dans divers styles de musique, p. ex. à titre de musicien travaillant à son propre compte, ou à temps plein avec une orchestre, un ensemble ou un groupe de musique local.",
      category: "Expérience",
    },
    {
      id: "exp_mus_etudiant",
      label:
        "Étudiant en voie d’obtenir un diplôme ou un Baccalauréat en interprétation musicale dans un collège, un conservatoire de musique ou une université reconnus",
      category: "Expérience",
    },
    {
      id: "exp_mus_pro",
      label:
        "Expérience comme musicien professionnel dans une variété d’ensembles et dans divers styles de musique, p. ex. à titre de musicien travaillant à son propre compte, ou à temps plein avec une orchestre, un ensemble ou un groupe de musique local",
      category: "Expérience",
    },
    {
      id: "exp_sceau_rouge_cuisine",
      label: "Certificat des normes interprovinciales Sceau rouge",
      category: "Expérience",
    },
    {
      id: "exp_permis_assistant_dentaire",
      label:
        "Permis en règle pour agir en tant qu’assistant dentaire délivré par une autorité de réglementation canadienne provinciale ou territoriale",
      category: "Expérience",
    },
    {
      id: "exp_lettre_dentaire_en_regle",
      label:
        "Lettre de l’autorité de réglementation professionnelle attestant que le candidat est « en règle »",
      category: "Expérience",
    },
    {
      id: "exp_permis_infirmier_auxiliaire",
      label:
        "Détention d’une autorisation en règle de travailler comme infirmier auxiliaire autorisé/immatriculé émise par un organisme de réglementation provincial ou territorial",
      category: "Expérience",
    },
    {
      id: "exp_cert_peroperatoire",
      label:
        "Certification comme infirmier auxiliaire autorisé/immatriculé en soins peropératoires",
      category: "Expérience",
    },
    {
      id: "exp_permis_paramedical",
      label:
        "Inscription actuelle ou en cours au permis ou privilèges hospitaliers de base ou certification en vigueur pour exercer à titre de paramédical(e), délivrés par un organisme de réglementation provincial ou territorial canadien",
      category: "Expérience",
    },
    {
      id: "exp_00189",
      label:
        "Au moins trois mois d'expérience pertinente dans un ou plusieurs des domaines suivants : industrie de la construction, gestion des installations, services d'incendies, services de l'environnement, géomatique, gestion de projet, service militaire",
      category: "Expérience",
    },
    {
      id: "exp_permis_physiotherapie",
      label:
        "Permis/licence d’exercice en règle (à titre actif) en tant que physiothérapeute émis par un organisme de réglementation provincial ou territorial",
      category: "Expérience",
    },
    {
      id: "exp_lettre_physiotherapie_regle",
      label:
        "Lettre de l’organisme de réglementation du candidat attestant que ce dernier est « En règle »",
      category: "Expérience",
    },
    {
      id: "exp_cert_bned",
      label: "Certificat du Bureau national d’examen dentaire du Canada (BNED)",
      category: "Expérience",
    },
    {
      id: "exp_permis_medecine_dentaire",
      label:
        "Autorisation en règle et sans restriction d’exercer la Médecine dentaire de la part d’une autorité réglementaire d’une province/d’un territoire du Canada",
      category: "Expérience",
    },
    {
      id: "exp_lettre_dentiste_regle",
      label:
        "Lettre de l’autorité réglementaire professionnelle attestant que le candidat est en règle",
      category: "Expérience",
    },
    {
      id: "exp_cv_dentiste_5ans",
      label:
        "Curriculum vitae remontant jusqu’à de cinq ans quant à l’expérience en tant que dentiste",
      category: "Expérience",
    },
    {
      id: "exp_permis_pharmacie",
      label: "Permis d’exercice de la pharmacie sans restriction en règle",
      category: "Expérience",
    },
    {
      id: "exp_lettre_pharmacie_regle",
      label:
        "Lettre de l’autorité de réglementation professionnelle attestant que le candidat est « en règle »",
      category: "Expérience",
    },
    {
      id: "exp_permis_soins_infirmiers",
      label:
        "Permis d’exercice en règle (état actif) en soins infirmiers en tant qu’infirmier autorisé ou infirmier en pratique octroyé par un organisme de réglementation provincial ou territorial du Canada",
      category: "Expérience",
    },
    {
      id: "exp_permis_travail_social",
      label:
        "Permis en règle et sans restriction (état actif) d’exercer comme travailleur social, délivré par une autorité / association réglementaire provinciale ou territoriale",
      category: "Expérience",
    },
    {
      id: "exp_lettre_travail_social_regle",
      label:
        "Lettre de l’autorité réglementaire professionnelle attestant que le candidat est « en règle »",
      category: "Expérience",
    },
    {
      id: "exp_00203",
      label:
        "Au moins une (1) année d’expérience cumulative dans deux ou plusieurs des domaines suivants : communications, journalisme, commercialisation, affaires publiques, relations publiques, recherche sur l'opinion publique, médias numériques ou sociaux",
      category: "Expérience",
    },
    {
      id: "exp_permis_droit",
      label:
        "Autorisé à pratiquer le droit dans une province canadienne ou un territoire canadien",
      category: "Expérience",
    },
    {
      id: "exp_lettre_barreau_regle",
      label:
        "Être « membre en règle », en exercice ou non, du Barreau d'une province ou d’un territoire",
      category: "Expérience",
    },
    {
      id: "exp_00208_bacc",
      label:
        "Au moins une ou plusieurs années de travail à temps plein dans un ou plusieurs des domaines suivants : sélection, recrutement (RH), recherche en sciences sociales, orientation scolaire/professionnelle",
      category: "Expérience",
    },
    {
      id: "exp_00211_maitrise",
      label:
        "Au moins trois ans cumulatifs d’expérience à temps plein dans l’un ou plusieurs des domaines suivants : élaboration d’un programme d’études, expert-conseil en éducation, conception de l’instruction, formation du personnel, enseignement/instruction, expert-conseil en instruction, développement de l’instruction",
      category: "Expérience",
    },
    {
      id: "exp_00349_leader_foi",
      label:
        "Accrédité et reconnu comme un leader au sein d’une tradition de foi  par l’autorité de gouvernance de cette même tradition de foi qui exerce une supervision au Canada, et tel que recommandé par le membre désigné du CIAMC",
      category: "Expérience",
    },
    {
      id: "exp_00349_endosse_ciamc",
      label: "Avoir été endossé comme aumônier par le CIAMC",
      category: "Expérience",
    },
    {
      id: "exp_00349_entrevue_aum",
      label:
        "Avoir réussi une entrevue et jugé apte par un comité présidé par le D Svc Aum.  La sélection finale est confirmée par l’Aumônier général.",
      category: "Expérience",
    },
    {
      id: "exp_00374_cert_permis",
      label:
        "Certificat en règle du Conseil de certification des adjoints au médecin du Canada (CCAMC) et permis/licence en règle (en vigueur) d’exercer comme adjoint au médecin délivré(e) par une autorité réglementaire d’une province ou d’un territoire du Canada",
      category: "Expérience",
    },
    {
      id: "exp_00374_lettre_regle",
      label:
        "Lettre de l’autorité professionnelle réglementaire ou de son superviseur en clinique, selon le cas, attestant que le candidat est en règle",
      category: "Expérience",
    },
    {
      id: "exp_00390_residence",
      label: `Achèvement d’une formation spécialisée dans un programme de résidence agréé par le Collège royal des médecins et chirurgiens du Canada dans l’une des spécialités suivantes: 
o Médecine interne avec une résidence de deux ans dans l’une des disciplines suivantes;   
    a) Médecine interne générale 
    b) Maladies infectieuses 
    c) Soins intensifs 
o Anesthésiologie 
o Chirurgie générale 
o Chirurgie orthopédique 
o Psychiatrie 
o Radiologie 
o Médecine physique et de réadaptation (Physiatrie) 
o Médecine d’urgence`,
      category: "Expérience",
    },
    {
      id: "exp_00390_certification",
      label:
        "Certification et titre de fellow du Collège royal des médecins et chirurgiens du Canada, dans l’une des spécialités mentionnées ci dessus",
      category: "Expérience",
    },
    {
      id: "exp_00390_permis",
      label:
        "Permis d’exercice valide et sans restriction pour pratiquer la médecine à titre de spécialiste (selon la spécialité indiquée ci-dessus) dans toute province ou tout territoire du Canada",
      category: "Expérience",
    },
    {
      id: "exp_00390_attestation",
      label:
        "Attestation de bonne conduite professionnelle délivrée par l’organisme de réglementation provincial ou territorial du candidat",
      category: "Expérience",
    },
    {
      id: "exp_00390_civil",
      label:
        "Pour toutes les spécialités : à l’exception de la psychiatrie et de la médecine physique et réadaptation (physiatrie): Être employé à temps plein dans un poste clinique au sein d’un établissement de soins de santé civil",
      category: "Expérience",
    },
    {
      id: "exp_00393_autorisation",
      label:
        "Détenir une Autorisation en règle et sans restriction d’exercer la Médecine en tant que médecin de famille dans une province ou un territoire du Canada",
      category: "Expérience",
    },
    {
      id: "exp_00393_lettre_regle",
      label:
        "Lettre des autorités de réglementation de la province/territoire du candidat attestant que ce dernier est « en règle »",
      category: "Expérience",
    },
    {
      id: "exp_00393_certification",
      label:
        "Certification en médecine familiale du Collège des médecins de famille du Canada",
      category: "Expérience",
    },
    {
      id: "exp_00398_gestion",
      label:
        "Un minimum de deux années d’expérience cumulative en gestion à temps plein au cours des cinq dernières années dans un milieu de soins de santé",
      category: "Expérience",
    },
    {
      id: "exp_cv_recent",
      label: "Curriculum vitae (CV) récent à jour",
      category: "Expérience",
    },
  ];

  jobRules: JobRule[] = [
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00005"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00010"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["des_12e_annee", "base_math_10_adv"],
      jobs: ["00019"],
      allowPR: true,
    },
    {
      jobs: ["00099"],
      allowPR: false, // CC
      customCheck: (selected, coursSpecialisesIds) => {
        const hasDESAndLang =
          this.hasCriterion(selected, "des_12e_annee") && selected.has("francais_sec5_11e");
        const hasCoursSpecialises = coursSpecialisesIds.some((id) =>
          selected.has(id),
        );
        const has1erCycle =
          selected.has("univ_1er_cycle_global") ||
          Array.from(selected).some((id) => id.startsWith("bacc_"));

        if (hasDESAndLang || hasCoursSpecialises || has1erCycle) return { passed: true };
        return {
          passed: false,
          missingFr: "DES avec Français/Anglais de sec 5 (ou Cours spécialisé / Diplôme universitaire)",
          missingEn: "High School Diploma with Grade 11 English/French (or Specialized Course / University Degree)"
        };
      },
    },
    {
      jobs: ["00100"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const hasDES = this.hasCriterion(selected, "des_12e_annee");
        const hasMath11App = selected.has("base_math_11_app");
        const hasChemOrPhys =
          selected.has("chimie_sec5_11e") || selected.has("physique_sec5_11e");
        
        if (hasDES && hasMath11App && hasChemOrPhys) return { passed: true };

        const missingFr = [];
        const missingEn = [];
        if (!hasDES) {
          missingFr.push("DES ou 12e année");
          missingEn.push("High School Diploma or Grade 12");
        }
        if (!hasMath11App) {
          missingFr.push("Mathématiques de sec 5/11e (appliquées)");
          missingEn.push("Grade 11 Math (Applied)");
        }
        if (!hasChemOrPhys) {
          missingFr.push("Chimie ou Physique de sec 5/11e année");
          missingEn.push("Grade 11 Chemistry or Physics");
        }
        return {
          passed: false,
          missingFr: missingFr.join(" et "),
          missingEn: missingEn.join(" and "),
        };
      },
    },

    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00105"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["sec4_24_credits", "base_math_10_app"],
      jobs: ["00109"],
      allowPR: false, // CC
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00114"],
      allowPR: false, // CC
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00115"],
      allowPR: false, // CC
    },
    {
      jobs: ["00120"],
      allowPR: false, // CC
      customCheck: (selected) => {
        const has24PropsAndMath =
          selected.has("sec4_24_credits") && selected.has("base_math_10_app");
        const has1erCycle =
          selected.has("univ_1er_cycle_global") ||
          Array.from(selected).some((id) => id.startsWith("bacc_"));
        
        if (has24PropsAndMath || has1erCycle) return { passed: true };

        return {
            passed: false,
            missingFr: "24 crédits de sec 4 avec Mathématiques de sec 4/10e (appliquées) (ou Diplôme universitaire)",
            missingEn: "24 credits of Grade 10 with Grade 10 Math (Applied) (or University Degree)"
        };
      },
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
        "sci_tech4_sci10",
      ],
      jobs: ["00129"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
        "sci_tech4_sci10",
      ],
      jobs: ["00130", "00134"],
      allowPR: true, // RP
    },
    {
      jobs: ["00135"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const isEnglish = selected.has("etude_anglais");
        if (isEnglish) {
          const hasDes = this.hasCriterion(selected, "des_12e_annee");
          const hasEnglishSec5 = selected.has("anglais_sec5_12e");
          const hasCegep201 = selected.has("qc_12_cegep201") || selected.has("base_math_12_adv");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = hasDes && hasEnglishSec5 && (hasCegep201 || hasMath11AppOrAdv);
          const passed = passedAcademic || selected.has("cs_tea_m");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Anglais de sec 5 / 12 e année + (CEGEP 201 Appliquée ou Théoriques / 12e année ou Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑M (technicien d’entretien d’aéronefs - maintenance) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 12 / Sec 5 English + (CEGEP 201 Appliquée ou Théoriques / 12e année or Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-M (aircraft maintenance engineer - maintenance) program diploma)",
          };
        } else {
          const hasDes = this.hasCriterion(selected, "des_12e_annee");
          const hasPhysicsSec5 = selected.has("physique_sec5_11e");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = hasDes && hasPhysicsSec5 && hasMath11AppOrAdv;
          const passed = passedAcademic || selected.has("cs_tea_m");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Physique de sec 5/11e année + (Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑M (technicien d’entretien d’aéronefs - maintenance) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 11 Physics + (Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-M (aircraft maintenance engineer - maintenance) program diploma)",
          };
        }
      },
    },
    {
      jobs: ["00136"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const isEnglish = selected.has("etude_anglais");
        if (isEnglish) {
          const hasDes = this.hasCriterion(selected, "des_12e_annee");
          const hasEnglishSec5 = selected.has("anglais_sec5_12e");
          const hasCegep201 = selected.has("qc_12_cegep201") || selected.has("base_math_12_adv");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = hasDes && hasEnglishSec5 && (hasCegep201 || hasMath11AppOrAdv);
          const passed = passedAcademic || selected.has("cs_tea_e");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Anglais de sec 5 / 12 e année + (CEGEP 201 Appliquée ou Théoriques / 12e année ou Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑E (technicien d’entretien d’aéronefs - avionique) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 12 / Sec 5 English + (CEGEP 201 Appliquée ou Théoriques / 12e année or Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-E (aircraft maintenance engineer - avionics) program diploma)",
          };
        } else {
          const hasDes = this.hasCriterion(selected, "des_12e_annee");
          const hasPhysicsSec5 = selected.has("physique_sec5_11e");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = hasDes && hasPhysicsSec5 && hasMath11AppOrAdv;
          const passed = passedAcademic || selected.has("cs_tea_e");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Physique de sec 5/11e année + (Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑E (technicien d’entretien d’aéronefs - avionique) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 11 Physics + (Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-E (aircraft maintenance engineer - avionics) program diploma)",
          };
        }
      },
    },
    {
      jobs: ["00137"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          this.hasCriterion(selected, "des_12e_annee") ||
          selected.has("cs_photo_multimedia") ||
          selected.has("bacc_arts_communications") ||
          selected.has("bacc_arts_communication_visuelle")
        );
        if (passed) return { passed: true };
        return {
            passed: false,
            missingFr: "DES, Cours de spécialisation en Photographie/Multimédia, ou Bacc en Communications",
            missingEn: "High School Diploma, Specialized Course in Photography/Multimedia, or Bachelor's in Communications"
        };
      },
    },
    {
      jobs: ["00138"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const isEnglish = selected.has("etude_anglais");
        if (isEnglish) {
          const hasDes = this.hasCriterion(selected, "des_12e_annee");
          const hasEnglishSec5 = selected.has("anglais_sec5_12e");
          const hasCegep201 = selected.has("qc_12_cegep201") || selected.has("base_math_12_adv");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = hasDes && hasEnglishSec5 && (hasCegep201 || hasMath11AppOrAdv);
          const passed = passedAcademic || selected.has("cs_tea_s");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Anglais de sec 5 / 12 e année + (CEGEP 201 Appliquée ou Théoriques / 12e année ou Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑S (technicien d’entretien d’aéronefs - structures) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 12 / Sec 5 English + (CEGEP 201 Appliquée ou Théoriques / 12e année or Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-S (aircraft maintenance engineer - structures) program diploma)",
          };
        } else {
          const hasDes = this.hasCriterion(selected, "des_12e_annee");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = hasDes && hasMath11AppOrAdv;
          const passed = passedAcademic || selected.has("cs_tea_s");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + (Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑S (technicien d’entretien d’aéronefs - structures) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + (Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-S (aircraft maintenance engineer - structures) program diploma)",
          };
        }
      },
    },
    {
      jobs: ["00149"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const hasEducation =
          this.hasCriterion(selected, "des_12e_annee") && selected.has("base_math_10_app");
        const hasFireTech = selected.has("cs_sec_incendie");
        const passed = hasEducation || hasFireTech;
        if (passed) return { passed: true };
        return {
            passed: false,
            missingFr: "DES avec Mathématiques de sec 4/10e (appliquées) (ou Formation en sécurité incendie)",
            missingEn: "High School Diploma with Grade 10 Math (Applied) (or Fire Security Training)"
        };
      },
    },
    {
      requiredCriteriaIds: ["cs_tech_lab_med"],
      jobs: ["00152"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["cs_tech_radio_med"],
      jobs: ["00153"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["cs_tech_ing_biomed"],
      jobs: ["00155"],
      allowPR: true, // RP
    },
    {
      jobs: ["00161"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const isOutsideCanada = selected.has("etude_hors_canada");
        const hasUniversityDegree = (
          selected.has("bacc_arts_criminologie") ||
          selected.has("bacc_arts_justice_criminelle") ||
          selected.has("bacc_arts_sci_policieres") ||
          selected.has("bacc_arts_sec_policieres") ||
          selected.has("bacc_arts_sec_publique") ||
          selected.has("bacc_arts_sociologie") ||
          selected.has("bacc_arts_psychologie") ||
          selected.has("bacc_arts_gestion_urgences") ||
          selected.has("bacc_arts_droit") ||
          selected.has("bacc_arts_etudes_judiciaires")
        );
        const hasTechPolicieres = selected.has("cs_tech_policieres");
        const passed = hasTechPolicieres || (!isOutsideCanada && hasUniversityDegree);

        if (isOutsideCanada) {
          return {
            passed,
            missingFr: "DEC en techniques policières (les diplômes universitaires ne sont admissibles que pour les études complétées au Canada)",
            missingEn: "Police Technology diploma (university degrees are only admissible for studies completed in Canada)"
          };
        }

        return {
          passed,
          missingFr: "DEC en techniques policières (ou Diplôme universitaire admissible au Canada : Criminologie, Justice criminelle, Sciences/études policières, Sécurité et études policières, Sécurité publique, Sociologie, Psychologie, Gestion des urgences, Droit ou Études judiciaires)",
          missingEn: "Police Technology diploma (or Eligible Canadian university degree: Criminology, Criminal Justice, Police Science/Studies, Security and Police Studies, Public Safety, Sociology, Psychology, Emergency Management, Law, or Judicial Studies)"
        };
      },
    },
    {
      jobs: ["00164"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          (selected.has("sec4_24_credits") &&
            selected.has("base_math_10_gen")) ||
          selected.has("cs_dep_cuisine")
        );
        if (passed) return { passed: true };
        return {
            passed: false,
            missingFr: "24 crédits de sec 4 avec Mathématiques de sec 4/10e (générales) (ou DEP en cuisine)",
            missingEn: "24 credits of Grade 10 with Grade 10 Math (General) (or DEP in cooking)"
        };
      },
    },
    {
      jobs: ["00166"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          this.hasCriterion(selected, "des_12e_annee") || selected.has("cs_etude_musique")
        );
        if (passed) return { passed: true };
        return {
            passed: false,
            missingFr: "DES ou 12e année (ou Études en musique)",
            missingEn: "High School Diploma or Grade 12 (or Music Studies)"
        };
      },
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00167", "00168", "00169", "00170", "00171"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["des_12e_annee", "base_math_11_app"],
      jobs: ["00238"],
      allowPR: false, // CC
    },
    {
      requiredCriteriaIds: ["sec4_24_credits", "base_math_10_gen"],
      jobs: ["00261"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00299"],
      allowPR: false, // CC
    },
    {
      jobs: ["00301"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          (selected.has("sec4_24_credits") &&
            selected.has("base_math_10_app")) ||
          selected.has("cs_dep_refrigeration")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "24 crédits de sec 4 avec Math appliquées de sec 4/10e (ou DEP en réfrigération)", missingEn: "24 credits of Grade 10 with Applied Math Grade 10 (or DEP in refrigeration)" };
      },
    },
    {
      jobs: ["00302"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const option1 =
          this.hasCriterion(selected, "sec4_24_credits") && selected.has("base_math_10_app");
        const option2 = selected.has("cs_dep_electricite");
        const option3 =
          this.hasCriterion(selected, "des_12e_annee") &&
          selected.has("base_math_11_adv") &&
          selected.has("physique_sec5_11e");
        const passed = option1 || option2 || option3;
        if (passed) return { passed: true };
        return { passed: false, missingFr: "24 crédits de sec 4 avec Math appliquées de sec 4/10e (ou DEP en électricité, ou DES avec Math avancées de sec 5/11e et Physique de sec 5/11e)", missingEn: "24 credits of Grade 10 with Applied Math Grade 10 (or DEP in electricity, or High School Diploma with Grade 11 Advanced Math and Grade 11 Physics)" };
      },
    },
    {
      jobs: ["00303"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          (this.hasCriterion(selected, "sec4_24_credits") &&
            selected.has("base_math_10_app")) ||
          selected.has("cs_dep_electricite")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "24 crédits de sec 4 avec Math appliquées de sec 4/10e (ou DEP en électricité)", missingEn: "24 credits of Grade 10 with Applied Math Grade 10 (or DEP in electricity)" };
      },
    },
    {
      jobs: ["00304"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          (this.hasCriterion(selected, "sec4_24_credits") &&
            selected.has("base_math_10_app")) ||
          selected.has("cs_dep_plomberie_chauffage")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "24 crédits de sec 4 avec Math appliquées de sec 4/10e (ou DEP en plomberie et chauffage)", missingEn: "24 credits of Grade 10 with Applied Math Grade 10 (or DEP in plumbing and heating)" };
      },
    },
    {
      jobs: ["00305"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          (this.hasCriterion(selected, "sec4_24_credits") &&
            selected.has("base_math_10_app")) ||
          selected.has("cs_aec_eaux")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "24 crédits de sec 4 avec Math appliquées de sec 4/10e (ou AEC en traitement des eaux)", missingEn: "24 credits of Grade 10 with Applied Math Grade 10 (or AEC in water treatment)" };
      },
    },
    {
      jobs: ["00306"],
      allowPR: true, // RP
      customCheck: (selected) => {
        const passed = (
          (this.hasCriterion(selected, "sec4_24_credits") &&
            selected.has("base_math_10_app")) ||
          selected.has("cs_dep_charpenterie")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "24 crédits de sec 4 avec Math appliquées de sec 4/10e (ou DEP en charpenterie)", missingEn: "24 credits of Grade 10 with Applied Math Grade 10 (or DEP in carpentry)" };
      },
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00324"],
      allowPR: false, // CC
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
        "sci_tech4_sci10",
      ],
      jobs: ["00327"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["cs_cert_assist_dentaire"],
      jobs: ["00335"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["sec4_24_credits", "base_math_10_app"],
      jobs: ["00337"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00339"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["sec4_24_credits", "base_math_10_adv"],
      jobs: ["00366"],
      allowPR: true, // RP
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00368"],
      allowPR: true,
    },
    {
      jobs: ["00370"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          (this.hasCriterion(selected, "des_12e_annee") && selected.has("base_math_11_app")) ||
          selected.has("cs_dep_arpentage_topo")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "DES avec Math appliquées de sec 5/11e (ou DEP en arpentage et topographie)", missingEn: "High School Diploma with Applied Math Grade 11 (or DEP in surveying and topography)" };
      },
    },
    {
      requiredCriteriaIds: ["cs_dep_sante_infirmiers"],
      jobs: ["00372"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
        "francais_sec4_10e",
      ],
      jobs: ["00375"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
        "francais_sec4_10e",
      ],
      jobs: ["00376"],
      allowPR: true,
    },
    {
      jobs: ["00378"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          (this.hasCriterion(selected, "des_12e_annee") && selected.has("base_math_11_adv")) ||
          (this.hasCriterion(selected, "des_12e_annee") && selected.has("info_sec5_12e")) ||
          selected.has("cs_dip_cyber")
        );
        if (passed) return { passed: true };
        return { passed: false, missingFr: "DES avec Math avancées de sec 5/11e ou Informatique de sec 5/12e (ou Diplôme en cybersécurité)", missingEn: "High School Diploma with Advanced Math Grade 11 or Grade 12 Computer Science (or Diploma in cybersecurity)" };
      },
    },
    {
      requiredCriteriaIds: ["sec4_24_credits", "base_math_10_app"],
      jobs: ["00383"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["sec4_24_credits", "base_math_10_app"],
      jobs: ["00384"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_adv",
        "sci_tech4_sci10",
      ],
      jobs: ["00385"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00386"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00387"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_adv",
        "sci_tech4_sci10",
      ],
      jobs: ["00394"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["sec4_24_credits"],
      jobs: ["00402"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
      ],
      jobs: ["00404"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
      ],
      jobs: ["00405"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: ["cs_cert_soins_param"],
      jobs: ["00406"],
      allowPR: true,
    },
    {
      requiredCriteriaIds: [
        "sec4_24_credits",
        "base_math_10_app",
        "sci_tech4_sci10",
      ],
      jobs: ["00407"],
      allowPR: true,
    },
    {
      jobs: [
        "00178",
        "00179",
        "00180",
        "00182",
        "00183",
        "00184",
        "00328",
        "00389",
      ],
      allowPR: true,
      customCheck: (selected) => {
        const has1erCycle =
          selected.has("univ_1er_cycle_global") ||
          Array.from(selected).some((id) => id.startsWith("bacc_"));
        const hasMaitrise =
          selected.has("univ_cycle_sup_maitrise") ||
          Array.from(selected).some((id) => id.startsWith("maitrise_"));
        return has1erCycle || hasMaitrise;
      },
    },
    {
      jobs: ["00181"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_mathematiques_appliquees",
          "bacc_sci_appliquees_general",
          "bacc_sci_chimie",
          "bacc_sci_systemes_informatiques",
          "bacc_sci_environnementales",
          "bacc_sci_mathematiques",
          "bacc_sci_mathematiques_physique",
          "bacc_sci_physique",
          "bacc_sci_espace_seul",
          "bacc_sci_terre",
        ];
        const requiredGenies = [
          "bacc_genie_civil",
          "bacc_genie_environnemental",
          "bacc_genie_geomatique",
          "bacc_genie_aerospatiale_aeronautique",
          "bacc_genie_chimie_chimique",
          "bacc_genie_informatique",
          "bacc_genie_systemes_informatique",
          "bacc_genie_electricite_electrique",
          "bacc_genie_energie",
          "bacc_genie_physique",
          "bacc_genie_geologie",
          "bacc_genie_industriel_seul",
          "bacc_genie_materiaux",
          "bacc_genie_mecanique",
          "bacc_genie_minier",
          "bacc_genie_batiment",
        ];
        return (
          requiredSciences.some((id) => selected.has(id)) ||
          requiredGenies.some((id) => selected.has(id))
        );
      },
    },
    {
      jobs: ["00185"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_appliquees_general",
          "bacc_sci_sciences_de_l_informatique",
          "bacc_sci_espace_seul",
          "bacc_sci_terre",
          "bacc_sci_physique",
          "bacc_sci_chimie",
        ];
        const requiredGenies = [
          "bacc_genie_aerospatiale_aeronautique",
          "bacc_genie_informatique",
          "bacc_genie_systemes_informatique",
          "bacc_genie_electricite_electrique",
          "bacc_genie_systemes_electricite",
          "bacc_genie_mecanique",
          "bacc_genie_systemes_mecanique",
          "bacc_genie_systemes_mecatronique",
          "bacc_genie_mecatronique",
          "bacc_genie_physique",
          "bacc_genie_logiciel",
          "bacc_genie_systemes_logiciel",
          "bacc_genie_conception_systemes",
          "bacc_genie_chimie_chimique",
          "bacc_genie_gestion",
          "bacc_genie_materiaux",
          "bacc_genie_spatiale",
        ];
        return (
          requiredSciences.some((id) => selected.has(id)) ||
          requiredGenies.some((id) => selected.has(id))
        );
      },
    },
    {
      jobs: ["00187"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_appliquees_general",
          "bacc_sci_chimie",
          "bacc_sci_sciences_de_l_informatique",
          "bacc_sci_systemes_informatiques",
          "bacc_sci_mathematiques",
          "bacc_sci_mathematiques_appliquees",
          "bacc_sci_physique",
          "bacc_sci_espace_seul",
          "bacc_sci_terre",
        ];
        const hasRequiredScience = requiredSciences.some((id) =>
          selected.has(id),
        );
        const hasGenie =
          selected.has("univ_1er_cycle_genie") ||
          Array.from(selected).some((id) => id.startsWith("bacc_genie_"));
        return hasRequiredScience || hasGenie;
      },
    },
    {
      jobs: ["00189"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences1 = [
          "bacc_sci_environnementales",
          "bacc_sci_geologie",
          "bacc_sci_technologie_surete_protection_incendie",
          "bacc_sci_geomatique",
          "bacc_sci_arpentage",
        ];
        const requiredGenies1 = [
          "bacc_genie_chimie_chimique",
          "bacc_genie_gestion",
          "bacc_genie_ingenierie_gestion",
          "bacc_genie_geologie",
        ];
        const cond1 =
          requiredSciences1.some((id) => selected.has(id)) ||
          requiredGenies1.some((id) => selected.has(id));

        const requiredSciences2 = ["bacc_sci_bsc_genie_protection_incendie"];
        const requiredGenies2 = [
          "bacc_genie_civil",
          "bacc_genie_mecanique",
          "bacc_genie_electricite_electrique",
          "bacc_genie_environnemental",
        ];
        const cond2 =
          requiredSciences2.some((id) => selected.has(id)) ||
          requiredGenies2.some((id) => selected.has(id));

        return cond1 || cond2;
      },
    },
    {
      jobs: ["00190"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_sante_physiotherapie") ||
          selected.has("maitrise_sante_physiotherapie")
        );
        return {
          passed,
          missingFr: "Baccalauréat ou Maîtrise en physiothérapie, avec un permis/licence d'exercice de physiothérapeute en règle (actif) d'un organisme provincial/territorial et une attestation de bonne conduite",
          missingEn: "Bachelor's or Master's degree in Physiotherapy, with a valid, active license/permit to practice as a physiotherapist from a provincial/territorial regulatory body and a letter of good standing"
        };
      },
    },
    {
      jobs: ["00191"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = selected.has("bacc_sante_medecine_dentaire");
        return {
          passed,
          missingFr: "Doctorat ou Baccalauréat en médecine dentaire, réussite des examens du BNED, permis d'exercice provincial/territorial actif, attestation de bonne conduite et au moins 5 ans de pratique clinique démontrée dans un CV",
          missingEn: "Doctor of Dental Medicine or Bachelor of Dental Surgery, completion of NDEB examinations, active provincial/territorial license, letter of good standing, and at least 5 years of clinical practice shown in a CV"
        };
      },
    },
    {
      jobs: ["00194"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_sante_pharmacie") ||
          selected.has("doctorat_sante_pharmacie")
        );
        return {
          passed,
          missingFr: "Baccalauréat ou Doctorat en pharmacie, avec un permis d'exercice de pharmacien actif d'une province/territoire canadien et une attestation de bonne conduite",
          missingEn: "Bachelor's or Doctorate in Pharmacy, with a valid active license to practice pharmacy in a Canadian province/territory and a letter of good standing"
        };
      },
    },
    {
      jobs: ["00195"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_sante_sciences_soins_infirmiers") ||
          selected.has("bacc_sante_sciences_infirmieres")
        );
        return {
          passed,
          missingFr: "Baccalauréat en sciences infirmières ou en sciences des soins infirmiers, avec un permis d'exercice actif et sans restriction d'infirmier(ère) autorisé(e) émis par un organisme provincial/territorial",
          missingEn: "Bachelor's degree in Nursing or Nursing Science, with a valid, unrestricted license to practice as a registered nurse from a provincial/territorial regulatory body"
        };
      },
    },
    {
      jobs: ["00197"],
      allowPR: true,
      customCheck: (selected) => {
        const hasBacc =
          selected.has("bacc_sante_biologie_humaine") ||
          selected.has("bacc_sante_physiologie_humaine") ||
          selected.has("bacc_sante_kinesiologie") ||
          selected.has("bacc_sante_biologie") ||
          selected.has("bacc_sante_biochimie") ||
          selected.has("bacc_sante_microbiologie") ||
          selected.has("bacc_sante_genie_biomedical") ||
          selected.has("bacc_sante_diplome_sciences_vie");

        const hasMaitrise =
          selected.has("maitrise_sante_integration_systemes_humains") ||
          selected.has("maitrise_sante_environnementale_professionnelle") ||
          selected.has("maitrise_sante_publique") ||
          selected.has("maitrise_sante_kinesiologie") ||
          selected.has("maitrise_sante_biologie_humaine") ||
          selected.has("maitrise_sante_physiologie_humaine") ||
          selected.has("maitrise_sante_biologie") ||
          selected.has("maitrise_sante_biochimie") ||
          selected.has("maitrise_sante_microbiologie") ||
          selected.has("maitrise_sante_genie_biomedical") ||
          selected.has("maitrise_sante_diplome_sciences_vie");

        const passed = hasBacc || hasMaitrise;
        return {
          passed,
          missingFr: "Baccalauréat ou Maîtrise dans un domaine des sciences biologiques ou de la santé (ex: biologie, kinésiologie, biochimie, microbiologie, sciences de la vie, génie biomédical, physiologie ou santé publique) [Aucune expérience clinique ou professionnelle préalable requise pour l'enrôlement direct]",
          missingEn: "Bachelor's or Master's degree in a bioscience or health-related field (e.g., biology, kinesiology, biochemistry, microbiology, life sciences, biomedical engineering, physiology, or public health) [No prior clinical or professional work experience required for direct entry]"
        };
      },
    },
    {
      jobs: ["00198"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = selected.has("maitrise_sante_service_social");
        return {
          passed,
          missingFr: "Maîtrise en service social, avec un permis d'exercice actif de travailleur social émis par un organisme provincial/territorial canadien et une attestation de bonne conduite",
          missingEn: "Master's degree in Social Work, with a valid, active license to practice social work from a provincial/territorial regulatory body and a letter of good standing"
        };
      },
    },
    {
      jobs: ["00203"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_arts_communications") ||
          selected.has("bacc_arts_relations_intern") ||
          selected.has("bacc_arts_journalisme") ||
          selected.has("bacc_arts_relations_publiques") ||
          selected.has("bacc_arts_anglais_francais") ||
          selected.has("bacc_arts_science_politique") ||
          selected.has("bacc_arts_commercialisation") ||
          selected.has("bacc_arts_medias_numeriques") ||
          selected.has("bacc_arts_etudes_militaires") ||
          selected.has("bacc_arts_anthropologie") ||
          selected.has("bacc_arts_psychologie") ||
          selected.has("bacc_arts_philosophie") ||
          selected.has("bacc_arts_sociologie") ||
          selected.has("bacc_arts_linguistique") ||
          selected.has("maitrise_arts_communications") ||
          selected.has("maitrise_arts_relations_internationales") ||
          selected.has("maitrise_arts_journalisme") ||
          selected.has("maitrise_arts_relations_publiques") ||
          selected.has("maitrise_arts_anglais_francais") ||
          selected.has("maitrise_arts_science_politique") ||
          selected.has("maitrise_arts_commercialisation") ||
          selected.has("maitrise_arts_medias_numeriques") ||
          selected.has("maitrise_arts_etudes_militaires") ||
          selected.has("maitrise_arts_anthropologie") ||
          selected.has("maitrise_arts_psychologie") ||
          selected.has("maitrise_arts_philosophie") ||
          selected.has("maitrise_arts_sociologie") ||
          selected.has("maitrise_arts_linguistique")
        );
        return {
          passed,
          missingFr: "Baccalauréat ou Maîtrise en communication, relations publiques, journalisme, relations internationales, science politique, langues, marketing, médias numériques ou sciences humaines, avec au moins une (1) année d'expérience cumulative à temps plein dans au moins deux de ces domaines (journalisme, relations publiques, marketing, affaires publiques, communications, médias numériques)",
          missingEn: "Bachelor's or Master's degree in communications, public relations, journalism, international relations, political science, languages, marketing, digital media, or social sciences, with at least one (1) year of cumulative full-time experience in at least two of these fields (journalism, public relations, marketing, public affairs, communications, digital media)"
        };
      },
    },
    {
      jobs: ["00204"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = selected.has("bacc_arts_droit");
        return {
          passed,
          missingFr: "Baccalauréat en droit (LL.B. ou B.C.L.), être membre actif en règle d'un barreau provincial ou territorial canadien et fournir une lettre d'attestation de bonne conduite",
          missingEn: "Bachelor's degree in Law (LL.B. or B.C.L.), being an active member in good standing of a provincial or territorial Canadian bar and providing a letter of good standing"
        };
      },
    },
    {
      jobs: ["00207", "00213"],
      allowPR: true,
      customCheck: (selected) => {
        return (
          selected.has("univ_1er_cycle_global") ||
          Array.from(selected).some((id) => id.startsWith("bacc_"))
        );
      },
    },
    {
      jobs: ["00208"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_arts_psychologie") ||
          selected.has("bacc_arts_sociologie") ||
          selected.has("maitrise_arts_psychologie_industrielle_orga") ||
          selected.has("maitrise_arts_psychologie_sociale") ||
          selected.has("maitrise_arts_psychologie_cognitive") ||
          selected.has("maitrise_arts_psychologie_recherche") ||
          selected.has("maitrise_arts_psychologie_sociale_applique") ||
          selected.has("maitrise_arts_sociologie") ||
          selected.has("maitrise_arts_anthropologie_sociale") ||
          selected.has("maitrise_arts_psychologie_sociale_culturale") ||
          selected.has("maitrise_arts_psychologie_conseil")
        );
        return {
          passed,
          missingFr: "Baccalauréat en psychologie ou sociologie, ou Maîtrise en psychologie, sociologie ou anthropologie sociale (Si admis via un baccalauréat : requiert au moins 1 an d'expérience de travail à temps plein en sélection, recrutement/RH, recherche en sciences sociales ou orientation scolaire/professionnelle)",
          missingEn: "Bachelor's degree in psychology or sociology, or Master's degree in psychology, sociology, or social anthropology (If applying with a Bachelor's degree: requires at least 1 year of full-time work experience in selection, recruiting/HR, social science research, or educational/vocational counseling)"
        };
      },
    },
    {
      jobs: ["00211"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_arts_education_professionnelle") ||
          selected.has("bacc_arts_education_adultes") ||
          selected.has("bacc_arts_education_physique") ||
          selected.has("bacc_arts_education") ||
          selected.has("bacc_arts_ressources_humaines") ||
          selected.has("maitrise_arts_education")
        );
        return {
          passed,
          missingFr: "Baccalauréat ou Maîtrise en éducation (générale, physique, des adultes, professionnelle) ou en ressources humaines, avec au moins trois (3) ans cumulatifs d'expérience à temps plein dans l'élaboration de programmes d'études, la formation de personnel, l'enseignement ou comme expert-conseil pédagogique",
          missingEn: "Bachelor's or Master's degree in education (general, physical, adult, vocational) or human resources, with at least three (3) cumulative years of full-time experience in curriculum development, staff training, teaching, or instructional consulting"
        };
      },
    },
    {
      jobs: ["00214"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_arts_justice_criminelle") ||
          selected.has("bacc_arts_criminologie") ||
          selected.has("bacc_arts_gestion_urgences") ||
          selected.has("bacc_arts_etudes_judiciaires") ||
          selected.has("bacc_arts_droit") ||
          selected.has("bacc_arts_sci_policieres") ||
          selected.has("bacc_arts_psychologie") ||
          selected.has("bacc_arts_sociologie") ||
          selected.has("bacc_arts_sec_publique") ||
          selected.has("bacc_arts_sec_policieres") ||
          selected.has("bacc_arts_admin_entreprise") ||
          selected.has("bacc_arts_etudes_militaires") ||
          selected.has("bacc_arts_etudes_internationales_cmr")
        );
        return {
          passed,
          missingFr: "Baccalauréat en criminologie, justice criminelle, sciences policières, sécurité publique, gestion des urgences, droit, psychologie, sociologie, administration ou études militaires, ainsi qu'un permis de conduire civil valide",
          missingEn: "Bachelor's degree in criminology, criminal justice, police sciences, public safety, emergency management, law, psychology, sociology, administration, or military studies, and a valid civilian driver's license"
        };
      },
    },
    {
      jobs: ["00340"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_mathematiques_appliquees",
          "bacc_sci_mathematiques",
          "bacc_sci_mathematiques_physique",
          "bacc_sci_physique",
          "bacc_sci_chimie",
          "bacc_sci_espace_seul",
          "bacc_sci_terre",
          "bacc_sci_information_informatique",
          "bacc_sci_systemes_informatiques",
          "bacc_sci_gestion_information",
          "bacc_sci_information",
          "bacc_sci_systemes_information",
          "bacc_sci_technologie_information",
        ];
        const hasRequiredScience = requiredSciences.some((id) =>
          selected.has(id),
        );
        const hasGenie =
          selected.has("univ_1er_cycle_genie") ||
          Array.from(selected).some((id) => id.startsWith("bacc_genie_"));
        return hasRequiredScience || hasGenie;
      },
    },
    {
      jobs: ["00341"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_mathematiques_appliquees",
          "bacc_sci_chimie",
          "bacc_sci_imagerie",
          "bacc_sci_mathematiques",
          "bacc_sci_mathematiques_physique",
          "bacc_sci_physique",
          "bacc_sci_espace_seul",
          "bacc_sci_terre",
          "bacc_sci_appliquees_general",
          "bacc_sci_sciences_de_l_informatique",
          "bacc_sci_systemes_informatiques",
          "bacc_sci_gestion_information",
          "bacc_sci_information",
          "bacc_sci_systemes_information",
          "bacc_sci_technologie_information",
        ];
        const hasRequiredScience = requiredSciences.some((id) =>
          selected.has(id),
        );
        const hasGenie =
          selected.has("univ_1er_cycle_genie") ||
          Array.from(selected).some((id) => id.startsWith("bacc_genie_"));
        return hasRequiredScience || hasGenie;
      },
    },
    {
      jobs: ["00344"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_technologie_information",
          "bacc_sci_donnees",
          "bacc_sci_espace_seul",
          "bacc_sci_informatique_seul",
          "bacc_sci_sciences_de_l_informatique",
          "bacc_sci_systemes_informatiques",
          "bacc_sci_mathematiques",
          "bacc_sci_mathematiques_appliquees",
          "bacc_sci_mathematiques_physique",
          "bacc_sci_physique",
        ];
        const hasRequiredScience = requiredSciences.some((id) =>
          selected.has(id),
        );

        const requiredGenieBaccs = [
          "bacc_genie_tech_fisheries_memorial",
          "bacc_genie_aerospatiale_aeronautique",
          "bacc_genie_architecture_navale",
          "bacc_genie_chimie_chimique",
          "bacc_genie_civil",
          "bacc_genie_communications",
          "bacc_genie_industriel_seul",
          "bacc_genie_physique_technique",
          "bacc_genie_systemes_electroniques",
          "bacc_genie_materiaux",
          "bacc_genie_maritime",
          "bacc_genie_mecanique",
          "bacc_genie_metallurgique",
          "bacc_genie_nucleaire",
          "bacc_genie_electricite_electrique",
          "bacc_genie_informatique",
          "bacc_genie_logiciel",
          "bacc_genie_cyber_systemes",
        ];
        const hasRequiredGenieBacc = requiredGenieBaccs.some((id) =>
          selected.has(id),
        );

        const requiredGenieMaitrises = [
          "maitrise_aeronautique",
          "maitrise_aerospatial",
          "maitrise_architecture_navale",
          "maitrise_chimique",
          "maitrise_genie_civil",
          "maitrise_arts_communications",
          "maitrise_industriel",
          "maitrise_genie_physique",
          "maitrise_genie_systemes_electroniques",
          "maitrise_materiels",
          "maitrise_marine",
          "maitrise_mecanique",
          "maitrise_metallurgique",
          "maitrise_nucleaire",
          "maitrise_genie_electrique",
          "maitrise_genie_systemes_electriques",
          "maitrise_genie_informatique",
          "maitrise_informatiques",
          "maitrise_logiciel",
        ];
        const hasRequiredGenieMaitrise = requiredGenieMaitrises.some((id) =>
          selected.has(id),
        );

        return (
          hasRequiredScience || hasRequiredGenieBacc || hasRequiredGenieMaitrise
        );
      },
    },
    {
      jobs: ["00345"],
      allowPR: true,
      customCheck: (selected) => {
        const requiredSciences = [
          "bacc_sci_informatique_seul",
          "bacc_sci_sciences_de_l_informatique",
          "bacc_sci_systemes_informatiques",
          "bacc_sci_mathematiques",
          "bacc_sci_mathematiques_appliquees",
          "bacc_sci_mathematiques_physique",
          "bacc_sci_physique",
          "bacc_sci_espace_seul",
        ];
        const hasRequiredScience = requiredSciences.some((id) =>
          selected.has(id),
        );

        const requiredGenieBaccs = [
          "bacc_genie_aerospatiale_aeronautique",
          "bacc_genie_chimie_chimique",
          "bacc_genie_civil",
          "bacc_genie_environnemental",
          "bacc_genie_systemes_electricite",
          "bacc_genie_systemes_electroniques",
          "bacc_genie_electricite_electrique",
          "bacc_genie_physique",
          "bacc_genie_informatique",
          "bacc_genie_systemes_informatique",
          "bacc_genie_industriel_seul",
          "bacc_genie_logiciel",
          "bacc_genie_materiels",
          "bacc_genie_metallurgique",
          "bacc_genie_nucleaire",
          "bacc_genie_marine",
          "bacc_genie_mecanique",
          "bacc_genie_architecture_navale",
          "bacc_genie_tech_sci_nautiques_cap_breton",
        ];
        const hasRequiredGenieBacc = requiredGenieBaccs.some((id) =>
          selected.has(id),
        );

        const requiredGenieMaitrises = [
          "maitrise_aeronautique",
          "maitrise_aerospatial",
          "maitrise_chimique",
          "maitrise_genie_civil",
          "maitrise_genie_environnement",
          "maitrise_genie_systemes_electriques",
          "maitrise_genie_systemes_electroniques",
          "maitrise_genie_electrique",
          "maitrise_genie_physique",
          "maitrise_physique",
          "maitrise_physiques",
          "maitrise_genie_informatique",
          "maitrise_informatiques",
          "maitrise_industriel",
          "maitrise_logiciel",
          "maitrise_materiels",
          "maitrise_metallurgique",
          "maitrise_nucleaire",
          "maitrise_marine",
          "maitrise_mecanique",
          "maitrise_architecture_navale",
        ];
        const hasRequiredGenieMaitrise = requiredGenieMaitrises.some((id) =>
          selected.has(id),
        );

        return (
          hasRequiredScience || hasRequiredGenieBacc || hasRequiredGenieMaitrise
        );
      },
    },
    {
      jobs: ["00349"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_arts_theologie") ||
          selected.has("maitrise_theologie")
        );
        return {
          passed,
          missingFr: "Baccalauréat ou Maîtrise en théologie ou études religieuses, être accrédité et reconnu comme leader spirituel par l'autorité d'une tradition de foi au Canada, être endossé par le CIAMC, et réussir l'entrevue d'aptitude",
          missingEn: "Bachelor's or Master's degree in Theology or Religious Studies, being accredited and recognized as a spiritual leader by a faith tradition authority in Canada, being endorsed by the ICCDF, and passing a suitability interview"
        };
      },
    },
    {
      jobs: ["00374"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = (
          selected.has("bacc_sante_adjoint_medecin") ||
          selected.has("maitrise_adjoint_medecin") ||
          selected.has("doctorat_adjoint_medecin")
        );
        return {
          passed,
          missingFr: "Baccalauréat, Maîtrise ou Doctorat d'adjoint au médecin, certificat du Conseil de certification des adjoints au médecin du Canada (CCAMC), permis d'exercice provincial/territorial actif et attestation de bonne conduite",
          missingEn: "Bachelor's, Master's, or Doctorate in Physician Assistant studies, certification from the Physician Assistant Certification Council of Canada (PACCC), active provincial/territorial license, and a letter of good standing"
        };
      },
    },
    {
      jobs: ["00390"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = selected.has("doctorat_medecine");
        return {
          passed,
          missingFr: "Doctorat en médecine (M.D.), achèvement d'une formation spécialisée (résidence) agréée par le Collège royal des médecins et chirurgiens du Canada dans l'une des spécialités requises, certification et titre de fellow du Collège royal, permis de spécialiste valide sans restriction, attestation de bonne conduite et emploi clinique civil à temps plein",
          missingEn: "Doctorate in Medicine (M.D.), completion of a specialized residency program accredited by the Royal College of Physicians and Surgeons of Canada in a required specialty, certification and fellowship from the Royal College, valid unrestricted specialist license, letter of good standing, and active full-time civilian clinical employment"
        };
      },
    },
    {
      jobs: ["00393"],
      allowPR: true,
      customCheck: (selected) => {
        const passed = selected.has("doctorat_medecine");
        return {
          passed,
          missingFr: "Doctorat en médecine (M.D.), autorisation d'exercer active et sans restriction la médecine familiale dans une province ou un territoire canadien, certification en médecine familiale du Collège des médecins de famille du Canada (CMFC) et attestation de bonne conduite",
          missingEn: "Doctorate in Medicine (M.D.), active unrestricted license to practice family medicine in a Canadian province or territory, family medicine certification from the College of Family Physicians of Canada (CFPC), and a letter of good standing"
        };
      },
    },
    {
      jobs: ["00398"],
      allowPR: true,
      customCheck: (selected) => {
        const option1 =
          selected.has("bacc_sante_gestion_services_sante") ||
          selected.has("bacc_sante_admin_soins_sante");

        const option2 =
          selected.has("bacc_arts_admin_affaires") ||
          selected.has("bacc_arts_admin_publique") ||
          selected.has("bacc_arts_ressources_humaines");

        const option3 =
          selected.has("maitrise_sante_gestion_services_sante") ||
          selected.has("maitrise_sante_admin_soins_sante") ||
          selected.has("maitrise_admin_affaires") ||
          selected.has("maitrise_admin_publique") ||
          selected.has("maitrise_gestion_ressources_humaines");

        const baccSanteSaufPlusHaut = [
          "bacc_sante_adjoint_medecin",
          "bacc_sante_biochimie",
          "bacc_sante_biologie",
          "bacc_sante_biologie_humaine",
          "bacc_sante_diplome_sciences_vie",
          "bacc_sante_genie_biomedical",
          "bacc_sante_kinesiologie",
          "bacc_sante_medecine_dentaire",
          "bacc_sante_microbiologie",
          "bacc_sante_pharmacie",
          "bacc_sante_physiologie_humaine",
          "bacc_sante_physiotherapie",
          "bacc_sante_sciences_soins_infirmiers",
          "bacc_sante_sciences_infirmieres",
        ].some((id) => selected.has(id));

        const dEsSanteSaufPlusHaut = [
          "doctorat_adjoint_medecin",
          "maitrise_adjoint_medecin",
          "doctorat_medecine",
          "doctorat_sante_pharmacie",
          "maitrise_sante_admin_sante",
          "maitrise_sante_biochimie",
          "maitrise_sante_biologie",
          "maitrise_sante_biologie_humaine",
          "maitrise_sante_diplome_sciences_vie",
          "maitrise_sante_genie_biomedical",
          "maitrise_sante_gestion_soins_sante",
          "maitrise_sante_integration_systemes_humains",
          "maitrise_sante_kinesiologie",
          "maitrise_sante_physiotherapie",
          "maitrise_sante_microbiologie",
          "maitrise_sante_physiologie_humaine",
          "maitrise_sante_environnementale_professionnelle",
          "maitrise_sante_publique",
        ].some((id) => selected.has(id));

        const option4 = baccSanteSaufPlusHaut || dEsSanteSaufPlusHaut;

        const passed = option1 || option2 || option3 || option4;
        return {
          passed,
          missingFr: "Baccalauréat ou Maîtrise en gestion des services de santé, administration (des affaires ou publique), ressources humaines, ou tout autre diplôme universitaire dans le domaine de la santé",
          missingEn: "Bachelor's or Master's degree in health services management, administration (business or public), human resources, or any other university degree in a health-related field"
        };
      },
    },
  ];

  selectedCriteriaIds = signal<Set<string>>(new Set<string>());

  activeScolariteTab = signal<"secondaire" | "specialises" | "universitaire">(
    "secondaire",
  );

  criteriaAnneeScolaire = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Année scolaire"),
  );
  criteriaHistoire = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Histoire"),
  );
  criteriaLangue = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Langue" && c.id !== "etude_anglais" && c.id !== "etude_hors_canada"),
  );
  criteriaScience = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Science"),
  );
  criteriaInformatique = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Informatique"),
  );
  criteriaCoursSpecialise = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Cours spécialisés"),
  );
  criteriaUniversitaire1erCycle = computed(() =>
    this.manualCriteria.filter((c) => c.category === "Universitaire 1er cycle"),
  );
  criteriaUniversitaire1erCycleGenie = computed(() =>
    this.manualCriteria.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" && c.subCategory === "Génie",
    ),
  );
  criteriaUniversitaire1erCycleSciences = computed(() =>
    this.manualCriteria.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" &&
        c.subCategory === "Sciences",
    ),
  );
  criteriaUniversitaire1erCycleArts = computed(() =>
    this.manualCriteria.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" && c.subCategory === "Arts",
    ),
  );
  criteriaUniversitaire1erCycleSante = computed(() =>
    this.manualCriteria.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" && c.subCategory === "Santé",
    ),
  );
  criteriaUniversitaireCycleSuperieur = computed(() =>
    this.manualCriteria.filter(
      (c) => c.category === "Universitaire cycle supérieur",
    ),
  );
  criteriaUniversitaireCycleSuperieurMaitrise = computed(() =>
    this.manualCriteria.filter(
      (c) =>
        c.category === "Universitaire cycle supérieur" &&
        c.subCategory === "Maîtrise",
    ),
  );
  criteriaUniversitaireCycleSuperieurDoctorat = computed(() =>
    this.manualCriteria.filter(
      (c) =>
        c.category === "Universitaire cycle supérieur" &&
        c.subCategory === "Doctorat",
    ),
  );
  criteriaExperience = computed(() => {
    const selected = this.selectedCriteriaIds();
    const criteria: ManualCriterion[] = [];

    // Evaluate if user meets base math conditions based on selected province math courses.
    const allMathOptions = Object.values(this.MATH_COURSES).reduce(
      (
        acc: { id: string; label: string; grade: number; diff: number }[],
        courses,
      ) => acc.concat(courses),
      [],
    );
    const selectedMaths = allMathOptions.filter((m) => selected.has(m.id));
    const hasMath = (grade: number, diff: number) => {
      return selectedMaths.some((m) => m.grade >= grade && m.diff >= diff);
    };
    const hasMath10App = hasMath(10, 2);

    // exp_photo_design needs one of: 'des_12e_annee', 'cs_photo_multimedia', 'bacc_arts_communications', 'bacc_arts_communication_visuelle'
    const hasEduForPhoto =
      selected.has("des_12e_annee") ||
      selected.has("cs_photo_multimedia") ||
      selected.has("bacc_arts_communications") ||
      selected.has("bacc_arts_communication_visuelle");
    if (hasEduForPhoto && this.isAdmissibleOtherThanEducation("00137")) {
      const crit = this.manualCriteria.find((c) => c.id === "exp_photo_design");
      if (crit) criteria.push(crit);
    }

    // exp_permis_conduire needs ('des_12e_annee' && 'base_math_10_app') or 'cs_sec_incendie' for 00149, or 'cs_tech_policieres' for 00161, or bacc degrees for 00214
    const check149 =
      ((selected.has("des_12e_annee") && hasMath10App) ||
        selected.has("cs_sec_incendie")) &&
      this.isAdmissibleOtherThanEducation("00149");
    const isOutsideCanada = selected.has("etude_hors_canada");
    const hasUniversityDegree161 =
      selected.has("bacc_arts_criminologie") ||
      selected.has("bacc_arts_justice_criminelle") ||
      selected.has("bacc_arts_sci_policieres") ||
      selected.has("bacc_arts_sec_policieres") ||
      selected.has("bacc_arts_sec_publique") ||
      selected.has("bacc_arts_sociologie") ||
      selected.has("bacc_arts_psychologie") ||
      selected.has("bacc_arts_gestion_urgences") ||
      selected.has("bacc_arts_droit") ||
      selected.has("bacc_arts_etudes_judiciaires");
    const hasEducation161 =
      selected.has("cs_tech_policieres") ||
      (!isOutsideCanada && hasUniversityDegree161);
    const check161 =
      hasEducation161 &&
      this.isAdmissibleOtherThanEducation("00161");
    const hasEducation214 =
      selected.has("bacc_arts_justice_criminelle") ||
      selected.has("bacc_arts_criminologie") ||
      selected.has("bacc_arts_gestion_urgences") ||
      selected.has("bacc_arts_etudes_judiciaires") ||
      selected.has("bacc_arts_droit") ||
      selected.has("bacc_arts_sci_policieres") ||
      selected.has("bacc_arts_psychologie") ||
      selected.has("bacc_arts_sociologie") ||
      selected.has("bacc_arts_sec_publique") ||
      selected.has("bacc_arts_sec_policieres") ||
      selected.has("bacc_arts_admin_entreprise") ||
      selected.has("bacc_arts_etudes_militaires") ||
      selected.has("bacc_arts_etudes_internationales_cmr");
    const check214 =
      hasEducation214 && this.isAdmissibleOtherThanEducation("00214");

    if (check149 || check161 || check214) {
      const crit = this.manualCriteria.find(
        (c) => c.id === "exp_permis_conduire",
      );
      if (crit) criteria.push(crit);
    }

    // exp_scslm, exp_acorplm, exp_permis_reglementation, exp_lettre_conformite, exp_lab_6mois need 'cs_tech_lab_med'
    if (
      selected.has("cs_tech_lab_med") &&
      this.isAdmissibleOtherThanEducation("00152")
    ) {
      const hasScslm = selected.has("exp_scslm");
      const hasAcorplm = selected.has("exp_acorplm");
      if (hasScslm) {
        const crit = this.manualCriteria.find((c) => c.id === "exp_scslm");
        if (crit) criteria.push(crit);
      } else if (hasAcorplm) {
        const crit = this.manualCriteria.find((c) => c.id === "exp_acorplm");
        if (crit) criteria.push(crit);
      } else {
        const critScslm = this.manualCriteria.find((c) => c.id === "exp_scslm");
        const critAcorplm = this.manualCriteria.find(
          (c) => c.id === "exp_acorplm",
        );
        if (critScslm) criteria.push(critScslm);
        if (critAcorplm) criteria.push(critAcorplm);
      }

      const hasPermis = selected.has("exp_permis_reglementation");
      const hasLettre = selected.has("exp_lettre_conformite");
      if (hasPermis) {
        const crit = this.manualCriteria.find(
          (c) => c.id === "exp_permis_reglementation",
        );
        if (crit) criteria.push(crit);
      } else if (hasLettre) {
        const crit = this.manualCriteria.find(
          (c) => c.id === "exp_lettre_conformite",
        );
        if (crit) criteria.push(crit);
      } else {
        const critPermis = this.manualCriteria.find(
          (c) => c.id === "exp_permis_reglementation",
        );
        const critLettre = this.manualCriteria.find(
          (c) => c.id === "exp_lettre_conformite",
        );
        if (critPermis) criteria.push(critPermis);
        if (critLettre) criteria.push(critLettre);
      }

      const critLab6 = this.manualCriteria.find(
        (c) => c.id === "exp_lab_6mois",
      );
      if (critLab6) criteria.push(critLab6);
    }

    // exp_permis_rad, exp_association_actrm, exp_lettre_reglementation_en_regle need 'cs_tech_radio_med'
    if (
      selected.has("cs_tech_radio_med") &&
      this.isAdmissibleOtherThanEducation("00153")
    ) {
      const hasPermisRad = selected.has("exp_permis_rad");
      const hasAssociationActrm = selected.has("exp_association_actrm");
      if (hasPermisRad) {
        const crit = this.manualCriteria.find((c) => c.id === "exp_permis_rad");
        if (crit) criteria.push(crit);
      } else if (hasAssociationActrm) {
        const crit = this.manualCriteria.find(
          (c) => c.id === "exp_association_actrm",
        );
        if (crit) criteria.push(crit);
      } else {
        const critPermisRad = this.manualCriteria.find(
          (c) => c.id === "exp_permis_rad",
        );
        const critAssociationActrm = this.manualCriteria.find(
          (c) => c.id === "exp_association_actrm",
        );
        if (critPermisRad) criteria.push(critPermisRad);
        if (critAssociationActrm) criteria.push(critAssociationActrm);
      }

      const critLettreReg = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_reglementation_en_regle",
      );
      if (critLettreReg) criteria.push(critLettreReg);
    }

    // exp_tech_eb_6mois needs 'cs_tech_ing_biomed'
    if (
      selected.has("cs_tech_ing_biomed") &&
      this.isAdmissibleOtherThanEducation("00155")
    ) {
      const critTechEb6 = this.manualCriteria.find(
        (c) => c.id === "exp_tech_eb_6mois",
      );
      if (critTechEb6) criteria.push(critTechEb6);
    }

    // 00166 musician experience criteria
    if (this.isAdmissibleOtherThanEducation("00166")) {
      if (selected.has("cs_etude_musique")) {
        const critMusPro = this.manualCriteria.find(
          (c) => c.id === "exp_mus_pro",
        );
        if (critMusPro) criteria.push(critMusPro);
      } else if (this.hasCriterion(selected, "des_12e_annee")) {
        const hasEnsembles = selected.has("exp_mus_ensembles");
        const hasEtudiant = selected.has("exp_mus_etudiant");
        if (hasEnsembles) {
          const crit = this.manualCriteria.find(
            (c) => c.id === "exp_mus_ensembles",
          );
          if (crit) criteria.push(crit);
        } else if (hasEtudiant) {
          const crit = this.manualCriteria.find(
            (c) => c.id === "exp_mus_etudiant",
          );
          if (crit) criteria.push(crit);
        } else {
          const critEnsembles = this.manualCriteria.find(
            (c) => c.id === "exp_mus_ensembles",
          );
          const critEtudiant = this.manualCriteria.find(
            (c) => c.id === "exp_mus_etudiant",
          );
          if (critEnsembles) criteria.push(critEnsembles);
          if (critEtudiant) criteria.push(critEtudiant);
        }
      }
    }

    // 00164 cook experience criteria
    if (
      selected.has("cs_dep_cuisine") &&
      this.isAdmissibleOtherThanEducation("00164")
    ) {
      const critSceauRouge = this.manualCriteria.find(
        (c) => c.id === "exp_sceau_rouge_cuisine",
      );
      if (critSceauRouge) criteria.push(critSceauRouge);
    }

    // 00335 dental assistant experience criteria
    if (
      selected.has("cs_cert_assist_dentaire") &&
      this.isAdmissibleOtherThanEducation("00335")
    ) {
      const critPermisDentaire = this.manualCriteria.find(
        (c) => c.id === "exp_permis_assistant_dentaire",
      );
      const critLettreDentaire = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_dentaire_en_regle",
      );
      if (critPermisDentaire) criteria.push(critPermisDentaire);
      if (critLettreDentaire) criteria.push(critLettreDentaire);
    }

    // 00372 practical nurse experience criteria
    if (
      selected.has("cs_dep_sante_infirmiers") &&
      this.isAdmissibleOtherThanEducation("00372")
    ) {
      const critPermisInfirmier = this.manualCriteria.find(
        (c) => c.id === "exp_permis_infirmier_auxiliaire",
      );
      const critLettreReglementation = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_reglementation_en_regle",
      );
      const critCertPeroperatoire = this.manualCriteria.find(
        (c) => c.id === "exp_cert_peroperatoire",
      );
      if (critPermisInfirmier) criteria.push(critPermisInfirmier);
      if (critLettreReglementation) criteria.push(critLettreReglementation);
      if (critCertPeroperatoire) criteria.push(critCertPeroperatoire);
    }

    // 00406 paramedic experience criteria
    if (
      selected.has("cs_cert_soins_param") &&
      this.isAdmissibleOtherThanEducation("00406")
    ) {
      const critPermisParamed = this.manualCriteria.find(
        (c) => c.id === "exp_permis_paramedical",
      );
      if (critPermisParamed) criteria.push(critPermisParamed);
    }

    // 00189 experience criteria
    const has00189Base =
      selected.has("bacc_sci_environnementales") ||
      selected.has("bacc_sci_geologie") ||
      selected.has("bacc_sci_technologie_surete_protection_incendie") ||
      selected.has("bacc_sci_geomatique") ||
      selected.has("bacc_sci_arpentage") ||
      selected.has("bacc_genie_chimie_chimique") ||
      selected.has("bacc_genie_gestion") ||
      selected.has("bacc_genie_ingenierie_gestion") ||
      selected.has("bacc_genie_geologie");
    if (has00189Base && this.isAdmissibleOtherThanEducation("00189")) {
      const crit00189 = this.manualCriteria.find((c) => c.id === "exp_00189");
      if (crit00189) criteria.push(crit00189);
    }

    // 00190 experience criteria
    if (
      (selected.has("bacc_sante_physiotherapie") ||
        selected.has("maitrise_sante_physiotherapie")) &&
      this.isAdmissibleOtherThanEducation("00190")
    ) {
      const critPermisPhysio = this.manualCriteria.find(
        (c) => c.id === "exp_permis_physiotherapie",
      );
      const critLettrePhysio = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_physiotherapie_regle",
      );
      if (critPermisPhysio) criteria.push(critPermisPhysio);
      if (critLettrePhysio) criteria.push(critLettrePhysio);
    }

    // 00191 experience criteria
    if (
      selected.has("bacc_sante_medecine_dentaire") &&
      this.isAdmissibleOtherThanEducation("00191")
    ) {
      const critBned = this.manualCriteria.find(
        (c) => c.id === "exp_cert_bned",
      );
      const critPermisDentaire = this.manualCriteria.find(
        (c) => c.id === "exp_permis_medecine_dentaire",
      );
      const critLettreDentiste = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_dentiste_regle",
      );
      const critCvDentiste = this.manualCriteria.find(
        (c) => c.id === "exp_cv_dentiste_5ans",
      );
      if (critBned) criteria.push(critBned);
      if (critPermisDentaire) criteria.push(critPermisDentaire);
      if (critLettreDentiste) criteria.push(critLettreDentiste);
      if (critCvDentiste) criteria.push(critCvDentiste);
    }

    // 00194 experience criteria
    if (
      (selected.has("bacc_sante_pharmacie") ||
        selected.has("doctorat_sante_pharmacie")) &&
      this.isAdmissibleOtherThanEducation("00194")
    ) {
      const critPermisPharmacie = this.manualCriteria.find(
        (c) => c.id === "exp_permis_pharmacie",
      );
      const critLettrePharmacie = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_pharmacie_regle",
      );
      if (critPermisPharmacie) criteria.push(critPermisPharmacie);
      if (critLettrePharmacie) criteria.push(critLettrePharmacie);
    }

    // 00195 experience criteria
    if (
      (selected.has("bacc_sante_sciences_soins_infirmiers") ||
        selected.has("bacc_sante_sciences_infirmieres")) &&
      this.isAdmissibleOtherThanEducation("00195")
    ) {
      const critPermisInfirmiers = this.manualCriteria.find(
        (c) => c.id === "exp_permis_soins_infirmiers",
      );
      if (critPermisInfirmiers) criteria.push(critPermisInfirmiers);
    }

    // 00198 experience criteria
    if (
      selected.has("maitrise_sante_service_social") &&
      this.isAdmissibleOtherThanEducation("00198")
    ) {
      const critPermisSocial = this.manualCriteria.find(
        (c) => c.id === "exp_permis_travail_social",
      );
      const critLettreSocial = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_travail_social_regle",
      );
      if (critPermisSocial) criteria.push(critPermisSocial);
      if (critLettreSocial) criteria.push(critLettreSocial);
    }

    // 00203 experience criteria
    if (
      (selected.has("bacc_arts_communications") ||
        selected.has("bacc_arts_relations_intern") ||
        selected.has("bacc_arts_journalisme") ||
        selected.has("bacc_arts_relations_publiques") ||
        selected.has("bacc_arts_anglais_francais") ||
        selected.has("bacc_arts_science_politique") ||
        selected.has("bacc_arts_commercialisation") ||
        selected.has("bacc_arts_medias_numeriques") ||
        selected.has("bacc_arts_etudes_militaires") ||
        selected.has("bacc_arts_anthropologie") ||
        selected.has("bacc_arts_psychologie") ||
        selected.has("bacc_arts_philosophie") ||
        selected.has("bacc_arts_sociologie") ||
        selected.has("bacc_arts_linguistique") ||
        selected.has("maitrise_arts_communications") ||
        selected.has("maitrise_arts_relations_internationales") ||
        selected.has("maitrise_arts_journalisme") ||
        selected.has("maitrise_arts_relations_publiques") ||
        selected.has("maitrise_arts_anglais_francais") ||
        selected.has("maitrise_arts_science_politique") ||
        selected.has("maitrise_arts_commercialisation") ||
        selected.has("maitrise_arts_medias_numeriques") ||
        selected.has("maitrise_arts_etudes_militaires") ||
        selected.has("maitrise_arts_anthropologie") ||
        selected.has("maitrise_arts_psychologie") ||
        selected.has("maitrise_arts_philosophie") ||
        selected.has("maitrise_arts_sociologie") ||
        selected.has("maitrise_arts_linguistique")) &&
      this.isAdmissibleOtherThanEducation("00203")
    ) {
      const crit00203 = this.manualCriteria.find((c) => c.id === "exp_00203");
      if (crit00203) criteria.push(crit00203);
    }

    // 00204 experience criteria
    if (
      selected.has("bacc_arts_droit") &&
      this.isAdmissibleOtherThanEducation("00204")
    ) {
      const critPermisDroit = this.manualCriteria.find(
        (c) => c.id === "exp_permis_droit",
      );
      const critLettreBarreau = this.manualCriteria.find(
        (c) => c.id === "exp_lettre_barreau_regle",
      );
      if (critPermisDroit) criteria.push(critPermisDroit);
      if (critLettreBarreau) criteria.push(critLettreBarreau);
    }

    // 00208 experience criteria (only for baccalaureate degrees)
    if (
      (selected.has("bacc_arts_psychologie") ||
        selected.has("bacc_arts_sociologie")) &&
      this.isAdmissibleOtherThanEducation("00208")
    ) {
      const crit00208 = this.manualCriteria.find(
        (c) => c.id === "exp_00208_bacc",
      );
      if (crit00208) criteria.push(crit00208);
    }

    // 00211 experience criteria (only for master's degree)
    if (
      selected.has("maitrise_arts_education") &&
      this.isAdmissibleOtherThanEducation("00211")
    ) {
      const crit00211 = this.manualCriteria.find(
        (c) => c.id === "exp_00211_maitrise",
      );
      if (crit00211) criteria.push(crit00211);
    }

    // 00349 experience criteria
    if (
      (selected.has("bacc_arts_theologie") ||
        selected.has("maitrise_theologie")) &&
      this.isAdmissibleOtherThanEducation("00349")
    ) {
      const critLeader = this.manualCriteria.find(
        (c) => c.id === "exp_00349_leader_foi",
      );
      const critEndosse = this.manualCriteria.find(
        (c) => c.id === "exp_00349_endosse_ciamc",
      );
      const critEntrevue = this.manualCriteria.find(
        (c) => c.id === "exp_00349_entrevue_aum",
      );
      if (critLeader) criteria.push(critLeader);
      if (critEndosse) criteria.push(critEndosse);
      if (critEntrevue) criteria.push(critEntrevue);
    }

    // 00374 experience criteria
    if (
      (selected.has("bacc_sante_adjoint_medecin") ||
        selected.has("maitrise_adjoint_medecin") ||
        selected.has("doctorat_adjoint_medecin")) &&
      this.isAdmissibleOtherThanEducation("00374")
    ) {
      const critCertPermis = this.manualCriteria.find(
        (c) => c.id === "exp_00374_cert_permis",
      );
      const critLettreRegle = this.manualCriteria.find(
        (c) => c.id === "exp_00374_lettre_regle",
      );
      if (critCertPermis) criteria.push(critCertPermis);
      if (critLettreRegle) criteria.push(critLettreRegle);
    }

    // 00390 experience criteria
    if (selected.has("doctorat_medecine")) {
      if (this.isAdmissibleOtherThanEducation("00390")) {
        const critResidence = this.manualCriteria.find(
          (c) => c.id === "exp_00390_residence",
        );
        const critCert = this.manualCriteria.find(
          (c) => c.id === "exp_00390_certification",
        );
        const critPermis = this.manualCriteria.find(
          (c) => c.id === "exp_00390_permis",
        );
        const critAtte = this.manualCriteria.find(
          (c) => c.id === "exp_00390_attestation",
        );
        const critCivil = this.manualCriteria.find(
          (c) => c.id === "exp_00390_civil",
        );
        if (critResidence) criteria.push(critResidence);
        if (critCert) criteria.push(critCert);
        if (critPermis) criteria.push(critPermis);
        if (critAtte) criteria.push(critAtte);
        if (critCivil) criteria.push(critCivil);
      }

      // 00393 experience criteria (Médecin de famille)
      if (this.isAdmissibleOtherThanEducation("00393")) {
        const critAuto393 = this.manualCriteria.find(
          (c) => c.id === "exp_00393_autorisation",
        );
        const critLettre393 = this.manualCriteria.find(
          (c) => c.id === "exp_00393_lettre_regle",
        );
        const critCert393 = this.manualCriteria.find(
          (c) => c.id === "exp_00393_certification",
        );
        if (critAuto393) criteria.push(critAuto393);
        if (critLettre393) criteria.push(critLettre393);
        if (critCert393) criteria.push(critCert393);
      }
    }

    // 00398 experience criteria
    const baccSanteSaufPlusHaut = [
      "bacc_sante_adjoint_medecin",
      "bacc_sante_biochimie",
      "bacc_sante_biologie",
      "bacc_sante_biologie_humaine",
      "bacc_sante_diplome_sciences_vie",
      "bacc_sante_genie_biomedical",
      "bacc_sante_kinesiologie",
      "bacc_sante_medecine_dentaire",
      "bacc_sante_microbiologie",
      "bacc_sante_pharmacie",
      "bacc_sante_physiologie_humaine",
      "bacc_sante_physiotherapie",
      "bacc_sante_sciences_soins_infirmiers",
      "bacc_sante_sciences_infirmieres",
    ].some((id) => selected.has(id));

    const dEsSanteSaufPlusHaut = [
      "doctorat_adjoint_medecin",
      "maitrise_adjoint_medecin",
      "doctorat_medecine",
      "doctorat_sante_pharmacie",
      "maitrise_sante_admin_sante",
      "maitrise_sante_biochimie",
      "maitrise_sante_biologie",
      "maitrise_sante_biologie_humaine",
      "maitrise_sante_diplome_sciences_vie",
      "maitrise_sante_genie_biomedical",
      "maitrise_sante_gestion_soins_sante",
      "maitrise_sante_integration_systemes_humains",
      "maitrise_sante_kinesiologie",
      "maitrise_sante_physiotherapie",
      "maitrise_sante_microbiologie",
      "maitrise_sante_physiologie_humaine",
      "maitrise_sante_environnementale_professionnelle",
      "maitrise_sante_publique",
    ].some((id) => selected.has(id));

    if (
      (baccSanteSaufPlusHaut || dEsSanteSaufPlusHaut) &&
      this.isAdmissibleOtherThanEducation("00398")
    ) {
      const critGSS = this.manualCriteria.find(
        (c) => c.id === "exp_00398_gestion",
      );
      if (critGSS) criteria.push(critGSS);
    }

    // Check CV requirement for specific jobs (00152, 00155, 00335, 00372, 00378, 00406, 00190, 00194, 00195, 00198, 00204, 00374, 00153, 00191, 00349, 00390, 00398)
    const cvJobsEduEligible =
      (selected.has("cs_tech_lab_med") && this.isAdmissibleOtherThanEducation("00152")) ||
      (selected.has("cs_tech_radio_med") && this.isAdmissibleOtherThanEducation("00153")) ||
      (selected.has("cs_tech_ing_biomed") && this.isAdmissibleOtherThanEducation("00155")) ||
      ((selected.has("bacc_sante_physiotherapie") || selected.has("maitrise_sante_physiotherapie")) && this.isAdmissibleOtherThanEducation("00190")) ||
      (selected.has("bacc_sante_medecine_dentaire") && this.isAdmissibleOtherThanEducation("00191")) ||
      ((selected.has("bacc_sante_pharmacie") || selected.has("doctorat_sante_pharmacie")) && this.isAdmissibleOtherThanEducation("00194")) ||
      ((selected.has("bacc_sante_sciences_soins_infirmiers") || selected.has("bacc_sante_sciences_infirmieres")) && this.isAdmissibleOtherThanEducation("00195")) ||
      (selected.has("maitrise_sante_service_social") && this.isAdmissibleOtherThanEducation("00198")) ||
      (selected.has("bacc_arts_droit") && this.isAdmissibleOtherThanEducation("00204")) ||
      (selected.has("cs_cert_assist_dentaire") && this.isAdmissibleOtherThanEducation("00335")) ||
      ((selected.has("bacc_arts_theologie") || selected.has("maitrise_theologie")) && this.isAdmissibleOtherThanEducation("00349")) ||
      (selected.has("cs_dep_sante_infirmiers") && this.isAdmissibleOtherThanEducation("00372")) ||
      ((selected.has("bacc_sante_adjoint_medecin") || selected.has("maitrise_adjoint_medecin") || selected.has("doctorat_adjoint_medecin")) && this.isAdmissibleOtherThanEducation("00374")) ||
      (((selected.has("des_12e_annee") && selected.has("base_math_11_adv")) || (selected.has("des_12e_annee") && selected.has("info_sec5_12e")) || selected.has("cs_dip_cyber")) && this.isAdmissibleOtherThanEducation("00378")) ||
      (selected.has("doctorat_medecine") && this.isAdmissibleOtherThanEducation("00390")) ||
      ((baccSanteSaufPlusHaut || dEsSanteSaufPlusHaut) && this.isAdmissibleOtherThanEducation("00398")) ||
      (selected.has("cs_cert_soins_param") && this.isAdmissibleOtherThanEducation("00406"));

    if (cvJobsEduEligible) {
      const critCv = this.manualCriteria.find((c) => c.id === "exp_cv_recent");
      if (critCv && !criteria.some((c) => c.id === "exp_cv_recent")) {
        criteria.push(critCv);
      }
    }

    return criteria;
  });
  criteriaExperienceSecondaire = computed(() =>
    this.manualCriteria.filter(
      (c) => c.category === "Expérience" && c.subCategory === "secondaire",
    ),
  );
  criteriaExperienceSpecialises = computed(() =>
    this.manualCriteria.filter(
      (c) => c.category === "Expérience" && c.subCategory === "specialises",
    ),
  );
  criteriaExperienceUniversitaire = computed(() =>
    this.manualCriteria.filter(
      (c) => c.category === "Expérience" && c.subCategory === "universitaire",
    ),
  );

  expandedDomaines = signal<Set<string>>(new Set<string>());

  isPforApplicant = signal<boolean>(false);
  pforType = signal<"cmr" | "civil">("cmr");
  cmrArts = signal<boolean>(false);
  cmrScience = signal<boolean>(false);
  cmrGenie = signal<boolean>(false);

  togglePforApplicant() {
    this.isPforApplicant.update((v) => !v);
    this.sharedState.isPostulantPfor.set(this.isPforApplicant());
  }

  toggleDomaine(domaine: string) {
    const current = new Set(this.expandedDomaines());
    if (current.has(domaine)) {
      current.delete(domaine);
    } else {
      current.add(domaine);
    }
    this.expandedDomaines.set(current);
  }

  resetAllLocal() {
    this.age.set(null);
    this.citizenship.set("Canadian Citizen");
    this.selectedProvince.set("QC");
    this.hasMedicalLimitation.set(false);
    this.isPforApplicant.set(false);
    this.sharedState.isPostulantPfor.set(false);
    this.pforType.set("cmr");
    this.cmrArts.set(false);
    this.cmrScience.set(false);
    this.cmrGenie.set(false);
    this.medicalV.set("");
    this.medicalCV.set("");
    this.medicalH.set("");
    this.medicalG.set("");
    this.medicalO.set("");
    this.medicalA.set("");
    this.medicalU.set("");
    this.selectedCriteriaIds.set(new Set<string>());
    this.activeScolariteTab.set("secondaire");
    this.expandedDomaines.set(new Set<string>());
    this.selectedDossierJobId1.set("");
    this.selectedDossierJobId2.set("");
    this.selectedDossierJobId3.set("");
    this.searchDossierQuery1.set("");
    this.searchDossierQuery2.set("");
    this.searchDossierQuery3.set("");
    this.dropdownOpen1.set(false);
    this.dropdownOpen2.set(false);
    this.dropdownOpen3.set(false);
    this.showOptionsDropdown.set(false);
    this.ignoreSip.set(false);
    this.includeTraitement.set(false);
    this.testEcePassed.set(false);
    this.testEsomPassed.set(false);
    this.testCeopmPassed.set(false);
    this.testCspnPassed.set(false);
    this.testCspnNotCompleted.set(false);
    this.testCspn00182Passed.set(false);
    this.testCspn00183Passed.set(false);
    this.testCspn00184Passed.set(false);
    this.melService.resetApplicantLimitations();
    this.reorientationCriteria.resetAll();
    this.sharedState.resetSharedRecruiterState();
  }

  resetAll() {
    this.resetAllLocal();
    this.sharedState.triggerRecruiterReset();
  }

  toggleManualCriterion(id: string) {
    const current = new Set(this.selectedCriteriaIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);

      // Auto-checking logic
      if (id === "cs_autre_dep") {
        current.add("sec4_24_credits");
      }

      if (id === "chimie_sec5_11e" || id === "physique_sec5_11e") {
        current.add("sci_tech4_sci10");
      }

      if (id.startsWith("cs_")) {
        const crit = this.manualCriteria.find((c) => c.id === id);
        if (
          crit &&
          (crit.label.includes("DEP") ||
            crit.label.includes("DEC") ||
            crit.label.includes("diplôme") ||
            crit.label.includes("Diplôme"))
        ) {
          current.add("sec4_24_credits");
        }
      }

      if (
        id.startsWith("bacc_") ||
        id.startsWith("maitrise_") ||
        id.startsWith("doctorat_") ||
        id.startsWith("univ_")
      ) {
        current.add("sec4_24_credits");
      }

      if (id === "des_12e_annee") {
        current.add("sec4_24_credits");
        current.add("francais_sec4_10e");
        current.add("francais_sec5_11e");
        current.add("qc_10_gen"); // Math CST IV
        current.add("sci_tech4_sci10");
      }

      if (id === "qc_10_app") {
        current.add("qc_10_gen");
      }

      if (id === "qc_10_adv") {
        current.add("qc_10_app");
        current.add("qc_10_gen");
      }

      if (id === "qc_11_gen") {
        current.add("qc_10_gen");
      }

      if (id === "qc_11_app" || id === "qc_11_adv" || id === "qc_12_cegep201") {
        current.add("qc_10_gen");
        current.add("qc_10_app");
        current.add("qc_10_adv");
        current.add("qc_11_gen");
        current.add("qc_11_app");
        current.add("qc_11_adv");
      }

      if (id === "anglais_sec5_12e") {
        current.add("francais_sec5_11e");
        current.add("francais_sec4_10e");
      }

      if (id === "francais_sec5_11e") {
        current.add("francais_sec4_10e");
      }

      // Mutual exclusions for job 00152
      if (id === "exp_scslm") {
        current.delete("exp_acorplm");
      } else if (id === "exp_acorplm") {
        current.delete("exp_scslm");
      } else if (id === "exp_permis_reglementation") {
        current.delete("exp_lettre_conformite");
      } else if (id === "exp_lettre_conformite") {
        current.delete("exp_permis_reglementation");
      }

      // Mutual exclusions for job 00153
      if (id === "exp_permis_rad") {
        current.delete("exp_association_actrm");
      } else if (id === "exp_association_actrm") {
        current.delete("exp_permis_rad");
      }

      // Mutual exclusions for job 00166
      if (id === "exp_mus_ensembles") {
        current.delete("exp_mus_etudiant");
      } else if (id === "exp_mus_etudiant") {
        current.delete("exp_mus_ensembles");
      }

      // Auto-check logic for university cycles
      if (id.startsWith("bacc_")) {
        current.add("univ_1er_cycle_global");
        const crit = this.manualCriteria.find((c) => c.id === id);
        if (crit && crit.subCategory) {
          if (crit.subCategory === "Génie") current.add("univ_1er_cycle_genie");
          if (crit.subCategory === "Arts") current.add("univ_1er_cycle_arts");
          if (crit.subCategory === "Sciences")
            current.add("univ_1er_cycle_sciences");
          if (crit.subCategory === "Santé") current.add("univ_1er_cycle_sante");
        }
      }

      if (id.startsWith("maitrise_") || id.startsWith("doctorat_")) {
        current.add("univ_cycle_sup_global");
        const crit = this.manualCriteria.find((c) => c.id === id);
        if (crit && crit.subCategory) {
          if (crit.subCategory === "Maîtrise")
            current.add("univ_cycle_sup_maitrise");
          if (crit.subCategory === "Doctorat")
            current.add("univ_cycle_sup_doctorat");
        }
      }

      if (
        id === "univ_1er_cycle_genie" ||
        id === "univ_1er_cycle_arts" ||
        id === "univ_1er_cycle_sciences" ||
        id === "univ_1er_cycle_sante"
      ) {
        current.add("univ_1er_cycle_global");
      }

      if (
        id === "univ_cycle_sup_maitrise" ||
        id === "univ_cycle_sup_doctorat"
      ) {
        current.add("univ_cycle_sup_global");
      }
    }

    // Auto-cleanup orphaned experience choices
    const hasEduForPhoto =
      current.has("des_12e_annee") ||
      current.has("cs_photo_multimedia") ||
      current.has("bacc_arts_communications") ||
      current.has("bacc_arts_communication_visuelle");
    if (!hasEduForPhoto) {
      current.delete("exp_photo_design");
    }

    const allMathOptions = Object.values(this.MATH_COURSES).reduce(
      (
        acc: { id: string; label: string; grade: number; diff: number }[],
        courses,
      ) => acc.concat(courses),
      [],
    );
    const selectedMaths = allMathOptions.filter((m) => current.has(m.id));
    const hasMath = (grade: number, diff: number) => {
      return selectedMaths.some((m) => m.grade >= grade && m.diff >= diff);
    };
    const hasMath10App = hasMath(10, 2);

    const hasEduForConduire =
      (current.has("des_12e_annee") && hasMath10App) ||
      current.has("cs_sec_incendie") ||
      current.has("cs_tech_policieres") ||
      current.has("bacc_arts_justice_criminelle") ||
      current.has("bacc_arts_criminologie") ||
      current.has("bacc_arts_gestion_urgences") ||
      current.has("bacc_arts_etudes_judiciaires") ||
      current.has("bacc_arts_droit") ||
      current.has("bacc_arts_sci_policieres") ||
      current.has("bacc_arts_psychologie") ||
      current.has("bacc_arts_sociologie") ||
      current.has("bacc_arts_sec_publique") ||
      current.has("bacc_arts_sec_policieres") ||
      current.has("bacc_arts_admin_entreprise") ||
      current.has("bacc_arts_etudes_militaires") ||
      current.has("bacc_arts_etudes_internationales_cmr");
    if (!hasEduForConduire) {
      current.delete("exp_permis_conduire");
    }

    // Auto-cleanup for 00152 medical lab technologist
    if (!current.has("cs_tech_lab_med")) {
      current.delete("exp_scslm");
      current.delete("exp_acorplm");
      current.delete("exp_permis_reglementation");
      current.delete("exp_lettre_conformite");
      current.delete("exp_lab_6mois");
    }

    // Auto-cleanup for 00153 medical radiation technologist
    if (!current.has("cs_tech_radio_med")) {
      current.delete("exp_permis_rad");
      current.delete("exp_association_actrm");
    }
    if (
      !current.has("cs_tech_radio_med") &&
      !current.has("cs_dep_sante_infirmiers")
    ) {
      current.delete("exp_lettre_reglementation_en_regle");
    }

    // Auto-cleanup for 00155 biomedical electronics technologist
    if (!current.has("cs_tech_ing_biomed")) {
      current.delete("exp_tech_eb_6mois");
    }

    // Auto-cleanup for 00166 musician
    if ((!current.has("des_12e_annee") && !current.has("aens")) || current.has("cs_etude_musique")) {
      current.delete("exp_mus_ensembles");
      current.delete("exp_mus_etudiant");
    }
    if (!current.has("cs_etude_musique")) {
      current.delete("exp_mus_pro");
    }

    // Auto-cleanup for 00164 cook
    if (!current.has("cs_dep_cuisine")) {
      current.delete("exp_sceau_rouge_cuisine");
    }

    // Auto-cleanup for 00335 dental assistant
    if (!current.has("cs_cert_assist_dentaire")) {
      current.delete("exp_permis_assistant_dentaire");
      current.delete("exp_lettre_dentaire_en_regle");
    }

    // Auto-cleanup for 00372 practical nurse
    if (!current.has("cs_dep_sante_infirmiers")) {
      current.delete("exp_permis_infirmier_auxiliaire");
      current.delete("exp_cert_peroperatoire");
    }

    // Auto-cleanup for 00406 paramedical
    if (!current.has("cs_cert_soins_param")) {
      current.delete("exp_permis_paramedical");
    }

    // Auto-cleanup for 00189
    const has00189Base =
      current.has("bacc_sci_environnementales") ||
      current.has("bacc_sci_geologie") ||
      current.has("bacc_sci_technologie_surete_protection_incendie") ||
      current.has("bacc_sci_geomatique") ||
      current.has("bacc_sci_arpentage") ||
      current.has("bacc_genie_chimie_chimique") ||
      current.has("bacc_genie_gestion") ||
      current.has("bacc_genie_ingenierie_gestion") ||
      current.has("bacc_genie_geologie");
    if (!has00189Base) {
      current.delete("exp_00189");
    }

    // Auto-cleanup for 00190
    if (
      !current.has("bacc_sante_physiotherapie") &&
      !current.has("maitrise_sante_physiotherapie")
    ) {
      current.delete("exp_permis_physiotherapie");
      current.delete("exp_lettre_physiotherapie_regle");
    }

    // Auto-cleanup for 00191
    if (!current.has("bacc_sante_medecine_dentaire")) {
      current.delete("exp_cert_bned");
      current.delete("exp_permis_medecine_dentaire");
      current.delete("exp_lettre_dentiste_regle");
      current.delete("exp_cv_dentiste_5ans");
    }

    // Auto-cleanup for 00194
    if (
      !current.has("bacc_sante_pharmacie") &&
      !current.has("doctorat_sante_pharmacie")
    ) {
      current.delete("exp_permis_pharmacie");
      current.delete("exp_lettre_pharmacie_regle");
    }

    // Auto-cleanup for 00195
    if (
      !current.has("bacc_sante_sciences_soins_infirmiers") &&
      !current.has("bacc_sante_sciences_infirmieres")
    ) {
      current.delete("exp_permis_soins_infirmiers");
    }

    // Auto-cleanup for 00198
    if (!current.has("maitrise_sante_service_social")) {
      current.delete("exp_permis_travail_social");
      current.delete("exp_lettre_travail_social_regle");
    }

    // Auto-cleanup for 00203
    const has00203Base =
      current.has("bacc_arts_communications") ||
      current.has("bacc_arts_relations_intern") ||
      current.has("bacc_arts_journalisme") ||
      current.has("bacc_arts_relations_publiques") ||
      current.has("bacc_arts_anglais_francais") ||
      current.has("bacc_arts_science_politique") ||
      current.has("bacc_arts_commercialisation") ||
      current.has("bacc_arts_medias_numeriques") ||
      current.has("bacc_arts_etudes_militaires") ||
      current.has("bacc_arts_anthropologie") ||
      current.has("bacc_arts_psychologie") ||
      current.has("bacc_arts_philosophie") ||
      current.has("bacc_arts_sociologie") ||
      current.has("bacc_arts_linguistique") ||
      current.has("maitrise_arts_communications") ||
      current.has("maitrise_arts_relations_internationales") ||
      current.has("maitrise_arts_journalisme") ||
      current.has("maitrise_arts_relations_publiques") ||
      current.has("maitrise_arts_anglais_francais") ||
      current.has("maitrise_arts_science_politique") ||
      current.has("maitrise_arts_commercialisation") ||
      current.has("maitrise_arts_medias_numeriques") ||
      current.has("maitrise_arts_etudes_militaires") ||
      current.has("maitrise_arts_anthropologie") ||
      current.has("maitrise_arts_psychologie") ||
      current.has("maitrise_arts_philosophie") ||
      current.has("maitrise_arts_sociologie") ||
      current.has("maitrise_arts_linguistique");
    if (!has00203Base) {
      current.delete("exp_00203");
    }

    // Auto-cleanup for 00204
    if (!current.has("bacc_arts_droit")) {
      current.delete("exp_permis_droit");
      current.delete("exp_lettre_barreau_regle");
    }

    // Auto-cleanup for 00208
    if (
      !current.has("bacc_arts_psychologie") &&
      !current.has("bacc_arts_sociologie")
    ) {
      current.delete("exp_00208_bacc");
    }

    // Auto-cleanup for 00211
    if (!current.has("maitrise_arts_education")) {
      current.delete("exp_00211_maitrise");
    }

    this.selectedCriteriaIds.set(current);
  }

  isCandidateTooOld = computed(() => {
    const ageVal = this.age();
    if (ageVal === null || ageVal <= 0) return false;
    if (ageVal >= 57) return true;

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

    if (this.isPforApplicant()) {
      if (this.pforType() === "cmr") {
        const hasCmrDomain =
          this.cmrArts() || this.cmrScience() || this.cmrGenie();
        return hasCmrDomain || this.eligibleJobs().length > 0;
      } else {
        return true;
      }
    }
    return true;
  });

  hasCriterion(selected: Set<string>, id: string): boolean {
    if (id === "des_12e_annee") {
      return selected.has("des_12e_annee") || selected.has("aens");
    }
    if (id === "sec4_24_credits") {
      return selected.has("sec4_24_credits") || selected.has("des_12e_annee") || selected.has("aens");
    }
    return selected.has(id);
  }

  eligibleJobs = computed(() => {
    const citizenship = this.citizenship();
    const ageVal = this.age();

    if (this.isPforApplicant()) {
      if (citizenship === "PR < 3 years") return [];

      const candidateJobIds: string[] = [];
      if (this.pforType() === "cmr") {
        const arts = this.cmrArts();
        const science = this.cmrScience();
        const genie = this.cmrGenie();
        const hasDossierJob = !!(
          this.selectedDossierJobId1() ||
          this.selectedDossierJobId2() ||
          this.selectedDossierJobId3()
        );
        if ((!arts && !science && !genie) || !hasDossierJob) return [];

        for (const [jId, cmrInfo] of Object.entries(CMR_JOB_DOMAINS)) {
          const match =
            (arts && cmrInfo.arts) ||
            (science && cmrInfo.science) ||
            (genie && cmrInfo.genie);
          if (match) {
            candidateJobIds.push(jId);
          }
        }
      } else {
        for (const j of this.jobService.getAllJobs()) {
          if (this.jobService.hasPforProgram(j.id, this.currentSipPhase())) {
            candidateJobIds.push(j.id);
          }
        }
      }

      const result = new Set<string>();
      for (const jId of candidateJobIds) {
        if (!this.jobService.hasPforProgram(jId, this.currentSipPhase())) continue;
        if (!this.isJobMedicalAdmissible(jId)) continue;
        if (!this.isJobExtraTestAdmissible(jId)) continue;
        if (citizenship === "PR > 3 years" && !this.jobService.isJobRp(jId))
          continue;
        if (!this.ignoreSip() && this.jobService.isPforJobClosed(jId, this.currentSipPhase()))
          continue;

        if (ageVal !== null && ageVal > 0) {
          if (ageVal >= 57) continue;
          const job = this.jobService.getAllJobs().find((j) => j.id === jId);
          if (job) {
            const firstContract =
              job.contracts && job.contracts.length > 0
                ? job.contracts[0]
                : null;
            const durationYears = firstContract
              ? firstContract.duration.match(/(\d+)\s*an/)
                ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
                : 3
              : 3;
            if (ageVal + durationYears >= 60) continue;
          }
        }

        result.add(jId);
      }

      return Array.from(result).sort((a, b) => a.localeCompare(b));
    }

    const rawSelected = this.selectedCriteriaIds();
    if (rawSelected.size === 0) return [];

    // Process implications
    const selected = new Set(rawSelected);

    // Evaluate if user meets base math conditions based on selected province math courses.
    const allMathOptions = Object.values(this.MATH_COURSES).reduce(
      (acc, courses) => acc.concat(courses),
      [],
    );
    const selectedMaths = allMathOptions.filter((m) => selected.has(m.id));

    // To meet a grade + difficulty, you need ANY course with AT LEAST that grade, AND AT LEAST that diff.
    const hasMath = (grade: number, diff: number) => {
      return selectedMaths.some((m) => m.grade >= grade && m.diff >= diff);
    };

    if (hasMath(10, 1)) selected.add("base_math_10_gen");
    if (hasMath(10, 2)) selected.add("base_math_10_app");
    if (hasMath(10, 3)) selected.add("base_math_10_adv");
    if (hasMath(11, 1)) selected.add("base_math_11_gen");
    if (hasMath(11, 2)) selected.add("base_math_11_app");
    if (hasMath(11, 3)) selected.add("base_math_11_adv");
    if (hasMath(12, 1)) selected.add("base_math_12_gen");
    if (hasMath(12, 2)) selected.add("base_math_12_app");
    if (hasMath(12, 3)) selected.add("base_math_12_adv");

    // If PR < 3 years, they are not admissible to the Canadian Armed Forces at all.
    if (citizenship === "PR < 3 years") {
      return [];
    }

    const jobs = new Set<string>();
    const coursSpecialisesIds = this.criteriaCoursSpecialise().map((c) => c.id);

    for (const rule of this.jobRules) {
      let meetsRule = false;
      if (rule.customCheck) {
        const checkResult = rule.customCheck(selected, coursSpecialisesIds);
        meetsRule = typeof checkResult === "boolean" ? checkResult : checkResult.passed;
      } else if (
        rule.requiredCriteriaIds &&
        rule.requiredCriteriaIds.length > 0
      ) {
        meetsRule = rule.requiredCriteriaIds.every((id) => this.hasCriterion(selected, id));
      }

      if (meetsRule) {
        for (const jId of rule.jobs) {
          // Check medical limitation
          if (!this.isJobMedicalAdmissible(jId)) {
            continue;
          }

          // Check extra test eligibility
          if (!this.isJobExtraTestAdmissible(jId)) {
            continue;
          }

          // Under PR > 3 years, only RP-eligible jobs are permitted.
          if (citizenship === "PR > 3 years" && !this.jobService.isJobRp(jId)) {
            continue;
          }

          // Exclude closed (SIP) jobs
          if (!this.ignoreSip() && this.jobService.isJobClosed(jId, this.currentSipPhase())) {
            continue;
          }

          // Age qualification logic:
          // Maximum enrollment age is 56 (57+ automatically ineligible).
          // Contract duration formula: Admissible = 59 - duration or less (Inadmissible = 60 - duration or more).
          if (ageVal !== null && ageVal > 0) {
            if (ageVal >= 57) {
              continue;
            }
            const job = this.jobService.getAllJobs().find((j) => j.id === jId);
            if (job) {
              const firstContract =
                job.contracts && job.contracts.length > 0
                  ? job.contracts[0]
                  : null;
              const durationYears = firstContract
                ? firstContract.duration.match(/(\d+)\s*an/)
                  ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
                  : 3
                : 3;
              if (ageVal + durationYears >= 60) {
                continue;
              }
            } else {
              if (ageVal + 3 >= 60) {
                continue;
              }
            }
          }

          jobs.add(jId);
        }
      }
    }

    return Array.from(jobs).sort((a, b) => a.localeCompare(b));
  });

  jobsExcludedByAge = computed(() => {
    const citizenship = this.citizenship();
    const ageVal = this.age();
    if (ageVal === null || ageVal <= 0) return [];

    if (this.isPforApplicant()) {
      if (citizenship === "PR < 3 years") return [];

      const candidateJobIds: string[] = [];
      if (this.pforType() === "cmr") {
        const arts = this.cmrArts();
        const science = this.cmrScience();
        const genie = this.cmrGenie();
        const hasDossierJob = !!(
          this.selectedDossierJobId1() ||
          this.selectedDossierJobId2() ||
          this.selectedDossierJobId3()
        );
        if ((!arts && !science && !genie) || !hasDossierJob) return [];

        for (const [jId, cmrInfo] of Object.entries(CMR_JOB_DOMAINS)) {
          const match =
            (arts && cmrInfo.arts) ||
            (science && cmrInfo.science) ||
            (genie && cmrInfo.genie);
          if (match) candidateJobIds.push(jId);
        }
      } else {
        for (const j of this.jobService.getAllJobs()) {
          if (this.jobService.hasPforProgram(j.id, this.currentSipPhase())) {
            candidateJobIds.push(j.id);
          }
        }
      }

      const excluded = [];
      for (const jId of candidateJobIds) {
        if (!this.jobService.hasPforProgram(jId, this.currentSipPhase())) continue;
        if (citizenship === "PR > 3 years" && !this.jobService.isJobRp(jId)) continue;
        if (!this.ignoreSip() && this.jobService.isPforJobClosed(jId, this.currentSipPhase())) continue;

        const job = this.jobService.getAllJobs().find((j) => j.id === jId);
        if (job) {
          const firstContract =
            job.contracts && job.contracts.length > 0 ? job.contracts[0] : null;
          const durationYears = firstContract
            ? firstContract.duration.match(/(\d+)\s*an/)
              ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
              : 3
            : 3;

          if (ageVal > 56 || ageVal + durationYears >= 60) {
            excluded.push({
              id: job.id,
              title: job.title,
              duration: durationYears,
              requiredAge: Math.min(56, 59 - durationYears),
            });
          }
        }
      }
      return excluded.sort((a, b) => a.id.localeCompare(b.id));
    }

    const rawSelected = this.selectedCriteriaIds();
    if (rawSelected.size === 0) return [];

    const selected = new Set(rawSelected);
    const allMathOptions = Object.values(this.MATH_COURSES).reduce(
      (acc, courses) => acc.concat(courses),
      [],
    );
    const selectedMaths = allMathOptions.filter((m) => selected.has(m.id));

    const hasMath = (grade: number, diff: number) => {
      return selectedMaths.some((m) => m.grade >= grade && m.diff >= diff);
    };

    if (hasMath(10, 1)) selected.add("base_math_10_gen");
    if (hasMath(10, 2)) selected.add("base_math_10_app");
    if (hasMath(10, 3)) selected.add("base_math_10_adv");
    if (hasMath(11, 1)) selected.add("base_math_11_gen");
    if (hasMath(11, 2)) selected.add("base_math_11_app");
    if (hasMath(11, 3)) selected.add("base_math_11_adv");
    if (hasMath(12, 1)) selected.add("base_math_12_gen");
    if (hasMath(12, 2)) selected.add("base_math_12_app");
    if (hasMath(12, 3)) selected.add("base_math_12_adv");

    if (citizenship === "PR < 3 years") {
      return [];
    }

    const excluded = [];
    const coursSpecialisesIds = this.criteriaCoursSpecialise().map((c) => c.id);

    for (const rule of this.jobRules) {
      let meetsRule = false;
      if (rule.customCheck) {
        const checkResult = rule.customCheck(selected, coursSpecialisesIds);
        meetsRule = typeof checkResult === "boolean" ? checkResult : checkResult.passed;
      } else if (
        rule.requiredCriteriaIds &&
        rule.requiredCriteriaIds.length > 0
      ) {
        meetsRule = rule.requiredCriteriaIds.every((id) => this.hasCriterion(selected, id));
      }

      if (meetsRule) {
        for (const jId of rule.jobs) {
          if (citizenship === "PR > 3 years" && !this.jobService.isJobRp(jId)) {
            continue;
          }

          // Exclude closed (SIP) jobs
          if (!this.ignoreSip() && this.jobService.isJobClosed(jId, this.currentSipPhase())) {
            continue;
          }

          const job = this.jobService.getAllJobs().find((j) => j.id === jId);
          if (job) {
            const firstContract =
              job.contracts && job.contracts.length > 0
                ? job.contracts[0]
                : null;
            const durationYears = firstContract
              ? firstContract.duration.match(/(\d+)\s*an/)
                ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
                : 3
              : 3;

            if (ageVal > 56 || ageVal + durationYears >= 60) {
              excluded.push({
                id: job.id,
                title: job.title,
                duration: durationYears,
                requiredAge: Math.min(56, 59 - durationYears),
              });
            }
          }
        }
      }
    }
    return excluded.sort((a, b) => a.id.localeCompare(b.id));
  });

  searchDossierQuery1 = this.sharedState.searchDossierQuery1;
  searchDossierQuery2 = this.sharedState.searchDossierQuery2;
  searchDossierQuery3 = this.sharedState.searchDossierQuery3;
  selectedDossierJobId1 = this.sharedState.selectedDossierJobId1;
  selectedDossierJobId2 = this.sharedState.selectedDossierJobId2;
  selectedDossierJobId3 = this.sharedState.selectedDossierJobId3;
  dropdownOpen1 = signal<boolean>(false);
  dropdownOpen2 = signal<boolean>(false);
  dropdownOpen3 = signal<boolean>(false);

  testEcePassed = this.sharedState.testEcePassed;
  testEsomPassed = this.sharedState.testEsomPassed;
  testCeopmPassed = this.sharedState.testCeopmPassed;
  testCspnPassed = this.sharedState.testCspnPassed;
  testCspnNotCompleted = this.sharedState.testCspnNotCompleted;
  testCspn00182Passed = this.sharedState.testCspn00182Passed;
  testCspn00183Passed = this.sharedState.testCspn00183Passed;
  testCspn00184Passed = this.sharedState.testCspn00184Passed;

  dossierJobIds = computed(() => {
    const ids: string[] = [];
    const id1 = this.selectedDossierJobId1();
    const id2 = this.selectedDossierJobId2();
    const id3 = this.selectedDossierJobId3();
    if (id1 && id1 !== "00003") ids.push(id1);
    if (id2 && id2 !== "00003") ids.push(id2);
    if (id3 && id3 !== "00003") ids.push(id3);
    return ids;
  });

  hasEceJob = computed(() => this.dossierJobIds().includes("00203"));
  hasEsomJob = computed(() => this.dossierJobIds().includes("00207"));
  hasCeopmJob = computed(() => this.dossierJobIds().includes("00214"));
  hasCspnJob = computed(() =>
    this.dossierJobIds().some((id) => id === "00182" || id === "00183" || id === "00184")
  );
  hasAnyExtraTest = computed(() =>
    this.hasEceJob() || this.hasEsomJob() || this.hasCeopmJob() || this.hasCspnJob()
  );

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

  checkJobExtraTestEligibility(jobId: string): {
    isExtraTestRequired: boolean;
    testName: string;
    eligible: boolean;
    reasonFr: string;
    reasonEn: string;
  } {
    if (jobId === "00203") {
      const isTested = this.hasEceJob();
      const eligible = !isTested || this.testEcePassed();
      return {
        isExtraTestRequired: isTested,
        testName: "ECE",
        eligible,
        reasonFr: eligible
          ? ""
          : "Échec ou non-réussite de l'Évaluation des compétences en communication écrite (ECE).",
        reasonEn: eligible
          ? ""
          : "Failed or did not pass the Written Communication Skills Evaluation (ECE).",
      };
    }
    if (jobId === "00207") {
      const isTested = this.hasEsomJob();
      const eligible = !isTested || this.testEsomPassed();
      return {
        isExtraTestRequired: isTested,
        testName: "ESOM",
        eligible,
        reasonFr: eligible
          ? ""
          : "Échec ou non-réussite de l'Évaluation de sélection des officiers de marine (ESOM).",
        reasonEn: eligible
          ? ""
          : "Failed or did not pass the Naval Officer Selection Assessment (ESOM).",
      };
    }
    if (jobId === "00214") {
      const isTested = this.hasCeopmJob();
      const eligible = !isTested || this.testCeopmPassed();
      return {
        isExtraTestRequired: isTested,
        testName: "CEOPM",
        eligible,
        reasonFr: eligible
          ? ""
          : "Échec ou non-réussite du Centre d’évaluation des officiers de la police militaire (CEOPM).",
        reasonEn: eligible
          ? ""
          : "Failed or did not pass the Military Police Officer Assessment Centre (CEOPM).",
      };
    }
    if (jobId === "00182") {
      const isTested = this.hasCspnJob();
      const notCompleted = this.testCspnNotCompleted();
      const eligible =
        !isTested ||
        (!notCompleted && this.testCspnPassed() && this.testCspn00182Passed());
      return {
        isExtraTestRequired: isTested,
        testName: "CSPN",
        eligible,
        reasonFr: eligible || notCompleted
          ? ""
          : "Échec ou non-réussite du test du Centre de sélection du personnel navigant (CSPN) pour le métier 00182 (Officier – Systèmes de combat).",
        reasonEn: eligible || notCompleted
          ? ""
          : "Failed or did not pass the Aircrew Selection Centre (ASC/CSPN) test for occupation 00182 (Air Combat Systems Officer).",
      };
    }
    if (jobId === "00183") {
      const isTested = this.hasCspnJob();
      const notCompleted = this.testCspnNotCompleted();
      const eligible =
        !isTested ||
        (!notCompleted && this.testCspnPassed() && this.testCspn00183Passed());
      return {
        isExtraTestRequired: isTested,
        testName: "CSPN",
        eligible,
        reasonFr: eligible || notCompleted
          ? ""
          : "Échec ou non-réussite du test du Centre de sélection du personnel navigant (CSPN) pour le métier 00183 (Pilote).",
        reasonEn: eligible || notCompleted
          ? ""
          : "Failed or did not pass the Aircrew Selection Centre (ASC/CSPN) test for occupation 00183 (Pilot).",
      };
    }
    if (jobId === "00184") {
      const isTested = this.hasCspnJob();
      const notCompleted = this.testCspnNotCompleted();
      const eligible =
        !isTested ||
        (!notCompleted && this.testCspnPassed() && this.testCspn00184Passed());
      return {
        isExtraTestRequired: isTested,
        testName: "CSPN",
        eligible,
        reasonFr: eligible || notCompleted
          ? ""
          : "Échec ou non-réussite du test du Centre de sélection du personnel navigant (CSPN) pour le métier 00184 (Contrôle aérospatial).",
        reasonEn: eligible || notCompleted
          ? ""
          : "Failed or did not pass the Aircrew Selection Centre (ASC/CSPN) test for occupation 00184 (Aerospace Control Officer).",
      };
    }
    return {
      isExtraTestRequired: false,
      testName: "",
      eligible: true,
      reasonFr: "",
      reasonEn: "",
    };
  }

  isJobExtraTestAdmissible(jobId: string): boolean {
    return this.checkJobExtraTestEligibility(jobId).eligible;
  }

  allJobsList = computed(() => this.jobService.getAllJobs());

  filteredDossierJobs1 = computed(() =>
    this.filterJobsForSearch(this.searchDossierQuery1()),
  );
  filteredDossierJobs2 = computed(() =>
    this.filterJobsForSearch(this.searchDossierQuery2()),
  );
  filteredDossierJobs3 = computed(() =>
    this.filterJobsForSearch(this.searchDossierQuery3()),
  );

  filterJobsForSearch(query: string) {
    let jobs = this.allJobsList();
    if (this.isPforApplicant() || this.sharedState.isPostulantPfor()) {
      jobs = jobs.filter((j) => this.jobService.isPforJob(j, this.currentSipPhase()));
    }
    if (!query || query.trim() === "") {
      return jobs;
    }
    const lowQuery = query.toLowerCase().trim();
    return jobs.filter(
      (j) =>
        j.id.includes(lowQuery) ||
        j.title.toLowerCase().includes(lowQuery) ||
        (j.abbreviation && j.abbreviation.toLowerCase().includes(lowQuery)),
    );
  }

  isFieldDisabled(index: number): boolean {
    const id1 = this.selectedDossierJobId1();
    const id2 = this.selectedDossierJobId2();
    const id3 = this.selectedDossierJobId3();
    
    if (index === 1) return (id2 === "00003" || id3 === "00003");
    if (index === 2) return (id1 === "00003" || id3 === "00003");
    if (index === 3) return (id1 === "00003" || id2 === "00003");
    return false;
  }

  selectDossierJob(index: number, jobId: string) {
    const qb = this.jobService.getAllJobs().find((j) => j.id === jobId);
    if (!qb) return;

    if (jobId === "00003") {
      if (index === 1) {
        this.selectedDossierJobId2.set("");
        this.searchDossierQuery2.set("");
        this.selectedDossierJobId3.set("");
        this.searchDossierQuery3.set("");
      } else if (index === 2) {
        this.selectedDossierJobId1.set("");
        this.searchDossierQuery1.set("");
        this.selectedDossierJobId3.set("");
        this.searchDossierQuery3.set("");
      } else if (index === 3) {
        this.selectedDossierJobId1.set("");
        this.searchDossierQuery1.set("");
        this.selectedDossierJobId2.set("");
        this.searchDossierQuery2.set("");
      }
    }

    if (index === 1) {
      this.selectedDossierJobId1.set(jobId);
      this.searchDossierQuery1.set(`${qb.id} - ${qb.title}`);
      this.dropdownOpen1.set(false);
    } else if (index === 2) {
      this.selectedDossierJobId2.set(jobId);
      this.searchDossierQuery2.set(`${qb.id} - ${qb.title}`);
      this.dropdownOpen2.set(false);
    } else if (index === 3) {
      this.selectedDossierJobId3.set(jobId);
      this.searchDossierQuery3.set(`${qb.id} - ${qb.title}`);
      this.dropdownOpen3.set(false);
    }
  }

  clearDossierJob(index: number, event: MouseEvent) {
    event.stopPropagation();
    if (index === 1) {
      this.selectedDossierJobId1.set("");
      this.searchDossierQuery1.set("");
      this.dropdownOpen1.set(false);
    } else if (index === 2) {
      this.selectedDossierJobId2.set("");
      this.searchDossierQuery2.set("");
      this.dropdownOpen2.set(false);
    } else if (index === 3) {
      this.selectedDossierJobId3.set("");
      this.searchDossierQuery3.set("");
      this.dropdownOpen3.set(false);
    }
  }

  onQueryChange(index: number, val: string) {
    if (index === 1) {
      this.searchDossierQuery1.set(val);
      if (!val) this.selectedDossierJobId1.set("");
    } else if (index === 2) {
      this.searchDossierQuery2.set(val);
      if (!val) this.selectedDossierJobId2.set("");
    } else if (index === 3) {
      this.searchDossierQuery3.set(val);
      if (!val) this.selectedDossierJobId3.set("");
    }
  }

  openDropdown(index: number) {
    if (this.isFieldDisabled(index)) return;
    if (index === 1) {
      this.dropdownOpen1.set(true);
      this.searchDossierQuery1.set("");
    } else if (index === 2) {
      this.dropdownOpen2.set(true);
      this.searchDossierQuery2.set("");
    } else if (index === 3) {
      this.dropdownOpen3.set(true);
      this.searchDossierQuery3.set("");
    }
  }

  closeDropdownDelayed(index: number) {
    setTimeout(() => {
      if (index === 1) {
        this.dropdownOpen1.set(false);
        const id = this.selectedDossierJobId1();
        if (id) {
          const qb = this.jobService.getAllJobs().find((j) => j.id === id);
          if (qb) this.searchDossierQuery1.set(`${qb.id} - ${qb.title}`);
        } else {
          this.searchDossierQuery1.set("");
        }
      } else if (index === 2) {
        this.dropdownOpen2.set(false);
        const id = this.selectedDossierJobId2();
        if (id) {
          const qb = this.jobService.getAllJobs().find((j) => j.id === id);
          if (qb) this.searchDossierQuery2.set(`${qb.id} - ${qb.title}`);
        } else {
          this.searchDossierQuery2.set("");
        }
      } else if (index === 3) {
        this.dropdownOpen3.set(false);
        const id = this.selectedDossierJobId3();
        if (id) {
          const qb = this.jobService.getAllJobs().find((j) => j.id === id);
          if (qb) this.searchDossierQuery3.set(`${qb.id} - ${qb.title}`);
        } else {
          this.searchDossierQuery3.set("");
        }
      }
    }, 200);
  }

  hasSelected(index: number): boolean {
    if (index === 1) return !!this.selectedDossierJobId1();
    if (index === 2) return !!this.selectedDossierJobId2();
    if (index === 3) return !!this.selectedDossierJobId3();
    return false;
  }

  isOfficerJob(jobId: string): boolean {
    return this.jobService.isOfficerJob(jobId);
  }

  checkJobEducationEligibility(jobId: string): { eligible: boolean; missingFr?: string; missingEn?: string } {
    const rules = this.jobRules.filter((r) => r.jobs.includes(jobId));
    if (rules.length === 0) {
      return { eligible: true };
    }

    const rawSelected = this.selectedCriteriaIds();
    const selected = new Set(rawSelected);

    const allMathOptions = Object.values(this.MATH_COURSES).reduce(
      (acc, courses) => acc.concat(courses),
      [] as any[],
    );
    const selectedMaths = allMathOptions.filter((m) => selected.has(m.id));

    const hasMath = (grade: number, diff: number) => {
      return selectedMaths.some((m) => m.grade >= grade && m.diff >= diff);
    };

    if (hasMath(10, 1)) selected.add("base_math_10_gen");
    if (hasMath(10, 2)) selected.add("base_math_10_app");
    if (hasMath(10, 3)) selected.add("base_math_10_adv");
    if (hasMath(11, 1)) selected.add("base_math_11_gen");
    if (hasMath(11, 2)) selected.add("base_math_11_app");
    if (hasMath(11, 3)) selected.add("base_math_11_adv");
    if (hasMath(12, 1)) selected.add("base_math_12_gen");
    if (hasMath(12, 2)) selected.add("base_math_12_app");
    if (hasMath(12, 3)) selected.add("base_math_12_adv");

    const coursSpecialisesIds = this.criteriaCoursSpecialise().map((c) => c.id);

    const missingFrList: string[] = [];
    const missingEnList: string[] = [];

    const getLabel = (id: string, isFr: boolean) => {
        const crit = this.manualCriteria.find(c => c.id === id);
        if (crit) {
            if (id === "des_12e_annee") return isFr ? "DES ou 12e année" : "High School Diploma or Grade 12";
            if (id === "aens") return isFr ? "AENS (Attestation d'équivalence de niveau de scolarité)" : "School Equivalency Attestation (AENS)";
            if (id === "sec4_24_credits") return isFr ? "Sec 4 (24 crédits) ou 10e année" : "Grade 10 (24 credits)";
            if (id === "francais_sec4_10e") return isFr ? "Français/Anglais de sec 4 ou 10e année" : "Grade 10 English/French";
            if (id === "francais_sec5_11e") return isFr ? "Français/Anglais de sec 5 ou 11e année" : "Grade 11 English/French";
            if (id === "anglais_sec5_12e") return isFr ? "Anglais de sec 5 / 12e année" : "Grade 12 / Sec 5 English";
            if (id === "sci_tech4_sci10") return isFr ? "Science et technologie de sec 4 ou 10e année" : "Grade 10 Science";
            if (id === "chimie_sec5_11e") return isFr ? "Chimie de sec 5 ou 11e année" : "Grade 11 Chemistry";
            if (id === "physique_sec5_11e") return isFr ? "Physique de sec 5 ou 11e année" : "Grade 11 Physics";
            return crit.label;
        }
        if (id === "base_math_10_gen") return isFr ? "Mathématiques de sec 4/10e (générales)" : "Grade 10 Math (General)";
        if (id === "base_math_10_app") return isFr ? "Mathématiques de sec 4/10e (appliquées)" : "Grade 10 Math (Applied)";
        if (id === "base_math_10_adv") return isFr ? "Mathématiques de sec 4/10e (avancées)" : "Grade 10 Math (Advanced)";
        if (id === "base_math_11_gen") return isFr ? "Mathématiques de sec 5/11e (générales)" : "Grade 11 Math (General)";
        if (id === "base_math_11_app") return isFr ? "Mathématiques de sec 5/11e (appliquées)" : "Grade 11 Math (Applied)";
        if (id === "base_math_11_adv") return isFr ? "Mathématiques de sec 5/11e (avancées)" : "Grade 11 Math (Advanced)";
        if (id === "base_math_12_gen") return isFr ? "Mathématiques de 12e (générales)" : "Grade 12 Math (General)";
        if (id === "base_math_12_app") return isFr ? "Mathématiques de 12e (appliquées)" : "Grade 12 Math (Applied)";
        if (id === "base_math_12_adv") return isFr ? "Mathématiques de 12e (avancées)" : "Grade 12 Math (Advanced)";
        return id;
    };

    for (const rule of rules) {
      let meetsRule = false;
      if (rule.customCheck) {
        const checkResult = rule.customCheck(selected, coursSpecialisesIds);
        if (typeof checkResult === "boolean") {
            meetsRule = checkResult;
            if (!meetsRule) {
                if (this.isOfficerJob(jobId)) {
                    missingFrList.push("Des études universitaires spécifiques sont manquantes");
                    missingEnList.push("Specific university studies are missing");
                } else {
                    missingFrList.push("Des exigences spécifiques (ex: DEP, Mathématiques ou Sciences) sont manquantes");
                    missingEnList.push("Specific requirements (e.g. DEP, Math or Science) are missing");
                }
            }
        } else {
            meetsRule = checkResult.passed;
            if (!meetsRule) {
                if (checkResult.missingFr) missingFrList.push(checkResult.missingFr);
                if (checkResult.missingEn) missingEnList.push(checkResult.missingEn);
            }
        }
      } else if (
        rule.requiredCriteriaIds &&
        rule.requiredCriteriaIds.length > 0
      ) {
        const missingIds = rule.requiredCriteriaIds.filter((id) => !this.hasCriterion(selected, id));
        if (missingIds.length === 0) {
            meetsRule = true;
        } else {
            missingFrList.push(missingIds.map(id => getLabel(id, true)).join(" et "));
            missingEnList.push(missingIds.map(id => getLabel(id, false)).join(" and "));
        }
      }

      if (meetsRule) {
        return { eligible: true };
      }
    }
    
    return { 
        eligible: false, 
        missingFr: Array.from(new Set(missingFrList)).join(" OU "),
        missingEn: Array.from(new Set(missingEnList)).join(" OR ")
    };
  }

  checkJobMedicalEligibility(jobId: string): {
    eligible: boolean;
    reasonFr: string;
    reasonEn: string;
  } {
    if (!this.hasMedicalLimitation()) {
      return { eligible: true, reasonFr: "", reasonEn: "" };
    }
    const job = this.jobService.getAllJobs().find((j) => j.id === jobId);
    if (!job || !job.medicalStandard) {
      // Si un métier n'est pas dans le PDF, ne fait rien avec ce métier.
      return { eligible: true, reasonFr: "", reasonEn: "" };
    }

    const parseVal = (valStr: string) => {
      const trimmed = (valStr || "").trim();
      if (!trimmed) return null;
      const num = parseInt(trimmed, 10);
      return isNaN(num) ? null : num;
    };

    const v = parseVal(this.medicalV());
    const cv = parseVal(this.medicalCV());
    const h = parseVal(this.medicalH());

    const std = job.medicalStandard;
    const failingFr: string[] = [];
    const failingEn: string[] = [];

    if (v !== null && v > std.v) {
      failingFr.push(`Votre vue (V) ne rencontre pas la norme minimale du métier (votre cote : V${v}, norme requise : V${std.v} max)`);
      failingEn.push(`Your vision (V) does not meet the minimum standard for this occupation (your score: V${v}, required: V${std.v} max)`);
    }
    if (cv !== null && cv > std.cv) {
      failingFr.push(`Votre perception des couleurs (CV) ne rencontre pas la norme minimale du métier (votre cote : CV${cv}, norme requise : CV${std.cv} max)`);
      failingEn.push(`Your color vision (CV) does not meet the minimum standard for this occupation (your score: CV${cv}, required: CV${std.cv} max)`);
    }
    if (h !== null && h > std.h) {
      failingFr.push(`Votre audition (H) ne rencontre pas la norme minimale du métier (votre cote : H${h}, norme requise : H${std.h} max)`);
      failingEn.push(`Your hearing (H) does not meet the minimum standard for this occupation (your score: H${h}, required: H${std.h} max)`);
    }

    const applicantLimitations = this.melService.applicantLimitations();
    const melMatrix = this.melService.acceptabilityMatrix();

    for (const [melId, hasLim] of Object.entries(applicantLimitations)) {
      if (hasLim) {
        const isAcceptable = melMatrix[melId]?.[jobId] ?? true;
        if (!isAcceptable) {
          const limitation = MEL_LIMITATIONS.find(l => l.id === melId);
          const limFr = limitation?.textFr || limitation?.text || melId;
          const limEn = limitation?.text || melId;
          failingFr.push(`Limitation médicale incompatible : ${limFr}`);
          failingEn.push(`Incompatible medical limitation: ${limEn}`);
        }
      }
    }

    if (failingFr.length > 0) {
      return {
        eligible: false,
        reasonFr: failingFr.join(" | "),
        reasonEn: failingEn.join(" | "),
      };
    }

    return { eligible: true, reasonFr: "", reasonEn: "" };
  }

  isJobMedicalAdmissible(jobId: string): boolean {
    return this.checkJobMedicalEligibility(jobId).eligible;
  }

  isAdmissibleOtherThanEducation(jobId: string): boolean {
    if (!jobId) return false;
    if (jobId === "00003") return false;
    const job = this.jobService.getAllJobs().find((j) => j.id === jobId);
    if (!job) return false;

    if (this.jobService.isJobClosed(jobId, this.currentSipPhase())) {
      return false;
    }

    if (!this.isJobMedicalAdmissible(jobId)) {
      return false;
    }

    if (!this.isJobExtraTestAdmissible(jobId)) {
      return false;
    }

    const ageVal = this.age();
    const citizenshipVal = this.citizenship();

    const firstContract =
      job.contracts && job.contracts.length > 0 ? job.contracts[0] : null;
    const durationYears = firstContract
      ? firstContract.duration.match(/(\d+)\s*an/)
        ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
        : 3
      : 3;

    if (ageVal !== null && ageVal > 0) {
      if (ageVal > 56 || ageVal + durationYears >= 60) {
        return false;
      }
    }

    if (citizenshipVal === "PR < 3 years") {
      return false;
    } else if (citizenshipVal === "PR > 3 years") {
      if (!this.jobService.isJobRp(jobId)) {
        return false;
      }
    }

    return true;
  }

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
    if (domains.length === 0) return "";
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
    if (domains.length === 0) return "";
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} or ${domains[1]}`;
    return `${domains[0]}, ${domains[1]}, or ${domains[2]}`;
  }

  evaluateJobAdmissibility(jobId: string) {
    if (!jobId) return null;
    const job = this.jobService.getAllJobs().find((j) => j.id === jobId);
    if (!job) return null;

    if (jobId === "00003") {
      return {
        job,
        isEligible: false,
        isAgeAdmissible: false,
        ageReason: "",
        isCitizenshipAdmissible: false,
        citizenshipReason: "",
        isEducationAdmissible: false,
        educationReason: "",
        educationReasonEn: "",
        isMedicalAdmissible: false,
        medicalReason: "",
        medicalReasonEn: "",
        isExtraTestRequired: false,
        isExtraTestAdmissible: false,
        extraTestName: "",
        extraTestReasonFr: "",
        extraTestReasonEn: "",
        durationYears: 3,
        isJobClosed: false,
        isClosedTraitement: false,
        isClosedAdmissionOnly: false,
      };
    }

    const ageVal = this.age();
    const citizenshipVal = this.citizenship();

    let isAgeAdmissible = true;
    let ageReason = "";
    let ageReasonEn = "";
    const firstContract =
      job.contracts && job.contracts.length > 0 ? job.contracts[0] : null;
    const durationYears = firstContract
      ? firstContract.duration.match(/(\d+)\s*an/)
        ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
        : 3
      : 3;

    if (ageVal !== null && ageVal > 0) {
      if (ageVal >= 57) {
        isAgeAdmissible = false;
        ageReason =
          "L'âge maximal d'admissibilité est de 56 ans (57 ans et plus est automatiquement inadmissible).";
        ageReasonEn =
          "Maximum eligibility age is 56 (57 and older is automatically ineligible).";
      } else if (ageVal + durationYears >= 60) {
        isAgeAdmissible = false;
        ageReason = "Vous dépassez l'âge maximal d'admissibilité pour ce métier.";
        ageReasonEn = "You exceed the maximum eligibility age for this occupation.";
      }
    }

    let isCitizenshipAdmissible = true;
    let citizenshipReason = "";
    if (citizenshipVal === "PR < 3 years") {
      isCitizenshipAdmissible = false;
      citizenshipReason =
        "Les résidents permanents de moins de trois ans ne sont pas admissibles aux Forces armées canadiennes.";
    } else if (citizenshipVal === "PR > 3 years") {
      const isRpAllowed = this.jobService.isJobRp(jobId);
      if (!isRpAllowed) {
        isCitizenshipAdmissible = false;
        citizenshipReason =
          "Ce métier est réservé aux citoyens canadiens uniquement (CC).";
      }
    }

    const extraTestCheck = this.checkJobExtraTestEligibility(jobId);
    const isExtraTestRequired = extraTestCheck.isExtraTestRequired;
    const isExtraTestAdmissible = extraTestCheck.eligible;
    const extraTestName = extraTestCheck.testName;
    const extraTestReasonFr = extraTestCheck.reasonFr;
    const extraTestReasonEn = extraTestCheck.reasonEn;

    let isEducationAdmissible = true;
    let educationReason = "";
    let educationReasonEn = "";

    if (this.isPforApplicant()) {
      const hasPfor = this.jobService.hasPforProgram(jobId, this.currentSipPhase());
      const isPforClosed = this.jobService.isPforJobClosed(jobId, this.currentSipPhase());

      if (this.pforType() === "cmr") {
        const cmrInfo = CMR_JOB_DOMAINS[jobId];
        if (!cmrInfo) {
          isEducationAdmissible = false;
          educationReason =
            "Ce métier n'est pas offert au Collège militaire royal (CMR) dans le cadre du PFOR.";
          educationReasonEn =
            "This occupation is not offered at the Royal Military College (RMC) under ROTP.";
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
            educationReason =
              `Ce métier requiert d'être admis au CMR en ${reqFr}, alors que votre admission actuelle au CMR est en ${admFr || "un autre domaine"}.`;
            const reqEn = this.getCmrJobRequiredDomainsEn(jobId);
            const admEn = this.getCmrAdmittedDomainsEn();
            educationReasonEn =
              `This occupation requires admission to RMC in ${reqEn}, whereas your current admission to RMC is in ${admEn || "another field"}.`;
          }
        }
      } else {
        if (!hasPfor) {
          isEducationAdmissible = false;
          educationReason =
            "Ce métier ne comporte aucune position disponible pour le PFOR Civil.";
          educationReasonEn =
            "This occupation has no available positions for Civil ROTP.";
        }
      }

      let isMedicalAdmissible = true;
      let medicalReason = "";
      let medicalReasonEn = "";
      if (this.hasMedicalLimitation()) {
        const medCheck = this.checkJobMedicalEligibility(jobId);
        if (!medCheck.eligible) {
          isMedicalAdmissible = false;
          medicalReason = medCheck.reasonFr;
          medicalReasonEn = medCheck.reasonEn;
        }
      }

      const isEligible =
        isAgeAdmissible &&
        isCitizenshipAdmissible &&
        isEducationAdmissible &&
        isMedicalAdmissible &&
        isExtraTestAdmissible;
      const hasPforTraitement = this.jobService.hasPforProgram(jobId, "traitement");
      const isPforClosedTraitement = this.jobService.isPforJobClosed(jobId, "traitement");
      const isClosedTraitementRaw = !hasPforTraitement || isPforClosedTraitement;

      const hasPforAdmission = this.jobService.hasPforProgram(jobId, "admission");
      const isPforClosedAdmission = this.jobService.isPforJobClosed(jobId, "admission");
      const isClosedAdmissionRaw = !hasPforAdmission || isPforClosedAdmission;

      const isClosedTraitement = isClosedTraitementRaw;
      const isClosedAdmissionOnly = isClosedAdmissionRaw && !isClosedTraitementRaw;
      const isJobClosed = isClosedTraitement || isClosedAdmissionOnly;

      return {
        job,
        isEligible,
        isAgeAdmissible,
        ageReason,
        ageReasonEn,
        isCitizenshipAdmissible,
        citizenshipReason,
        isEducationAdmissible,
        educationReason,
        educationReasonEn,
        isMedicalAdmissible,
        medicalReason,
        medicalReasonEn,
        isExtraTestRequired,
        isExtraTestAdmissible,
        extraTestName,
        extraTestReasonFr,
        extraTestReasonEn,
        durationYears,
        isJobClosed,
        isClosedTraitement,
        isClosedAdmissionOnly,
      };
    }

    const eduCheckSubmit = this.checkJobEducationEligibility(jobId);
    if (!eduCheckSubmit.eligible) {
      isEducationAdmissible = false;
      const specializedOfficers = ["00190", "00191", "00194", "00195", "00197", "00198", "00203", "00204", "00208", "00211", "00214", "00349", "00374", "00390", "00393", "00398"];
      if (this.isOfficerJob(jobId)) {
        if (specializedOfficers.includes(jobId) && eduCheckSubmit.missingFr) {
          educationReason = "Vous n'avez pas les études universitaires requises pour satisfaire aux exigences académiques (" + eduCheckSubmit.missingFr + ").";
          educationReasonEn = "You do not have the required university education to meet the academic requirements (" + eduCheckSubmit.missingEn + ").";
        } else {
          educationReason = "Vous n'avez pas les études universitaires requises pour satisfaire aux exigences académiques.";
          educationReasonEn = "You do not have the required university education to meet the academic requirements.";
        }
      } else if (eduCheckSubmit.missingFr) {
        educationReason = "Votre scolarité ou votre expérience ne satisfait pas aux exigences minimales (" + eduCheckSubmit.missingFr + ").";
        educationReasonEn = "Your academic level or experience does not meet the minimum requirements (" + eduCheckSubmit.missingEn + ").";
      } else {
        educationReason = "Votre scolarité ou votre expérience ne satisfait pas aux exigences minimales.";
        educationReasonEn = "Your academic level or experience does not meet the minimum requirements.";
      }
    }

    let isMedicalAdmissible = true;
    let medicalReason = "";
    let medicalReasonEn = "";
    if (this.hasMedicalLimitation()) {
      const medCheck = this.checkJobMedicalEligibility(jobId);
      if (!medCheck.eligible) {
        isMedicalAdmissible = false;
        medicalReason = medCheck.reasonFr;
        medicalReasonEn = medCheck.reasonEn;
      }
    }

    const isEligible =
      isAgeAdmissible &&
      isCitizenshipAdmissible &&
      isEducationAdmissible &&
      isMedicalAdmissible &&
      isExtraTestAdmissible;
    const isClosedTraitementRaw = this.jobService.isJobClosed(jobId, "traitement");
    const isClosedAdmissionRaw = this.jobService.isJobClosed(jobId, "admission");
    const isClosedTraitement = isClosedTraitementRaw;
    const isClosedAdmissionOnly = isClosedAdmissionRaw && !isClosedTraitementRaw;
    const isJobClosed = isClosedTraitement || isClosedAdmissionOnly;

    return {
      job,
      isEligible,
      isAgeAdmissible,
      ageReason,
      ageReasonEn,
      isCitizenshipAdmissible,
      citizenshipReason,
      isEducationAdmissible,
      educationReason,
      educationReasonEn,
      isMedicalAdmissible,
      medicalReason,
      medicalReasonEn,
      isExtraTestRequired,
      isExtraTestAdmissible,
      extraTestName,
      extraTestReasonFr,
      extraTestReasonEn,
      durationYears,
      isJobClosed,
      isClosedTraitement,
      isClosedAdmissionOnly,
    };
  }

  reset() {
    this.age.set(null);
    this.citizenship.set("Canadian Citizen");
    this.hasMedicalLimitation.set(false);
    this.includeTraitement.set(false);
    this.isPforApplicant.set(false);
    this.sharedState.isPostulantPfor.set(false);
    this.pforType.set("cmr");
    this.cmrArts.set(false);
    this.cmrScience.set(false);
    this.cmrGenie.set(false);
    this.medicalV.set("");
    this.medicalCV.set("");
    this.medicalH.set("");
    this.medicalG.set("");
    this.medicalO.set("");
    this.medicalA.set("");
    this.medicalU.set("");
    this.testEcePassed.set(false);
    this.testEsomPassed.set(false);
    this.testCeopmPassed.set(false);
    this.testCspnPassed.set(false);
    this.testCspnNotCompleted.set(false);
    this.testCspn00182Passed.set(false);
    this.testCspn00183Passed.set(false);
    this.testCspn00184Passed.set(false);
    this.selectedCriteriaIds.set(new Set<string>());
    this.selectedDossierJobId1.set("");
    this.selectedDossierJobId2.set("");
    this.selectedDossierJobId3.set("");
    this.searchDossierQuery1.set("");
    this.searchDossierQuery2.set("");
    this.searchDossierQuery3.set("");
    this.dropdownOpen1.set(false);
    this.dropdownOpen2.set(false);
    this.dropdownOpen3.set(false);
  }

  getMissingProofs(jobId: string): { fr: string[]; en: string[] } {
    const proofs = { fr: [] as string[], en: [] as string[] };
    const selected = this.selectedCriteriaIds();

    const cvJobs = [
      "00152", "00155", "00335", "00372", "00378", "00406", "00190", "00194",
      "00195", "00198", "00204", "00374", "00153", "00191", "00349", "00390", "00398"
    ];
    if (cvJobs.includes(jobId)) {
      const hasCv = selected.has("exp_cv_recent") || (jobId === "00191" && selected.has("exp_cv_dentiste_5ans"));
      if (!hasCv) {
        proofs.fr.push("Curriculum vitae (CV) récent à jour.");
        proofs.en.push("Recent up-to-date Curriculum Vitae (CV).");
      }
    }

    if (jobId === "00137") {
      if (!selected.has("exp_photo_design")) {
        proofs.fr.push(
          "Expérience dans un ou plusieurs des domaines suivants : photographie, photojournalisme, conception graphique ou multimédia.",
        );
        proofs.en.push(
          "Experience in one or more of the following fields: photography, photojournalism, graphic design, or multimedia.",
        );
      }
    }
    if (jobId === "00149" || jobId === "00161" || jobId === "00214") {
      if (!selected.has("exp_permis_conduire")) {
        proofs.fr.push(
          "Détenir un permis de conduire provincial/territorial en règle.",
        );
        proofs.en.push("Hold a valid provincial/territorial driver’s license.");
      }
    }
    if (jobId === "00152") {
      if (!selected.has("exp_scslm") && !selected.has("exp_acorplm")) {
        proofs.fr.push(
          "Fournir soit la certification de la Société canadienne de science de laboratoire médical (SCSLM) OU la certification de l'alliance canadienne des organismes de réglementation des professionnels de laboratoire médical (ACORPLM), incluant la réussite des examens du «TLM généraliste».",
        );
        proofs.en.push(
          'Provide either the certification from the Canadian Society for Medical Laboratory Science (CSMLS) OR the certification from the Canadian Alliance of Medical Laboratory Professionals Regulators (CAMLPR), including successfully passing the "General MLT" exams.',
        );
      }
      if (
        !selected.has("exp_permis_reglementation") &&
        !selected.has("exp_lettre_conformite")
      ) {
        proofs.fr.push(
          "Fournir un permis ou inscription sans restriction (statut actif) délivré par l’autorité de réglementation provinciale ou territoriale OU une Lettre de conformité (« Good Standing ») émise par l’autorité de réglementation.",
        );
        proofs.en.push(
          "Provide an unrestricted license or registration (active status) issued by the provincial or territorial regulatory authority OR a Letter of Good Standing issued by the regulatory authority.",
        );
      }
      if (!selected.has("exp_lab_6mois")) {
        proofs.fr.push(
          "Au moins six mois d'expérience à temps plein ou à temps partiel dans un laboratoire médical clinique au cours des deux dernières années.",
        );
        proofs.en.push(
          "At least six months of full-time or part-time clinical medical laboratory experience within the last two years.",
        );
      }
    }
    if (jobId === "00153") {
      if (
        !selected.has("exp_permis_rad") &&
        !selected.has("exp_association_actrm")
      ) {
        proofs.fr.push(
          "Fournir soit un permis, une certification ou autorisation sans restriction d’exercer comme technologue en radiation médicale (en règle et en vigueur) provenant d’un organisme de réglementation provincial/territorial reconnu OU la certification d’une association professionnelle ayant conclu une entente réciproque avec l’Association canadienne des technologues en radiation médicale (ACTRM).",
        );
        proofs.en.push(
          "Provide either an unrestricted license, certification, or practice permit to practice as a medical radiation technologist (in good standing and active) from a recognized provincial/territorial regulatory body OR certification from a professional association with a reciprocal agreement with CAMRT.",
        );
      }
      if (!selected.has("exp_lettre_reglementation_en_regle")) {
        proofs.fr.push(
          "Fournir une lettre de l'organisme de réglementation de la profession du candidat attestant que ce dernier est « en règle ».",
        );
        proofs.en.push(
          'Provide a letter from the professional regulatory body confirming that the candidate is "in good standing".',
        );
      }
    }
    if (jobId === "00155") {
      if (!selected.has("exp_tech_eb_6mois")) {
        proofs.fr.push(
          "A travaillé en tant que technologue en électronique biomédicale pendant une période totale d’au moins six (6) mois au cours des deux (2) dernières années.",
        );
        proofs.en.push(
          "Had worked as a biomedical electronics technologist for a total period of at least six (6) months within the last two (2) years.",
        );
      }
    }
    if (jobId === "00189") {
      const hasBase1 =
        selected.has("bacc_sci_environnementales") ||
        selected.has("bacc_sci_geologie") ||
        selected.has("bacc_sci_technologie_surete_protection_incendie") ||
        selected.has("bacc_sci_geomatique") ||
        selected.has("bacc_sci_arpentage") ||
        selected.has("bacc_genie_chimie_chimique") ||
        selected.has("bacc_genie_gestion") ||
        selected.has("bacc_genie_ingenierie_gestion") ||
        selected.has("bacc_genie_geologie");
      const hasBase2 =
        selected.has("bacc_sci_bsc_genie_protection_incendie") ||
        selected.has("bacc_genie_civil") ||
        selected.has("bacc_genie_mecanique") ||
        selected.has("bacc_genie_electricite_electrique") ||
        selected.has("bacc_genie_environnemental");
      if (hasBase1 && !hasBase2) {
        if (!selected.has("exp_00189")) {
          proofs.fr.push(
            "Au moins trois mois d'expérience pertinente dans un ou plusieurs des domaines suivants : industrie de la construction, gestion des installations, services d'incendies, services de l'environnement, géomatique, gestion de projet, service militaire.",
          );
          proofs.en.push(
            "At least three months of relevant experience in one or more of the following fields: construction industry, facility management, fire services, environmental services, geomatics, project management, military service.",
          );
        }
      }
    }
    if (jobId === "00190") {
      if (!selected.has("exp_permis_physiotherapie")) {
        proofs.fr.push(
          "Permis/licence d’exercice en règle (à titre actif) en tant que physiothérapeute émis par un organisme de réglementation provincial ou territorial.",
        );
        proofs.en.push(
          "Valid (active) license/permit to practice as a physiotherapist issued by a provincial or territorial regulatory body.",
        );
      }
      if (!selected.has("exp_lettre_physiotherapie_regle")) {
        proofs.fr.push(
          "Lettre de l’organisme de réglementation du candidat attestant que ce dernier est « En règle ».",
        );
        proofs.en.push(
          'Letter from the candidate\'s regulatory body confirming they are "In good standing".',
        );
      }
    }
    if (jobId === "00191") {
      if (!selected.has("exp_cert_bned")) {
        proofs.fr.push(
          "Certificat du Bureau national d’examen dentaire du Canada (BNED).",
        );
        proofs.en.push(
          "Certificate from the National Dental Examining Board of Canada (NDEB).",
        );
      }
      if (!selected.has("exp_permis_medecine_dentaire")) {
        proofs.fr.push(
          "Autorisation en règle et sans restriction d’exercer la Médecine dentaire de la part d’une autorité réglementaire d’une province/d’un territoire du Canada.",
        );
        proofs.en.push(
          "Valid and unrestricted license/permit to practice Dentistry from a provincial/territorial regulatory authority in Canada.",
        );
      }
      if (!selected.has("exp_lettre_dentiste_regle")) {
        proofs.fr.push(
          "Lettre de l’autorité réglementaire professionnelle attestant que le candidat est en règle.",
        );
        proofs.en.push(
          "Letter from the professional regulatory authority confirming that the candidate is in good standing.",
        );
      }
      if (!selected.has("exp_cv_dentiste_5ans")) {
        proofs.fr.push(
          "Curriculum vitae remontant jusqu’à de cinq ans quant à l’expérience en tant que dentiste.",
        );
        proofs.en.push(
          "Curriculum vitae going back up to five years regarding experience as a dentist.",
        );
      }
    }
    if (jobId === "00194") {
      if (!selected.has("exp_permis_pharmacie")) {
        proofs.fr.push(
          "Permis d’exercice de la pharmacie sans restriction en règle.",
        );
        proofs.en.push("Valid unrestricted license to practice pharmacy.");
      }
      if (!selected.has("exp_lettre_pharmacie_regle")) {
        proofs.fr.push(
          "Lettre de l’autorité de réglementation professionnelle attestant que le candidat est « en règle ».",
        );
        proofs.en.push(
          'Letter from the professional regulatory authority confirming that the candidate is in "good standing".',
        );
      }
    }
    if (jobId === "00195") {
      if (!selected.has("exp_permis_soins_infirmiers")) {
        proofs.fr.push(
          "Permis d’exercice en règle (état actif) en soins infirmiers en tant qu’infirmier autorisé ou infirmier en pratique octroyé par un organisme de réglementation provincial ou territorial du Canada.",
        );
        proofs.en.push(
          "Valid (active state) nursing practice license as a registered nurse or practical nurse issued by a provincial or territorial regulatory body in Canada.",
        );
      }
    }
    if (jobId === "00198") {
      if (!selected.has("exp_permis_travail_social")) {
        proofs.fr.push(
          "Permis en règle et sans restriction (état actif) d’exercer comme travailleur social, délivré par une autorité / association réglementaire provinciale ou territoriale.",
        );
        proofs.en.push(
          "Valid and unrestricted license/permit (active state) to practice as a social worker issued by a provincial or territorial regulatory authority/association.",
        );
      }
      if (!selected.has("exp_lettre_travail_social_regle")) {
        proofs.fr.push(
          "Lettre de l’autorité de réglementation professionnelle attestant que le candidat est « en règle ».",
        );
        proofs.en.push(
          'Letter from the professional regulatory authority confirming that the candidate is in "good standing".',
        );
      }
    }
    if (jobId === "00203") {
      if (!selected.has("exp_00203")) {
        proofs.fr.push(
          "Fournir une preuve d’au moins une (1) année d’expérience cumulative dans deux ou plusieurs des domaines suivants : communications, journalisme, commercialisation, affaires publiques, relations publiques, recherche sur l'opinion publique, médias numériques ou sociaux.",
        );
        proofs.en.push(
          "Provide proof of at least one (1) year of cumulative experience in two or more of the following fields: communications, journalism, marketing, public affairs, public relations, public opinion research, digital or social media.",
        );
      }
    }
    if (jobId === "00204") {
      if (!selected.has("exp_permis_droit")) {
        proofs.fr.push(
          "Autorisé à pratiquer le droit dans une province canadienne ou un territoire canadien.",
        );
        proofs.en.push(
          "Authorized to practice law in a Canadian province or territory.",
        );
      }
      if (!selected.has("exp_lettre_barreau_regle")) {
        proofs.fr.push(
          "Être « membre en règle », en exercice ou non, du Barreau d'une province ou d’un territoire.",
        );
        proofs.en.push(
          'Be a "member in good standing", practicing or non-practicing, of the Bar of a province or territory.',
        );
      }
    }
    if (jobId === "00208") {
      if (
        (selected.has("bacc_arts_psychologie") ||
          selected.has("bacc_arts_sociologie")) &&
        !selected.has("exp_00208_bacc")
      ) {
        proofs.fr.push(
          "Au moins une ou plusieurs années de travail à temps plein dans un ou plusieurs des domaines suivants : sélection, recrutement (RH), recherche en sciences sociales, orientation scolaire/professionnelle.",
        );
        proofs.en.push(
          "At least one or more years of full-time work in one or more of the following fields: selection, recruitment (HR), social science research, academic/career counseling.",
        );
      }
    }
    if (jobId === "00211") {
      if (
        selected.has("maitrise_arts_education") &&
        !selected.has("exp_00211_maitrise")
      ) {
        proofs.fr.push(
          "Fournir une preuve d’au moins trois (3) ans cumulatifs d’expérience à temps plein dans l’un ou plusieurs des domaines suivants : élaboration d’un programme d’études, expert-conseil en éducation, conception de l’instruction, formation du personnel, enseignement/instruction, expert-conseil en instruction, développement de l’instruction.",
        );
        proofs.en.push(
          "Provide proof of at least three (3) cumulative years of full-time experience in one or more of the following fields: curriculum development, education consultant, instructional design, staff training, teaching/instruction, instructional consultant, instructional development.",
        );
      }
    }
    if (jobId === "00164") {
      if (
        selected.has("cs_dep_cuisine") &&
        !selected.has("exp_sceau_rouge_cuisine")
      ) {
        proofs.fr.push(
          "Fournir une preuve de détention d’un Certificat des normes interprovinciales Sceau rouge.",
        );
        proofs.en.push(
          "Provide proof of holding a Red Seal interprovincial standards certification.",
        );
      }
    }
    if (jobId === "00166") {
      if (selected.has("cs_etude_musique")) {
        if (!selected.has("exp_mus_pro")) {
          proofs.fr.push(
            "Fournir une preuve d’expérience comme musicien professionnel dans une variété d’ensembles et dans divers styles de musique, p. ex. à titre de musicien travaillant à son propre compte, ou à temps plein avec une orchestre, un ensemble ou un groupe de musique local.",
          );
          proofs.en.push(
            "Provide proof of experience as a professional musician in a variety of ensembles and in various styles of music, e.g. as a self-employed musician, or full-time with a local orchestra, ensemble, or music group.",
          );
        }
      } else if (this.hasCriterion(selected, "des_12e_annee")) {
        if (
          !selected.has("exp_mus_ensembles") &&
          !selected.has("exp_mus_etudiant")
        ) {
          proofs.fr.push(
            "Fournir soit une preuve d’expérience comme musicien dans une variété d’ensembles et dans divers styles de musique, p. ex. à titre de musicien travaillant à son propre compte, ou à temps plein avec une orchestre, un ensemble ou un groupe de musique local, OU une preuve de statut d’étudiant en voie d’obtenir un diplôme ou un Baccalauréat en interprétation musicale dans un collège, un conservatoire de musique ou une université reconnus.",
          );
          proofs.en.push(
            "Provide either proof of experience as a musician in a variety of ensembles and in various styles of music, e.g. as a self-employed musician, or full-time with a local orchestra, ensemble, or music group, OR proof of student status on track to obtain a diploma or Bachelor’s degree in music performance in a recognized college, music conservatory, or university.",
          );
        }
      }
    }

    if (jobId === "00335") {
      if (selected.has("cs_cert_assist_dentaire")) {
        if (!selected.has("exp_permis_assistant_dentaire")) {
          proofs.fr.push(
            "Fournir une preuve de permis en règle pour agir en tant qu’assistant dentaire délivré par une autorité de réglementation canadienne provinciale ou territoriale.",
          );
          proofs.en.push(
            "Provide proof of a valid registration/license as a dental assistant issued by a Canadian provincial or territorial regulatory authority.",
          );
        }
        if (!selected.has("exp_lettre_dentaire_en_regle")) {
          proofs.fr.push(
            "Fournir une lettre de l’autorité de réglementation professionnelle attestant que le candidat est « en règle ».",
          );
          proofs.en.push(
            'Provide a letter from the professional regulatory authority confirming that the candidate is "in good standing".',
          );
        }
      }
    }

    if (jobId === "00372") {
      if (selected.has("cs_dep_sante_infirmiers")) {
        if (!selected.has("exp_permis_infirmier_auxiliaire")) {
          proofs.fr.push(
            "Fournir une preuve de détention d’une autorisation en règle de travailler comme infirmier auxiliaire autorisé/immatriculé émise par un organisme de réglementation provincial ou territorial.",
          );
          proofs.en.push(
            "Provide proof of holding a valid registration/license as a licensed/registered practical nurse issued by a provincial or territorial regulatory authority.",
          );
        }
        if (!selected.has("exp_lettre_reglementation_en_regle")) {
          proofs.fr.push(
            "Fournir une lettre de l’organisme de réglementation de la profession du candidat attestant que ce dernier est « en règle ».",
          );
          proofs.en.push(
            'Provide a letter from the professional regulatory authority confirming that the candidate is "in good standing".',
          );
        }
        if (!selected.has("exp_cert_peroperatoire")) {
          proofs.fr.push(
            "Fournir une preuve de certification comme infirmier auxiliaire autorisé/immatriculé en soins peropératoires.",
          );
          proofs.en.push(
            "Provide proof of certification as a licensed/registered practical nurse in perioperative care.",
          );
        }
      }
    }

    if (jobId === "00406") {
      if (selected.has("cs_cert_soins_param")) {
        if (!selected.has("exp_permis_paramedical")) {
          proofs.fr.push(
            "Fournir une preuve d'inscription actuelle ou en cours au permis ou privilèges hospitaliers de base ou certification en vigueur pour exercer à titre de paramédical(e), délivrés par un organisme de réglementation provincial ou territorial canadien.",
          );
          proofs.en.push(
            "Provide proof of current registration/licensure or active base hospital standard privileges or certification to practice as a paramedic, issued by a Canadian provincial or territorial regulatory authority.",
          );
        }
      }
    }

    if (jobId === "00349") {
      if (!selected.has("exp_00349_leader_foi")) {
        proofs.fr.push(
          "Accrédité et reconnu comme un leader au sein d’une tradition de foi  par l’autorité de gouvernance de cette même tradition de foi qui exerce une supervision au Canada, et tel que recommandé par le membre désigné du CIAMC.",
        );
        proofs.en.push(
          "Accredited and recognized as a faith group leader by the governing authority of that faith group which exercises supervision in Canada, and as recommended by the designated member of the ICCDF.",
        );
      }
      if (!selected.has("exp_00349_endosse_ciamc")) {
        proofs.fr.push("Avoir été endossé comme aumônier par le CIAMC.");
        proofs.en.push("Be endorsed as a chaplain by the ICCDF.");
      }
      if (!selected.has("exp_00349_entrevue_aum")) {
        proofs.fr.push(
          "Avoir réussi une entrevue et jugé apte par un comité présidé par le D Svc Aum.  La sélection finale est confirmée par l’Aumônier général.",
        );
        proofs.en.push(
          "Successfully pass an interview and be deemed suitable by a committee chaired by the D Chap Svc. Final selection is confirmed by the Chaplain General.",
        );
      }
    }

    if (jobId === "00374") {
      if (!selected.has("exp_00374_cert_permis")) {
        proofs.fr.push(
          "Certificat en règle du Conseil de certification des adjoints au médecin du Canada (CCAMC) et permis/licence en règle (en vigueur) d’exercer comme adjoint au médecin délivré(e) par une autorité réglementaire d’une province ou d’un territoire du Canada.",
        );
        proofs.en.push(
          "Valid certification from the Physician Assistant Certification Council of Canada (PACCC) and a valid active license to practice as a physician assistant issued by a provincial or territorial regulatory authority of Canada.",
        );
      }
      if (!selected.has("exp_00374_lettre_regle")) {
        proofs.fr.push(
          "Lettre de l’autorité professionnelle réglementaire ou de son superviseur en clinique, selon le cas, attestant que le candidat est en règle.",
        );
        proofs.en.push(
          "Letter from the professional regulatory authority or clinical supervisor, as applicable, confirming that the candidate is in good standing.",
        );
      }
    }

    if (jobId === "00390") {
      if (!selected.has("exp_00390_residence")) {
        proofs.fr.push(
          "Achèvement d’une formation spécialisée dans un programme de résidence agréé par le Collège royal des médecins et chirurgiens du Canada dans l’une des spécialités suivantes:\n- Médecine interne avec une résidence de deux ans dans l’une des disciplines suivantes;\n    a) Médecine interne générale\n    b) Maladies infectieuses\n    c) Soins intensifs\n- Anesthésiologie\n- Chirurgie générale\n- Chirurgie orthopédique\n- Psychiatrie\n- Radiologie\n- Médecine physique et de réadaptation (Physiatrie)\n- Médecine d’urgence.",
        );
        proofs.en.push(
          "Completion of specialized training in a residency program accredited by the Royal College of Physicians and Surgeons of Canada in one of the following specialties:\n- Internal medicine with a two-year residency in one of the following disciplines;\n    a) General internal medicine\n    b) Infectious diseases\n    c) Critical care\n- Anesthesiology\n- General surgery\n- Orthopedic surgery\n- Psychiatry\n- Radiology\n- Physical medicine and rehabilitation (Physiatry)\n- Emergency medicine.",
        );
      }
      if (!selected.has("exp_00390_certification")) {
        proofs.fr.push(
          "Certification et titre de fellow du Collège royal des médecins et chirurgiens du Canada, dans l’une des spécialités mentionnées ci-dessus.",
        );
        proofs.en.push(
          "Certification and fellowship designation from the Royal College of Physicians and Surgeons of Canada in one of the specialties mentioned above.",
        );
      }
      if (!selected.has("exp_00390_permis")) {
        proofs.fr.push(
          "Permis d’exercice valide et sans restriction pour pratiquer la médecine à titre de spécialiste (selon la spécialité indiquée ci-dessus) dans toute province ou tout territoire du Canada.",
        );
        proofs.en.push(
          "Valid and unrestricted license to practice medicine as a specialist (according to the specialty indicated above) in any province or territory of Canada.",
        );
      }
      if (!selected.has("exp_00390_attestation")) {
        proofs.fr.push(
          "Attestation de bonne conduite professionnelle délivrée par l’organisme de réglementation provincial ou territorial du candidat.",
        );
        proofs.en.push(
          "Certificate of professional good standing issued by the candidate’s provincial or territorial regulatory body.",
        );
      }
      if (!selected.has("exp_00390_civil")) {
        proofs.fr.push(
          "Pour toutes les spécialités : à l’exception de la psychiatrie et de la médecine physique et réadaptation (physiatrie): Être employé à temps plein dans un poste clinique au sein d’un établissement de soins de santé civil.",
        );
        proofs.en.push(
          "For all specialties, except psychiatry and physical medicine and rehabilitation (physiatry): Be employed full-time in a clinical position within a civilian healthcare facility.",
        );
      }
    }

    if (jobId === "00393") {
      if (!selected.has("exp_00393_autorisation")) {
        proofs.fr.push(
          "Détenir une Autorisation en règle et sans restriction d’exercer la Médecine en tant que médecin de famille dans une province ou un territoire du Canada.",
        );
        proofs.en.push(
          "Hold a valid and unrestricted license to practice Family Medicine in a province or territory of Canada.",
        );
      }
      if (!selected.has("exp_00393_lettre_regle")) {
        proofs.fr.push(
          "Lettre des autorités de réglementation de la province/territoire du candidat attestant que ce dernier est « en règle ».",
        );
        proofs.en.push(
          'Letter from the regulatory authorities of the candidate’s province/territory confirming that the candidate is in "good standing".',
        );
      }
      if (!selected.has("exp_00393_certification")) {
        proofs.fr.push(
          "Certification en médecine familiale du Collège des médecins de famille du Canada.",
        );
        proofs.en.push(
          "Certification in Family Medicine from the College of Family Physicians of Canada.",
        );
      }
    }

    if (jobId === "00398") {
      const option1Selected =
        selected.has("bacc_sante_gestion_services_sante") ||
        selected.has("bacc_sante_admin_soins_sante");
      const option2Selected =
        selected.has("bacc_arts_admin_affaires") ||
        selected.has("bacc_arts_admin_publique") ||
        selected.has("bacc_arts_ressources_humaines");
      const option3Selected =
        selected.has("maitrise_sante_gestion_services_sante") ||
        selected.has("maitrise_sante_admin_soins_sante") ||
        selected.has("maitrise_admin_affaires") ||
        selected.has("maitrise_admin_publique") ||
        selected.has("maitrise_gestion_ressources_humaines");
      const baccSanteSaufPlusHaut = [
        "bacc_sante_adjoint_medecin",
        "bacc_sante_biochimie",
        "bacc_sante_biologie",
        "bacc_sante_biologie_humaine",
        "bacc_sante_diplome_sciences_vie",
        "bacc_sante_genie_biomedical",
        "bacc_sante_kinesiologie",
        "bacc_sante_medecine_dentaire",
        "bacc_sante_microbiologie",
        "bacc_sante_pharmacie",
        "bacc_sante_physiologie_humaine",
        "bacc_sante_physiotherapie",
        "bacc_sante_sciences_soins_infirmiers",
        "bacc_sante_sciences_infirmieres",
      ].some((id) => selected.has(id));

      const dEsSanteSaufPlusHaut = [
        "doctorat_adjoint_medecin",
        "maitrise_adjoint_medecin",
        "doctorat_medecine",
        "doctorat_sante_pharmacie",
        "maitrise_sante_admin_sante",
        "maitrise_sante_biochimie",
        "maitrise_sante_biologie",
        "maitrise_sante_biologie_humaine",
        "maitrise_sante_diplome_sciences_vie",
        "maitrise_sante_genie_biomedical",
        "maitrise_sante_gestion_soins_sante",
        "maitrise_sante_integration_systemes_humains",
        "maitrise_sante_kinesiologie",
        "maitrise_sante_physiotherapie",
        "maitrise_sante_microbiologie",
        "maitrise_sante_physiologie_humaine",
        "maitrise_sante_environnementale_professionnelle",
        "maitrise_sante_publique",
      ].some((id) => selected.has(id));

      if (
        (baccSanteSaufPlusHaut || dEsSanteSaufPlusHaut) &&
        !option1Selected &&
        !option2Selected &&
        !option3Selected
      ) {
        if (!selected.has("exp_00398_gestion")) {
          proofs.fr.push(
            "Un minimum de deux années d’expérience cumulative en gestion à temps plein au cours des cinq dernières années dans un milieu de soins de santé.",
          );
          proofs.en.push(
            "A minimum of two years of cumulative full-time management experience within the last five years in a healthcare environment.",
          );
        }
      }
    }

    return proofs;
  }

  generateNoteText() {
    const jobIds = this.eligibleJobs();
    if (jobIds.length === 0)
      return "Aucun critère sélectionné. Impossible de générer la note.";

    let text = "Évaluation de réorientation\n====================\n\n";
    if (this.isPforApplicant()) {
      text += "Programme PFOR :\n";
      if (this.pforType() === "cmr") {
        text += `- Admis au Collège militaire royal (CMR) - Domaine(s) : ${this.getCmrAdmittedDomainsNoteFr() || "Non spécifié"}\n`;
      } else {
        text += "- Universités civiles\n";
      }
    } else {
      text += "Critères rencontrés :\n";
      const selected = this.selectedCriteriaIds();
      const criteriaArray = Array.from(selected);
      const allMathOptions = Object.values(this.MATH_COURSES).reduce(
        (acc: any[], courses: any) => acc.concat(courses),
        [],
      );

      for (const id of criteriaArray) {
        if (id.startsWith("base_math_")) continue; // Skip virtual base criteria

        const crit = this.manualCriteria.find((c) => c.id === id);
        if (crit) {
          text += "- " + crit.label + "\n";
        } else {
          const mathOpt = allMathOptions.find((m) => m.id === id);
          if (mathOpt) {
            text += "- " + mathOpt.label + "\n";
          }
        }
      }
    }

    text += "\nMétiers admissibles :\n";
    for (const jId of jobIds) {
      const job = this.jobService.getAllJobs().find((j) => j.id === jId);
      if (job) {
        text += "- " + job.id + " - " + job.title + "\n";
      } else {
        text += "- " + jId + "\n";
      }
    }

    if (!this.isPforApplicant()) {
      let hasMissingProofs = false;
      let missingProofsText = "\nPreuves supplémentaires requises :\n";
      for (const jId of jobIds) {
        const missing = this.getMissingProofs(jId);
        if (missing.fr.length > 0) {
          hasMissingProofs = true;
          const job = this.jobService.getAllJobs().find((j) => j.id === jId);
          const title = job ? `${job.id} - ${job.title}` : jId;
          missingProofsText += `\nPour le métier ${title} :\n`;
          for (const proof of missing.fr) {
            missingProofsText += `- ${proof}\n`;
          }
        }
      }

      if (hasMissingProofs) {
        text += missingProofsText;
      }
    }

    return text;
  }

  copied = signal(false);
  noteCopied = signal(false);

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
    ].filter((id) => !!id);

    let metierRaison = "";

    if (dossierIds.length === 0) {
      metierRaison = "aucun métier sélectionné au dossier";
    } else {
      const parts: string[] = [];
      for (const id of dossierIds) {
        if (id === "00003") {
          parts.push(`00003 : Sans métier`);
          continue;
        }
        const s = this.evaluateJobAdmissibility(id);
        let reasonFr = "";
        if (s) {
          const reasonsFrList: string[] = [];
          if (s.isJobClosed) {
            if (s.isClosedAdmissionOnly) {
              reasonsFrList.push("Fermé admission");
            } else {
              reasonsFrList.push(this.isPforApplicant() ? "Fermé PFOR" : "Fermé");
            }
          }
          if (!s.isAgeAdmissible) {
            reasonsFrList.push("Âge");
          }
          if (!s.isCitizenshipAdmissible) {
            reasonsFrList.push("Citoyenneté requise");
          }
          if (!s.isEducationAdmissible) {
            if (this.isPforApplicant() && this.pforType() === "cmr") {
              const cmrInfo = CMR_JOB_DOMAINS[id];
              if (!cmrInfo) {
                reasonsFrList.push("Non offert au CMR (PFOR)");
              } else {
                reasonsFrList.push(`Non admis au CMR en ${this.getCmrJobRequiredDomainsFr(id)}`);
              }
            } else if (this.isPforApplicant() && this.pforType() === "civil") {
              reasonsFrList.push("Non offert en PFOR Civil");
            } else {
              reasonsFrList.push("Scolarité/Expérience");
            }
          }
          if (!s.isMedicalAdmissible) {
            reasonsFrList.push("Limitation médicale");
          }
          if (s.isExtraTestRequired && !s.isExtraTestAdmissible && s.extraTestReasonFr) {
            reasonsFrList.push(`Test ${s.extraTestName}`);
          }

          if (reasonsFrList.length > 0) {
            reasonFr = reasonsFrList.join(", ");
          } else {
            reasonFr = "Admissible";
          }
        }
        parts.push(`(${id} : ${reasonFr})`);
      }
      metierRaison = parts.join(", ");
    }

    const isPRAdmissible = this.citizenship() === "PR > 3 years";
    const prDemandText = isPRAdmissible
      ? " et relevés de notes du pays d'origine demandés"
      : "";

    let reoPrefix = "Réorientation nécessaire car inadmissible pour";
    if (this.isPforApplicant() && this.pforType() === "cmr") {
      const cmrDomains = this.getCmrAdmittedDomainsNoteFr();
      if (cmrDomains) {
        reoPrefix = `Admis CMR (${cmrDomains}) - Réorientation nécessaire car`;
      } else {
        reoPrefix = "PFOR CMR - Réorientation nécessaire car";
      }
    } else if (this.isPforApplicant() && this.pforType() === "civil") {
      reoPrefix = "PFOR Civil - Réorientation nécessaire car";
    }

    const reoNote = `Étape 1 (En cours) - ${reoPrefix} : ${metierRaison}, courriel de réo envoyé${prDemandText}, en attente de la réponse du postulant. Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.`;

    if ((this.sharedState.includeLinkedEmail() || (this.sharedState.hasReassignedTasks() && this.showResultsPanel())) && this.sharedState.taskNote()) {
      const taskNoteRaw = this.sharedState.taskNote();

      // Extrait le message médical s'il est présent
      let medicalSuffix = "";
      const medicalMarker = "MÉDICAL - TRIAGE PAR MED CHU REQUIS";
      if (taskNoteRaw.toUpperCase().includes(medicalMarker)) {
        medicalSuffix = "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }

      // Normalise les notes en extrayant le préfixe et le suffixe commun
      const prefixRegex = /^Étape 1 \((En cours|en cours)\)\s*-\s*/i;
      const suffixString = "Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.";

      // Pour la note de tâche
      let taskHasPrefix = prefixRegex.test(taskNoteRaw);
      let taskClean = taskNoteRaw.replace(prefixRegex, "").trim();
      // On retire la partie médicale pour le nettoyage
      const medicalIndex = taskClean.toUpperCase().indexOf(medicalMarker);
      if (medicalIndex !== -1) {
        taskClean = taskClean.substring(0, medicalIndex).trim();
      }
      // On retire le suffixe de fermeture de dossier
      const suffixIndexTask = taskClean.toLowerCase().indexOf(suffixString.toLowerCase());
      if (suffixIndexTask !== -1) {
        taskClean = taskClean.substring(0, suffixIndexTask).trim();
      }
      if (taskClean.endsWith(".")) {
        taskClean = taskClean.slice(0, -1).trim();
      }

      // Pour la note de réorientation
      let reoHasPrefix = prefixRegex.test(reoNote);
      let reoClean = reoNote.replace(prefixRegex, "").trim();
      const suffixIndexReo = reoClean.toLowerCase().indexOf(suffixString.toLowerCase());
      if (suffixIndexReo !== -1) {
        reoClean = reoClean.substring(0, suffixIndexReo).trim();
      }
      if (reoClean.endsWith(".")) {
        reoClean = reoClean.slice(0, -1).trim();
      }

      // Combine les textes principaux
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

      // Restaure le préfixe si l'une des deux notes l'avait
      const hasPrefix = taskHasPrefix || reoHasPrefix;
      const finalPrefix = hasPrefix ? "Étape 1 (En cours) - " : "";

      return `${finalPrefix}${combinedCore}. ${suffixString}${medicalSuffix}`;
    }

    return reoNote;
  }

  async copyNoteRegistry() {
    try {
      const textContent = this.generateNoteRegistry();

      if (navigator.clipboard && navigator.clipboard.write) {
        const textBlob = new Blob([textContent], { type: "text/plain" });
        const clipboardItem = new ClipboardItem({
          "text/plain": textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(textContent);
      }

      this.noteCopied.set(true);
      setTimeout(() => this.noteCopied.set(false), 2000);
    } catch (err) {
      console.error("Failed to copy note", err);
    }
  }

  readonly JOB_URLS = JOB_URLS;

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

  buildBilingualEmail(isHtml: boolean): string {
    const jobIds = this.eligibleJobs();
    if (!this.showResultsPanel() && jobIds.length === 0) {
      if (isHtml) {
        return '<p class="text-slate-500 italic text-center mt-10">Sélectionnez au moins un critère de scolarité ou d\'expérience pour évaluer les métiers admissibles et générer le courriel de réorientation.</p>';
      } else {
        return "Sélectionnez au moins un critère de scolarité ou d'expérience pour générer le courriel.";
      }
    }

    const isPilotEligible = jobIds.includes("00183");
    const isPRAdmissible = this.citizenship() === "PR > 3 years";
    const isPfor = this.isPforApplicant();
    const isJobClosed = (j: string) => isPfor ? this.jobService.isPforJobClosed(j, this.currentSipPhase()) : this.jobService.isJobClosed(j, this.currentSipPhase());

    const renderAllEligibleJobsHtml = (ncmJobs: string[], offJobs: string[], isFrench: boolean) => {
      let out = "";
      const openNcm = ncmJobs.filter(j => !isJobClosed(j));
      const closedNcm = ncmJobs.filter(j => isJobClosed(j));
      const openOff = offJobs.filter(j => !isJobClosed(j));
      const closedOff = offJobs.filter(j => isJobClosed(j));

      const hasClosedJobs = (closedNcm.length > 0 || closedOff.length > 0);

      const openNcmTitle = isFrench ? (this.ignoreSip() ? "Militaires du rang (Ouverts)" : "Militaires du rang") : (this.ignoreSip() ? "Non-Commissioned Members (Open)" : "Non-Commissioned Members");
      const openOffTitle = isFrench ? (this.ignoreSip() ? "Officiers (Ouverts)" : "Officiers") : (this.ignoreSip() ? "Officers (Open)" : "Officers");
      const closedNcmTitle = isFrench ? "Militaires du rang (Fermés)" : "Non-Commissioned Members (Closed)";
      const closedOffTitle = isFrench ? "Officiers (Fermés)" : "Officers (Closed)";

      const buildSection = (jobList: string[], title: string, color: string, inlineColor: string, isClosed: boolean) => {
        let sec = "";
        if (jobList.length > 0) {
          sec += `<p class="font-bold text-${color} mt-4" style="color: ${inlineColor}; font-weight: bold; margin-top: 16px;">${title} :</p>\n`;
          sec += '<ul class="list-disc pl-5 mt-1 mb-2" style="padding-left: 20px; margin-top: 4px; margin-bottom: 8px;">\n';
          for (const jId of jobList) {
            let itemStyle = isClosed ? ' style="color: #b91c1c;"' : '';
            let itemClass = isClosed ? ' class="mt-0.5 text-red-700"' : ' class="mt-0.5"';
            sec += `  <li${itemClass}${itemStyle}><strong>${jId} - ${this.getJobLinkMarkup(jId, isFrench, true)}</strong></li>\n`;
          }
          sec += "</ul>\n";
          
          if (!this.isPforApplicant()) {
            const proofsMap = new Map<string, string[]>();
            for (const jId of jobList) {
              const missing = this.getMissingProofs(jId);
              const proofs = isFrench ? missing.fr : missing.en;
              if (proofs.length > 0) proofsMap.set(jId, proofs);
            }
            if (proofsMap.size > 0) {
              sec += `<p class="mt-2 text-xs text-red-800 font-semibold font-sans" style="color: #991b1b; font-weight: 600; font-size: 12px; margin-top: 8px;">${isFrench ? "Vous devrez fournir ces documents/preuves supplémentaires si vous choisissez les métiers suivants :" : "You will need to provide these additional documents/proofs if you choose the following occupations:"}</p>\n`;
              sec += '<ul class="list-disc pl-5 mt-1 mb-2 text-xs text-slate-600" style="color: #475569; padding-left: 20px; margin-top: 4px; margin-bottom: 8px; font-size: 12px;">\n';
              for (const [jId, proofs] of proofsMap.entries()) {
                sec += `  <li class="mt-0.5"><strong>${isFrench ? "Pour" : "For"} ${jId} - ${this.getJobLinkMarkup(jId, isFrench, true)} :</strong> ` + proofs.join(", ") + "</li>\n";
              }
              sec += "</ul>\n";
            }
          }
        }
        return sec;
      };

      // 1. Open jobs first
      out += buildSection(openNcm, openNcmTitle, "blue-800", "#1e40af", false);
      out += buildSection(openOff, openOffTitle, "purple-800", "#6b21a8", false);

      // 2. Closed note right above closed jobs if ignoreSip is active and there are closed jobs
      if (this.ignoreSip() && hasClosedJobs) {
        if (isFrench) {
          out +=
            '<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900" style="margin-top: 16px; padding: 12px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 4px; font-size: 14px; color: #713f12;">\n' +
            '  <strong>Note importante concernant les métiers fermés :</strong> La liste ci-dessous inclut des métiers actuellement ouverts et fermés. Si vous choisissez un <span style="background-color: #fef08a; font-weight: bold;">métier ouvert</span>, nous pourrons poursuivre le traitement de votre demande d\'emploi immédiatement. Par contre, si vous choisissez un <span style="background-color: #fecaca; color: #991b1b; font-weight: bold;">métier fermé</span> (marqué en rouge), nous devrons fermer votre dossier et ce sera <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de nous rappeler vers la fin du mois de mars prochain</span> pour faire rouvrir votre dossier dans ce métier.\n' +
            '</div>\n';
        } else {
          out +=
            '<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900" style="margin-top: 16px; padding: 12px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 4px; font-size: 14px; color: #713f12;">\n' +
            '  <strong>Important note regarding closed occupations:</strong> The list below includes both currently open and closed occupations. If you choose an <span style="background-color: #fef08a; font-weight: bold;">open occupation</span>, we can continue processing your application immediately. However, if you choose a <span style="background-color: #fecaca; color: #991b1b; font-weight: bold;">closed occupation</span> (marked in red), we will have to close your file and it will be <span style="background-color: #fef08a; font-weight: bold;">your sole responsibility to call us back towards the end of next March</span> to reopen your file for this occupation.\n' +
            '</div>\n';
        }

        // 3. Closed jobs
        out += buildSection(closedNcm, closedNcmTitle, "red-800", "#991b1b", true);
        out += buildSection(closedOff, closedOffTitle, "red-800", "#991b1b", true);
      }

      return out;
    };

    const renderAllEligibleJobsPlain = (ncmJobs: string[], offJobs: string[], isFrench: boolean) => {
      let out = "";
      const openNcm = ncmJobs.filter(j => !isJobClosed(j));
      const closedNcm = ncmJobs.filter(j => isJobClosed(j));
      const openOff = offJobs.filter(j => !isJobClosed(j));
      const closedOff = offJobs.filter(j => isJobClosed(j));

      const hasClosedJobs = (closedNcm.length > 0 || closedOff.length > 0);

      const openNcmTitle = isFrench ? (this.ignoreSip() ? "Militaires du rang (Ouverts)" : "Militaires du rang") : (this.ignoreSip() ? "Non-Commissioned Members (Open)" : "Non-Commissioned Members");
      const openOffTitle = isFrench ? (this.ignoreSip() ? "Officiers (Ouverts)" : "Officiers") : (this.ignoreSip() ? "Officers (Open)" : "Officers");
      const closedNcmTitle = isFrench ? "Militaires du rang (Fermés)" : "Non-Commissioned Members (Closed)";
      const closedOffTitle = isFrench ? "Officiers (Fermés)" : "Officers (Closed)";

      const buildSection = (jobList: string[], title: string) => {
        let sec = "";
        if (jobList.length > 0) {
          sec += `\n${title} :\n`;
          for (const jId of jobList) {
            sec += `  - ${jId} - ${this.getJobLinkMarkup(jId, isFrench, false)}\n`;
          }
          if (!this.isPforApplicant()) {
            const proofsMap = new Map<string, string[]>();
            for (const jId of jobList) {
              const missing = this.getMissingProofs(jId);
              const proofs = isFrench ? missing.fr : missing.en;
              if (proofs.length > 0) proofsMap.set(jId, proofs);
            }
            if (proofsMap.size > 0) {
              sec += `\n  ${isFrench ? "Documents supplémentaires requis :" : "Additional documents required:"}\n`;
              for (const [jId, proofs] of proofsMap.entries()) {
                sec += `    * ${isFrench ? "Pour" : "For"} ${jId} : ` + proofs.join(", ") + "\n";
              }
            }
          }
        }
        return sec;
      };

      // 1. Open jobs first
      out += buildSection(openNcm, openNcmTitle);
      out += buildSection(openOff, openOffTitle);

      // 2. Closed note right above closed jobs
      if (this.ignoreSip() && hasClosedJobs) {
        if (isFrench) {
          out +=
            "\nNote importante concernant les métiers fermés :\n" +
            "La liste ci-dessous inclut des métiers actuellement ouverts et fermés. Si vous choisissez un métier ouvert, nous pourrons poursuivre le traitement de votre demande d'emploi immédiatement. Par contre, si vous choisissez un métier fermé, nous devrons fermer votre dossier et ce sera votre entière responsabilité de nous rappeler vers la fin du mois de mars prochain pour faire rouvrir votre dossier dans ce métier.\n";
        } else {
          out +=
            "\nImportant note regarding closed occupations:\n" +
            "The list below includes both currently open and closed occupations. If you choose an open occupation, we can continue processing your application immediately. However, if you choose a closed occupation, we will have to close your file and it will be your sole responsibility to call us back towards the end of next March to reopen your file for this occupation.\n";
        }

        // 3. Closed jobs
        out += buildSection(closedNcm, closedNcmTitle);
        out += buildSection(closedOff, closedOffTitle);
      }

      return out;
    };

    const dossierIds = [
      this.selectedDossierJobId1(),
      this.selectedDossierJobId2(),
      this.selectedDossierJobId3(),
    ].filter((id) => !!id);

    const hasNoJobCode = dossierIds.includes("00003");
    const realDossierIds = dossierIds.filter((id) => id !== "00003");

    // Determine which dossier jobs are closed but otherwise admissible
    const closedTraitementJobs: string[] = [];
    const closedAdmissionOnlyJobs: string[] = [];
    for (const id of realDossierIds) {
      const s = this.evaluateJobAdmissibility(id);
      if (s) {
        if (
          s.isJobClosed &&
          s.isAgeAdmissible &&
          s.isCitizenshipAdmissible &&
          s.isEducationAdmissible &&
          s.isMedicalAdmissible &&
          s.isExtraTestAdmissible
        ) {
          if (s.isClosedAdmissionOnly) {
            closedAdmissionOnlyJobs.push(id);
          } else {
            closedTraitementJobs.push(id);
          }
        }
      }
    }
    const hasTraitementClosed = closedTraitementJobs.length > 0;
    const hasAdmissionClosed = closedAdmissionOnlyJobs.length > 0;
    const hasClosedButAdmissibleJobs = hasTraitementClosed || hasAdmissionClosed;
    const closedButAdmissibleJobs = [...closedTraitementJobs, ...closedAdmissionOnlyJobs];
    const allRealDossierJobsAreClosedTraitement = realDossierIds.length > 0 && closedTraitementJobs.length === realDossierIds.length;
    const allRealDossierJobsAreClosedAdmissionOnly = realDossierIds.length > 0 && closedAdmissionOnlyJobs.length === realDossierIds.length;

    // Split eligible jobs into NCM and Officer
    const listNCM: string[] = [];
    const listOFF: string[] = [];
    for (const jId of jobIds) {
      if (this.isOfficerJob(jId)) {
        listOFF.push(jId);
      } else {
        listNCM.push(jId);
      }
    }

    const rawHtml = this.sharedState.taskEmailHtmlFr();
    
    const hasTasks =
      !!rawHtml &&
      this.sharedState.hasReassignedTasks() &&
      rawHtml.includes("Bonjour,");
    const mergeTasks = (this.sharedState.includeLinkedEmail() || (this.sharedState.hasReassignedTasks() && this.showResultsPanel())) && hasTasks;

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

    if (isHtml) {
      // ------------------ HTML VERSION ------------------
      let h = "";

      let hFr = "";
      const isPforCmr = this.isPforApplicant() && this.pforType() === "cmr";
      const isPforCivil = this.isPforApplicant() && this.pforType() === "civil";
      const cmrAdmittedFr = this.getCmrAdmittedDomainsFr();

      // FRENCH SECTION
      hFr += '<p class="mt-4">Bonjour,</p>\n';

      if (this.isCandidateTooOld()) {
        hFr += '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature, nous constatons que vous devez faire l\'objet d\'une réorientation. En effet, vous dépassez l\'âge maximal d\'admissibilité pour vos choix de métiers.</p>\n';
      } else if (isPforCmr && cmrAdmittedFr) {
        hFr += `<p class="mt-4">Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), <strong>vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} !</strong> Nous tenons à vous féliciter chaleureusement pour cette admission.</p>\n`;
      }

      if (mergeTasks) {
        // Unified smart intro explaining both tasks list and reorientation
        if (this.isCandidateTooOld()) {
          hFr +=
            '<p class="mt-4">De plus, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else if (isPforCmr && cmrAdmittedFr) {
          hFr +=
            '<p class="mt-4">Toutefois, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else if (isPforCmr) {
          hFr +=
            '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal)</strong>, nous constatons que certaines actions de votre part sont requises. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else if (isPforCivil) {
          hFr +=
            '<p class="mt-4">Suite à l\'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Universités civiles)</strong>, nous constatons que certaines actions de votre part sont requises. Vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l\'objet d\'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n';
        } else {
          hFr +=
            "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. En effet, vous devez à la fois <strong>apporter des corrections aux tâches qui vous ont été réattribuées</strong> sur votre portail et faire l'objet d'une <strong>réorientation pour vos choix de métiers</strong>.</p>\n";
        }

        // Extract tasks list body from standard task email html
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
          taskPartHtml = taskPartHtml
            .replace(
              /<p[^>]*>\s*Nous avons procédé à l'évaluation de vos documents.*?pour nous permettre de poursuivre le traitement\.\s*<\/p>/gis,
              ""
            )
            .replace(
              /Nous avons procédé à l'évaluation de vos documents\. Bien que votre dossier progresse, certains éléments ne sont pas conformes et nécessitent des corrections de votre part pour nous permettre de poursuivre le traitement\.\s*/gis,
              ""
            )
            .replace(
              /<p[^>]*>\s*<strong>\s*Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours\.\s*<\/strong>\s*<\/p>/gis,
              ""
            )
            .replace(
              /<strong>\s*Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours\.\s*<\/strong>/gis,
              ""
            )
            .trim();
          hFr +=
            '<div class="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm">\n';
          hFr +=
            '<p class="font-bold text-black border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">1. TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :</p>\n';
          hFr += taskPartHtml + "\n";
          hFr += "</div>\n";
        }

        hFr +=
          '<p class="mt-6 font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">2. STATUT DE VOS CHOIX DE MÉTIERS ACTUELS ET RÉORIENTATION REQUISE :</p>\n';
      } else {
        // Standard Reorientation Intro French
        if (hasNoJobCode) {
          if (this.isCandidateTooOld()) {
            hFr +=
              "<p class=\"mt-4\">De plus, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.</p>\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            hFr +=
              "<p class=\"mt-4\">Toutefois, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.</p>\n";
          } else if (isPforCmr) {
            hFr +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.</p>\n";
          } else {
            hFr +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.</p>\n";
          }
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            hFr +=
              "<p class=\"mt-2\">Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (this.isCandidateTooOld()) {
            hFr +=
              "<p class=\"mt-4\">Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            hFr +=
              "<p class=\"mt-4\">Toutefois, suite à l'analyse de vos choix de métiers actuels, nous constatons qu'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (isPforCmr) {
            hFr +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else if (isPforCivil) {
            hFr +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature pour le <strong>Programme de formation des officiers de la force régulière (PFOR - Universités civiles)</strong>, nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          } else {
            hFr +=
              "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :</p>\n";
          }
        } else {
          hFr +=
            '<p class="mt-4">Voici le statut des autres métiers inscrits à votre dossier :</p>\n';
        }
        hFr += '<ul class="list-disc pl-5 mt-2 mb-4">\n';
        for (const id of realDossierIds) {
          const name = `${id} - ${this.getJobLinkMarkup(id, true, true)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonFr = "";
          if (s) {
            const reasonsFrList: string[] = [];
            if (s.isJobClosed) {
              if (s.isClosedAdmissionOnly) {
                reasonsFrList.push(
                  "Nous avons déjà un nombre suffisant de candidatures pour combler toutes les positions restantes.",
                );
              } else if (this.isPforApplicant()) {
                reasonsFrList.push(
                  "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).",
                );
              } else {
                reasonsFrList.push(
                  "Il n'y a plus de postes disponibles pour ce métier.",
                );
              }
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
            if (s.isExtraTestRequired && !s.isExtraTestAdmissible && s.extraTestReasonFr) {
              reasonsFrList.push(s.extraTestReasonFr);
            }

            if (reasonsFrList.length > 0) {
              reasonFr = `\n    <ul class="list-disc pl-5 mt-1 text-sm text-slate-600">\n      <li>${reasonsFrList.join("</li>\n      <li>")}</li>\n    </ul>`;
            } else {
              reasonFr =
                " : Admissible (réorientation lancée pour d'autres éléments du dossier).";
            }
          }
          hFr += `  <li class="mt-1"><strong>${name}</strong>${reasonFr}</li>\n`;
        }
        hFr += "</ul>\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          hFr +=
            "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles sous le PFOR ou requièrent un domaine d'études différent de votre admission au CMR.</p>\n";
        } else {
          hFr +=
            "<p class=\"mt-4\">Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles ou que vous n'y êtes pas admissible d'après nos critères.</p>\n";
        }
      }

      // Options French
      if (this.isCandidateTooOld() && jobIds.length === 0) {
        hFr += '<p class="mt-4 font-semibold text-slate-800">Conclusion :</p>\n';
        if (this.age() !== null && this.age()! >= 57) {
          hFr += '<p class="mt-2 text-sm">Étant donné que vous avez atteint ou dépassé l\'âge maximal d\'enrôlement (57 ans et plus), aucun métier ne peut vous être offert au sein des Forces armées canadiennes.</p>\n';
        } else {
          hFr += '<p class="mt-2 text-sm">Étant donné votre âge actuel, aucun métier admissible n\'est actuellement disponible pour votre candidature.</p>\n';
        }
      } else {
        hFr +=
          '<p class="mt-4 font-semibold text-slate-800">Voici les options qui s\'offrent à vous :</p>\n';
        if (hasTraitementClosed && hasAdmissionClosed) {
          const isPluralTraitement = closedTraitementJobs.length > 1;
          const opt1Title = isPluralTraitement
            ? 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mes choix de métiers (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mon choix de métier (' + closedTraitementJobs.join(", ") + ')';
          const opt1MetiersDesc = isPluralTraitement
            ? 'vos choix de métiers (<strong>' + closedTraitementJobs.join(", ") + '</strong>)'
            : 'votre choix de métier (<strong>' + closedTraitementJobs.join(", ") + '</strong>)';

          const isPluralAdmission = closedAdmissionOnlyJobs.length > 1;
          const opt2Title = isPluralAdmission
            ? 'Option 2 : Conserver mes choix de métiers (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait'
            : 'Option 2 : Conserver mon choix de métier (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait';
          const opt2MetiersDesc = isPluralAdmission
            ? 'vos choix de métiers (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)'
            : 'votre choix de métier (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)';
          const opt2Refer = isPluralAdmission ? 'vos choix de métiers' : 'votre choix de métier';

          hFr +=
            '<p class="mt-2 text-sm"><strong>' + opt1Title + '</strong><br>Vous pouvez conserver ' + opt1MetiersDesc + ' et attendre que les prochaines positions ouvrent en avril prochain. Cependant, <span style="background-color: #fef08a; font-weight: bold;">votre dossier sera fermé dès maintenant</span> et il sera de <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de contacter votre centre de recrutement au début du mois de mars prochain pour rouvrir votre dossier et poursuivre le processus de recrutement</span>.</p>\n';
          hFr +=
            '<p class="mt-4 text-sm"><strong>' + opt2Title + '</strong><br>Vous pouvez conserver ' + opt2MetiersDesc + ' au cas où un autre postulant déjà admis ne termine pas le processus et qu’une position se libère. Cependant, <span style="background-color: #fef08a; font-weight: bold;">votre dossier sera fermé dès maintenant</span> et il sera de <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de contacter votre centre de recrutement à tous les trois mois</span> pour savoir si des positions se seraient libérées pour ' + opt2Refer + ' afin de poursuivre le processus de recrutement.</p>\n';
          hFr +=
            '<p class="mt-4 text-sm"><strong>Option 3 : Choisir un autre métier parmi la liste des métiers admissibles</strong><br>Vous pouvez réorienter votre candidature vers d\'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l\'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.</p>\n';
        } else if (hasTraitementClosed) {
          const isPluralTraitement = closedTraitementJobs.length > 1;
          const opt1Title = isPluralTraitement
            ? 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mes choix de métiers (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mon choix de métier (' + closedTraitementJobs.join(", ") + ')';
          const opt1MetiersDesc = isPluralTraitement
            ? 'vos choix de métiers (<strong>' + closedTraitementJobs.join(", ") + '</strong>)'
            : 'votre choix de métier (<strong>' + closedTraitementJobs.join(", ") + '</strong>)';
          hFr +=
            '<p class="mt-2 text-sm"><strong>' + opt1Title + '</strong><br>Vous pouvez conserver ' + opt1MetiersDesc + ' et attendre que les prochaines positions ouvrent en avril prochain. Cependant, <span style="background-color: #fef08a; font-weight: bold;">votre dossier sera fermé dès maintenant</span> et il sera de <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de contacter votre centre de recrutement au début du mois de mars prochain pour rouvrir votre dossier et poursuivre le processus de recrutement</span>.</p>\n';
          hFr +=
            '<p class="mt-4 text-sm"><strong>Option 2 : Choisir un autre métier parmi la liste des métiers admissibles</strong><br>Vous pouvez réorienter votre candidature vers d\'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l\'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.</p>\n';
        } else if (hasAdmissionClosed) {
          const isPluralAdmission = closedAdmissionOnlyJobs.length > 1;
          const opt1Title = isPluralAdmission
            ? 'Option 1 : Conserver mes choix de métiers (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait'
            : 'Option 1 : Conserver mon choix de métier (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait';
          const opt1MetiersDesc = isPluralAdmission
            ? 'vos choix de métiers (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)'
            : 'votre choix de métier (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)';
          const opt1Refer = isPluralAdmission ? 'vos choix de métiers' : 'votre choix de métier';
          hFr +=
            '<p class="mt-2 text-sm"><strong>' + opt1Title + '</strong><br>Vous pouvez conserver ' + opt1MetiersDesc + ' au cas où un autre postulant déjà admis ne termine pas le processus et qu’une position se libère. Cependant, <span style="background-color: #fef08a; font-weight: bold;">votre dossier sera fermé dès maintenant</span> et il sera de <span style="background-color: #fef08a; font-weight: bold;">votre entière responsabilité de contacter votre centre de recrutement à tous les trois mois</span> pour savoir si des positions se seraient libérées pour ' + opt1Refer + ' afin de poursuivre le processus de recrutement.</p>\n';
          hFr +=
            '<p class="mt-4 text-sm"><strong>Option 2 : Choisir un autre métier parmi la liste des métiers admissibles</strong><br>Vous pouvez réorienter votre candidature vers d\'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l\'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.</p>\n';
        } else {
          hFr +=
            '<p class="mt-2 text-sm"><strong>Choisir un autre métier parmi la liste des métiers admissibles</strong><br>Vous devez réorienter votre candidature vers un choix de métier pour lequel vous êtes admissible afin de poursuivre le processus d\'enrôlement. Pour ces métiers, l\'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Veuillez consulter la liste ci-dessous.</p>\n';
        }
      }

      // Eligible Jobs French Division
      hFr +=
        '<div class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      hFr +=
        '<p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">MÉTIERS ADMISSIBLES :</p>\n';

      if (isPilotEligible) {
        hFr +=
          '<div class="mt-2 mb-3 p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs" style="margin-top: 8px; margin-bottom: 12px; padding: 10px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; font-size: 13px; color: #78350f;">\n' +
          '  <strong>Attention – Choix du métier de Pilote (00183) :</strong> Le métier de Pilote étant fortement contingenté (nombre de places très limité), si vous choisissez ce métier, vous devez obligatoirement sélectionner un deuxième métier parmi la liste des métiers admissibles.\n' +
          '</div>\n';
      }

      if (listNCM.length === 0 && listOFF.length === 0) {
        hFr += '<p class="mt-2 text-slate-700 italic">' + (this.isPforApplicant() ? "Aucun métier PFOR ouvert correspondant n'est disponible actuellement pour la sélection effectuée." : "Aucun métier correspondant disponible.") + '</p>\n';
      } else {
        hFr += renderAllEligibleJobsHtml(listNCM, listOFF, true);
      }
      hFr += "</div>\n";

      // Conclusion French
      if (mergeTasks) {
        hFr +=
          '<p class="mt-6 font-semibold text-slate-800">Prochaines étapes :</p>\n';
        hFr +=
          "<p>En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées. Nous vous invitons donc à :</p>\n";
        hFr += '<ul class="list-disc pl-5 mt-1 mb-2 text-sm text-slate-700">\n';
        hFr +=
          '  <li>Vous rendre sur votre portail (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) afin de corriger sans délai les tâches indiquées ci-dessus ;</li>\n';
        if (isPRAdmissible) {
          hFr +=
            '  <li>Si ce n\'est pas déjà fait, retourner sur votre portail (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) afin d\'y déposer les relevés de notes de votre pays d\'origine (dans leur langue d\'origine s\'ils sont en français ou en anglais, ou accompagnés d\'une traduction officielle au besoin) ;</li>\n';
        }
        hFr +=
          "  <li>Répondre directement à ce courriel avec votre choix de réorientation ou vos nouveaux choix de métiers pour mettre à jour votre dossier.</li>\n";
        hFr += "</ul>\n";
      } else {
        if (isPRAdmissible) {
          hFr +=
            '<p class="mt-4 text-sm text-slate-700">De plus, si ce n\'est pas déjà fait, veuillez retourner sur votre portail (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) afin d\'y déposer les relevés de notes de votre pays d\'origine. Ceux-ci doivent être rédigés en français ou en anglais, ou être accompagnés d\'une traduction officielle au besoin.</p>\n';
        }
        hFr +=
          '<p class="mt-4">Nous vous remercions pour votre intérêt envers les Forces armées canadiennes. Veuillez nous faire part de votre décision en répondant directement à ce courriel afin de poursuivre ou de mettre à jour votre dossier.</p>\n';
      }

      // Warning French
      hFr +=
        '<p class="mt-4 text-sm text-slate-600">Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</p>\n';

      // Signature French
      hFr += '<p>' + this.sharedState.getHtmlSignatureFr() + '</p>\n';

      let hEn = "";
      // ======================================
      // ENGLISH SECTION
      // ======================================
      hEn += '<p class="mt-4">Hello,</p>\n';

      const cmrAdmittedEn = this.getCmrAdmittedDomainsEn();
      if (this.isCandidateTooOld()) {
        if (this.age() !== null && this.age()! >= 57) {
          hEn += '<p class="mt-4">Following the analysis of your application file, we inform you that you exceed the maximum eligibility age for enrollment in the Canadian Armed Forces (maximum eligibility age is 56, 57 and older being automatically ineligible).</p>\n';
        } else {
          hEn += '<p class="mt-4">Following the analysis of your application file, we have determined that you must undergo a reorientation. Indeed, you exceed the maximum eligibility age for your selected occupations.</p>\n';
        }
      } else if (isPforCmr && cmrAdmittedEn) {
        hEn += `<p class="mt-4">We are pleased to inform you that, following the assessment of your transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), <strong>you have been admitted to RMC in the following field(s) of study: ${cmrAdmittedEn} !</strong> We would like to warmly congratulate you on your admission.</p>\n`;
      }

      if (mergeTasks) {
        // Unified smart English intro
        if (this.isCandidateTooOld()) {
          hEn +=
            '<p class="mt-4">In addition, actions are required on your part to proceed with processing your application. Specifically, you must <strong>correct the reassigned tasks</strong> on your portal and undergo a <strong>reorientation of your occupational choices</strong>.</p>\n';
        } else if (isPforCmr && cmrAdmittedEn) {
          hEn +=
            '<p class="mt-4">However, actions are required on your part to proceed with processing your application. Specifically, you must <strong>correct the reassigned tasks</strong> on your portal and undergo a <strong>reorientation of your occupational choices</strong>.</p>\n';
        } else if (isPforCmr) {
          hEn +=
            '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Royal Military College)</strong>, actions are required on your part. Specifically, you must <strong>correct the reassigned tasks</strong> on your portal and undergo a <strong>reorientation of your occupational choices</strong>.</p>\n';
        } else if (isPforCivil) {
          hEn +=
            '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (Civilian University ROTP)</strong>, actions are required on your part. Specifically, you must <strong>correct the reassigned tasks</strong> on your portal and undergo a <strong>reorientation of your occupational choices</strong>.</p>\n';
        } else {
          hEn +=
            '<p class="mt-4">Following the analysis of your application file, we have determined that actions are required on your part to proceed with processing your application. Specifically, you must <strong>correct the reassigned tasks</strong> on your portal and undergo a <strong>reorientation of your occupational choices</strong>.</p>\n';
        }

        let taskPartHtmlEn = "";
        if (rawHtml.includes("<!-- START_TASK_BODY_EN -->")) {
          const enParts = rawHtml.split("<!-- START_TASK_BODY_EN -->");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<!-- END_TASK_BODY_EN -->");
            if (enBodyPart.length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        } else {
          const enParts = rawHtml.split("<p>Hello,</p>");
          if (enParts.length > 1) {
            const enBodyPart = enParts[1].split("<p>Due to the high volume");
            if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
              taskPartHtmlEn = enBodyPart[0].trim();
            }
          }
        }

        if (taskPartHtmlEn) {
          taskPartHtmlEn = taskPartHtmlEn
            .replace(
              /<p[^>]*>\s*We have evaluated your documents.*?to allow us to continue processing\.\s*<\/p>/gis,
              ""
            )
            .replace(
              /We have evaluated your documents\. While your application is progressing, some items are not compliant and require corrections on your part to allow us to continue processing\.\s*/gis,
              ""
            )
            .replace(
              /<p[^>]*>\s*<strong>\s*If you take no action, your file will be automatically deactivated after 30 days\.\s*<\/strong>\s*<\/p>/gis,
              ""
            )
            .replace(
              /<strong>\s*If you take no action, your file will be automatically deactivated after 30 days\.\s*<\/strong>/gis,
              ""
            )
            .trim();
          hEn +=
            '<div class="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm">\n';
          hEn +=
            '<p class="font-bold text-black border-b border-amber-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">1. TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL :</p>\n';
          hEn += taskPartHtmlEn + "\n";
          hEn += "</div>\n";
        }

        hEn +=
          '<p class="mt-6 font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-base" style="font-size: 15px; font-weight: bold; color: #000000;">2. STATUS OF YOUR CURRENT OCCUPATIONS AND REQUIRED REORIENTATION :</p>\n';
      } else {
        // Standard English intro
        if (hasNoJobCode) {
          if (this.isCandidateTooOld()) {
            hEn +=
              '<p class="mt-4">In addition, no occupation is currently selected in your file, and the processing of your application cannot continue without an eligible occupation choice from you.</p>\n';
          } else if (isPforCmr && cmrAdmittedEn) {
            hEn +=
              '<p class="mt-4">However, no occupation is currently selected in your file, and the processing of your application cannot continue without an eligible occupation choice from you.</p>\n';
          } else if (isPforCmr) {
            hEn +=
              '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Royal Military College)</strong>, we have determined that you must undergo a reorientation. Indeed, no occupation is currently selected in your file, and the processing of your application cannot continue without an occupation choice from you.</p>\n';
          } else {
            hEn +=
              '<p class="mt-4">Following the analysis of your application file, we have determined that you must undergo a reorientation. Indeed, no occupation is currently selected in your file, and the processing of your application cannot continue without an occupation choice from you.</p>\n';
          }
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            hEn +=
              '<p class="mt-2">Here is the current status of the occupations in your file:</p>\n';
          } else if (this.isCandidateTooOld()) {
            hEn +=
              '<p class="mt-4">Here is the current status of the occupations in your file:</p>\n';
          } else if (isPforCmr && cmrAdmittedEn) {
            hEn +=
              '<p class="mt-4">However, following the review of your current occupation choices, a reorientation is required. Here is the current status of the occupations in your file:</p>\n';
          } else if (isPforCmr) {
            hEn +=
              '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (ROTP - Royal Military College)</strong>, here is the current status of the occupations in your file:</p>\n';
          } else if (isPforCivil) {
            hEn +=
              '<p class="mt-4">Following the analysis of your application file for the <strong>Regular Officer Training Plan (Civilian University ROTP)</strong>, here is the current status of the occupations in your file:</p>\n';
          } else {
            hEn +=
              '<p class="mt-4">Following the analysis of your application file, we have determined that you must undergo a reorientation. Here is the current status of the occupations in your file:</p>\n';
          }
        } else {
          hEn +=
            '<p class="mt-4">Here is the current status of the other occupations in your file:</p>\n';
        }
        hEn += '<ul class="list-disc pl-5 mt-2 mb-4">\n';
        for (const id of realDossierIds) {
          const nameEn = `${id} - ${this.getJobLinkMarkup(id, false, true)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonEn = "";
          if (s) {
            const reasonsEnList: string[] = [];
            if (s.isJobClosed) {
              if (s.isClosedAdmissionOnly) {
                reasonsEnList.push(
                  "We already have a sufficient number of applications to fill all remaining positions.",
                );
              } else if (this.isPforApplicant()) {
                reasonsEnList.push(
                  "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).",
                );
              } else {
                reasonsEnList.push(
                  "There are no longer positions available for this occupation.",
                );
              }
            }
            if (!s.isAgeAdmissible) {
              reasonsEnList.push(s.ageReasonEn);
            }
            if (!s.isCitizenshipAdmissible) {
              reasonsEnList.push(
                "For various reasons, this occupation is not accessible to permanent residents.",
              );
            }
            if (!s.isEducationAdmissible) {
              reasonsEnList.push(s.educationReasonEn);
            }
            if (!s.isMedicalAdmissible) {
              reasonsEnList.push(s.medicalReasonEn);
            }
            if (s.isExtraTestRequired && !s.isExtraTestAdmissible && s.extraTestReasonEn) {
              reasonsEnList.push(s.extraTestReasonEn);
            }

            if (reasonsEnList.length > 0) {
              reasonEn = `\n    <ul class="list-disc pl-5 mt-1 text-sm text-slate-600">\n      <li>${reasonsEnList.join("</li>\n      <li>")}</li>\n    </ul>`;
            } else {
              reasonEn =
                ": Admissible (reorientation initiated due to other elements of your file).";
            }
          }
          hEn += `  <li class="mt-1"><strong>${nameEn}</strong>${reasonEn}</li>\n`;
        }
        hEn += "</ul>\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          hEn +=
            '<p class="mt-4">Following the analysis of your application file, your current occupational choices are unavailable under ROTP or require a field of study different from your RMC admission.</p>\n';
        } else {
          hEn +=
            '<p class="mt-4">Following the analysis of your application file, we have determined that your current occupational choices are currently unavailable or you do not qualify for them based on our criteria.</p>\n';
        }
      }

      // Options English
      if (this.isCandidateTooOld() && jobIds.length === 0) {
        hEn += '<p class="mt-4 font-semibold text-slate-800">Conclusion :</p>\n';
        if (this.age() !== null && this.age()! >= 57) {
          hEn += '<p class="mt-2 text-sm">Given that you have reached or exceeded the maximum enrollment age (57 and older), no occupation can be offered to you within the Canadian Armed Forces.</p>\n';
        } else {
          hEn += '<p class="mt-2 text-sm">Given your current age, no eligible occupation is currently available for your application.</p>\n';
        }
      } else {
        hEn +=
          '<p class="mt-4 font-semibold text-slate-800">Here are the options available to you:</p>\n';
        if (hasTraitementClosed && hasAdmissionClosed) {
          const isPluralTraitementEn = closedTraitementJobs.length > 1;
          const opt1TitleEn = isPluralTraitementEn
            ? 'Option 1: Close my file and wait for the next open positions for my occupational choices (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1: Close my file and wait for the next open positions for my occupational choice (' + closedTraitementJobs.join(", ") + ')';
          const opt1OccupationsEn = isPluralTraitementEn
            ? 'your occupational choices (<strong>' + closedTraitementJobs.join(", ") + '</strong>)'
            : 'your occupational choice (<strong>' + closedTraitementJobs.join(", ") + '</strong>)';

          const isPluralAdmissionEn = closedAdmissionOnlyJobs.length > 1;
          const opt2TitleEn = isPluralAdmissionEn
            ? 'Option 2: Retain my occupational choices (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up'
            : 'Option 2: Retain my occupational choice (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up';
          const opt2OccupationsEn = isPluralAdmissionEn
            ? 'your occupational choices (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)'
            : 'your occupational choice (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)';
          const opt2ReferEn = isPluralAdmissionEn ? 'your occupational choices' : 'your occupational choice';

          hEn +=
            '<p class="mt-2 text-sm"><strong>' + opt1TitleEn + '</strong><br>You can retain ' + opt1OccupationsEn + ' and wait until next April for positions to open. However, <span style="background-color: #fef08a; font-weight: bold;">your file will be closed immediately</span> and it will be <span style="background-color: #fef08a; font-weight: bold;">your sole responsibility to contact your recruiting centre at the beginning of next March to reopen your file and continue the recruitment process</span>.</p>\n';
          hEn +=
            '<p class="mt-4 text-sm"><strong>' + opt2TitleEn + '</strong><br>You can retain ' + opt2OccupationsEn + ' in case another candidate already admitted does not complete the process and a position opens up. However, <span style="background-color: #fef08a; font-weight: bold;">your file will be closed immediately</span> and it will be <span style="background-color: #fef08a; font-weight: bold;">your sole responsibility to contact your recruiting centre every three months</span> to find out if positions have opened up for ' + opt2ReferEn + ' in order to continue the recruitment process.</p>\n';
          hEn +=
            '<p class="mt-4 text-sm"><strong>Option 3: Choose another occupation from the list of eligible occupations</strong><br>You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.</p>\n';
        } else if (hasTraitementClosed) {
          const isPluralTraitementEn = closedTraitementJobs.length > 1;
          const opt1TitleEn = isPluralTraitementEn
            ? 'Option 1: Close my file and wait for the next open positions for my occupational choices (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1: Close my file and wait for the next open positions for my occupational choice (' + closedTraitementJobs.join(", ") + ')';
          const opt1OccupationsEn = isPluralTraitementEn
            ? 'your occupational choices (<strong>' + closedTraitementJobs.join(", ") + '</strong>)'
            : 'your occupational choice (<strong>' + closedTraitementJobs.join(", ") + '</strong>)';
          hEn +=
            '<p class="mt-2 text-sm"><strong>' + opt1TitleEn + '</strong><br>You can retain ' + opt1OccupationsEn + ' and wait until next April for positions to open. However, <span style="background-color: #fef08a; font-weight: bold;">your file will be closed immediately</span> and it will be <span style="background-color: #fef08a; font-weight: bold;">your sole responsibility to contact your recruiting centre at the beginning of next March to reopen your file and continue the recruitment process</span>.</p>\n';
          hEn +=
            '<p class="mt-4 text-sm"><strong>Option 2: Choose another occupation from the list of eligible occupations</strong><br>You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.</p>\n';
        } else if (hasAdmissionClosed) {
          const isPluralAdmissionEn = closedAdmissionOnlyJobs.length > 1;
          const opt1TitleEn = isPluralAdmissionEn
            ? 'Option 1: Retain my occupational choices (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up'
            : 'Option 1: Retain my occupational choice (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up';
          const opt1OccupationsEn = isPluralAdmissionEn
            ? 'your occupational choices (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)'
            : 'your occupational choice (<strong>' + closedAdmissionOnlyJobs.join(", ") + '</strong>)';
          const opt1ReferEn = isPluralAdmissionEn ? 'your occupational choices' : 'your occupational choice';
          hEn +=
            '<p class="mt-2 text-sm"><strong>' + opt1TitleEn + '</strong><br>You can retain ' + opt1OccupationsEn + ' in case another candidate already admitted does not complete the process and a position opens up. However, <span style="background-color: #fef08a; font-weight: bold;">your file will be closed immediately</span> and it will be <span style="background-color: #fef08a; font-weight: bold;">your sole responsibility to contact your recruiting centre every three months</span> to find out if positions have opened up for ' + opt1ReferEn + ' in order to continue the recruitment process.</p>\n';
          hEn +=
            '<p class="mt-4 text-sm"><strong>Option 2: Choose another occupation from the list of eligible occupations</strong><br>You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.</p>\n';
        } else {
          hEn +=
            '<p class="mt-2 text-sm"><strong>Choose another occupation from the list of eligible occupations</strong><br>You must redirect your application to an occupational choice for which you are eligible to continue the enrollment process. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.</p>\n';
        }
      }

      // Eligible Jobs English Division
      hEn +=
        '<div class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">\n';
      hEn +=
        '<p class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">ELIGIBLE OCCUPATIONS:</p>\n';

      if (isPilotEligible) {
        hEn +=
          '<div class="mt-2 mb-3 p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs" style="margin-top: 8px; margin-bottom: 12px; padding: 10px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; font-size: 13px; color: #78350f;">\n' +
          '  <strong>Important – Selection of the Pilot Occupation (00183):</strong> As the Pilot occupation is highly competitive (very limited number of positions available), if you choose Pilot, you must also select a second occupation from the list of eligible occupations.\n' +
          '</div>\n';
      }

      if (listNCM.length === 0 && listOFF.length === 0) {
        hEn += '<p class="mt-2 text-slate-700 italic">' + (this.isPforApplicant() ? "No matching open ROTP occupations are currently available for the selected options." : "No matching occupations available.") + '</p>\n';
      } else {
        hEn += renderAllEligibleJobsHtml(listNCM, listOFF, false);
      }
      hEn += "</div>\n";

      // Conclusion English
      if (mergeTasks) {
        hEn +=
          '<p class="mt-6 font-semibold text-slate-800">Next steps:</p>\n';
        hEn +=
          "<p>Due to the high volume of applications, we must prioritize processing files for which all tasks are completed. We therefore invite you to:</p>\n";
        hEn += '<ul class="list-disc pl-5 mt-1 mb-2 text-sm text-slate-700">\n';
        hEn +=
          '  <li>Visit your portal (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) to correct the tasks indicated above without delay;</li>\n';
        if (isPRAdmissible) {
          hEn +=
            '  <li>If not already done, return to your portal (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) to upload the transcripts from your country of origin (in their original language if they are in English or French, or accompanied by an official translation if needed);</li>\n';
        }
        hEn +=
          "  <li>Reply directly to this email with your reorientation choice or your new occupational choices to update your file.</li>\n";
        hEn += "</ul>\n";
      } else {
        if (isPRAdmissible) {
          hEn +=
            '<p class="mt-4 text-sm text-slate-700">Additionally, if not already done, please return to your portal (<a href="https://www.cafoap-pclfac.forces.gc.ca/" class="text-blue-600 hover:underline">https://www.cafoap-pclfac.forces.gc.ca/</a>) to upload the transcripts from your country of origin. These documents must be in English or French, or accompanied by an official translation if needed.</p>\n';
        }
        hEn +=
          '<p class="mt-4">We thank you for your interest in the Canadian Armed Forces. Please let us know your decision by replying directly to this email so that we can update your file.</p>\n';
      }

      // Warning English
      hEn +=
        '<p class="mt-4 text-sm text-slate-600">If you do not take any action, your file will be automatically deactivated after 30 days.</p>\n';

      // Signature English
      hEn += '<p>' + this.sharedState.getHtmlSignatureEn() + '</p>\n';

      const isEnglishActive = this.translationService.isEnglish();
      if (isEnglishActive) {
        return '<p><span style="background-color: yellow; font-weight: bold; padding: 2px 4px; border-radius: 3px;">Le message en français suivra.</span></p>\n' +
          hEn +
          '<hr class="my-6 border-slate-200" />\n' +
          hFr;
      } else {
        return '<p><span style="background-color: yellow; font-weight: bold; padding: 2px 4px; border-radius: 3px;">English message will follow.</span></p>\n' +
          hFr +
          '<hr class="my-6 border-slate-200" />\n' +
          hEn;
      }
    } else {
      // ------------------ PLAIN TEXT VERSION ------------------
      let pFr = "";
      const isPforCmr = this.isPforApplicant() && this.pforType() === "cmr";
      const isPforCivil = this.isPforApplicant() && this.pforType() === "civil";
      const cmrAdmittedFr = this.getCmrAdmittedDomainsFr();

      pFr += "Bonjour,\n\n";

      if (isPforCmr && cmrAdmittedFr) {
        pFr += `Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} ! Nous tenons à vous féliciter chaleureusement pour cette admission.\n\n`;
      }

      if (mergeTasks) {
        if (isPforCmr && cmrAdmittedFr) {
          pFr += "Toutefois, certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        } else if (isPforCmr) {
          pFr += "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal), nous constatons que certaines actions de votre part sont requises. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        } else if (isPforCivil) {
          pFr += "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Universités civiles), nous constatons que certaines actions de votre part sont requises. Vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        } else {
          pFr += "Suite à l'analyse de votre dossier de candidature, nous constatons que certaines actions de votre part sont requises pour nous permettre de poursuivre le traitement de votre demande. En effet, vous devez à la fois apporter des corrections aux tâches qui vous ont été réattribuées sur votre portail et faire l'objet d'une réorientation pour vos choix de métiers.\n\n";
        }
        const tasksTxt = this.sharedState.taskEmailFr();
        const frParts = tasksTxt.split("Bonjour,");
        if (frParts.length > 1) {
          let frBodyPart: string[] = [];
          if (frParts[1].includes("Si vous ne prenez aucune action, votre dossier sera désactivé")) {
            frBodyPart = frParts[1].split("Si vous ne prenez aucune action, votre dossier sera désactivé");
          } else {
            frBodyPart = frParts[1].split("\n\nEn raison du volume");
          }
          if (frBodyPart.length > 0 && frBodyPart[0].trim().length > 0) {
            let taskTextFr = frBodyPart[0].trim();
            taskTextFr = taskTextFr
              .replace(
                /Nous avons procédé à l'évaluation de vos documents.*?pour nous permettre de poursuivre le traitement\.\s*/gis,
                ""
              )
              .trim();
            pFr += "==================================================\n";
            pFr += "1. TÂCHES ET COMMUNICATIONS À CORRIGER SUR VOTRE PORTAIL :\n";
            pFr += "==================================================\n\n";
            pFr += taskTextFr + "\n\n";
          }
        }
        pFr += "==================================================\n";
        pFr += "2. STATUT DE VOS CHOIX DE MÉTIERS ACTUELS ET RÉORIENTATION REQUISE :\n";
        pFr += "==================================================\n\n";
      }

      // Intro French
      if (this.isCandidateTooOld()) {
        if (this.age() !== null && this.age()! >= 57) {
          pFr += "Suite à l'analyse de votre dossier de candidature, nous vous informons que vous dépassez l'âge maximal d'admissibilité pour l'enrôlement dans les Forces armées canadiennes (l'âge maximal d'admissibilité est de 56 ans, 57 ans et plus étant automatiquement inadmissible).\n\n";
        } else {
          pFr += "Suite à l'analyse de votre dossier de candidature, nous constatons que vous devez faire l'objet d'une réorientation. En effet, vous dépassez l'âge maximal d'admissibilité pour vos choix de métiers.\n\n";
        }
      } else if (isPforCmr && cmrAdmittedFr) {
        pFr += `Nous avons le plaisir de vous informer que, suite à l'évaluation de vos relevés de notes et de votre potentiel académique par le Collège militaire royal du Canada (CMR) pour le Programme de formation des officiers de la force régulière (PFOR), vous avez été admis(e) au CMR dans le(s) domaine(s) d'études suivant(s) : ${cmrAdmittedFr} ! Nous tenons à vous féliciter chaleureusement pour cette admission.\n\n`;
      }

      if (hasNoJobCode) {
        if (this.isCandidateTooOld()) {
          pFr +=
            "De plus, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.\n\n";
        } else if (isPforCmr && cmrAdmittedFr) {
          pFr +=
            "Toutefois, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier admissible ne soit fait de votre part.\n\n";
        } else if (isPforCmr) {
          pFr +=
            "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal), nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.\n\n";
        } else {
          pFr +=
            "Suite à l'analyse de votre dossier de candidature, nous constatons que vous devez faire l'objet d'une réorientation. En effet, aucun métier n'est actuellement sélectionné à votre dossier et le traitement de votre demande ne peut pas se poursuivre sans qu'un choix de métier ne soit fait de votre part.\n\n";
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            pFr +=
              "Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (this.isCandidateTooOld()) {
            pFr +=
              "Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (isPforCmr && cmrAdmittedFr) {
            pFr +=
              "Toutefois, suite à l'analyse de vos choix de métiers actuels, nous constatons qu'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (isPforCmr) {
            pFr +=
              "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Collège militaire royal), nous constatons qu'une réorientation est nécessaire. Voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else if (isPforCivil) {
            pFr +=
              "Suite à l'analyse de votre dossier de candidature pour le Programme de formation des officiers de la force régulière (PFOR - Universités civiles), nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :\n";
          } else {
            pFr +=
              "Suite à l'analyse de votre dossier de candidature, nous constatons que vous devez faire l'objet d'une réorientation. En effet, voici le statut des métiers actuellement inscrits à votre dossier :\n";
          }
        } else {
          pFr +=
            "Voici le statut des autres métiers inscrits à votre dossier :\n";
        }
        for (const id of realDossierIds) {
          const name = `${id} - ${this.getJobLinkMarkup(id, true, false)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonFr = "";
          if (s) {
            const reasonsFrList: string[] = [];
            if (s.isJobClosed) {
              if (s.isClosedAdmissionOnly) {
                reasonsFrList.push(
                  "Nous avons déjà un nombre suffisant de candidatures pour combler toutes les positions restantes.",
                );
              } else if (this.isPforApplicant()) {
                reasonsFrList.push(
                  "Il n'y a plus de postes disponibles pour ce métier dans le cadre du Programme de formation des officiers de la force régulière (PFOR).",
                );
              } else {
                reasonsFrList.push(
                  "Il n'y a plus de postes disponibles pour ce métier.",
                );
              }
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
            if (s.isExtraTestRequired && !s.isExtraTestAdmissible && s.extraTestReasonFr) {
              reasonsFrList.push(s.extraTestReasonFr);
            }

            if (reasonsFrList.length > 0) {
              reasonFr = `\n    - ${reasonsFrList.join("\n    - ")}`;
            } else {
              reasonFr =
                " : Admissible (réorientation initiée pour d'autres éléments).";
            }
          }
          pFr += `- ${name}${reasonFr}\n`;
        }
        pFr += "\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          pFr +=
            "Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles sous le PFOR ou requièrent un domaine d'études différent de votre admission au CMR.\n\n";
        } else {
          pFr +=
            "Suite à l'analyse de votre dossier de candidature, nous constatons que vos choix de métiers actuels ne sont pas disponibles ou que vous n'y êtes pas admissible.\n\n";
        }
      }

      // Options French
      if (this.isCandidateTooOld() && jobIds.length === 0) {
        pFr += "Conclusion :\n";
        if (this.age() !== null && this.age()! >= 57) {
          pFr += "Étant donné que vous avez atteint ou dépassé l'âge maximal d'enrôlement (57 ans et plus), aucun métier ne peut vous être offert au sein des Forces armées canadiennes.\n\n";
        } else {
          pFr += "Étant donné votre âge actuel, aucun métier admissible n'est actuellement disponible pour votre candidature.\n\n";
        }
      } else {
        pFr += "Voici les options qui s'offrent à vous :\n\n";
        if (hasTraitementClosed && hasAdmissionClosed) {
          const isPluralTraitement = closedTraitementJobs.length > 1;
          const opt1Title = isPluralTraitement
            ? 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mes choix de métiers (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mon choix de métier (' + closedTraitementJobs.join(", ") + ')';
          const opt1MetiersDesc = isPluralTraitement
            ? 'vos choix de métiers (' + closedTraitementJobs.join(", ") + ')'
            : 'votre choix de métier (' + closedTraitementJobs.join(", ") + ')';

          const isPluralAdmission = closedAdmissionOnlyJobs.length > 1;
          const opt2Title = isPluralAdmission
            ? 'Option 2 : Conserver mes choix de métiers (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait'
            : 'Option 2 : Conserver mon choix de métier (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait';
          const opt2MetiersDesc = isPluralAdmission
            ? 'vos choix de métiers (' + closedAdmissionOnlyJobs.join(", ") + ')'
            : 'votre choix de métier (' + closedAdmissionOnlyJobs.join(", ") + ')';
          const opt2Refer = isPluralAdmission ? 'vos choix de métiers' : 'votre choix de métier';

          pFr += opt1Title + "\n";
          pFr += "Vous pouvez conserver " + opt1MetiersDesc + " et attendre que les prochaines positions ouvrent en avril prochain. Cependant, votre dossier sera fermé dès maintenant et il sera de votre entière responsabilité de contacter votre centre de recrutement au début du mois de mars prochain pour rouvrir votre dossier et poursuivre le processus de recrutement.\n\n";

          pFr += opt2Title + "\n";
          pFr += "Vous pouvez conserver " + opt2MetiersDesc + " au cas où un autre postulant déjà admis ne termine pas le processus et qu’une position se libère. Cependant, votre dossier sera fermé dès maintenant et il sera de votre entière responsabilité de contacter votre centre de recrutement à tous les trois mois pour savoir si des positions se seraient libérées pour " + opt2Refer + " afin de poursuivre le processus de recrutement.\n\n";

          pFr += "Option 3 : Choisir un autre métier parmi la liste des métiers admissibles\n";
          pFr += "Vous pouvez réorienter votre candidature vers d'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.\n\n";
        } else if (hasTraitementClosed) {
          const isPluralTraitement = closedTraitementJobs.length > 1;
          const opt1Title = isPluralTraitement
            ? 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mes choix de métiers (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1 : Fermer mon dossier et attendre les prochaines positions ouvertes pour mon choix de métier (' + closedTraitementJobs.join(", ") + ')';
          const opt1MetiersDesc = isPluralTraitement
            ? 'vos choix de métiers (' + closedTraitementJobs.join(", ") + ')'
            : 'votre choix de métier (' + closedTraitementJobs.join(", ") + ')';
          pFr += opt1Title + "\n";
          pFr += "Vous pouvez conserver " + opt1MetiersDesc + " et attendre que les prochaines positions ouvrent en avril prochain. Cependant, votre dossier sera fermé dès maintenant et il sera de votre entière responsabilité de contacter votre centre de recrutement au début du mois de mars prochain pour rouvrir votre dossier et poursuivre le processus de recrutement.\n\n";
          pFr += "Option 2 : Choisir un autre métier parmi la liste des métiers admissibles\n";
          pFr += "Vous pouvez réorienter votre candidature vers d'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.\n\n";
        } else if (hasAdmissionClosed) {
          const isPluralAdmission = closedAdmissionOnlyJobs.length > 1;
          const opt1Title = isPluralAdmission
            ? 'Option 1 : Conserver mes choix de métiers (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait'
            : 'Option 1 : Conserver mon choix de métier (' + closedAdmissionOnlyJobs.join(", ") + ') au cas où une position se libèrerait';
          const opt1MetiersDesc = isPluralAdmission
            ? 'vos choix de métiers (' + closedAdmissionOnlyJobs.join(", ") + ')'
            : 'votre choix de métier (' + closedAdmissionOnlyJobs.join(", ") + ')';
          const opt1Refer = isPluralAdmission ? 'vos choix de métiers' : 'votre choix de métier';
          pFr += opt1Title + "\n";
          pFr += "Vous pouvez conserver " + opt1MetiersDesc + " au cas où un autre postulant déjà admis ne termine pas le processus et qu’une position se libère. Cependant, votre dossier sera fermé dès maintenant et il sera de votre entière responsabilité de contacter votre centre de recrutement à tous les trois mois pour savoir si des positions se seraient libérées pour " + opt1Refer + " afin de poursuivre le processus de recrutement.\n\n";
          pFr += "Option 2 : Choisir un autre métier parmi la liste des métiers admissibles\n";
          pFr += "Vous pouvez réorienter votre candidature vers d'autres choix de métiers admissibles dès maintenant. Pour ces métiers, l'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Consultez la liste ci-dessous.\n\n";
        } else {
          pFr += "Choisir un autre métier parmi la liste des métiers admissibles\n";
          pFr += "Vous devez réorienter votre candidature vers un choix de métier pour lequel vous êtes admissible afin de poursuivre le processus d'enrôlement. Pour ces métiers, l'admission est ouverte et le traitement de votre dossier se poursuivra immédiatement. Veuillez consulter la liste ci-dessous.\n\n";
        }
      }

      // Eligible Jobs French Division
      pFr += "--------------------------------------------------\n";
      pFr += "MÉTIERS ADMISSIBLES :\n";
      pFr += "--------------------------------------------------\n";

      if (isPilotEligible) {
        pFr += "\nAttention – Choix du métier de Pilote (00183) :\n";
        pFr += "Le métier de Pilote étant fortement contingenté (nombre de places très limité), si vous choisissez ce métier, vous devez obligatoirement sélectionner un deuxième métier parmi la liste des métiers admissibles.\n\n";
      }

      if (listNCM.length === 0 && listOFF.length === 0) {
        pFr += (this.isPforApplicant() ? "Aucun métier PFOR ouvert correspondant n'est disponible actuellement pour la sélection effectuée.\n\n" : "Aucun métier correspondant disponible.\n\n");
      } else {
        pFr += renderAllEligibleJobsPlain(listNCM, listOFF, true);
      }

      // Conclusion French
      if (mergeTasks) {
        pFr += "\nProchaines étapes :\n";
        pFr += "En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées. Nous vous invitons donc à :\n";
        pFr += "- Vous rendre sur votre portail (https://www.cafoap-pclfac.forces.gc.ca/) afin de corriger sans délai les tâches indiquées ci-dessus ;\n";
        if (isPRAdmissible) {
          pFr += "- Si ce n'est pas déjà fait, retourner sur votre portail (https://www.cafoap-pclfac.forces.gc.ca/) afin d'y déposer les relevés de notes de votre pays d'origine (dans leur langue d'origine s'ils sont en français ou en anglais, ou accompagnés d'une traduction officielle au besoin) ;\n";
        }
        pFr += "- Répondre directement à ce courriel avec votre choix de réorientation ou vos nouveaux choix de métiers pour mettre à jour votre dossier.\n\n";
      } else {
        if (isPRAdmissible) {
          pFr +=
            "\nDe plus, si ce n'est pas déjà fait, veuillez retourner sur votre portail (https://www.cafoap-pclfac.forces.gc.ca/) afin d'y déposer les relevés de notes de votre pays d'origine. Ceux-ci doivent être rédigés en français ou en anglais, ou être accompagnés d'une traduction officielle au besoin.\n";
        }
        pFr +=
          "\nNous vous remercions pour votre intérêt envers les Forces armées canadiennes. Veuillez nous faire part de votre décision en répondant directement à ce courriel afin de poursuivre ou de mettre à jour votre dossier.\n\n";
      }

      // Warning French
      pFr +=
        "Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.\n\n";

      // Signature French
      pFr += this.sharedState.getSignatureFr() + "\n\n";

      let pEn = "";
      // ENGLISH SECTION
      pEn += "Hello,\n\n";

      const cmrAdmittedEn = this.getCmrAdmittedDomainsEn();
      if (this.isCandidateTooOld()) {
        if (this.age() !== null && this.age()! >= 57) {
          pEn += "Following the analysis of your application file, we inform you that you exceed the maximum eligibility age for enrollment in the Canadian Armed Forces (maximum eligibility age is 56, 57 and older being automatically ineligible).\n\n";
        } else {
          pEn += "Following the analysis of your application file, we have determined that you must undergo a reorientation. Indeed, you exceed the maximum eligibility age for your selected occupations.\n\n";
        }
      } else if (isPforCmr && cmrAdmittedEn) {
        pEn += `We are pleased to inform you that, following the assessment of your transcripts and academic potential by the Royal Military College of Canada (RMC) for the Regular Officer Training Plan (ROTP), you have been admitted to RMC in the following field(s) of study: ${cmrAdmittedEn}! We would like to warmly congratulate you on your admission.\n\n`;
      }

      if (mergeTasks) {
        if (isPforCmr && cmrAdmittedEn) {
          pEn += "However, actions are required on your part to proceed with processing your application. Specifically, you must correct the reassigned tasks on your portal and undergo a reorientation of your occupational choices.\n\n";
        } else if (isPforCmr) {
          pEn += "Following the analysis of your application file for the Regular Officer Training Plan (ROTP - Royal Military College), actions are required on your part. Specifically, you must correct the reassigned tasks on your portal and undergo a reorientation of your occupational choices.\n\n";
        } else if (isPforCivil) {
          pEn += "Following the analysis of your application file for the Regular Officer Training Plan (Civilian University ROTP), actions are required on your part. Specifically, you must correct the reassigned tasks on your portal and undergo a reorientation of your occupational choices.\n\n";
        } else {
          pEn += "Following the analysis of your application file, we have determined that actions are required on your part to proceed with processing your application. Specifically, you must correct the reassigned tasks on your portal and undergo a reorientation of your occupational choices.\n\n";
        }
        const tasksTxt = this.sharedState.taskEmailFr();
        const enParts = tasksTxt.split("Hello,");
        if (enParts.length > 1) {
          let enBodyPart: string[] = [];
          if (enParts[1].includes("If you take no action, your file will be automatically deactivated")) {
            enBodyPart = enParts[1].split("If you take no action, your file will be automatically deactivated");
          } else {
            enBodyPart = enParts[1].split("\n\nDue to the high volume");
          }
          if (enBodyPart.length > 0 && enBodyPart[0].trim().length > 0) {
            let taskTextEn = enBodyPart[0].trim();
            taskTextEn = taskTextEn
              .replace(
                /We have evaluated your documents.*?to allow us to continue processing\.\s*/gis,
                ""
              )
              .trim();
            pEn += "==================================================\n";
            pEn += "1. TASKS AND COMMUNICATIONS TO CORRECT ON YOUR PORTAL :\n";
            pEn += "==================================================\n\n";
            pEn += taskTextEn + "\n\n";
          }
        }
        pEn += "==================================================\n";
        pEn += "2. STATUS OF YOUR CURRENT OCCUPATIONS AND REQUIRED REORIENTATION :\n";
        pEn += "==================================================\n\n";
      }

      // Intro English
      if (hasNoJobCode) {
        if (this.isCandidateTooOld()) {
          pEn +=
            "In addition, no occupation is currently selected in your file, and the processing of your application cannot continue without an eligible occupation choice from you.\n\n";
        } else if (isPforCmr && cmrAdmittedEn) {
          pEn +=
            "However, no occupation is currently selected in your file, and the processing of your application cannot continue without an eligible occupation choice from you.\n\n";
        } else if (isPforCmr) {
          pEn +=
            "Following the analysis of your application file for the Regular Officer Training Plan (ROTP - Royal Military College), we have determined that you must undergo a reorientation. Indeed, no occupation is currently selected in your file, and the processing of your application cannot continue without an occupation choice from you.\n\n";
        } else {
          pEn +=
            "Following the analysis of your application file, we have determined that you must undergo a reorientation. Indeed, no occupation is currently selected in your file, and the processing of your application cannot continue without an occupation choice from you.\n\n";
        }
      }

      if (realDossierIds.length > 0) {
        if (!hasNoJobCode) {
          if (mergeTasks) {
            pEn +=
              "Here is the current status of the occupations in your file:\n";
          } else if (this.isCandidateTooOld()) {
            pEn +=
              "Here is the current status of the occupations in your file:\n";
          } else if (isPforCmr && cmrAdmittedEn) {
            pEn +=
              "However, following the review of your current occupation choices, a reorientation is required. Here is the current status of the occupations in your file:\n";
          } else if (isPforCmr) {
            pEn +=
              "Following the analysis of your application file for the Regular Officer Training Plan (ROTP - Royal Military College), here is the current status of the occupations in your file:\n";
          } else if (isPforCivil) {
            pEn +=
              "Following the analysis of your application file for the Regular Officer Training Plan (Civilian University ROTP), here is the current status of the occupations in your file:\n";
          } else {
            pEn +=
              "Following the analysis of your application file, we have determined that you must undergo a reorientation. Here is the current status of the occupations in your file:\n";
          }
        } else {
          pEn +=
            "Here is the current status of the other occupations in your file:\n";
        }
        for (const id of realDossierIds) {
          const nameEn = `${id} - ${this.getJobLinkMarkup(id, false, false)}`;
          const s = this.evaluateJobAdmissibility(id);
          let reasonEn = "";
          if (s) {
            const reasonsEnList: string[] = [];
            if (s.isJobClosed) {
              if (s.isClosedAdmissionOnly) {
                reasonsEnList.push(
                  "We already have a sufficient number of applications to fill all remaining positions.",
                );
              } else if (this.isPforApplicant()) {
                reasonsEnList.push(
                  "There are no longer positions available for this occupation under the Regular Officer Training Plan (ROTP).",
                );
              } else {
                reasonsEnList.push(
                  "There are no longer positions available for this occupation.",
                );
              }
            }
            if (!s.isAgeAdmissible) {
              reasonsEnList.push(s.ageReasonEn);
            }
            if (!s.isCitizenshipAdmissible) {
              reasonsEnList.push(
                "For various reasons, this occupation is not accessible to permanent residents.",
              );
            }
            if (!s.isEducationAdmissible) {
              reasonsEnList.push(s.educationReasonEn);
            }
            if (!s.isMedicalAdmissible) {
              reasonsEnList.push(s.medicalReasonEn);
            }
            if (s.isExtraTestRequired && !s.isExtraTestAdmissible && s.extraTestReasonEn) {
              reasonsEnList.push(s.extraTestReasonEn);
            }

            if (reasonsEnList.length > 0) {
              reasonEn = `\n    - ${reasonsEnList.join("\n    - ")}`;
            } else {
              reasonEn =
                ": Admissible (reorientation initiated for other elements).";
            }
          }
          pEn += `- ${nameEn}${reasonEn}\n`;
        }
        pEn += "\n";
      } else if (!hasNoJobCode) {
        if (isPforCmr) {
          pEn +=
            "Following the analysis of your application file, your current occupational choices are unavailable under ROTP or require a field of study different from your RMC admission.\n\n";
        } else {
          pEn +=
            "Following the analysis of your application file, we have determined that your current occupational choices are currently unavailable or you do not qualify for them based on our criteria.\n\n";
        }
      }

      // Options English
      if (this.isCandidateTooOld() && jobIds.length === 0) {
        pEn += "Conclusion :\n";
        if (this.age() !== null && this.age()! >= 57) {
          pEn += "Given that you have reached or exceeded the maximum enrollment age (57 and older), no occupation can be offered to you within the Canadian Armed Forces.\n\n";
        } else {
          pEn += "Given your current age, no eligible occupation is currently available for your application.\n\n";
        }
      } else {
        pEn += "Here are the options available to you:\n\n";
        if (hasTraitementClosed && hasAdmissionClosed) {
          const isPluralTraitementEn = closedTraitementJobs.length > 1;
          const opt1TitleEn = isPluralTraitementEn
            ? 'Option 1: Close my file and wait for the next open positions for my occupational choices (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1: Close my file and wait for the next open positions for my occupational choice (' + closedTraitementJobs.join(", ") + ')';
          const opt1OccupationsEn = isPluralTraitementEn
            ? 'your occupational choices (' + closedTraitementJobs.join(", ") + ')'
            : 'your occupational choice (' + closedTraitementJobs.join(", ") + ')';

          const isPluralAdmissionEn = closedAdmissionOnlyJobs.length > 1;
          const opt2TitleEn = isPluralAdmissionEn
            ? 'Option 2: Retain my occupational choices (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up'
            : 'Option 2: Retain my occupational choice (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up';
          const opt2OccupationsEn = isPluralAdmissionEn
            ? 'your occupational choices (' + closedAdmissionOnlyJobs.join(", ") + ')'
            : 'your occupational choice (' + closedAdmissionOnlyJobs.join(", ") + ')';
          const opt2ReferEn = isPluralAdmissionEn ? 'your occupational choices' : 'your occupational choice';

          pEn += opt1TitleEn + "\n";
          pEn += "You can retain " + opt1OccupationsEn + " and wait until next April for positions to open. However, your file will be closed immediately and it will be your sole responsibility to contact your recruiting centre at the beginning of next March to reopen your file and continue the recruitment process.\n\n";

          pEn += opt2TitleEn + "\n";
          pEn += "You can retain " + opt2OccupationsEn + " in case another candidate already admitted does not complete the process and a position opens up. However, your file will be closed immediately and it will be your sole responsibility to contact your recruiting centre every three months to find out if positions have opened up for " + opt2ReferEn + " in order to continue the recruitment process.\n\n";

          pEn += "Option 3: Choose another occupation from the list of eligible occupations\n";
          pEn += "You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.\n\n";
        } else if (hasTraitementClosed) {
          const isPluralTraitementEn = closedTraitementJobs.length > 1;
          const opt1TitleEn = isPluralTraitementEn
            ? 'Option 1: Close my file and wait for the next open positions for my occupational choices (' + closedTraitementJobs.join(", ") + ')'
            : 'Option 1: Close my file and wait for the next open positions for my occupational choice (' + closedTraitementJobs.join(", ") + ')';
          const opt1OccupationsEn = isPluralTraitementEn
            ? 'your occupational choices (' + closedTraitementJobs.join(", ") + ')'
            : 'your occupational choice (' + closedTraitementJobs.join(", ") + ')';
          pEn += opt1TitleEn + "\n";
          pEn += "You can retain " + opt1OccupationsEn + " and wait until next April for positions to open. However, your file will be closed immediately and it will be your sole responsibility to contact your recruiting centre at the beginning of next March to reopen your file and continue the recruitment process.\n\n";
          pEn += "Option 2: Choose another occupation from the list of eligible occupations\n";
          pEn += "You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.\n\n";
        } else if (hasAdmissionClosed) {
          const isPluralAdmissionEn = closedAdmissionOnlyJobs.length > 1;
          const opt1TitleEn = isPluralAdmissionEn
            ? 'Option 1: Retain my occupational choices (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up'
            : 'Option 1: Retain my occupational choice (' + closedAdmissionOnlyJobs.join(", ") + ') in case a position opens up';
          const opt1OccupationsEn = isPluralAdmissionEn
            ? 'your occupational choices (' + closedAdmissionOnlyJobs.join(", ") + ')'
            : 'your occupational choice (' + closedAdmissionOnlyJobs.join(", ") + ')';
          const opt1ReferEn = isPluralAdmissionEn ? 'your occupational choices' : 'your occupational choice';
          pEn += opt1TitleEn + "\n";
          pEn += "You can retain " + opt1OccupationsEn + " in case another candidate already admitted does not complete the process and a position opens up. However, your file will be closed immediately and it will be your sole responsibility to contact your recruiting centre every three months to find out if positions have opened up for " + opt1ReferEn + " in order to continue the recruitment process.\n\n";
          pEn += "Option 2: Choose another occupation from the list of eligible occupations\n";
          pEn += "You can redirect your application to other eligible occupational choices right now. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.\n\n";
        } else {
          pEn += "Choose another occupation from the list of eligible occupations\n";
          pEn += "You must redirect your application to an occupational choice for which you are eligible to continue the enrollment process. For these occupations, admission is open and the processing of your application will continue immediately. Please consult the list below.\n\n";
        }
      }

      // Eligible Jobs English Division
      pEn += "--------------------------------------------------\n";
      pEn += "ELIGIBLE OCCUPATIONS:\n";
      pEn += "--------------------------------------------------\n";

      if (isPilotEligible) {
        pEn += "\nImportant – Selection of the Pilot Occupation (00183):\n";
        pEn += "As the Pilot occupation is highly competitive (very limited number of positions available), if you choose Pilot, you must also select a second occupation from the list of eligible occupations.\n\n";
      }

      if (listNCM.length === 0 && listOFF.length === 0) {
        pEn += (this.isPforApplicant() ? "No matching open ROTP occupations are currently available for the selected options.\n\n" : "No matching occupations available.\n\n");
      } else {
        pEn += renderAllEligibleJobsPlain(listNCM, listOFF, false);
      }

      // Conclusion English
      if (mergeTasks) {
        pEn += "\nNext steps:\n";
        pEn += "Due to the high volume of applications, we must prioritize processing files for which all tasks are completed. We therefore invite you to:\n";
        pEn += "- Visit your portal (https://www.cafoap-pclfac.forces.gc.ca/) to correct the tasks indicated above without delay;\n";
        if (isPRAdmissible) {
          pEn += "- If not already done, return to your portal (https://www.cafoap-pclfac.forces.gc.ca/) to upload the transcripts from your country of origin (in their original language if they are in English or French, or accompanied by an official translation if needed);\n";
        }
        pEn += "- Reply directly to this email with your reorientation choice or your new occupational choices to update your file.\n\n";
      } else {
        if (isPRAdmissible) {
          pEn +=
            "\nAdditionally, if not already done, please return to your portal (https://www.cafoap-pclfac.forces.gc.ca/) to upload the transcripts from your country of origin. These documents must be in English or French, or accompanied by an official translation if needed.\n";
        }
        pEn +=
          "\nWe thank you for your interest in the Canadian Armed Forces. Please let us know your decision by replying directly to this email so that we can update your file.\n\n";
      }

      // Warning English
      pEn +=
        "If you do not take any action, your file will be automatically deactivated after 30 days.\n";

      // Signature English
      pEn += this.sharedState.getSignatureEn() + "\n";

      const divider = "______________________________________________________________________________\n\n";
      const isEnglishActive = this.translationService.isEnglish();
      if (isEnglishActive) {
        return "Le message en français suivra.\n\n" + pEn + divider + pFr;
      } else {
        return "English message will follow.\n\n" + pFr + divider + pEn;
      }
    }
  }

  async copyBilingualEmail() {
    try {
      const htmlContent = this.buildBilingualEmail(true);
      const textContent = this.buildBilingualEmail(false);
      const subject = "Forces armées canadiennes/Canadian Armed Forces";

      if (navigator.clipboard && navigator.clipboard.write) {
        const typeHtml = "text/html";
        const typeText = "text/plain";

        const blobHtml = new Blob([htmlContent], { type: typeHtml });
        const blobText = new Blob([textContent], { type: typeText });

        const data = [
          new ClipboardItem({
            [typeHtml]: blobHtml,
            [typeText]: blobText,
          }),
        ];

        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(textContent);
      }

      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);

      // Open email client
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}`;
      window.location.href = mailtoLink;
    } catch (err) {
      console.error("Failed to copy reorientation email", err);
    }
  }

  exportToOutlook() {
    return this.copyBilingualEmail();
  }

  getReoContentPlainFr() {
    return this.buildBilingualEmail(false);
  }

  getReoContentPlainEn() {
    return this.buildBilingualEmail(false);
  }

  getReoContentHtmlFr() {
    return this.buildBilingualEmail(true);
  }

  getReoContentHtmlEn() {
    return this.buildBilingualEmail(true);
  }
}
