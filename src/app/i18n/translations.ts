export type Language = 'fr' | 'en';

export interface Translations {
  common: {
    yes: string;
    no: string;
    back: string;
    close: string;
    copy: string;
    copied: string;
    save: string;
    cancel: string;
    reset: string;
    loading: string;
    exportOutlook: string;
    switchRole: string;
    unauthorized: string;
    unlock: string;
    restrictedAccess: string;
    enterPassword: string;
    wrongPassword: string;
    passwordPlaceholder: string;
    toastSaved: string;
    status: string;
    actions: string;
    details: string;
    filter: string;
    search: string;
  };
  roles: {
    selectRole: string;
    dossierManager: string;
    recruiter: string;
    tutoMarcel: string;
    marcelAcronym: string;
    marcelFullFr: string;
    marcelFullEn: string;
  };
  onboarding: {
    initialCheck: string;
    isMinor: string;
    fileType: string;
    fileTypeRecruiterDesc: string;
    fileTypeGdDesc: string;
    normal: string;
    pfor: string;
    local: string;
    ota: string;
  };
  email: {
    englishFollows: string;
    frenchFollows: string;
    reorientationSubject: string;
    standardWarning: string;
  };
  signatures: {
    title: string;
    subtitle: string;
    resetActiveBlock: string;
    saveAll: string;
    blockNormal: string;
    blockOta: string;
    scopeNoticeNormal: string;
    scopeNoticeOta: string;
    frenchSigNormal: string;
    englishSigNormal: string;
    frenchSigOta: string;
    englishSigOta: string;
    descNormalFr: string;
    descNormalEn: string;
    descOtaFr: string;
    descOtaEn: string;
  };
  panels: {
    reo: string;
    premierContact: string;
    avisFermeture: string;
    annexeQ: string;
    medicalEval: string;
    offer: string;
    notes: string;
    email: string;
    tasks: string;
    subsidizedStudies: string;
    normalOffer: string;
    placeCity: string;
    postingUnit: string;
    trade: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  fr: {
    common: {
      yes: "Oui",
      no: "Non",
      back: "Retour",
      close: "Fermer",
      copy: "Copier",
      copied: "Copié !",
      save: "Sauvegarder",
      cancel: "Annuler",
      reset: "Réinitialiser",
      loading: "Chargement...",
      exportOutlook: "Courriel Outlook",
      switchRole: "Changer de rôle",
      unauthorized: "Accès refusé",
      unlock: "Déverrouiller",
      restrictedAccess: "Accès restreint",
      enterPassword: "Veuillez entrer le mot de passe pour accéder à l'application.",
      wrongPassword: "Mot de passe incorrect.",
      passwordPlaceholder: "Mot de passe",
      toastSaved: "Sauvegardé avec succès !",
      status: "Statut",
      actions: "Actions",
      details: "Détails",
      filter: "Filtrer",
      search: "Rechercher",
    },
    roles: {
      selectRole: "Sélection du Rôle",
      dossierManager: "Gestionnaire de dossier",
      recruiter: "Recruteur",
      tutoMarcel: "Tuto Marcel",
      marcelAcronym: "MARCEL 2.0",
      marcelFullFr: "Module d'Analyse et de Réorientation des Candidats à l'Enrôlement pour les Lâches",
      marcelFullEn: "Module for Analysis and Reorientation of Candidates for Enlistment and Legwork",
    },
    onboarding: {
      initialCheck: "Vérification Initiale",
      isMinor: "Le postulant est-il mineur ?",
      fileType: "Type de dossier",
      fileTypeRecruiterDesc: "Le dossier est-il Normal ou PFOR ?",
      fileTypeGdDesc: "Le postulant est-il Local ou OTA ?",
      normal: "Normal",
      pfor: "PFOR",
      local: "Local",
      ota: "OTA",
    },
    email: {
      englishFollows: "English message will follow.",
      frenchFollows: "Le message en français suivra.",
      reorientationSubject: "Forces armées canadiennes / Canadian Armed Forces",
      standardWarning: "Si vous ne posez aucun geste, votre dossier sera automatiquement désactivé après 30 jours.",
    },
    signatures: {
      title: "Gestion des signatures",
      subtitle: "Personnalisez vos signatures de courriel (Signature normale et Signature OTA).",
      resetActiveBlock: "Réinitialiser le bloc actif",
      saveAll: "Sauvegarder tout",
      blockNormal: "Bloc Signature Normale",
      blockOta: "Bloc Signature OTA",
      scopeNoticeNormal: "Partout (Volet Recruteur & Dossiers locaux GD) sauf dans le volet GD pour les dossiers OTA.",
      scopeNoticeOta: "Exclusivement dans le volet Gestionnaire de dossier (GD) pour les dossiers OTA.",
      frenchSigNormal: "Signature française (Normale)",
      englishSigNormal: "Signature anglaise (Normale)",
      frenchSigOta: "Signature française (OTA)",
      englishSigOta: "Signature anglaise (OTA)",
      descNormalFr: "Cette signature sera intégrée au bas de vos correspondances régulières rédigées en français.",
      descNormalEn: "Cette signature sera intégrée au bas de vos correspondances régulières rédigées en anglais.",
      descOtaFr: "Cette signature sera intégrée au bas de vos correspondances pour les dossiers OTA dans le volet GD en français.",
      descOtaEn: "Cette signature sera intégrée au bas de vos correspondances pour les dossiers OTA dans le volet GD en anglais.",
    },
    panels: {
      reo: "Réorientation",
      premierContact: "Premier Contact",
      avisFermeture: "Avis de Fermeture",
      annexeQ: "Annexe Q",
      medicalEval: "Évaluation médicale",
      offer: "Offre d'enrôlement",
      notes: "Notes",
      email: "Courriel",
      tasks: "Tâches",
      subsidizedStudies: "Études subventionnées",
      normalOffer: "Offre normale",
      placeCity: "Ville / Lieu",
      postingUnit: "Unité d'affectation",
      trade: "Métier",
    }
  },
  en: {
    common: {
      yes: "Yes",
      no: "No",
      back: "Back",
      close: "Close",
      copy: "Copy",
      copied: "Copied!",
      save: "Save",
      cancel: "Cancel",
      reset: "Reset",
      loading: "Loading...",
      exportOutlook: "Outlook Email",
      switchRole: "Switch Role",
      unauthorized: "Access Denied",
      unlock: "Unlock",
      restrictedAccess: "Restricted Access",
      enterPassword: "Please enter the password to access the application.",
      wrongPassword: "Incorrect password.",
      passwordPlaceholder: "Password",
      toastSaved: "Saved successfully!",
      status: "Status",
      actions: "Actions",
      details: "Details",
      filter: "Filter",
      search: "Search",
    },
    roles: {
      selectRole: "Role Selection",
      dossierManager: "File Manager",
      recruiter: "Recruiter",
      tutoMarcel: "Marcel Tutorial",
      marcelAcronym: "MARCEL 2.0",
      marcelFullFr: "Module d'Analyse et de Réorientation des Candidats à l'Enrôlement pour les Lâches",
      marcelFullEn: "Module for Analysis and Reorientation of Candidates for Enlistment and Legwork",
    },
    onboarding: {
      initialCheck: "Initial Verification",
      isMinor: "Is the applicant a minor?",
      fileType: "File Type",
      fileTypeRecruiterDesc: "Is the file Normal or ROTP (PFOR)?",
      fileTypeGdDesc: "Is the applicant Local or OTA?",
      normal: "Normal",
      pfor: "ROTP (PFOR)",
      local: "Local",
      ota: "OTA",
    },
    email: {
      englishFollows: "English message will follow.",
      frenchFollows: "Le message en français suivra.",
      reorientationSubject: "Canadian Armed Forces / Forces armées canadiennes",
      standardWarning: "If you do not take any action, your file will be automatically deactivated after 30 days.",
    },
    signatures: {
      title: "Signature Management",
      subtitle: "Customize your email signatures (Standard Signature and OTA Signature).",
      resetActiveBlock: "Reset Active Block",
      saveAll: "Save All",
      blockNormal: "Standard Signature Block",
      blockOta: "OTA Signature Block",
      scopeNoticeNormal: "Everywhere (Recruiter section & local FM files) except in FM for OTA files.",
      scopeNoticeOta: "Exclusively in the File Manager (FM) section for OTA files.",
      frenchSigNormal: "French Signature (Standard)",
      englishSigNormal: "English Signature (Standard)",
      frenchSigOta: "French Signature (OTA)",
      englishSigOta: "English Signature (OTA)",
      descNormalFr: "This signature will be appended to regular correspondence written in French.",
      descNormalEn: "This signature will be appended to regular correspondence written in English.",
      descOtaFr: "This signature will be appended to correspondence for OTA files in the FM section in French.",
      descOtaEn: "This signature will be appended to correspondence for OTA files in the FM section in English.",
    },
    panels: {
      reo: "Reorientation",
      premierContact: "First Contact",
      avisFermeture: "Notice of File Closure",
      annexeQ: "Annex Q",
      medicalEval: "Medical Assessment",
      offer: "Enrolment Offer",
      notes: "Notes",
      email: "Email",
      tasks: "Tasks",
      subsidizedStudies: "Subsidized Education",
      normalOffer: "Standard Offer",
      placeCity: "City / Location",
      postingUnit: "Posting Unit",
      trade: "Occupation",
    }
  }
};
