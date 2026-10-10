export interface ManualCriterion {
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

export interface JobRule {
  requiredCriteriaIds?: string[];
  customCheck?: (
    selected: Set<string>,
    criteriaCoursSpecialiseIds: string[],
  ) => boolean | { passed: boolean; missingFr?: string; missingEn?: string };
  jobs: string[];
  allowPR?: boolean;
}


export const PROVINCES = [
    { id: "QC", name: "Québec" },
    { id: "ON", name: "Ontario" },
    { id: "BC", name: "C.-B. / Yukon" },
    { id: "AB", name: "Alberta / T.N.-O. / Nunavut" },
    { id: "NB_FR", name: "Nouveau-Brunswick (Franco)" },
  ];


export const MATH_COURSES: Record<
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


export function hasDes(selected: Set<string>): boolean {
  return selected.has("des_12e_annee") || selected.has("aens");
}

export function hasSec4(selected: Set<string>): boolean {
  return selected.has("sec4_24_credits") || selected.has("des_12e_annee") || selected.has("aens");
}

export const MANUAL_CRITERIA: ManualCriterion[] = [
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


export const JOB_RULES: JobRule[] = [
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
          hasDes(selected) && selected.has("francais_sec5_11e");
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
        const hasDES = hasDes(selected);
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
          const userHasDes = hasDes(selected);
          const hasEnglishSec5 = selected.has("anglais_sec5_12e");
          const hasCegep201 = selected.has("qc_12_cegep201") || selected.has("base_math_12_adv");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = userHasDes && hasEnglishSec5 && (hasCegep201 || hasMath11AppOrAdv);
          const passed = passedAcademic || selected.has("cs_tea_m");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Anglais de sec 5 / 12 e année + (CEGEP 201 Appliquée ou Théoriques / 12e année ou Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑M (technicien d’entretien d’aéronefs - maintenance) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 12 / Sec 5 English + (CEGEP 201 Appliquée ou Théoriques / 12e année or Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-M (aircraft maintenance engineer - maintenance) program diploma)",
          };
        } else {
          const userHasDes = hasDes(selected);
          const hasPhysicsSec5 = selected.has("physique_sec5_11e");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = userHasDes && hasPhysicsSec5 && hasMath11AppOrAdv;
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
          const userHasDes = hasDes(selected);
          const hasEnglishSec5 = selected.has("anglais_sec5_12e");
          const hasCegep201 = selected.has("qc_12_cegep201") || selected.has("base_math_12_adv");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = userHasDes && hasEnglishSec5 && (hasCegep201 || hasMath11AppOrAdv);
          const passed = passedAcademic || selected.has("cs_tea_e");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Anglais de sec 5 / 12 e année + (CEGEP 201 Appliquée ou Théoriques / 12e année ou Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑E (technicien d’entretien d’aéronefs - avionique) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 12 / Sec 5 English + (CEGEP 201 Appliquée ou Théoriques / 12e année or Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-E (aircraft maintenance engineer - avionics) program diploma)",
          };
        } else {
          const userHasDes = hasDes(selected);
          const hasPhysicsSec5 = selected.has("physique_sec5_11e");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = userHasDes && hasPhysicsSec5 && hasMath11AppOrAdv;
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
          hasDes(selected) ||
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
          const userHasDes = hasDes(selected);
          const hasEnglishSec5 = selected.has("anglais_sec5_12e");
          const hasCegep201 = selected.has("qc_12_cegep201") || selected.has("base_math_12_adv");
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = userHasDes && hasEnglishSec5 && (hasCegep201 || hasMath11AppOrAdv);
          const passed = passedAcademic || selected.has("cs_tea_s");
          if (passed) return { passed: true };
          return {
            passed: false,
            missingFr: "Exige : (DES/12e années complété + Anglais de sec 5 / 12 e année + (CEGEP 201 Appliquée ou Théoriques / 12e année ou Mathématiques de sec 5/11e (appliquées) ou Mathématiques de sec 5/11e (avancées))) ou (Un diplôme d’un programme TEA‑S (technicien d’entretien d’aéronefs - structures) accrédité par Transports Canada)",
            missingEn: "Requires: (High School Diploma + Grade 12 / Sec 5 English + (CEGEP 201 Appliquée ou Théoriques / 12e année or Grade 11 Math (Applied) or Grade 11 Math (Advanced))) or (An accredited Transport Canada AME-S (aircraft maintenance engineer - structures) program diploma)",
          };
        } else {
          const userHasDes = hasDes(selected);
          const hasMath11AppOrAdv = selected.has("base_math_11_app") || selected.has("base_math_11_adv");
          const passedAcademic = userHasDes && hasMath11AppOrAdv;
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
          hasDes(selected) && selected.has("base_math_10_app");
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
          hasDes(selected) || selected.has("cs_etude_musique")
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
          selected.has("sec4_24_credits") && selected.has("base_math_10_app");
        const option2 = selected.has("cs_dep_electricite");
        const option3 =
          selected.has("des_12e_annee") &&
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
          (selected.has("sec4_24_credits") &&
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
          (selected.has("sec4_24_credits") &&
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
          (selected.has("sec4_24_credits") &&
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
          (selected.has("sec4_24_credits") &&
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
          (hasDes(selected) && selected.has("base_math_11_app")) ||
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
          (hasDes(selected) && selected.has("base_math_11_adv")) ||
          (hasDes(selected) && selected.has("info_sec5_12e")) ||
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

