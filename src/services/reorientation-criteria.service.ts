import { Injectable, computed, signal, inject } from "@angular/core";
import { JobDatabaseService } from "./job-database.service";
import { MelService, MEL_LIMITATIONS } from "./mel.service";
import { SharedStateService } from "./shared-state.service";
import { JobEntry } from "./jobs-data";
import {
  ManualCriterion,
  JobRule,
  PROVINCES,
  MATH_COURSES,
  MANUAL_CRITERIA,
  JOB_RULES,
} from "../app/data/reorientation-criteria.data";

export interface NcmEvaluationResult {
  eligibleJobs: JobEntry[];
  openJobs: JobEntry[];
  closedJobs: JobEntry[];
  openOfficerJobs: JobEntry[];
  closedOfficerJobs: JobEntry[];
  openNcmJobs: JobEntry[];
  closedNcmJobs: JobEntry[];
}

@Injectable({
  providedIn: "root",
})
export class ReorientationCriteriaService {
  private jobService = inject(JobDatabaseService);
  private melService = inject(MelService);
  private sharedState = inject(SharedStateService);

  readonly PROVINCES = PROVINCES;
  readonly MATH_COURSES = MATH_COURSES;
  readonly MANUAL_CRITERIA = MANUAL_CRITERIA;
  readonly JOB_RULES = JOB_RULES;

  // Candidate profile signals
  age = signal<number | null>(null);
  citizenship = signal<string>("Canadian Citizen");
  ignoreSip = signal<boolean>(false);
  includeTraitement = signal<boolean>(false);
  currentSipPhase = computed<"admission" | "traitement" | "both">(() =>
    this.includeTraitement() ? "both" : "admission",
  );

  hasMedicalLimitation = signal<boolean>(false);
  medicalV = signal<string>("");
  medicalCV = signal<string>("");
  medicalH = signal<string>("");

  // Selected state
  selectedCriteriaIds = signal<Set<string>>(new Set<string>());
  selectedProvince = signal<string>("QC");
  activeScolariteTab = signal<"secondaire" | "specialises" | "universitaire">(
    "secondaire",
  );

  // Dossier job selection from shared state for extra test requirement checking
  dossierJobIds = computed(() =>
    [
      this.sharedState.selectedDossierJobId1(),
      this.sharedState.selectedDossierJobId2(),
      this.sharedState.selectedDossierJobId3(),
    ].filter(Boolean),
  );

  hasEceJob = computed(() => this.dossierJobIds().includes("00203"));
  hasEsomJob = computed(() => this.dossierJobIds().includes("00207"));
  hasCeopmJob = computed(() => this.dossierJobIds().includes("00214"));
  hasCspnJob = computed(() =>
    this.dossierJobIds().some(
      (id) => id === "00182" || id === "00183" || id === "00184",
    ),
  );

  // Math courses for currently selected province
  mathCoursesForProvince = computed(() => {
    const prov = this.selectedProvince();
    return this.MATH_COURSES[prov] || [];
  });

  // Education category lists
  criteriaAnneeScolaire = computed(() =>
    this.MANUAL_CRITERIA.filter((c) => c.category === "Année scolaire"),
  );

  criteriaHistoire = computed(() =>
    this.MANUAL_CRITERIA.filter((c) => c.category === "Histoire"),
  );

  criteriaLangue = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Langue" &&
        c.id !== "etude_anglais" &&
        c.id !== "etude_hors_canada",
    ),
  );

  criteriaScience = computed(() =>
    this.MANUAL_CRITERIA.filter((c) => c.category === "Science"),
  );

  criteriaInformatique = computed(() =>
    this.MANUAL_CRITERIA.filter((c) => c.category === "Informatique"),
  );

  criteriaCoursSpecialise = computed(() =>
    this.MANUAL_CRITERIA.filter((c) => c.category === "Cours spécialisés"),
  );

  criteriaUniversitaire1erCycleGenie = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" && c.subCategory === "Génie",
    ),
  );

  criteriaUniversitaire1erCycleSciences = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" &&
        c.subCategory === "Sciences",
    ),
  );

  criteriaUniversitaire1erCycleArts = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" && c.subCategory === "Arts",
    ),
  );

  criteriaUniversitaire1erCycleSante = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Universitaire 1er cycle" && c.subCategory === "Santé",
    ),
  );

  criteriaUniversitaireCycleSuperieurMaitrise = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Universitaire cycle supérieur" &&
        c.subCategory === "Maîtrise",
    ),
  );

  criteriaUniversitaireCycleSuperieurDoctorat = computed(() =>
    this.MANUAL_CRITERIA.filter(
      (c) =>
        c.category === "Universitaire cycle supérieur" &&
        c.subCategory === "Doctorat",
    ),
  );

  // Dynamic experience criteria derived from selected schooling and candidate admissibility
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

    // exp_photo_design needs one of: 'des_12e_annee', 'aens', 'cs_photo_multimedia', 'bacc_arts_communications', 'bacc_arts_communication_visuelle'
    const hasEduForPhoto =
      selected.has("des_12e_annee") ||
      selected.has("aens") ||
      selected.has("cs_photo_multimedia") ||
      selected.has("bacc_arts_communications") ||
      selected.has("bacc_arts_communication_visuelle");
    if (hasEduForPhoto && this.isAdmissibleOtherThanEducation("00137")) {
      const crit = this.MANUAL_CRITERIA.find((c) => c.id === "exp_photo_design");
      if (crit) criteria.push(crit);
    }

    // exp_permis_conduire needs ('des_12e_annee' && 'base_math_10_app') or 'cs_sec_incendie' for 00149, or 'cs_tech_policieres' for 00161, or bacc degrees for 00214
    const check149 =
      (((selected.has("des_12e_annee") || selected.has("aens")) && hasMath10App) ||
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
      hasEducation161 && this.isAdmissibleOtherThanEducation("00161");
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
      const crit = this.MANUAL_CRITERIA.find(
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
        const crit = this.MANUAL_CRITERIA.find((c) => c.id === "exp_scslm");
        if (crit) criteria.push(crit);
      } else if (hasAcorplm) {
        const crit = this.MANUAL_CRITERIA.find((c) => c.id === "exp_acorplm");
        if (crit) criteria.push(crit);
      } else {
        const critScslm = this.MANUAL_CRITERIA.find((c) => c.id === "exp_scslm");
        const critAcorplm = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_acorplm",
        );
        if (critScslm) criteria.push(critScslm);
        if (critAcorplm) criteria.push(critAcorplm);
      }

      const hasPermis = selected.has("exp_permis_reglementation");
      const hasLettre = selected.has("exp_lettre_conformite");
      if (hasPermis) {
        const crit = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_permis_reglementation",
        );
        if (crit) criteria.push(crit);
      } else if (hasLettre) {
        const crit = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_lettre_conformite",
        );
        if (crit) criteria.push(crit);
      } else {
        const critPermis = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_permis_reglementation",
        );
        const critLettre = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_lettre_conformite",
        );
        if (critPermis) criteria.push(critPermis);
        if (critLettre) criteria.push(critLettre);
      }

      const critLab6 = this.MANUAL_CRITERIA.find(
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
        const crit = this.MANUAL_CRITERIA.find((c) => c.id === "exp_permis_rad");
        if (crit) criteria.push(crit);
      } else if (hasAssociationActrm) {
        const crit = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_association_actrm",
        );
        if (crit) criteria.push(crit);
      } else {
        const critPermisRad = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_permis_rad",
        );
        const critAssociationActrm = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_association_actrm",
        );
        if (critPermisRad) criteria.push(critPermisRad);
        if (critAssociationActrm) criteria.push(critAssociationActrm);
      }

      const critLettreReg = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_lettre_reglementation_en_regle",
      );
      if (critLettreReg) criteria.push(critLettreReg);
    }

    // exp_tech_eb_6mois needs 'cs_tech_ing_biomed'
    if (
      selected.has("cs_tech_ing_biomed") &&
      this.isAdmissibleOtherThanEducation("00155")
    ) {
      const critTechEb6 = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_tech_eb_6mois",
      );
      if (critTechEb6) criteria.push(critTechEb6);
    }

    // 00166 musician experience criteria
    if (this.isAdmissibleOtherThanEducation("00166")) {
      if (selected.has("cs_etude_musique")) {
        const critMusPro = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_mus_pro",
        );
        if (critMusPro) criteria.push(critMusPro);
      } else if (selected.has("des_12e_annee") || selected.has("aens")) {
        const hasEnsembles = selected.has("exp_mus_ensembles");
        const hasEtudiant = selected.has("exp_mus_etudiant");
        if (hasEnsembles) {
          const crit = this.MANUAL_CRITERIA.find(
            (c) => c.id === "exp_mus_ensembles",
          );
          if (crit) criteria.push(crit);
        } else if (hasEtudiant) {
          const crit = this.MANUAL_CRITERIA.find(
            (c) => c.id === "exp_mus_etudiant",
          );
          if (crit) criteria.push(crit);
        } else {
          const critEnsembles = this.MANUAL_CRITERIA.find(
            (c) => c.id === "exp_mus_ensembles",
          );
          const critEtudiant = this.MANUAL_CRITERIA.find(
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
      const critSceauRouge = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_sceau_rouge_cuisine",
      );
      if (critSceauRouge) criteria.push(critSceauRouge);
    }

    // 00335 dental assistant experience criteria
    if (
      selected.has("cs_cert_assist_dentaire") &&
      this.isAdmissibleOtherThanEducation("00335")
    ) {
      const critPermisDentaire = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_assistant_dentaire",
      );
      const critLettreDentaire = this.MANUAL_CRITERIA.find(
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
      const critPermisInfirmier = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_infirmier_auxiliaire",
      );
      const critLettreReglementation = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_lettre_reglementation_en_regle",
      );
      const critCertPeroperatoire = this.MANUAL_CRITERIA.find(
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
      const critPermisParamed = this.MANUAL_CRITERIA.find(
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
      const crit00189 = this.MANUAL_CRITERIA.find((c) => c.id === "exp_00189");
      if (crit00189) criteria.push(crit00189);
    }

    // 00190 experience criteria
    if (
      (selected.has("bacc_sante_physiotherapie") ||
        selected.has("maitrise_sante_physiotherapie")) &&
      this.isAdmissibleOtherThanEducation("00190")
    ) {
      const critPermisPhysio = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_physiotherapie",
      );
      const critLettrePhysio = this.MANUAL_CRITERIA.find(
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
      const critBned = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_cert_bned",
      );
      const critPermisDentaire = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_medecine_dentaire",
      );
      const critLettreDentiste = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_lettre_dentiste_regle",
      );
      const critCvDentiste = this.MANUAL_CRITERIA.find(
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
      const critPermisPharmacie = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_pharmacie",
      );
      const critLettrePharmacie = this.MANUAL_CRITERIA.find(
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
      const critPermisInfirmiers = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_soins_infirmiers",
      );
      if (critPermisInfirmiers) criteria.push(critPermisInfirmiers);
    }

    // 00198 experience criteria
    if (
      selected.has("maitrise_sante_service_social") &&
      this.isAdmissibleOtherThanEducation("00198")
    ) {
      const critPermisSocial = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_travail_social",
      );
      const critLettreSocial = this.MANUAL_CRITERIA.find(
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
      const crit00203 = this.MANUAL_CRITERIA.find((c) => c.id === "exp_00203");
      if (crit00203) criteria.push(crit00203);
    }

    // 00204 experience criteria
    if (
      selected.has("bacc_arts_droit") &&
      this.isAdmissibleOtherThanEducation("00204")
    ) {
      const critPermisDroit = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_permis_droit",
      );
      const critLettreBarreau = this.MANUAL_CRITERIA.find(
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
      const crit00208 = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_00208_bacc",
      );
      if (crit00208) criteria.push(crit00208);
    }

    // 00211 experience criteria (only for master's degree)
    if (
      selected.has("maitrise_arts_education") &&
      this.isAdmissibleOtherThanEducation("00211")
    ) {
      const crit00211 = this.MANUAL_CRITERIA.find(
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
      const critLeader = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_00349_leader_foi",
      );
      const critEndosse = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_00349_endosse_ciamc",
      );
      const critEntrevue = this.MANUAL_CRITERIA.find(
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
      const critCertPermis = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_00374_cert_permis",
      );
      const critLettreRegle = this.MANUAL_CRITERIA.find(
        (c) => c.id === "exp_00374_lettre_regle",
      );
      if (critCertPermis) criteria.push(critCertPermis);
      if (critLettreRegle) criteria.push(critLettreRegle);
    }

    // 00390 experience criteria
    if (selected.has("doctorat_medecine")) {
      if (this.isAdmissibleOtherThanEducation("00390")) {
        const critResidence = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_00390_residence",
        );
        const critCert = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_00390_certification",
        );
        const critPermis = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_00390_permis",
        );
        const critAtte = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_00390_attestation",
        );
        const critCivil = this.MANUAL_CRITERIA.find(
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
        const critAuto393 = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_00393_autorisation",
        );
        const critLettre393 = this.MANUAL_CRITERIA.find(
          (c) => c.id === "exp_00393_lettre_regle",
        );
        const critCert393 = this.MANUAL_CRITERIA.find(
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
      const critGSS = this.MANUAL_CRITERIA.find(
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
      ((((selected.has("des_12e_annee") || selected.has("aens")) && selected.has("base_math_11_adv")) || ((selected.has("des_12e_annee") || selected.has("aens")) && selected.has("info_sec5_12e")) || selected.has("cs_dip_cyber")) && this.isAdmissibleOtherThanEducation("00378")) ||
      (selected.has("doctorat_medecine") && this.isAdmissibleOtherThanEducation("00390")) ||
      ((baccSanteSaufPlusHaut || dEsSanteSaufPlusHaut) && this.isAdmissibleOtherThanEducation("00398")) ||
      (selected.has("cs_cert_soins_param") && this.isAdmissibleOtherThanEducation("00406"));

    if (cvJobsEduEligible) {
      const critCv = this.MANUAL_CRITERIA.find((c) => c.id === "exp_cv_recent");
      if (critCv && !criteria.some((c) => c.id === "exp_cv_recent")) {
        criteria.push(critCv);
      }
    }

    return criteria;
  });

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
        const crit = this.MANUAL_CRITERIA.find((c) => c.id === id);
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
        const crit = this.MANUAL_CRITERIA.find((c) => c.id === id);
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
        const crit = this.MANUAL_CRITERIA.find((c) => c.id === id);
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
      current.has("aens") ||
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
      ((current.has("des_12e_annee") || current.has("aens")) && hasMath10App) ||
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

  hasCriterion(id: string): boolean {
    return this.selectedCriteriaIds().has(id);
  }

  resetCriteria() {
    this.selectedCriteriaIds.set(new Set());
    this.selectedProvince.set("QC");
    this.activeScolariteTab.set("secondaire");
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
      const eligible = !isTested || this.sharedState.testEcePassed();
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
      const eligible = !isTested || this.sharedState.testEsomPassed();
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
      const eligible = !isTested || this.sharedState.testCeopmPassed();
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
      const notCompleted = this.sharedState.testCspnNotCompleted();
      const eligible =
        !isTested ||
        (!notCompleted &&
          this.sharedState.testCspnPassed() &&
          this.sharedState.testCspn00182Passed());
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
      const notCompleted = this.sharedState.testCspnNotCompleted();
      const eligible =
        !isTested ||
        (!notCompleted &&
          this.sharedState.testCspnPassed() &&
          this.sharedState.testCspn00183Passed());
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
      const notCompleted = this.sharedState.testCspnNotCompleted();
      const eligible =
        !isTested ||
        (!notCompleted &&
          this.sharedState.testCspnPassed() &&
          this.sharedState.testCspn00184Passed());
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

  isAdmissibleOtherThanEducation(
    jobId: string,
    options?: {
      age?: number | null;
      citizenship?: string;
      ignoreSip?: boolean;
      currentSipPhase?: "admission" | "traitement" | "both";
      hasMedicalLimitation?: boolean;
      medicalV?: string;
      medicalCV?: string;
      medicalH?: string;
    },
  ): boolean {
    if (!jobId || jobId === "00003") return false;
    const job = this.jobService.getAllJobs().find((j) => j.id === jobId);
    if (!job) return false;

    const ignoreSipVal = options?.ignoreSip ?? this.ignoreSip();
    const sipPhaseVal =
      options?.currentSipPhase ??
      (this.includeTraitement() ? "both" : "admission");
    if (!ignoreSipVal && this.jobService.isJobClosed(jobId, sipPhaseVal)) {
      return false;
    }

    if (!this.isJobMedicalAdmissible(jobId, options)) {
      return false;
    }

    if (!this.isJobExtraTestAdmissible(jobId)) {
      return false;
    }

    const ageVal = options?.age ?? this.age();
    const citizenshipVal = options?.citizenship ?? this.citizenship();

    const firstContract =
      job.contracts && job.contracts.length > 0 ? job.contracts[0] : null;
    const durationYears = firstContract
      ? firstContract.duration.match(/(\d+)\s*an/)
        ? parseInt(firstContract.duration.match(/(\d+)\s*an/)![1], 10)
        : 3
      : 3;

    if (ageVal !== null && ageVal > 0) {
      if (ageVal >= 57 || ageVal + durationYears >= 60) {
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

  isJobMedicalAdmissible(
    jobId: string,
    options?: {
      hasMedicalLimitation?: boolean;
      medicalV?: string;
      medicalCV?: string;
      medicalH?: string;
    },
  ): boolean {
    const job = this.jobService.getJobById(jobId);
    if (!job || !job.medicalStandard) return true;

    const hasMedLim =
      options?.hasMedicalLimitation ?? this.hasMedicalLimitation();
    if (hasMedLim) {
      const parseVal = (valStr?: string) => {
        const trimmed = (valStr || "").trim();
        if (!trimmed) return null;
        const num = parseInt(trimmed, 10);
        return isNaN(num) ? null : num;
      };
      const v = parseVal(options?.medicalV ?? this.medicalV());
      const cv = parseVal(options?.medicalCV ?? this.medicalCV());
      const h = parseVal(options?.medicalH ?? this.medicalH());

      const std = job.medicalStandard;
      if (v !== null && v > std.v) return false;
      if (cv !== null && cv > std.cv) return false;
      if (h !== null && h > std.h) return false;
    }

    const applicantLimitations = this.melService.applicantLimitations();
    const melMatrix = this.melService.acceptabilityMatrix();
    for (const [melId, hasLim] of Object.entries(applicantLimitations)) {
      if (hasLim) {
        const isAcceptable = melMatrix[melId]?.[jobId] ?? true;
        if (!isAcceptable) return false;
      }
    }
    return true;
  }

  checkJobEducationEligibility(
    jobId: string,
    options?: { selectedCriteriaIds?: Set<string> },
  ): { eligible: boolean; missingFr?: string; missingEn?: string } {
    const rules = this.JOB_RULES.filter((r) => r.jobs.includes(jobId));
    if (rules.length === 0) {
      return { eligible: true };
    }

    const rawSelected =
      options?.selectedCriteriaIds ?? this.selectedCriteriaIds();
    const selected = new Set(rawSelected);

    const allMathOptions = Object.values(this.MATH_COURSES).reduce(
      (acc, courses) => acc.concat(courses),
      [] as { id: string; label: string; grade: number; diff: number }[],
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
      const crit = this.MANUAL_CRITERIA.find((c) => c.id === id);
      if (crit) {
        if (id === "des_12e_annee")
          return isFr
            ? "DES ou 12e année"
            : "High School Diploma or Grade 12";
        if (id === "sec4_24_credits")
          return isFr
            ? "Sec 4 (24 crédits) ou 10e année"
            : "Grade 10 (24 credits)";
        if (id === "francais_sec4_10e")
          return isFr
            ? "Français/Anglais de sec 4 ou 10e année"
            : "Grade 10 English/French";
        if (id === "francais_sec5_11e")
          return isFr
            ? "Français/Anglais de sec 5 ou 11e année"
            : "Grade 11 English/French";
        if (id === "anglais_sec5_12e")
          return isFr
            ? "Anglais de sec 5 / 12e année"
            : "Grade 12 / Sec 5 English";
        if (id === "sci_tech4_sci10")
          return isFr
            ? "Science et technologie de sec 4 ou 10e année"
            : "Grade 10 Science";
        if (id === "chimie_sec5_11e")
          return isFr ? "Chimie de sec 5 ou 11e année" : "Grade 11 Chemistry";
        if (id === "physique_sec5_11e")
          return isFr
            ? "Physique de sec 5 ou 11e année"
            : "Grade 11 Physics";
        return crit.label;
      }
      if (id === "base_math_10_gen")
        return isFr
          ? "Mathématiques de sec 4/10e (générales)"
          : "Grade 10 Math (General)";
      if (id === "base_math_10_app")
        return isFr
          ? "Mathématiques de sec 4/10e (appliquées)"
          : "Grade 10 Math (Applied)";
      if (id === "base_math_10_adv")
        return isFr
          ? "Mathématiques de sec 4/10e (avancées)"
          : "Grade 10 Math (Advanced)";
      if (id === "base_math_11_gen")
        return isFr
          ? "Mathématiques de sec 5/11e (générales)"
          : "Grade 11 Math (General)";
      if (id === "base_math_11_app")
        return isFr
          ? "Mathématiques de sec 5/11e (appliquées)"
          : "Grade 11 Math (Applied)";
      if (id === "base_math_11_adv")
        return isFr
          ? "Mathématiques de sec 5/11e (avancées)"
          : "Grade 11 Math (Advanced)";
      if (id === "base_math_12_gen")
        return isFr
          ? "Mathématiques de 12e (générales)"
          : "Grade 12 Math (General)";
      if (id === "base_math_12_app")
        return isFr
          ? "Mathématiques de 12e (appliquées)"
          : "Grade 12 Math (Applied)";
      if (id === "base_math_12_adv")
        return isFr
          ? "Mathématiques de 12e (avancées)"
          : "Grade 12 Math (Advanced)";
      return id;
    };

    for (const rule of rules) {
      let meetsRule = false;
      if (rule.customCheck) {
        const checkResult = rule.customCheck(selected, coursSpecialisesIds);
        if (typeof checkResult === "boolean") {
          meetsRule = checkResult;
          if (!meetsRule) {
            if (this.jobService.isOfficerJob(jobId)) {
              missingFrList.push(
                "Des études universitaires spécifiques sont manquantes",
              );
              missingEnList.push("Specific university studies are missing");
            } else {
              missingFrList.push(
                "Des exigences spécifiques (ex: DEP, Mathématiques ou Sciences) sont manquantes",
              );
              missingEnList.push(
                "Specific requirements (e.g. DEP, Math or Science) are missing",
              );
            }
          }
        } else {
          meetsRule = checkResult.passed;
          if (!meetsRule) {
            if (checkResult.missingFr)
              missingFrList.push(checkResult.missingFr);
            if (checkResult.missingEn)
              missingEnList.push(checkResult.missingEn);
          }
        }
      } else if (
        rule.requiredCriteriaIds &&
        rule.requiredCriteriaIds.length > 0
      ) {
        const missingIds = rule.requiredCriteriaIds.filter(
          (id) => !selected.has(id),
        );
        if (missingIds.length === 0) {
          meetsRule = true;
        } else {
          missingFrList.push(
            missingIds.map((id) => getLabel(id, true)).join(" et "),
          );
          missingEnList.push(
            missingIds.map((id) => getLabel(id, false)).join(" and "),
          );
        }
      }

      if (meetsRule) {
        return { eligible: true };
      }
    }

    return {
      eligible: false,
      missingFr: Array.from(new Set(missingFrList)).join(" OU "),
      missingEn: Array.from(new Set(missingEnList)).join(" OR "),
    };
  }

  evaluateEligibleNcmJobs(options?: {
    selectedCriteriaIds?: Set<string>;
    selectedProvince?: string;
    age?: number | null;
    citizenship?: string;
    ignoreSip?: boolean;
    currentSipPhase?: "admission" | "traitement" | "both";
    hasMedicalLimitation?: boolean;
    medicalV?: string;
    medicalCV?: string;
    medicalH?: string;
  }): NcmEvaluationResult {
    const rawSelected =
      options?.selectedCriteriaIds ?? this.selectedCriteriaIds();
    if (rawSelected.size === 0) {
      return {
        eligibleJobs: [],
        openJobs: [],
        closedJobs: [],
        openOfficerJobs: [],
        closedOfficerJobs: [],
        openNcmJobs: [],
        closedNcmJobs: [],
      };
    }

    const citizenship = options?.citizenship ?? this.citizenship();
    if (citizenship === "PR < 3 years") {
      return {
        eligibleJobs: [],
        openJobs: [],
        closedJobs: [],
        openOfficerJobs: [],
        closedOfficerJobs: [],
        openNcmJobs: [],
        closedNcmJobs: [],
      };
    }

    const jobsSet = new Set<string>();

    for (const rule of this.JOB_RULES) {
      for (const jId of rule.jobs) {
        if (!this.isAdmissibleOtherThanEducation(jId, options)) {
          continue;
        }

        const eduCheck = this.checkJobEducationEligibility(jId, {
          selectedCriteriaIds: rawSelected,
        });
        if (eduCheck.eligible) {
          jobsSet.add(jId);
        }
      }
    }

    const ignoreSipVal = options?.ignoreSip ?? this.ignoreSip();
    const sipPhaseVal =
      options?.currentSipPhase ??
      (this.includeTraitement() ? "both" : "admission");

    const openJobs: JobEntry[] = [];
    const closedJobs: JobEntry[] = [];
    const eligibleJobs: JobEntry[] = [];

    const openOfficerJobs: JobEntry[] = [];
    const closedOfficerJobs: JobEntry[] = [];
    const openNcmJobs: JobEntry[] = [];
    const closedNcmJobs: JobEntry[] = [];

    // Sort job IDs numerically
    const sortedJobIds = Array.from(jobsSet).sort((a, b) => a.localeCompare(b));

    for (const jId of sortedJobIds) {
      const job = this.jobService.getJobById(jId);
      if (!job) continue;

      const isOfficer = this.jobService.isOfficerJob(jId);
      const isClosed = this.jobService.isJobClosed(jId, sipPhaseVal);

      if (isClosed) {
        closedJobs.push(job);
        if (isOfficer) {
          closedOfficerJobs.push(job);
        } else {
          closedNcmJobs.push(job);
        }
        if (ignoreSipVal) {
          eligibleJobs.push(job);
        }
      } else {
        openJobs.push(job);
        if (isOfficer) {
          openOfficerJobs.push(job);
        } else {
          openNcmJobs.push(job);
        }
        eligibleJobs.push(job);
      }
    }

    return {
      eligibleJobs,
      openJobs,
      closedJobs,
      openOfficerJobs,
      closedOfficerJobs,
      openNcmJobs,
      closedNcmJobs,
    };
  }

  resetAll() {
    this.selectedCriteriaIds.set(new Set<string>());
    this.activeScolariteTab.set("secondaire");
    this.selectedProvince.set("QC");
    this.age.set(null);
    this.citizenship.set("Canadian Citizen");
    this.ignoreSip.set(false);
    this.includeTraitement.set(false);
    this.hasMedicalLimitation.set(false);
    this.medicalV.set("");
    this.medicalCV.set("");
    this.medicalH.set("");
  }
}
