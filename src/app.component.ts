import { TranslationService } from "./services/translation.service";
import {
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  effect,
  untracked,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import {
  RecruitmentDataService,
  Task,
  DocumentItem,
  RejectionReason,
} from "./services/recruitment-data.service";
import {
  EmailScenariosService,
  EmailScenario,
} from "./services/email-scenarios.service";
import { JobSearchModalComponent } from "./app/components/job-search-modal.component";
import { CalendarPickerComponent } from "./app/components/calendar-picker.component";
import { CourseSeriesPickerComponent } from "./app/components/course-series-picker.component";
import { UnitPickerComponent } from "./app/components/unit-picker.component";
import { RoleSelectionComponent } from "./app/components/role-selection.component";
import { SignatureManagerComponent } from "./app/components/signature-manager.component";
import { AuthGateComponent } from "./app/components/auth-gate.component";
import { UnitSession, UNITS_LIST } from "./app/data/units.data";
import { CourseSession } from "./app/data/course-sessions.data";
import { JOB_URLS } from "./app/data/job-urls.data";
import { SharedStateService, DEFAULT_SIG_FR, DEFAULT_SIG_EN, DEFAULT_SIG_OTA_FR, DEFAULT_SIG_OTA_EN } from "./services/shared-state.service";
import { JobDatabaseService } from "./services/job-database.service";
import { MelService } from "./services/mel.service";
import { ReorientationCriteriaService } from "./services/reorientation-criteria.service";
import { JobEntry, JobCategory, MilitaryElement, RecruitmentCenter, RECRUITMENT_CENTERS, ENROLMENT_HOURS } from "./services/jobs-data";
import { FormsModule } from "@angular/forms";

export interface UniteAffectation {
  id: string;
  nom: string;
  adresseHtml: string;
  adressePlain: string;
}

export const UNITES_AFFECTATION: UniteAffectation[] = [
  {
    id: "st-jean",
    nom: "St-Jean sur richelieu",
    adresseHtml: "ÉCOLE DE LEADERSHIP ET DE RECRUES DES FORCES CANADIENNES<br>CP 100 SUCC BUREAU-CHEF<br>RICHELAIN QC J0J 1R0",
    adressePlain: "ÉCOLE DE LEADERSHIP ET DE RECRUES DES FORCES CANADIENNES\nCP 100 SUCC BUREAU-CHEF\nRICHELAIN QC J0J 1R0"
  },
  {
    id: "valcartier",
    nom: "Valcartier",
    adresseHtml: "DETACHEMENT VALCARTIER QUARTIER GENERAL DE LA 2E DIVISION DU CANADA<br>CP 1000 SUCC FORCES<br>COURCELETTE QC G0A 4Z0",
    adressePlain: "DETACHEMENT VALCARTIER QUARTIER GENERAL DE LA 2E DIVISION DU CANADA\nCP 1000 SUCC FORCES\nCOURCELETTE QC G0A 4Z0"
  },
  {
    id: "borden",
    nom: "Borden",
    adresseHtml: "BASE DES FORCES CANADIENNES BORDEN<br>CP 1000 SUCC MAIN<br>BORDEN ON L0M 1C0",
    adressePlain: "BASE DES FORCES CANADIENNES BORDEN\nCP 1000 SUCC MAIN\nBORDEN ON L0M 1C0"
  },
  {
    id: "bagotville",
    nom: "Bagotville",
    adresseHtml: "BASE DES FORCES CANADIENNES BAGOTVILLE<br>CP 5000 SUCC BUREAU-CHEF<br>ALOUETTE QC G0V 1A0",
    adressePlain: "BASE DES FORCES CANADIENNES BAGOTVILLE\nCP 5000 SUCC BUREAU-CHEF\nALOUETTE QC G0V 1A0"
  },
  {
    id: "gagetown",
    nom: "Gagetown",
    adresseHtml: "BASE DE SOUTIEN DE LA 5E DIVISION DU CANADA GAGETOWN<br>CP 17000 SUCC FORCES<br>OROMOCTO NB E2V 4J5",
    adressePlain: "BASE DE SOUTIEN DE LA 5E DIVISION DU CANADA GAGETOWN\nCP 17000 SUCC FORCES\nOROMOCTO NB E2V 4J5"
  }
];


type AppStage = "intro" | "minor-check" | "recruiter-dossier-type" | "main";

interface RoleSnapshot {
  stage: AppStage;
  isUnderAge: boolean;
  recruiterDossierType?: 'normal' | 'pfor';
  allTasks: Task[];
  selectedTask: Task | null;
  selectedRejectionKeys: Set<string>;
  taskNotCompletedKeys: Set<string>;
  compliantDocKeys: Set<string>;
  collapsedGroups: Set<string>;
  forceGeneralReminder: boolean;
  selectedEmailBankTemplate?: string;
  triageMedicalRequis?: boolean;
  selectedDossierJobId1: string;
  selectedDossierJobId2: string;
  selectedDossierJobId3: string;
  searchDossierQuery1: string;
  searchDossierQuery2: string;
  searchDossierQuery3: string;
  dossierJobFailedCe1: boolean;
  dossierJobFailedCe2: boolean;
  dossierJobFailedCe3: boolean;
  testEcePassed?: boolean;
  testEsomPassed?: boolean;
  testCeopmPassed?: boolean;
  testCspnPassed?: boolean;
  testCspnNotCompleted?: boolean;
  testCspn00182Passed?: boolean;
  testCspn00183Passed?: boolean;
  testCspn00184Passed?: boolean;
  includeLinkedEmail: boolean;
  reoMergedEmailHtml: string;
  reoMergedEmailPlain: string;
  reoMergedNote: string;
  premierContactCourriel?: boolean;
  premierContactMedical?: boolean;
  premierContactEntrevue?: boolean;
  premierContactGambit?: boolean;
  premierContactPsps?: boolean;
  premierContactSelfie?: boolean;
  premierContactIptad?: boolean;
  premierContactSeaf?: boolean;
  premierContactSubPanelMode?: 'courriel' | 'note';
  premierContactNoteIptad?: string;
  premierContactNoteSeaf?: string;
  premierContactNoteEntrevue?: string;
  premierContactNoteMedical?: string;
  premierContactNotePsps?: string;
  premierContactNoteGambit?: string;
  premierContactNoteAnxQ?: string;
  avisFermetureCourriel?: boolean;
  avisFermetureDelaiJours?: string;
  avisFermetureDate?: string;
  avisFermetureEntrevue?: boolean;
  avisFermetureMedicale?: boolean;
  avisFermetureGambit?: boolean;
  avisFermeturePsps?: boolean;
  annexeQCourriel?: boolean;
  annexeQAlphaPostulant?: string;
  pforMatricule?: string;
  sgtCheckedInstructions?: string[];
  evaluationMedicaleType?: 'Dossier régulier' | 'Dossier OTA';
  evaluationMedicalePartie1?: boolean;
  evaluationMedicalePartie2?: boolean;
  evaluationMedicalePartie1Et2?: boolean;
  offreNormaleChecked?: boolean;
  offreEtudesSubventionneesChecked?: boolean;
  offreLieuVille?: string;
  offreUniteAffectation?: string;
  offreMetier?: string;
  offreMetierSearchQuery?: string;
  offreProgrammeEnrolement?: string;
  offreElement?: string;
  offreDureeContrat?: string;
  offreEtudesSubventionnees?: string;
  offreDureeEtudesSubventionnees?: string;
  offreDateEnrolement?: string;
  offreHeureArriveePostulant?: string;
  offreHeureArriveeInvites?: string;
  offreLieuEnrolement?: string;
  offreDateArriveeUnite?: string;
  offreElementsManquants?: string;
  offreDateElementsManquants?: string;
  offreSerieCours?: string;
  offreDateCoursDebut?: string;
  offreDateCoursFin?: string;
  offreSubPanelMode?: 'courriel' | 'note';
  noteStatutCivil?: string;
  noteConjoint?: string;
  noteConjointTexte?: string;
  noteEnfantCount?: string;
  noteEnfantDetails?: { sex: string; year: string }[];
  notePlaqueImm?: string;
  noteBrisBail?: string;
  noteEntreposage?: string;
  noteSermentDeclaration?: string;
  noteInviteMil?: string;
  noteInviteMilTexte?: string;
  noteSvcMilAnt?: string;
  noteBeneficiaire?: string;
  noteDateCourrielConfirmation?: string;
  testEsomRecruitmentCenterCity?: string;
  offreFormulairePpp?: boolean;
  offreFormulairePcu?: boolean;
  offreFormulaireCroixSouvenir?: boolean;
  offreFormulaireBeneficiaire?: boolean;
}

function getTodayDateString(): string {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, JobSearchModalComponent, CalendarPickerComponent, CourseSeriesPickerComponent, UnitPickerComponent, FormsModule, RoleSelectionComponent, SignatureManagerComponent, AuthGateComponent],
  templateUrl: './app.component.html',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class AppComponent implements OnInit {
  onAuthenticated() {
    this.isAuthenticated.set(true);
  }

  private dataService = inject(RecruitmentDataService);
  private emailScenariosService = inject(EmailScenariosService);
  private sanitizer = inject(DomSanitizer);
  public sharedState = inject(SharedStateService);
  public jobService = inject(JobDatabaseService);
  public melService = inject(MelService);
  public reorientationCriteria = inject(ReorientationCriteriaService);
  public translationService = inject(TranslationService);

  // Dossier Jobs Panel Dropdown States
  dossierDropdownOpen1 = signal<boolean>(false);
  dossierDropdownOpen2 = signal<boolean>(false);
  dossierDropdownOpen3 = signal<boolean>(false);

  // Premier Contact State
  premierContactSubPanelMode = signal<'courriel' | 'note'>('courriel');
  readonly premierContactIptadOptions: string[] = ['Complété', 'À faire', 'Attribué'];
  readonly premierContactSeafOptions: string[] = ['Complété', 'Attribué'];
  readonly premierContactEntrevueOptions: string[] = ['À faire', 'Complété', 'Attribué'];
  readonly premierContactMedicalOptions: string[] = ['À faire', 'Complété', 'Attribué'];
  readonly premierContactPspsOptions: string[] = ['À faire', 'Complété', 'Initié'];
  readonly premierContactGambitOptions: string[] = ['En attente (type 28)', 'En attente (dossier soumis)', 'Concluant favorable', 'Concluant défavorable', 'Non Concluant'];
  readonly premierContactAnxQOptions: string[] = ['À faire', 'Complété'];

  premierContactNoteIptad = signal<string>('Complété');
  premierContactNoteSeaf = signal<string>('Complété');
  premierContactNoteEntrevue = signal<string>('À faire');
  premierContactNoteMedical = signal<string>('À faire');
  premierContactNotePsps = signal<string>('À faire');
  premierContactNoteGambit = signal<string>('En attente (type 28)');
  premierContactNoteAnxQ = signal<string>('À faire');

  premierContactCourriel = signal<boolean>(false);
  premierContactMedical = signal<boolean>(false);
  premierContactEntrevue = signal<boolean>(false);
  premierContactGambit = signal<boolean>(false);
  premierContactPsps = signal<boolean>(false);
  premierContactSelfie = signal<boolean>(false);
  premierContactIptad = signal<boolean>(false);
  premierContactSeaf = signal<boolean>(false);

  // Avis de Fermeture State
  avisFermetureCourriel = signal<boolean>(false);
  avisFermetureDelaiJours = signal<string>('14');
  avisFermetureDate = signal<string>('');
  avisFermetureEntrevue = signal<boolean>(false);
  avisFermetureMedicale = signal<boolean>(false);
  avisFermetureGambit = signal<boolean>(false);
  avisFermeturePsps = signal<boolean>(false);

  // Annexe Q State
  annexeQCourriel = signal<boolean>(false);
  annexeQAlphaPostulant = signal<string>('');

  // PFOR State
  pforMatricule = signal<string>('');

  // Instructions Sgt Recruteur Checkboxes
  sgtPforInstructions = [
    { id: 'pfor_1', text: "S'assurer que la liste de Vérification A1 à A35 est bien rempli" },
    { id: 'pfor_2', text: 'Marquer la tâche "Planifier votre consultation CAF 101" comme complétée' },
    { id: 'pfor_3', text: 'Réattribuer la tâche "relevés de notes et Diplômes" pour le dépôt de la capture d\'écran de confirmation des documents déposés sur le PA' },
    { id: 'pfor_4', text: 'Ajouter la note au registre du Postulant' },
    { id: 'pfor_5', text: 'Tag CCM et Recruteur BPR appropriés' },
    { id: 'pfor_6', text: 'Basculer vers la Gestion des admissions' },
    { id: 'pfor_7', text: 'Envoyer les 2 courriels au Postulant : CAF 101 PFOR et Lien PA' },
  ];

  sgtStandardInstructions = [
    { id: 'std_1', text: "S'assurer que la liste de vérification A1 à A35 est bien rempli." },
    { id: 'std_2', text: "Attribuer la tâche : Planifiez votre séance d'information des FAC 101." },
    { id: 'std_3', text: "Mettre le marqueur ‘’Dispense requise’’ ou ‘’ÉRA requise’’ au besoin, le Ltv Forest fera l’analyse." },
    { id: 'std_4', text: "Ajouter la note au registre du postulant." },
    { id: 'std_5', text: "Basculer le postulant dans Traitement initial." },
    { id: 'std_6', text: "Envoyé le courriel au postulant contenant le lien vers le Form et le CAF 101." },
  ];

  sgtCheckedInstructions = signal<Set<string>>(new Set<string>());

  toggleSgtInstruction(id: string) {
    this.sgtCheckedInstructions.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isSgtInstructionChecked(id: string): boolean {
    return this.sgtCheckedInstructions().has(id);
  }

  resetSgtInstructions() {
    this.sgtCheckedInstructions.set(new Set<string>());
  }

  toggleAllSgtInstructions(items: { id: string; text: string }[]) {
    const allChecked = items.every(item => this.isSgtInstructionChecked(item.id));
    this.sgtCheckedInstructions.update(set => {
      const next = new Set(set);
      if (allChecked) {
        items.forEach(item => next.delete(item.id));
      } else {
        items.forEach(item => next.add(item.id));
      }
      return next;
    });
  }

  getCompletedSgtInstructionsCount(items: { id: string; text: string }[]): number {
    return items.filter(item => this.isSgtInstructionChecked(item.id)).length;
  }

  // Évaluation Médicale State
  evaluationMedicaleType = signal<'Dossier régulier' | 'Dossier OTA'>('Dossier régulier');
  evaluationMedicalePartie1 = signal<boolean>(false);
  evaluationMedicalePartie2 = signal<boolean>(false);
  evaluationMedicalePartie1Et2 = signal<boolean>(false);
  copiedMedicalKey = signal<string | null>(null);

  copyToClipboard(text: string, key: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    this.copiedMedicalKey.set(key);
    setTimeout(() => {
      if (this.copiedMedicalKey() === key) {
        this.copiedMedicalKey.set(null);
      }
    }, 2000);
  }

  // --- Premier Contact Methods ---
  getPremierContactSelectedTasks(): {
    id: string;
    labelPlainFr: string;
    labelPlainEn: string;
    labelHtmlFr: string;
    labelHtmlEn: string;
  }[] {
    const list: {
      id: string;
      labelPlainFr: string;
      labelPlainEn: string;
      labelHtmlFr: string;
      labelHtmlEn: string;
    }[] = [];
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';

    // In local dossiers, medical is a numbered list item. In OTA dossiers, medical appointment text replaces or follows the list.
    if (this.premierContactMedical() && !isOta) {
      list.push({
        id: 'medical',
        labelPlainFr: 'Planifiez votre évaluation médicale',
        labelPlainEn: 'Schedule your medical evaluation',
        labelHtmlFr: 'Planifiez votre évaluation médicale',
        labelHtmlEn: 'Schedule your medical evaluation',
      });
    }
    if (this.premierContactEntrevue()) {
      list.push({
        id: 'entrevue',
        labelPlainFr: 'Planifiez votre entrevue',
        labelPlainEn: 'Schedule your interview',
        labelHtmlFr: 'Planifiez votre entrevue',
        labelHtmlEn: 'Schedule your interview',
      });
    }
    if (this.premierContactGambit()) {
      list.push({
        id: 'gambit',
        labelPlainFr: "Références, antécédents d'emploi et d'études (Gambit)",
        labelPlainEn: 'References, employment and education history (Gambit)',
        labelHtmlFr: "Références, antécédents d'emploi et d'études (Gambit)",
        labelHtmlEn: 'References, employment and education history (Gambit)',
      });
    }
    if (this.premierContactPsps()) {
      list.push({
        id: 'psps',
        labelPlainFr: "Vérification du casier judiciaire et du dossier de crédit (PSPS/cette tâche n'est pas dans votre portail, vous recevrez un courriel envoyé par app@gambitid.com)",
        labelPlainEn: 'Criminal record and credit check (PSPS/this task is not in your portal, you will receive an email sent by app@gambitid.com)',
        labelHtmlFr: "Vérification du casier judiciaire et du dossier de crédit (PSPS/cette tâche n'est pas dans votre portail, vous recevrez un courriel envoyé par app@gambitid.com)",
        labelHtmlEn: 'Criminal record and credit check (PSPS/this task is not in your portal, you will receive an email sent by app@gambitid.com)',
      });
    }
    if (this.premierContactSelfie()) {
      list.push({
        id: 'selfie',
        labelPlainFr: "Téléverser un égoportrait (selfie) avec votre pièce d'identité dans votre portail (dans la tâche : Pièce d'identité avec photo émise par le gouvernement canadien (les deux côtés)). Voici un lien vers un exemple acceptable d’un égoportrait : https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png",
        labelPlainEn: 'Upload a selfie with your ID document to your portal (in the task: Canadian government issued photo ID (both sides)). Here is a link to an acceptable example of a selfie: https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png',
        labelHtmlFr: `Téléverser un égoportrait (selfie) avec votre pièce d'identité dans votre portail (dans la tâche : Pièce d'identité avec photo émise par le gouvernement canadien (les deux côtés)). Voici un lien vers un exemple acceptable d’un <a href="https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png" target="_blank" style="color: #0563c1; text-decoration: underline;">égoportrait</a>.`,
        labelHtmlEn: `Upload a selfie with your ID document to your portal (in the task: Canadian government issued photo ID (both sides)). Here is a link to an acceptable example of a <a href="https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png" target="_blank" style="color: #0563c1; text-decoration: underline;">selfie</a>.`,
      });
    }
    if (this.premierContactIptad()) {
      list.push({
        id: 'iptad',
        labelPlainFr: "Évaluation de la personnalité (Inventaire de personnalité des traits auto-descriptifs)",
        labelPlainEn: "Personality Assessment (Self-Descriptive Inventory of Personality Traits)",
        labelHtmlFr: "Évaluation de la personnalité (Inventaire de personnalité des traits auto-descriptifs)",
        labelHtmlEn: "Personality Assessment (Self-Descriptive Inventory of Personality Traits)",
      });
    }
    if (this.premierContactSeaf()) {
      list.push({
        id: 'seaf',
        labelPlainFr: "Formulaire de demande d'emploi notée",
        labelPlainEn: "Scored Employment Application Form",
        labelHtmlFr: "Formulaire de demande d'emploi notée",
        labelHtmlEn: "Scored Employment Application Form",
      });
    }
    return list;
  }

  getPremierContactSectionPlainFr(): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    const selected = this.getPremierContactSelectedTasks();

    const p1 = `Bonjour,
Votre dossier de candidature pour les Forces armées canadiennes m’a été attribué. Sachez que votre dossier est actuellement en traitement et que nous continuons de le faire progresser.
Nous vous demandons de porter une attention particulière à vos courriels et à votre portail car des tâches vont vous être attribuées. Chaque nouvelle tâche attribuée doit être complétée dans un délai de 14 jours à partir de la date d’attribution sinon votre dossier sera fermé.`;

    let p2 = '';
    if (selected.length > 0) {
      const listStr = selected.map((t, idx) => `${idx + 1}-\t${t.labelPlainFr}`).join('\n');
      p2 = `\n\nTâche(s) à compléter présentement :\n${listStr}`;
    }

    let p3 = '';
    if (isOta && this.premierContactMedical()) {
      p3 = `\n\nVotre rendez-vous pour votre évaluation médicale a été fixé au centre de recrutement de Montréal.
Veuillez vous connecter à votre portail du postulant afin d'y retrouver tous les détails concernant votre rendez-vous.
IMPORTANT : Veuillez nous avertir le plus rapidement possible si la date ne vous convient pas.`;
    }

    const p4 = `\n\nPourriez-vous me dire si vous avez du service militaire antérieur? (Cadet, Force de réserve/régulière, Armée étrangère)

Je reste à votre disposition afin de répondre à toutes questions que vous pourriez avoir concernant votre dossier.
Enfin, veuillez m’informer de tous changements à apporter à votre dossier, par exemple : changement d’adresse, études, nouvelles qualifications, nouvelle pièce d’identité, changement quant à votre dossier médical ou judiciaire, etc.

Au besoin, voici le lien de connexion à votre portail : https://www.cafoap-pclfac.forces.gc.ca/

Je vous remercie de votre intérêt pour les forces armées canadiennes.
Merci de votre collaboration.`;

    return `${p1}${p2}${p3}${p4}`;
  }

  getPremierContactSectionPlainEn(): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    const selected = this.getPremierContactSelectedTasks();

    const p1 = `Hello,
Your application file for the Canadian Armed Forces has been assigned to me. Please know that your file is currently being processed and we continue to move it forward.
We ask you to pay close attention to your emails and your portal as tasks will be assigned to you. Each new assigned task must be completed within 14 days of the assignment date, otherwise your file will be closed.`;

    let p2 = '';
    if (selected.length > 0) {
      const listStr = selected.map((t, idx) => `${idx + 1}-\t${t.labelPlainEn}`).join('\n');
      p2 = `\n\nTask(s) to be completed at this time:\n${listStr}`;
    }

    let p3 = '';
    if (isOta && this.premierContactMedical()) {
      p3 = `\n\nYour appointment for your Medical Evaluation has been scheduled at the Montreal recruitment centre.
Please log in to your applicant portal to find all the details regarding your appointment.
IMPORTANT: Please notify us as soon as possible if this date does not work for you.`;
    }

    const p4 = `\n\nCould you tell me if you have any prior military service? (Cadets, Reserve/Regular Force, Foreign Military)

I remain at your disposal to answer any questions you may have regarding your file.
Finally, please inform me of any changes to be made to your file, for example: change of address, studies, new qualifications, new identification document, change regarding your medical or criminal record, etc.

If necessary, here is the link to log into your portal: https://www.cafoap-pclfac.forces.gc.ca/

Thank you for your interest in the Canadian Armed Forces.
Thank you for your cooperation.`;

    return `${p1}${p2}${p3}${p4}`;
  }

  getPremierContactEmailPlain(): string {
    const fr = this.getPremierContactSectionPlainFr();
    const en = this.getPremierContactSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return this.translationService.formatBilingualEmail({
      frBody: fr,
      enBody: en,
      sigFr: sigFr,
      sigEn: sigEn,
      isHtml: false
    });
  }

  getPremierContactSectionHtmlFr(): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    const selected = this.getPremierContactSelectedTasks();

    const p1Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,<br>Votre dossier de candidature pour les Forces armées canadiennes m’a été attribué. Sachez que votre dossier est actuellement en traitement et que nous continuons de le faire progresser.<br>Nous vous demandons de porter une attention particulière à vos courriels et à votre portail car des tâches vont vous être attribuées. Chaque nouvelle tâche attribuée doit être complétée dans un <span style="background-color: yellow; mso-highlight: yellow;">délai de 14 jours</span> à partir de la date d’attribution sinon votre dossier sera fermé.</p>`;

    let p2Html = '';
    if (selected.length > 0) {
      const itemsHtml = selected
        .map(
          (t, idx) =>
            `${idx + 1}-&nbsp;&nbsp;&nbsp;&nbsp;${t.labelHtmlFr}`
        )
        .join('<br>');
      p2Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Tâche(s) à compléter présentement :<br>${itemsHtml}</p>`;
    }

    let p3Html = '';
    if (isOta && this.premierContactMedical()) {
      p3Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Votre rendez-vous pour votre évaluation médicale a été fixé au centre de recrutement de Montréal.<br>Veuillez vous connecter à votre portail du postulant afin d'y retrouver tous les détails concernant votre rendez-vous.<br><strong style="background-color: #fee2e2; color: #991b1b; padding: 2px 4px;">IMPORTANT : Veuillez nous avertir le plus rapidement possible si la date ne vous convient pas.</strong></p>`;
    }

    const p4Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Pourriez-vous me dire si vous avez du service militaire antérieur? (Cadet, Force de réserve/régulière, Armée étrangère)</p><p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Je reste à votre disposition afin de répondre à toutes questions que vous pourriez avoir concernant votre dossier.<br>Enfin, <span style="background-color: yellow; mso-highlight: yellow;">veuillez m’informer de tous changements à apporter à votre dossier</span>, par exemple : changement d’adresse, études, nouvelles qualifications, nouvelle pièce d’identité, changement quant à votre dossier médical ou judiciaire, etc.<br><br>Au besoin, voici le lien de connexion à votre portail : <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #0563c1; text-decoration: underline;">https://www.cafoap-pclfac.forces.gc.ca/</a><br><br>Je vous remercie de votre intérêt pour les forces armées canadiennes.<br>Merci de votre collaboration.</p>`;

    return `${p1Html}${p2Html}${p3Html}${p4Html}`;
  }

  getPremierContactSectionHtmlEn(): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    const selected = this.getPremierContactSelectedTasks();

    const p1Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Hello,<br>Your application file for the Canadian Armed Forces has been assigned to me. Please know that your file is currently being processed and we continue to move it forward.<br>We ask you to pay close attention to your emails and your portal as tasks will be assigned to you. Each new assigned task must be completed <span style="background-color: yellow; mso-highlight: yellow;">within 14 days</span> of the assignment date, otherwise your file will be closed.</p>`;

    let p2Html = '';
    if (selected.length > 0) {
      const itemsHtml = selected
        .map(
          (t, idx) =>
            `${idx + 1}-&nbsp;&nbsp;&nbsp;&nbsp;${t.labelHtmlEn}`
        )
        .join('<br>');
      p2Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Task(s) to be completed at this time:<br>${itemsHtml}</p>`;
    }

    let p3Html = '';
    if (isOta && this.premierContactMedical()) {
      p3Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Your appointment for your Medical Evaluation has been scheduled at the Montreal recruitment centre.<br>Please log in to your applicant portal to find all the details regarding your appointment.<br><strong style="background-color: #fee2e2; color: #991b1b; padding: 2px 4px;">IMPORTANT: Please notify us as soon as possible if this date does not work for you.</strong></p>`;
    }

    const p4Html = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Could you tell me if you have any prior military service? (Cadets, Reserve/Regular Force, Foreign Military)</p><p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">I remain at your disposal to answer any questions you may have regarding your file.<br>Finally, <span style="background-color: yellow; mso-highlight: yellow;">please inform me of any changes to be made to your file</span>, for example: change of address, studies, new qualifications, new identification document, change regarding your medical or criminal record, etc.<br><br>If necessary, here is the link to log into your portal: <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #0563c1; text-decoration: underline;">https://www.cafoap-pclfac.forces.gc.ca/</a><br><br>Thank you for your interest in the Canadian Armed Forces.<br>Thank you for your cooperation.</p>`;

    return `${p1Html}${p2Html}${p3Html}${p4Html}`;
  }

  getPremierContactEmailHtml(): string {
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    const fr = this.getPremierContactSectionHtmlFr();
    const en = this.getPremierContactSectionHtmlEn();
    return this.translationService.formatBilingualEmail({
      frBody: fr,
      enBody: en,
      sigFr: sigFr,
      sigEn: sigEn,
      isHtml: true
    });
  }

  // --- Avis de Fermeture Methods ---
  getAvisFermetureSelectedTasksFr(): string[] {
    const list: string[] = [];
    if (this.avisFermetureEntrevue()) {
      list.push("Planifiez votre entrevue");
    }
    if (this.avisFermetureMedicale()) {
      list.push("Planifiez votre évaluation médicale");
    }
    if (this.avisFermetureGambit()) {
      list.push("Références, antécédents d'emploi et d'études (Gambit)");
    }
    if (this.avisFermeturePsps()) {
      list.push("Vérification du casier judiciaire et du dossier de crédit (PSPS)");
    }
    return list;
  }

  getAvisFermetureSelectedTasksEn(): string[] {
    const list: string[] = [];
    if (this.avisFermetureEntrevue()) {
      list.push("Schedule your interview");
    }
    if (this.avisFermetureMedicale()) {
      list.push("Schedule your medical evaluation");
    }
    if (this.avisFermetureGambit()) {
      list.push("References, employment and education history (Gambit)");
    }
    if (this.avisFermeturePsps()) {
      list.push("Criminal record and credit check (PSPS)");
    }
    return list;
  }

  isOffreOtaActive(): boolean {
    return this.evaluationMedicaleType() === 'Dossier OTA' && (this.offreNormaleChecked() || this.offreEtudesSubventionneesChecked());
  }

  getAnnexeQSectionPlainFr(): string {
    const alpha = this.annexeQAlphaPostulant().trim() || 'xx';
    return `Bonjour Monsieur/Madame,\n\nLes documents PSPS sont au dossier pour le postulant suivant : ${alpha}\n\nMerci, bonne journée à vous !`;
  }

  getAnnexeQSectionPlainEn(): string {
    const alpha = this.annexeQAlphaPostulant().trim() || 'xx';
    return `Hello Sir/Madam,\n\nThe PSPS documents are on file for the following applicant: ${alpha}\n\nThank you, have a great day!`;
  }

  getAnnexeQEmailPlain(): string {
    const fr = this.getAnnexeQSectionPlainFr();
    const en = this.getAnnexeQSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return this.translationService.formatBilingualEmail({
      frBody: fr,
      enBody: en,
      sigFr: sigFr,
      sigEn: sigEn,
      isHtml: false
    });
  }

  getAnnexeQSectionHtmlFr(): string {
    const alpha = this.annexeQAlphaPostulant().trim() || 'xx';
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour Monsieur/Madame,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Les documents PSPS sont au dossier pour le postulant suivant : ${alpha}</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Merci, bonne journée à vous !</p>`;
  }

  getAnnexeQSectionHtmlEn(): string {
    const alpha = this.annexeQAlphaPostulant().trim() || 'xx';
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Hello Sir/Madam,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">The PSPS documents are on file for the following applicant: ${alpha}</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Thank you, have a great day!</p>`;
  }

  getAnnexeQEmailHtml(): string {
    const fr = this.getAnnexeQSectionHtmlFr();
    const en = this.getAnnexeQSectionHtmlEn();
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    return this.translationService.formatBilingualEmail({
      frBody: fr,
      enBody: en,
      sigFr: sigFr,
      sigEn: sigEn,
      isHtml: true
    });
  }

  translateDateToEn(dateStr: string): string {
    if (!dateStr) return '';
    const map: Record<string, string> = {
      'janvier': 'January', 'février': 'February', 'mars': 'March', 'avril': 'April',
      'mai': 'May', 'juin': 'June', 'juillet': 'July', 'août': 'August',
      'septembre': 'September', 'octobre': 'October', 'novembre': 'November', 'décembre': 'December'
    };
    let result = dateStr;
    for (const [fr, en] of Object.entries(map)) {
      result = result.replace(new RegExp(`\\b${fr}\\b`, 'gi'), en);
    }
    return result;
  }

  getAvisFermetureSectionPlainFr(): string {
    let delaiLineFr = '';
    if (this.avisFermetureDelaiJours() === 'autre') {
      const dateStr = this.avisFermetureDate().trim() || 'xx';
      delaiLineFr = `À cet effet, nous vous accordons jusqu'au ${dateStr} pour effectuer les actions nécessaires.`;
    } else {
      const delai = this.avisFermetureDelaiJours() || '14';
      delaiLineFr = `À cet effet, nous vous accordons un délai de ${delai} jours à compter de la date d'envoi de ce courriel pour effectuer les actions nécessaires.`;
    }
    const tasks = this.getAvisFermetureSelectedTasksFr();
    let tasksBlock = '';
    if (tasks.length > 0) {
      tasksBlock = '\n\nVoici les tâches à compléter dans le délai prescrit :\n' + tasks.map((t, i) => `${i + 1}- ${t}`).join('\n');
    } else {
      tasksBlock = '\n\nVoici les tâches à compléter dans le délai prescrit :\n1-\n\n2-';
    }

    return `Bonjour,\n\nPar la présente, nous vous informons que votre dossier demeure incomplet à ce jour, certaines tâches requises n’ayant pas été complétées.\n${delaiLineFr}\nÀ défaut de régularisation dans ce délai, nous procéderons à la fermeture de votre dossier sans autre avis.${tasksBlock}\n\nSi vous avez des questions, n’hésitez pas à communiquer avec moi.`;
  }

  getAvisFermetureSectionPlainEn(): string {
    let delaiLineEn = '';
    if (this.avisFermetureDelaiJours() === 'autre') {
      const rawDate = this.avisFermetureDate().trim() || 'xx';
      const dateStr = rawDate !== 'xx' ? this.translateDateToEn(rawDate) : 'xx';
      delaiLineEn = `To this end, we grant you until ${dateStr} to take the necessary actions.`;
    } else {
      const delai = this.avisFermetureDelaiJours() || '14';
      delaiLineEn = `To this end, we grant you a period of ${delai} days from the sending date of this email to take the necessary actions.`;
    }
    const tasks = this.getAvisFermetureSelectedTasksEn();
    let tasksBlock = '';
    if (tasks.length > 0) {
      tasksBlock = '\n\nHere are the tasks to complete within the prescribed timeframe:\n' + tasks.map((t, i) => `${i + 1}- ${t}`).join('\n');
    } else {
      tasksBlock = '\n\nHere are the tasks to complete within the prescribed timeframe:\n1-\n\n2-';
    }

    return `Hello,\n\nWe hereby inform you that your file remains incomplete to date, as certain required tasks have not been completed.\n${delaiLineEn}\nFailing regularization within this timeframe, we will proceed with closing your file without further notice.${tasksBlock}\n\nIf you have any questions, please do not hesitate to contact me.`;
  }

  getAvisFermetureEmailPlain(): string {
    const fr = this.getAvisFermetureSectionPlainFr();
    const en = this.getAvisFermetureSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return this.translationService.formatBilingualEmail({
      frBody: fr,
      enBody: en,
      sigFr: sigFr,
      sigEn: sigEn,
      isHtml: false
    });
  }

  getAvisFermetureSectionHtmlFr(): string {
    let delaiHtmlFr = '';
    if (this.avisFermetureDelaiJours() === 'autre') {
      const dateStr = this.avisFermetureDate().trim() || 'xx';
      delaiHtmlFr = `À cet effet, nous vous accordons jusqu'au <span style="background-color: red; mso-highlight: red; color: #ffffff; padding: 1px 4px;">${dateStr}</span> pour effectuer les actions nécessaires.`;
    } else {
      const delai = this.avisFermetureDelaiJours() || '14';
      delaiHtmlFr = `À cet effet, nous vous accordons un délai de <span style="background-color: red; mso-highlight: red; color: #ffffff; padding: 1px 4px;">${delai} jours</span> à compter de la date d'envoi de ce courriel pour effectuer les actions nécessaires.`;
    }
    const tasks = this.getAvisFermetureSelectedTasksFr();
    let tasksHtml = '';
    if (tasks.length > 0) {
      tasksHtml = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Voici les tâches à compléter dans le délai prescrit :<br>` +
        tasks.map((t, i) => `${i + 1}-&nbsp;&nbsp;&nbsp;&nbsp;${t}`).join('<br>') + `</p>`;
    } else {
      tasksHtml = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Voici les tâches à compléter dans le délai prescrit :<br>1-<br><br>2-</p>`;
    }

    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Par la présente, nous vous informons que votre dossier demeure incomplet à ce jour, certaines tâches requises n’ayant pas été complétées.<br>${delaiHtmlFr}<br>À défaut de régularisation dans ce délai, nous procéderons à la fermeture de votre dossier sans autre avis.</p>` +
      `${tasksHtml}` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Si vous avez des questions, n’hésitez pas à communiquer avec moi.</p>`;
  }

  getAvisFermetureSectionHtmlEn(): string {
    let delaiHtmlEn = '';
    if (this.avisFermetureDelaiJours() === 'autre') {
      const rawDate = this.avisFermetureDate().trim() || 'xx';
      const dateStr = rawDate !== 'xx' ? this.translateDateToEn(rawDate) : 'xx';
      delaiHtmlEn = `To this end, we grant you until <span style="background-color: red; mso-highlight: red; color: #ffffff; padding: 1px 4px;">${dateStr}</span> to take the necessary actions.`;
    } else {
      const delai = this.avisFermetureDelaiJours() || '14';
      delaiHtmlEn = `To this end, we grant you a period of <span style="background-color: red; mso-highlight: red; color: #ffffff; padding: 1px 4px;">${delai} days</span> from the sending date of this email to take the necessary actions.`;
    }
    const tasks = this.getAvisFermetureSelectedTasksEn();
    let tasksHtml = '';
    if (tasks.length > 0) {
      tasksHtml = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Here are the tasks to complete within the prescribed timeframe:<br>` +
        tasks.map((t, i) => `${i + 1}-&nbsp;&nbsp;&nbsp;&nbsp;${t}`).join('<br>') + `</p>`;
    } else {
      tasksHtml = `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Here are the tasks to complete within the prescribed timeframe:<br>1-<br><br>2-</p>`;
    }

    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Hello,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">We hereby inform you that your file remains incomplete to date, as certain required tasks have not been completed.<br>${delaiHtmlEn}<br>Failing regularization within this timeframe, we will proceed with closing your file without further notice.</p>` +
      `${tasksHtml}` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">If you have any questions, please do not hesitate to contact me.</p>`;
  }

  getAvisFermetureEmailHtml(): string {
    const fr = this.getAvisFermetureSectionHtmlFr();
    const en = this.getAvisFermetureSectionHtmlEn();
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();

    return `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>English message will follow.</strong></p>` +
      `${fr}` +
      `<p>${sigFr}</p>` +
      `<p style="margin-top: 12.0pt; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">______________________________________________________________________________</p>` +
      `${en}` +
      `<p>${sigEn}</p>` +
      `</div>`;
  }

  getMedicalPartEn(part: string): string {
    if (part === 'Partie 1') return 'Part 1';
    if (part === 'Partie 2') return 'Part 2';
    if (part === 'Partie 1 et 2') return 'Part 1 and 2';
    return part;
  }


  getMedicalEmailBody(part: string): string {
    const partEn = this.getMedicalPartEn(part);
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';

    if (isOta) {
      let fr = `Bonjour,

Votre rendez-vous pour votre évaluation médicale - ${part} a été fixé au centre de recrutement de Montréal.

Veuillez vous connecter à votre portail du postulant afin d'y retrouver tous les détails concernant votre rendez-vous.

Lien de connexion à votre portail : https://www.cafoap-pclfac.forces.gc.ca/

IMPORTANT : Veuillez nous avertir le plus rapidement possible si la date ne vous convient pas.

Merci de votre collaboration.`;

      let en = `Hello,

Your appointment for your Medical Evaluation - ${partEn} has been scheduled at the Montreal recruitment centre.

Please log in to your applicant portal to find all the details regarding your appointment.

Applicant portal login link: https://www.cafoap-pclfac.forces.gc.ca/

IMPORTANT: Please notify us as soon as possible if this date does not work for you.

Thank you for your cooperation.`;

      return `${fr}\n\n______________________________________________________________________________\n\n${en}`;
    }

    let fr = `Bonjour,

Une nouvelle tâche intitulée « Évaluation médicale - ${part} » vous a été attribuée dans votre portail du postulant.

Afin de réaliser votre évaluation médicale, vous devrez vous présenter à votre centre de recrutement attitré (dont les coordonnées sont indiquées directement dans votre portail).

Dans votre portail, vous pourrez sélectionner vous-même le moment qui vous convient le mieux parmi les plages horaires disponibles.

Lien de connexion à votre portail : https://www.cafoap-pclfac.forces.gc.ca/

Merci de votre collaboration.`;

    let en = `Hello,

A new task titled "Medical Evaluation - ${partEn}" has been assigned to you in your applicant portal.

To complete this medical evaluation, you will need to report to your assigned recruitment centre (indicated in your portal).

In your portal, you will be able to select the time slot that best suits you from the available times.

Applicant portal login link: https://www.cafoap-pclfac.forces.gc.ca/

Thank you for your cooperation.`;

    return `${fr}\n\n______________________________________________________________________________\n\n${en}`;
  }

  getMedicalPartsInfo(): { labelFr: string; labelEn: string } | null {
    if (this.evaluationMedicalePartie1Et2()) {
      return { labelFr: 'Partie 1 et 2', labelEn: 'Part 1 and 2' };
    }
    if (this.evaluationMedicalePartie1() && this.evaluationMedicalePartie2()) {
      return { labelFr: 'Partie 1 et Partie 2', labelEn: 'Part 1 and Part 2' };
    }
    if (this.evaluationMedicalePartie1()) {
      return { labelFr: 'Partie 1', labelEn: 'Part 1' };
    }
    if (this.evaluationMedicalePartie2()) {
      return { labelFr: 'Partie 2', labelEn: 'Part 2' };
    }
    return null;
  }

  getMedicalSectionHtmlFr(part: string): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    let html = '';
    if (isOta) {
      html += `<p>Votre rendez-vous pour votre évaluation médicale - <strong>${part}</strong> a été fixé au centre de recrutement de Montréal.</p>`;
      html += `<p>Veuillez vous connecter à votre portail du postulant afin d'y retrouver tous les détails concernant votre rendez-vous.</p>`;
      html += `<p>Lien de connexion à votre portail : <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline;">https://www.cafoap-pclfac.forces.gc.ca/</a></p>`;
      html += `<p style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 10px 14px; margin: 14px 0; color: #991b1b;"><strong style="font-size: 11.5pt;">IMPORTANT : Veuillez nous avertir le plus rapidement possible si la date ne vous convient pas.</strong></p>`;
    } else {
      html += `<p>Une nouvelle tâche intitulée <strong>Évaluation médicale - ${part}</strong> vous a été attribuée dans votre portail du postulant.</p>`;
      html += `<p>Afin de réaliser votre évaluation médicale, vous devrez vous présenter à votre centre de recrutement attitré (dont les coordonnées sont indiquées directement dans votre portail).</p>`;
      html += `<p>Dans votre portail, vous pourrez sélectionner vous-même le moment qui vous convient le mieux parmi les plages horaires disponibles.</p>`;
      html += `<p>Lien de connexion à votre portail : <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline;">https://www.cafoap-pclfac.forces.gc.ca/</a></p>`;
    }
    html += `<p>Merci de votre collaboration.</p>`;
    return html;
  }

  getMedicalSectionHtmlEn(partEn: string): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    let html = '';
    if (isOta) {
      html += `<p>Your appointment for your Medical Evaluation - <strong>${partEn}</strong> has been scheduled at the Montreal recruitment centre.</p>`;
      html += `<p>Please log in to your applicant portal to find all the details regarding your appointment.</p>`;
      html += `<p>Applicant portal login link: <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline;">https://www.cafoap-pclfac.forces.gc.ca/</a></p>`;
      html += `<p style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 10px 14px; margin: 14px 0; color: #991b1b;"><strong style="font-size: 11.5pt;">IMPORTANT: Please notify us as soon as possible if this date does not work for you.</strong></p>`;
    } else {
      html += `<p>A new task titled <strong>Medical Evaluation - ${partEn}</strong> has been assigned to you in your applicant portal.</p>`;
      html += `<p>To complete this medical evaluation, you will need to report to your assigned recruitment centre (indicated in your portal).</p>`;
      html += `<p>In your portal, you will be able to select the time slot that best suits you from the available times.</p>`;
      html += `<p>Applicant portal login link: <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline;">https://www.cafoap-pclfac.forces.gc.ca/</a></p>`;
    }
    html += `<p>Thank you for your cooperation.</p>`;
    return html;
  }

  getMedicalSectionPlainFr(part: string): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    let fr = '';
    if (isOta) {
      fr += `Votre rendez-vous pour votre évaluation médicale - ${part} a été fixé au centre de recrutement de Montréal.\n\n`;
      fr += `Veuillez vous connecter à votre portail du postulant afin d'y retrouver tous les détails concernant votre rendez-vous.\n\n`;
      fr += `Lien de connexion à votre portail : https://www.cafoap-pclfac.forces.gc.ca/\n\n`;
      fr += `IMPORTANT : Veuillez nous avertir le plus rapidement possible si la date ne vous convient pas.\n\n`;
    } else {
      fr += `Une nouvelle tâche intitulée « Évaluation médicale - ${part} » vous a été attribuée dans votre portail du postulant.\n\n`;
      fr += `Afin de réaliser votre évaluation médicale, vous devrez vous présenter à votre centre de recrutement attitré (dont les coordonnées sont indiquées directement dans votre portail).\n\n`;
      fr += `Dans votre portail, vous pourrez sélectionner vous-même le moment qui vous convient le mieux parmi les plages horaires disponibles.\n\n`;
      fr += `Lien de connexion à votre portail : https://www.cafoap-pclfac.forces.gc.ca/\n\n`;
    }
    fr += `Merci de votre collaboration.`;
    return fr;
  }

  getMedicalSectionPlainEn(partEn: string): string {
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    let en = '';
    if (isOta) {
      en += `Your appointment for your Medical Evaluation - ${partEn} has been scheduled at the Montreal recruitment centre.\n\n`;
      en += `Please log in to your applicant portal to find all the details regarding your appointment.\n\n`;
      en += `Applicant portal login link: https://www.cafoap-pclfac.forces.gc.ca/\n\n`;
      en += `IMPORTANT: Please notify us as soon as possible if this date does not work for you.\n\n`;
    } else {
      en += `A new task titled "Medical Evaluation - ${partEn}" has been assigned to you in your applicant portal.\n\n`;
      en += `To complete this medical evaluation, you will need to report to your assigned recruitment centre (indicated in your portal).\n\n`;
      en += `In your portal, you will be able to select the time slot that best suits you from the available times.\n\n`;
      en += `Applicant portal login link: https://www.cafoap-pclfac.forces.gc.ca/\n\n`;
    }
    en += `Thank you for your cooperation.`;
    return en;
  }

  getMedicalRegisterNoteCombined(): string {
    const medInfo = this.getMedicalPartsInfo();
    if (!medInfo) return '';
    if (this.evaluationMedicaleType() === 'Dossier OTA') {
      return `Rendez-vous pour l'évaluation médicale - ${medInfo.labelFr} directement fixé au centre de recrutement de Montréal (Dossier OTA). Courriel d'information envoyé au postulant pour consultation des détails dans son portail.`;
    }
    return `Tâche « Évaluation médicale - ${medInfo.labelFr} » attribuée au postulant dans son portail. Courriel explicatif envoyé pour la sélection d'une plage horaire au centre de recrutement attitré.`;
  }

  getMedicalEmailPlain(part: string): string {
    const partEn = this.getMedicalPartEn(part);
    const fr = this.getMedicalSectionPlainFr(part);
    const en = this.getMedicalSectionPlainEn(partEn);
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return `English message will follow.\n\nBonjour,\n\n${fr}\n\n${sigFr}\n\n______________________________________________________________________________\n\nHello,\n\n${en}\n\n${sigEn}`;
  }

  getMedicalEmailHtml(part: string): string {
    const partEn = this.getMedicalPartEn(part);
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;
    html += `<p><strong>English message will follow.</strong></p>`;
    html += `<p>Bonjour,</p>`;
    html += this.getMedicalSectionHtmlFr(part);
    html += `<p>` + sigFr + `</p>`;
    html += `<br><hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;"><br>`;
    html += `<p>Hello,</p>`;
    html += this.getMedicalSectionHtmlEn(partEn);
    html += `<p>` + sigEn + `</p>`;
    html += `</div>`;
    return html;
  }

  getSafeMedicalEmailHtml(part: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getMedicalEmailHtml(part));
  }

  getMedicalRegisterNote(part: string): string {
    if (this.evaluationMedicaleType() === 'Dossier OTA') {
      return `Rendez-vous pour l'évaluation médicale - ${part} directement fixé au centre de recrutement de Montréal (Dossier OTA). Courriel d'information envoyé au postulant pour consultation des détails dans son portail.`;
    }
    return `Tâche « Évaluation médicale - ${part} » attribuée au postulant dans son portail. Courriel explicatif envoyé pour la sélection d'une plage horaire au centre de recrutement attitré.`;
  }

  // Auth & Role State
  isAuthenticated = signal<boolean>(false);
  passwordInput = signal<string>('');
  authError = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  selectedRole = signal<'none' | 'recruiter' | 'gestionnaire'>('none');
  private roleSnapshots: Partial<Record<'recruiter' | 'gestionnaire', RoleSnapshot>> = {};

  private createSnapshot(): RoleSnapshot {
    return {
      stage: this.stage(),
      isUnderAge: this.isUnderAge(),
      allTasks: JSON.parse(JSON.stringify(this.allTasks())),
      selectedTask: this.selectedTask() ? JSON.parse(JSON.stringify(this.selectedTask())) : null,
      selectedRejectionKeys: new Set(this.selectedRejectionKeys()),
      taskNotCompletedKeys: new Set(this.taskNotCompletedKeys()),
      compliantDocKeys: new Set(this.compliantDocKeys()),
      collapsedGroups: new Set(this.collapsedGroups()),
      forceGeneralReminder: this.forceGeneralReminder(),
      selectedEmailBankTemplate: this.selectedEmailBankTemplate(),
      triageMedicalRequis: this.triageMedicalRequis(),
      selectedDossierJobId1: this.sharedState.selectedDossierJobId1(),
      selectedDossierJobId2: this.sharedState.selectedDossierJobId2(),
      selectedDossierJobId3: this.sharedState.selectedDossierJobId3(),
      searchDossierQuery1: this.sharedState.searchDossierQuery1(),
      searchDossierQuery2: this.sharedState.searchDossierQuery2(),
      searchDossierQuery3: this.sharedState.searchDossierQuery3(),
      dossierJobFailedCe1: this.sharedState.dossierJobFailedCe1(),
      dossierJobFailedCe2: this.sharedState.dossierJobFailedCe2(),
      dossierJobFailedCe3: this.sharedState.dossierJobFailedCe3(),
      testEcePassed: this.sharedState.testEcePassed(),
      testEsomPassed: this.sharedState.testEsomPassed(),
      testCeopmPassed: this.sharedState.testCeopmPassed(),
      testCspnPassed: this.sharedState.testCspnPassed(),
      testCspnNotCompleted: this.sharedState.testCspnNotCompleted(),
      testCspn00182Passed: this.sharedState.testCspn00182Passed(),
      testCspn00183Passed: this.sharedState.testCspn00183Passed(),
      testCspn00184Passed: this.sharedState.testCspn00184Passed(),
      includeLinkedEmail: this.sharedState.includeLinkedEmail(),
      reoMergedEmailHtml: this.sharedState.reoMergedEmailHtml(),
      reoMergedEmailPlain: this.sharedState.reoMergedEmailPlain(),
      reoMergedNote: this.sharedState.reoMergedNote(),
      premierContactCourriel: this.premierContactCourriel(),
      premierContactMedical: this.premierContactMedical(),
      premierContactEntrevue: this.premierContactEntrevue(),
      premierContactGambit: this.premierContactGambit(),
      premierContactPsps: this.premierContactPsps(),
      premierContactSelfie: this.premierContactSelfie(),
      premierContactIptad: this.premierContactIptad(),
      premierContactSeaf: this.premierContactSeaf(),
      premierContactSubPanelMode: this.premierContactSubPanelMode(),
      premierContactNoteIptad: this.premierContactNoteIptad(),
      premierContactNoteSeaf: this.premierContactNoteSeaf(),
      premierContactNoteEntrevue: this.premierContactNoteEntrevue(),
      premierContactNoteMedical: this.premierContactNoteMedical(),
      premierContactNotePsps: this.premierContactNotePsps(),
      premierContactNoteGambit: this.premierContactNoteGambit(),
      premierContactNoteAnxQ: this.premierContactNoteAnxQ(),
      avisFermetureCourriel: this.avisFermetureCourriel(),
      avisFermetureDelaiJours: this.avisFermetureDelaiJours(),
      avisFermetureDate: this.avisFermetureDate(),
      avisFermetureEntrevue: this.avisFermetureEntrevue(),
      avisFermetureMedicale: this.avisFermetureMedicale(),
      avisFermetureGambit: this.avisFermetureGambit(),
      avisFermeturePsps: this.avisFermeturePsps(),
      annexeQCourriel: this.annexeQCourriel(),
      annexeQAlphaPostulant: this.annexeQAlphaPostulant(),
      pforMatricule: this.pforMatricule(),
      evaluationMedicaleType: this.evaluationMedicaleType(),
      evaluationMedicalePartie1: this.evaluationMedicalePartie1(),
      evaluationMedicalePartie2: this.evaluationMedicalePartie2(),
      evaluationMedicalePartie1Et2: this.evaluationMedicalePartie1Et2(),
      offreNormaleChecked: this.offreNormaleChecked(),
      offreEtudesSubventionneesChecked: this.offreEtudesSubventionneesChecked(),
      offreLieuVille: this.offreLieuVille(),
      offreUniteAffectation: this.offreUniteAffectation(),
      offreMetier: this.offreMetier(),
      offreMetierSearchQuery: this.offreMetierSearchQuery(),
      offreProgrammeEnrolement: this.offreProgrammeEnrolement(),
      offreElement: this.offreElement(),
      offreDureeContrat: this.offreDureeContrat(),
      offreEtudesSubventionnees: this.offreEtudesSubventionnees(),
      offreDureeEtudesSubventionnees: this.offreDureeEtudesSubventionnees(),
      offreDateEnrolement: this.offreDateEnrolement(),
      offreHeureArriveePostulant: this.offreHeureArriveePostulant(),
      offreHeureArriveeInvites: this.offreHeureArriveeInvites(),
      offreLieuEnrolement: this.offreLieuEnrolement(),
      offreDateArriveeUnite: this.offreDateArriveeUnite(),
      offreElementsManquants: this.offreElementsManquants(),
      offreDateElementsManquants: this.offreDateElementsManquants(),
      offreSerieCours: this.offreSerieCours(),
      offreDateCoursDebut: this.offreDateCoursDebut(),
      offreDateCoursFin: this.offreDateCoursFin(),
      offreSubPanelMode: this.offreSubPanelMode(),
      noteStatutCivil: this.noteStatutCivil(),
      noteConjoint: this.noteConjoint(),
      noteConjointTexte: this.noteConjointTexte(),
      noteEnfantCount: this.noteEnfantCount(),
      noteEnfantDetails: this.noteEnfantDetails(),
      notePlaqueImm: this.notePlaqueImm(),
      noteBrisBail: this.noteBrisBail(),
      noteEntreposage: this.noteEntreposage(),
      noteSermentDeclaration: this.noteSermentDeclaration(),
      noteInviteMil: this.noteInviteMil(),
      noteInviteMilTexte: this.noteInviteMilTexte(),
      noteSvcMilAnt: this.noteSvcMilAnt(),
      noteBeneficiaire: this.noteBeneficiaire(),
      noteDateCourrielConfirmation: this.noteDateCourrielConfirmation(),
      testEsomRecruitmentCenterCity: this.testEsomRecruitmentCenterCity(),
      offreFormulairePpp: this.offreFormulairePpp(),
      offreFormulairePcu: this.offreFormulairePcu(),
      offreFormulaireCroixSouvenir: this.offreFormulaireCroixSouvenir(),
      offreFormulaireBeneficiaire: this.offreFormulaireBeneficiaire(),
      recruiterDossierType: this.recruiterDossierType(),
      sgtCheckedInstructions: Array.from(this.sgtCheckedInstructions()),
    };
  }

  private applySnapshot(snapshot: RoleSnapshot) {
    this.stage.set(snapshot.stage);
    this.isUnderAge.set(snapshot.isUnderAge);
    this.recruiterDossierType.set(snapshot.recruiterDossierType || 'normal');
    this.allTasks.set(snapshot.allTasks);
    this.selectedTask.set(snapshot.selectedTask);
    this.selectedRejectionKeys.set(new Set(snapshot.selectedRejectionKeys));
    this.taskNotCompletedKeys.set(new Set(snapshot.taskNotCompletedKeys));
    this.compliantDocKeys.set(new Set(snapshot.compliantDocKeys));
    this.collapsedGroups.set(new Set(snapshot.collapsedGroups));
    this.selectedEmailBankTemplate.set(snapshot.selectedEmailBankTemplate || (snapshot.forceGeneralReminder ? 'general_reminder' : ''));
    this.triageMedicalRequis.set(snapshot.triageMedicalRequis || false);

    if (snapshot.evaluationMedicaleType) {
      this.evaluationMedicaleType.set(snapshot.evaluationMedicaleType);
    }
    this.sgtCheckedInstructions.set(new Set(snapshot.sgtCheckedInstructions || []));
    this.premierContactCourriel.set(snapshot.premierContactCourriel || false);
    this.premierContactMedical.set(snapshot.premierContactMedical || false);
    this.premierContactEntrevue.set(snapshot.premierContactEntrevue || false);
    this.premierContactGambit.set(snapshot.premierContactGambit || false);
    this.premierContactPsps.set(snapshot.premierContactPsps || false);
    this.premierContactSelfie.set(snapshot.premierContactSelfie || false);
    this.premierContactIptad.set(snapshot.premierContactIptad || false);
    this.premierContactSeaf.set(snapshot.premierContactSeaf || false);
    this.premierContactSubPanelMode.set(snapshot.premierContactSubPanelMode || 'courriel');
    this.premierContactNoteIptad.set(snapshot.premierContactNoteIptad || 'Complété');
    this.premierContactNoteSeaf.set(snapshot.premierContactNoteSeaf || 'Complété');
    this.premierContactNoteEntrevue.set(snapshot.premierContactNoteEntrevue || 'À faire');
    this.premierContactNoteMedical.set(snapshot.premierContactNoteMedical || 'À faire');
    this.premierContactNotePsps.set(snapshot.premierContactNotePsps || 'À faire');
    this.premierContactNoteGambit.set(snapshot.premierContactNoteGambit || 'En attente (type 28)');
    this.premierContactNoteAnxQ.set(snapshot.premierContactNoteAnxQ || 'À faire');

    this.avisFermetureCourriel.set(snapshot.avisFermetureCourriel || false);
    this.avisFermetureDelaiJours.set(snapshot.avisFermetureDelaiJours || '14');
    this.avisFermetureDate.set(snapshot.avisFermetureDate || '');
    this.avisFermetureEntrevue.set(snapshot.avisFermetureEntrevue || false);
    this.avisFermetureMedicale.set(snapshot.avisFermetureMedicale || false);
    this.avisFermetureGambit.set(snapshot.avisFermetureGambit || false);
    this.avisFermeturePsps.set(snapshot.avisFermeturePsps || false);

    this.annexeQCourriel.set(snapshot.annexeQCourriel || false);
    this.annexeQAlphaPostulant.set(snapshot.annexeQAlphaPostulant || '');
    this.pforMatricule.set(snapshot.pforMatricule || '');

    this.evaluationMedicalePartie1.set(snapshot.evaluationMedicalePartie1 || false);
    this.evaluationMedicalePartie2.set(snapshot.evaluationMedicalePartie2 || false);
    this.evaluationMedicalePartie1Et2.set(snapshot.evaluationMedicalePartie1Et2 || false);

    const isOta = (snapshot.evaluationMedicaleType || this.evaluationMedicaleType()) === 'Dossier OTA';
    const savedVille = (typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_ville')) || 'Québec';
    const villeToSet = isOta ? 'Montréal' : (snapshot.offreLieuVille || savedVille);
    const centerObj = this.recruitmentCentersList.find(c => c.city === villeToSet) || this.recruitmentCentersList[0];

    this.offreNormaleChecked.set(snapshot.offreNormaleChecked || false);
    this.offreEtudesSubventionneesChecked.set(snapshot.offreEtudesSubventionneesChecked || false);
    this.offreLieuVille.set(villeToSet);
    this.offreUniteAffectation.set(snapshot.offreUniteAffectation || 'st-jean');
    this.offreMetier.set(snapshot.offreMetier || '');
    this.offreMetierSearchQuery.set(snapshot.offreMetierSearchQuery || '');
    this.offreProgrammeEnrolement.set(snapshot.offreProgrammeEnrolement || '');
    this.offreElement.set(snapshot.offreElement || '');
    this.offreDureeContrat.set(snapshot.offreDureeContrat || '');
    this.offreEtudesSubventionnees.set(snapshot.offreEtudesSubventionnees || '');
    this.offreDureeEtudesSubventionnees.set(snapshot.offreDureeEtudesSubventionnees || '');
    this.offreDateEnrolement.set(snapshot.offreDateEnrolement || '');
    this.offreHeureArriveePostulant.set(snapshot.offreHeureArriveePostulant || (typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_postulant')) || '8h00');
    this.offreHeureArriveeInvites.set(snapshot.offreHeureArriveeInvites || (typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_invites')) || (snapshot.offreEtudesSubventionneesChecked ? '9h45' : '10h00'));
    this.offreLieuEnrolement.set(snapshot.offreLieuEnrolement || centerObj.fullFr);
    this.offreDateArriveeUnite.set(snapshot.offreDateArriveeUnite || '');
    this.offreElementsManquants.set(snapshot.offreElementsManquants || 'Spécimen de chèque');
    this.offreDateElementsManquants.set(snapshot.offreDateElementsManquants || '');
    this.offreSerieCours.set(snapshot.offreSerieCours || '');
    this.offreDateCoursDebut.set(snapshot.offreDateCoursDebut || '');
    this.offreDateCoursFin.set(snapshot.offreDateCoursFin || '');
    this.offreSubPanelMode.set(snapshot.offreSubPanelMode || 'courriel');
    this.noteStatutCivil.set(snapshot.noteStatutCivil || 'célibataire');
    this.noteConjoint.set(snapshot.noteConjoint || 'N/A');
    this.noteConjointTexte.set(snapshot.noteConjointTexte || '');
    this.noteEnfantCount.set(snapshot.noteEnfantCount || '0');
    this.noteEnfantDetails.set(snapshot.noteEnfantDetails || []);
    this.notePlaqueImm.set(snapshot.notePlaqueImm || '');
    this.noteBrisBail.set(snapshot.noteBrisBail || 'N/A');
    this.noteEntreposage.set(snapshot.noteEntreposage || 'N/A');
    this.noteSermentDeclaration.set(snapshot.noteSermentDeclaration || 'Serment');
    this.noteInviteMil.set(snapshot.noteInviteMil || 'N/A');
    this.noteInviteMilTexte.set(snapshot.noteInviteMilTexte || '');
    this.noteSvcMilAnt.set(snapshot.noteSvcMilAnt || 'N/A');
    this.noteBeneficiaire.set(snapshot.noteBeneficiaire || '');
    this.noteDateCourrielConfirmation.set(snapshot.noteDateCourrielConfirmation || '');
    this.testEsomRecruitmentCenterCity.set(snapshot.testEsomRecruitmentCenterCity || 'Québec');
    this.offreFormulairePpp.set(snapshot.offreFormulairePpp || false);
    this.offreFormulairePcu.set(snapshot.offreFormulairePcu || false);
    this.offreFormulaireCroixSouvenir.set(snapshot.offreFormulaireCroixSouvenir || false);
    this.offreFormulaireBeneficiaire.set(snapshot.offreFormulaireBeneficiaire || false);

    this.sharedState.selectedDossierJobId1.set(snapshot.selectedDossierJobId1);
    this.sharedState.selectedDossierJobId2.set(snapshot.selectedDossierJobId2);
    this.sharedState.selectedDossierJobId3.set(snapshot.selectedDossierJobId3);
    this.sharedState.searchDossierQuery1.set(snapshot.searchDossierQuery1);
    this.sharedState.searchDossierQuery2.set(snapshot.searchDossierQuery2);
    this.sharedState.searchDossierQuery3.set(snapshot.searchDossierQuery3);
    this.sharedState.dossierJobFailedCe1.set(snapshot.dossierJobFailedCe1 || false);
    this.sharedState.dossierJobFailedCe2.set(snapshot.dossierJobFailedCe2 || false);
    this.sharedState.dossierJobFailedCe3.set(snapshot.dossierJobFailedCe3 || false);
    this.sharedState.testEcePassed.set(snapshot.testEcePassed || false);
    this.sharedState.testEsomPassed.set(snapshot.testEsomPassed || false);
    this.sharedState.testCeopmPassed.set(snapshot.testCeopmPassed || false);
    this.sharedState.testCspnPassed.set(snapshot.testCspnPassed || false);
    this.sharedState.testCspnNotCompleted.set(snapshot.testCspnNotCompleted || false);
    this.sharedState.testCspn00182Passed.set(snapshot.testCspn00182Passed || false);
    this.sharedState.testCspn00183Passed.set(snapshot.testCspn00183Passed || false);
    this.sharedState.testCspn00184Passed.set(snapshot.testCspn00184Passed || false);
    this.sharedState.reoMergedEmailHtml.set(snapshot.reoMergedEmailHtml);
    this.sharedState.reoMergedEmailPlain.set(snapshot.reoMergedEmailPlain);
    this.sharedState.reoMergedNote.set(snapshot.reoMergedNote);
  }

  private createFreshSnapshot(role: 'recruiter' | 'gestionnaire'): RoleSnapshot {
    return {
      stage: 'intro',
      isUnderAge: false,
      recruiterDossierType: 'normal',
      allTasks: this.dataService.getTasks(role),
      selectedTask: null,
      selectedRejectionKeys: new Set(),
      taskNotCompletedKeys: new Set(),
      compliantDocKeys: new Set(),
      collapsedGroups: new Set(),
      forceGeneralReminder: false,
      selectedEmailBankTemplate: '',
      triageMedicalRequis: false,
      evaluationMedicaleType: 'Dossier régulier',
      premierContactCourriel: false,
      premierContactMedical: false,
      premierContactEntrevue: false,
      premierContactGambit: false,
      premierContactPsps: false,
      premierContactSelfie: false,
      premierContactIptad: false,
      premierContactSeaf: false,
      premierContactSubPanelMode: 'courriel',
      premierContactNoteIptad: 'Complété',
      premierContactNoteSeaf: 'Complété',
      premierContactNoteEntrevue: 'À faire',
      premierContactNoteMedical: 'À faire',
      premierContactNotePsps: 'À faire',
      premierContactNoteGambit: 'En attente (type 28)',
      premierContactNoteAnxQ: 'À faire',
      avisFermetureCourriel: false,
      avisFermetureDelaiJours: '14',
      avisFermetureDate: '',
      avisFermetureEntrevue: false,
      avisFermetureMedicale: false,
      avisFermetureGambit: false,
      avisFermeturePsps: false,
      annexeQCourriel: false,
      annexeQAlphaPostulant: '',
      pforMatricule: '',
      sgtCheckedInstructions: [],
      evaluationMedicalePartie1: false,
      evaluationMedicalePartie2: false,
      evaluationMedicalePartie1Et2: false,
      offreNormaleChecked: false,
      offreEtudesSubventionneesChecked: false,
      offreLieuVille: (typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_ville')) || 'Québec',
      offreUniteAffectation: 'st-jean',
      offreMetier: '',
      offreMetierSearchQuery: '',
      offreProgrammeEnrolement: '',
      offreElement: '',
      offreDureeContrat: '',
      offreEtudesSubventionnees: '',
      offreDureeEtudesSubventionnees: '',
      offreDateEnrolement: '',
      offreHeureArriveePostulant: (typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_postulant')) || '8h00',
      offreHeureArriveeInvites: (typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_invites')) || '10h00',
      offreLieuEnrolement: (typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_enrolement')) || this.recruitmentCentersList[0].fullFr,
      offreDateArriveeUnite: '',
      offreElementsManquants: 'Spécimen de chèque',
      offreDateElementsManquants: '',
      offreSerieCours: '',
      offreDateCoursDebut: '',
      offreDateCoursFin: '',
      offreSubPanelMode: 'courriel',
      noteStatutCivil: 'célibataire',
      noteConjoint: 'N/A',
      noteConjointTexte: '',
      noteEnfantCount: '0',
      noteEnfantDetails: [],
      notePlaqueImm: '',
      noteBrisBail: 'N/A',
      noteEntreposage: 'N/A',
      noteSermentDeclaration: 'Serment',
      noteInviteMil: 'N/A',
      noteInviteMilTexte: '',
      noteSvcMilAnt: 'N/A',
      noteBeneficiaire: '',
      noteDateCourrielConfirmation: '',
      testEsomRecruitmentCenterCity: 'Québec',
      offreFormulairePpp: false,
      offreFormulairePcu: false,
      offreFormulaireCroixSouvenir: false,
      offreFormulaireBeneficiaire: false,
      selectedDossierJobId1: '',
      selectedDossierJobId2: '',
      selectedDossierJobId3: '',
      searchDossierQuery1: '',
      searchDossierQuery2: '',
      searchDossierQuery3: '',
      dossierJobFailedCe1: false,
      dossierJobFailedCe2: false,
      dossierJobFailedCe3: false,
      testEcePassed: false,
      testEsomPassed: false,
      testCeopmPassed: false,
      testCspnPassed: false,
      testCspnNotCompleted: false,
      testCspn00182Passed: false,
      testCspn00183Passed: false,
      testCspn00184Passed: false,
      includeLinkedEmail: false,
      reoMergedEmailHtml: '',
      reoMergedEmailPlain: '',
      reoMergedNote: '',
    };
  }

  ngOnInit() {
    const isAuth = localStorage.getItem('marcel_auth');
    if (isAuth === 'true') {
      this.isAuthenticated.set(true);
    }
  }

  selectRole(role: 'recruiter' | 'gestionnaire') {
    const current = this.selectedRole();
    if (current === 'recruiter' || current === 'gestionnaire') {
      this.roleSnapshots[current] = this.createSnapshot();
    }

    this.selectedRole.set(role);
    localStorage.setItem('marcel_role', role);

    const existing = this.roleSnapshots[role];
    if (existing) {
      this.applySnapshot(existing);
    } else {
      this.applySnapshot(this.createFreshSnapshot(role));
    }

    if (role === 'gestionnaire') {
      this.stage.set('intro');
    }
  }

  switchRole() {
    const current = this.selectedRole();
    if (current === 'recruiter' || current === 'gestionnaire') {
      this.roleSnapshots[current] = this.createSnapshot();
    }
    this.selectedRole.set('none');
    localStorage.removeItem('marcel_role');
  }

  lockSession() {
    this.isAuthenticated.set(false);
    this.selectedRole.set('none');
    localStorage.removeItem('marcel_auth');
    localStorage.removeItem('marcel_role');
  }

  async checkPassword(event: Event) {
    event.preventDefault();
    const input = this.passwordInput();
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === '4b65e209bce165f2be7ddc7a5347453f200afaca8c590dc411c3dc886bf02635') {
      this.isAuthenticated.set(true);
      this.authError.set(false);
      localStorage.setItem('marcel_auth', 'true');
    } else {
      this.authError.set(true);
    }
  }

  // App Stage Management
  stage = signal<AppStage>("intro");
  isUnderAge = signal<boolean>(false);
  recruiterDossierType = signal<'normal' | 'pfor'>('normal');

  // Tuto Marcel State
  showTutoMarcel = signal<boolean>(false);

  openTutoMarcel() {
    this.showTutoMarcel.set(true);
  }

  closeTutoMarcel() {
    this.showTutoMarcel.set(false);
    this.selectedRole.set('none');
  }

  // Signature Settings State
  showSignaturePage = signal<boolean>(false);
  showToast = signal<boolean>(false);
  signatureSection = signal<'normal' | 'ota'>('normal');
  sigFrTemp = "";
  sigEnTemp = "";
  sigOtaFrTemp = "";
  sigOtaEnTemp = "";

  get isOtaDossier(): boolean {
    return this.selectedRole() === 'gestionnaire' && this.evaluationMedicaleType() === 'Dossier OTA';
  }

  getSignatureFr(): string {
    return this.sharedState.getSignatureFr(this.isOtaDossier);
  }

  getSignatureEn(): string {
    return this.sharedState.getSignatureEn(this.isOtaDossier);
  }

  getHtmlSignatureFr(): string {
    return this.sharedState.getHtmlSignatureFr(this.isOtaDossier);
  }

  getHtmlSignatureEn(): string {
    return this.sharedState.getHtmlSignatureEn(this.isOtaDossier);
  }

  toggleSignatureSettings() {
    this.sigFrTemp = this.sharedState.customSignatureFr();
    this.sigEnTemp = this.sharedState.customSignatureEn();
    this.sigOtaFrTemp = this.sharedState.customSignatureOtaFr();
    this.sigOtaEnTemp = this.sharedState.customSignatureOtaEn();
    this.showSignaturePage.set(true);
  }

  closeSignaturePage() {
    this.showSignaturePage.set(false);
  }

  saveSignatures() {
    this.sharedState.saveSignatures(
      this.sigFrTemp,
      this.sigEnTemp,
      this.sigOtaFrTemp,
      this.sigOtaEnTemp
    );
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  resetSignatures() {
    if (this.signatureSection() === 'normal') {
      this.sigFrTemp = DEFAULT_SIG_FR;
      this.sigEnTemp = DEFAULT_SIG_EN;
    } else {
      this.sigOtaFrTemp = DEFAULT_SIG_OTA_FR;
      this.sigOtaEnTemp = DEFAULT_SIG_OTA_EN;
    }
  }

  // Job Search Modal State
  showJobSearch = signal(false);

  toggleJobSearch() {
    this.showJobSearch.update((v) => !v);
  }

  // Task Groups Definition & Expansion State
  collapsedGroups = signal<Set<string>>(new Set());

  toggleGroupCollapse(groupId: string) {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups().has(groupId);
  }

  isGroupCompliant(group: { tasks: Task[] }): boolean {
    return group.tasks.length > 0 && group.tasks.every((t) => this.isTaskCompliant(t));
  }

  setGroupCompliant(group: { tasks: Task[] }, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const currentKeys = new Set(this.compliantDocKeys());
    const currentNotCompleted = new Set(this.taskNotCompletedKeys());
    const currentRejections = new Set(this.selectedRejectionKeys());
    const dossierJobs = this.getDossierJobObjects();

    if (this.isGroupCompliant(group)) {
      // Toggle OFF: Retirer la conformité des tâches de ce groupe
      group.tasks.forEach((task) => {
        if (!task.nameFr.includes("Documents Supplémentaires")) {
          task.documents.forEach((doc) => {
            currentKeys.delete(this.getDocKey(task, doc));
          });
        } else {
          currentKeys.delete(`${task.nameFr}::metiers_docs`);
        }
      });
    } else {
      // Toggle ON: Rendre toutes les tâches du groupe conformes
      group.tasks.forEach((task) => {
        // Enlever des tâches non complétées
        currentNotCompleted.delete(task.nameFr);

        if (!task.nameFr.includes("Documents Supplémentaires")) {
          task.documents.forEach((doc) => {
            currentKeys.add(this.getDocKey(task, doc));
            // Enlever les motifs de rejet
            doc.reasons.forEach((reason) => {
              currentRejections.delete(this.getReasonKey(doc, reason));
              dossierJobs.forEach((j) => {
                currentRejections.delete(this.getJobReasonKey(j, doc, reason));
              });
            });
          });
        } else {
          currentKeys.add(`${task.nameFr}::metiers_docs`);
          task.documents.forEach((doc) => {
            doc.reasons.forEach((reason) => {
              currentRejections.delete(this.getReasonKey(doc, reason));
              dossierJobs.forEach((j) => {
                currentRejections.delete(this.getJobReasonKey(j, doc, reason));
              });
            });
          });
        }
      });
    }

    this.compliantDocKeys.set(currentKeys);
    this.taskNotCompletedKeys.set(currentNotCompleted);
    this.selectedRejectionKeys.set(currentRejections);
  }

  hasGroupRejections(group: { tasks: Task[] }): boolean {
    return group.tasks.some((t) => this.hasTaskRejections(t));
  }

  getGroupForTask(task: Task): { id: string; title: string } | null {
    if (this.selectedRole() === "gestionnaire") {
      if (task.section) {
        return { id: task.section, title: task.section };
      }
      if (task.nameFr.includes("Courriel d'offre")) {
        return { id: "Courriel d'offre", title: "Courriel d'offre" };
      }
      if (task.nameFr.includes("Documents Supplémentaires")) {
        return { id: "Autre", title: "Autre" };
      }
      return { id: "Autre", title: "Autre" };
    }

    if (
      task.nameFr.includes("Documents Supplémentaires") ||
      task.nameFr.includes("Courriel d'offre")
    ) {
      return null;
    }
    if (task.section) {
      return { id: task.section, title: task.section };
    }
    const name = task.nameFr;
    if (
      name.includes("Relevé") ||
      name.includes("Relevés") ||
      name.includes("Pièce d'identité") ||
      name.includes("Certificat de naissance") ||
      name.includes("Consentement du parent")
    ) {
      return { id: "0.1", title: "0.1" };
    }
    if (name.includes("MDN 2977")) {
      return { id: "0.5", title: "0.5" };
    }
    return { id: "1.0", title: "1.0" };
  }

  groupedVisibleTasks = computed(() => {
    const tasks = this.visibleTasks();
    const isGd = this.selectedRole() === "gestionnaire";

    if (isGd) {
      const gdGroupOrder = [
        "Réception d'un postulant",
        "Suivi de dossier",
        "Retour PSPS",
        "Courriel d'offre",
        "Courriel enrôlement",
        "Autre",
      ];
      const groupsMap = new Map<string, { id: string; title: string; tasks: Task[] }>();
      for (const gName of gdGroupOrder) {
        groupsMap.set(gName, { id: gName, title: gName, tasks: [] });
      }

      for (const task of tasks) {
        const g = this.getGroupForTask(task);
        const gId = g ? g.id : "Autre";
        if (!groupsMap.has(gId)) {
          groupsMap.set(gId, { id: gId, title: gId, tasks: [] });
        }
        groupsMap.get(gId)!.tasks.push(task);
      }

      const groups = gdGroupOrder
        .map((name) => groupsMap.get(name)!)
        .filter((g) => !!g);

      return {
        groups,
        additionalTasks: [],
      };
    }

    const groupsMap = new Map<string, { id: string; title: string; tasks: Task[] }>();
    const additionalTasks: Task[] = [];

    for (const task of tasks) {
      const g = this.getGroupForTask(task);
      if (!g) {
        additionalTasks.push(task);
      } else {
        if (!groupsMap.has(g.id)) {
          groupsMap.set(g.id, { id: g.id, title: g.title, tasks: [] });
        }
        groupsMap.get(g.id)!.tasks.push(task);
      }
    }

    return {
      groups: Array.from(groupsMap.values()),
      additionalTasks,
    };
  });

  // Signals
  private allTasks = signal<Task[]>(
    this.dataService.getTasks(
      this.selectedRole() === "gestionnaire" ? "gestionnaire" : "recruiter"
    )
  );

  selectedTask = signal<Task | null>(null);

  // Set of selected rejection IDs
  selectedRejectionKeys = signal<Set<string>>(new Set());

  // Set of tasks marked as not completed
  taskNotCompletedKeys = signal<Set<string>>(new Set());

  // Set of explicitly Compliant Documents (key: taskName::docName)
  compliantDocKeys = signal<Set<string>>(new Set());

  // UI States for copy feedback
  copiedEmail = signal(false);
  copiedEmailCaf101 = signal(false);
  copiedEmailLienPa = signal(false);
  copiedNote = signal(false);

  @ViewChild(JobSearchModalComponent) jobSearchModal!: JobSearchModalComponent;

  constructor() {
    // Keep SharedState isOtaDossier in sync
    effect(() => {
      const isOta = this.isOtaDossier;
      untracked(() => {
        this.sharedState.isOtaDossier.set(isOta);
      });
    });

    // No task selected initially, waiting for stage selection
    effect(() => {
      const note = this.generatedNote();
      const rawHtml = this.getCombinedRawHtmlString(true);
      const rawPlain = this.getCombinedPlainString(true);
      const hasReassigned =
        !this.allTasksCompliant() &&
        (this.hasSelectedRejections() || this.forceGeneralReminder());

      untracked(() => {
        this.sharedState.taskNote.set(note);
        this.sharedState.taskEmailHtmlFr.set(rawHtml);
        this.sharedState.taskEmailFr.set(rawPlain);
        this.sharedState.hasReassignedTasks.set(hasReassigned);
      });
    });

    effect(() => {
      const trigger = this.sharedState.recruiterResetTrigger();
      if (trigger > 0) {
        untracked(() => {
          this.restartApp(false);
        });
      }
    });
  }

  // --- DOSSIER JOBS METHODS ---

  getDossierJob(index: number): JobEntry | undefined {
    const id =
      index === 1
        ? this.sharedState.selectedDossierJobId1()
        : index === 2
        ? this.sharedState.selectedDossierJobId2()
        : this.sharedState.selectedDossierJobId3();
    if (!id) return undefined;
    return this.jobService.getAllJobs().find((j) => j.id === id);
  }

  isJobClosed(jobId: string): boolean {
    return this.jobService.isJobClosed(jobId);
  }

  getFilteredJobsForIndex(index: number): JobEntry[] {
    const query =
      index === 1
        ? this.sharedState.searchDossierQuery1()
        : index === 2
        ? this.sharedState.searchDossierQuery2()
        : this.sharedState.searchDossierQuery3();
    if (!query || query.trim() === "") {
      let allJobs = this.jobService.getAllJobs();
      if (this.sharedState.isPostulantPfor()) {
        allJobs = allJobs.filter(j => this.jobService.isPforJob(j));
      }
      return allJobs;
    }
    let searchedJobs = this.jobService.searchJobs(query);
    if (this.sharedState.isPostulantPfor()) {
      searchedJobs = searchedJobs.filter(j => this.jobService.isPforJob(j));
    }
    return searchedJobs;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  isDossierFieldDisabled(index: number): boolean {
    const id1 = this.sharedState.selectedDossierJobId1();
    const id2 = this.sharedState.selectedDossierJobId2();
    const id3 = this.sharedState.selectedDossierJobId3();
    if (index === 1) return id2 === "00003" || id3 === "00003";
    if (index === 2) return id1 === "00003" || id3 === "00003";
    if (index === 3) return id1 === "00003" || id2 === "00003";
    return false;
  }

  selectDossierJob(index: number, jobId: string) {
    const qb = this.jobService.getAllJobs().find((j) => j.id === jobId);
    if (!qb) return;

    if (jobId === "00003") {
      if (index === 1) {
        this.sharedState.selectedDossierJobId2.set("");
        this.sharedState.searchDossierQuery2.set("");
        this.sharedState.selectedDossierJobId3.set("");
        this.sharedState.searchDossierQuery3.set("");
      } else if (index === 2) {
        this.sharedState.selectedDossierJobId1.set("");
        this.sharedState.searchDossierQuery1.set("");
        this.sharedState.selectedDossierJobId3.set("");
        this.sharedState.searchDossierQuery3.set("");
      } else if (index === 3) {
        this.sharedState.selectedDossierJobId1.set("");
        this.sharedState.searchDossierQuery1.set("");
        this.sharedState.selectedDossierJobId2.set("");
        this.sharedState.searchDossierQuery2.set("");
      }
    }

    if (index === 1) {
      this.sharedState.selectedDossierJobId1.set(jobId);
      this.sharedState.searchDossierQuery1.set(`${qb.id} - ${qb.title}`);
      this.dossierDropdownOpen1.set(false);
    } else if (index === 2) {
      this.sharedState.selectedDossierJobId2.set(jobId);
      this.sharedState.searchDossierQuery2.set(`${qb.id} - ${qb.title}`);
      this.dossierDropdownOpen2.set(false);
    } else if (index === 3) {
      this.sharedState.selectedDossierJobId3.set(jobId);
      this.sharedState.searchDossierQuery3.set(`${qb.id} - ${qb.title}`);
      this.dossierDropdownOpen3.set(false);
    }
  }

  clearDossierJob(index: number, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (index === 1) {
      this.sharedState.selectedDossierJobId1.set("");
      this.sharedState.searchDossierQuery1.set("");
      this.sharedState.dossierJobFailedCe1.set(false);
      this.dossierDropdownOpen1.set(false);
    } else if (index === 2) {
      this.sharedState.selectedDossierJobId2.set("");
      this.sharedState.searchDossierQuery2.set("");
      this.sharedState.dossierJobFailedCe2.set(false);
      this.dossierDropdownOpen2.set(false);
    } else if (index === 3) {
      this.sharedState.selectedDossierJobId3.set("");
      this.sharedState.searchDossierQuery3.set("");
      this.sharedState.dossierJobFailedCe3.set(false);
      this.dossierDropdownOpen3.set(false);
    }
  }

  onDossierQueryChange(index: number, val: string) {
    if (index === 1) {
      this.sharedState.searchDossierQuery1.set(val);
      if (!val) {
        this.sharedState.selectedDossierJobId1.set("");
        this.sharedState.dossierJobFailedCe1.set(false);
      }
    } else if (index === 2) {
      this.sharedState.searchDossierQuery2.set(val);
      if (!val) {
        this.sharedState.selectedDossierJobId2.set("");
        this.sharedState.dossierJobFailedCe2.set(false);
      }
    } else if (index === 3) {
      this.sharedState.searchDossierQuery3.set(val);
      if (!val) {
        this.sharedState.selectedDossierJobId3.set("");
        this.sharedState.dossierJobFailedCe3.set(false);
      }
    }
  }

  openDossierDropdown(index: number) {
    if (this.isDossierFieldDisabled(index)) return;
    if (index === 1) {
      this.dossierDropdownOpen1.set(true);
      this.sharedState.searchDossierQuery1.set("");
    } else if (index === 2) {
      this.dossierDropdownOpen2.set(true);
      this.sharedState.searchDossierQuery2.set("");
    } else if (index === 3) {
      this.dossierDropdownOpen3.set(true);
      this.sharedState.searchDossierQuery3.set("");
    }
  }

  closeDossierDropdownDelayed(index: number) {
    setTimeout(() => {
      if (index === 1) {
        this.dossierDropdownOpen1.set(false);
        const id = this.sharedState.selectedDossierJobId1();
        if (id) {
          const qb = this.jobService.getAllJobs().find((j) => j.id === id);
          if (qb) this.sharedState.searchDossierQuery1.set(`${qb.id} - ${qb.title}`);
        } else {
          this.sharedState.searchDossierQuery1.set("");
        }
      } else if (index === 2) {
        this.dossierDropdownOpen2.set(false);
        const id = this.sharedState.selectedDossierJobId2();
        if (id) {
          const qb = this.jobService.getAllJobs().find((j) => j.id === id);
          if (qb) this.sharedState.searchDossierQuery2.set(`${qb.id} - ${qb.title}`);
        } else {
          this.sharedState.searchDossierQuery2.set("");
        }
      } else if (index === 3) {
        this.dossierDropdownOpen3.set(false);
        const id = this.sharedState.selectedDossierJobId3();
        if (id) {
          const qb = this.jobService.getAllJobs().find((j) => j.id === id);
          if (qb) this.sharedState.searchDossierQuery3.set(`${qb.id} - ${qb.title}`);
        } else {
          this.sharedState.searchDossierQuery3.set("");
        }
      }
    }, 200);
  }

  // --- STAGE LOGIC ---

  restartApp(triggerShared: boolean = true) {
    if (triggerShared) {
      this.sharedState.triggerRecruiterReset();
    }
    this.showJobSearch.set(false);
    this.melService.resetApplicantLimitations();
    this.reorientationCriteria.resetAll();
    this.sharedState.resetSharedRecruiterState();

    this.stage.set("intro");
    this.isUnderAge.set(false);
    this.recruiterDossierType.set("normal");
    this.sharedState.isPostulantPfor.set(false);
    this.pforMatricule.set('');
    this.resetSgtInstructions();
    this.selectedTask.set(null);
    this.selectedRejectionKeys.set(new Set());
    this.taskNotCompletedKeys.set(new Set());
    this.compliantDocKeys.set(new Set());
    this.collapsedGroups.set(new Set());
    this.selectedEmailBankTemplate.set('');
    this.triageMedicalRequis.set(false);
    this.allTasks.set(
      this.dataService.getTasks(
        this.selectedRole() === "gestionnaire" ? "gestionnaire" : "recruiter"
      )
    );

    // Reset GD specific panels & selections
    this.evaluationMedicaleType.set("Dossier régulier");
    this.premierContactCourriel.set(false);
    this.premierContactMedical.set(false);
    this.premierContactEntrevue.set(false);
    this.premierContactGambit.set(false);
    this.premierContactPsps.set(false);
    this.premierContactSelfie.set(false);
    this.premierContactIptad.set(false);
    this.premierContactSeaf.set(false);
    this.premierContactSubPanelMode.set('courriel');
    this.premierContactNoteIptad.set('Complété');
    this.premierContactNoteSeaf.set('Complété');
    this.premierContactNoteEntrevue.set('À faire');
    this.premierContactNoteMedical.set('À faire');
    this.premierContactNotePsps.set('À faire');
    this.premierContactNoteGambit.set('En attente (type 28)');
    this.premierContactNoteAnxQ.set('À faire');

    this.avisFermetureCourriel.set(false);
    this.avisFermetureDelaiJours.set('14');
    this.avisFermetureDate.set('');
    this.avisFermetureEntrevue.set(false);
    this.avisFermetureMedicale.set(false);
    this.avisFermetureGambit.set(false);
    this.avisFermeturePsps.set(false);

    this.annexeQCourriel.set(false);
    this.annexeQAlphaPostulant.set('');
    this.pforMatricule.set('');

    this.evaluationMedicalePartie1.set(false);
    this.evaluationMedicalePartie2.set(false);
    this.evaluationMedicalePartie1Et2.set(false);
    this.copiedMedicalKey.set(null);

    // Reset Offer forms
    const isOta = this.evaluationMedicaleType() === 'Dossier OTA';
    const savedVille = (typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_ville')) || 'Québec';
    const savedPostulant = (typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_postulant')) || '8h00';
    const savedInvites = (typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_invites')) || '10h00';
    const villeToSet = isOta ? 'Montréal' : savedVille;
    const centerObj = this.recruitmentCentersList.find(c => c.city === villeToSet) || this.recruitmentCentersList[0];
    const savedLieuEnrolement = isOta ? centerObj.fullFr : ((typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_enrolement')) || centerObj.fullFr);

    this.offreNormaleChecked.set(false);
    this.offreEtudesSubventionneesChecked.set(false);
    this.offreLieuVille.set(villeToSet);
    this.offreUniteAffectation.set('st-jean');
    this.offreMetier.set('');
    this.offreMetierSearchQuery.set('');
    this.offreMetierDropdownOpen.set(false);
    this.offreProgrammeEnrolement.set('');
    this.offreElement.set('');
    this.offreDureeContrat.set('');
    this.offreEtudesSubventionnees.set('');
    this.offreDureeEtudesSubventionnees.set('');
    this.offreDateEnrolement.set('');
    this.offreHeureArriveePostulant.set(savedPostulant);
    this.offreHeureArriveeInvites.set(savedInvites);
    this.offreLieuEnrolement.set(savedLieuEnrolement);
    this.offreDateArriveeUnite.set('');
    this.offreElementsManquants.set('Spécimen de chèque');
    this.offreDateElementsManquants.set('');
    this.offreSerieCours.set('');
    this.offreDateCoursDebut.set('');
    this.offreDateCoursFin.set('');
    this.offreFormulairePpp.set(false);
    this.offreFormulairePcu.set(false);
    this.offreFormulaireCroixSouvenir.set(false);
    this.offreFormulaireBeneficiaire.set(false);
    this.offreSubPanelMode.set('courriel');
    this.noteStatutCivil.set('célibataire');
    this.noteConjoint.set('N/A');
    this.noteConjointTexte.set('');
    this.noteEnfantCount.set('0');
    this.noteEnfantDetails.set([]);
    this.notePlaqueImm.set('');
    this.noteBrisBail.set('N/A');
    this.noteEntreposage.set('N/A');
    this.noteSermentDeclaration.set('Serment');
    this.noteInviteMil.set('N/A');
    this.noteInviteMilTexte.set('');
    this.noteSvcMilAnt.set('N/A');
    this.noteBeneficiaire.set('');
    this.noteDateCourrielConfirmation.set(getTodayDateString());
    this.testEsomRecruitmentCenterCity.set('Québec');

    // Reset Dossier jobs & Réo shared state
    this.clearDossierJob(1);
    this.clearDossierJob(2);
    this.clearDossierJob(3);
    this.dossierDropdownOpen1.set(false);
    this.dossierDropdownOpen2.set(false);
    this.dossierDropdownOpen3.set(false);

    const current = this.selectedRole();
    if (current === 'recruiter' || current === 'gestionnaire') {
      this.roleSnapshots[current] = this.createFreshSnapshot(current);
    }
  }

  isPforDossier(): boolean {
    return this.sharedState.isPostulantPfor() || this.recruiterDossierType() === 'pfor';
  }

  areAllDocsCompliant = computed(() => {
    const tasks = this.visibleTasks().filter((t) => !t.nameFr.includes("Documents Supplémentaires"));
    if (tasks.length === 0) return false;
    const currentCompliant = this.compliantDocKeys();
    for (const task of tasks) {
      for (const doc of task.documents) {
        if (!currentCompliant.has(this.getDocKey(task, doc))) {
          return false;
        }
      }
    }
    return true;
  });

  setAllCompliant() {
    if (this.areAllDocsCompliant()) {
      // Toggle OFF: désactiver la conformité de toutes les tâches standard visibles
      const currentKeys = new Set(this.compliantDocKeys());
      this.visibleTasks().forEach((task) => {
        if (!task.nameFr.includes("Documents Supplémentaires")) {
          task.documents.forEach((doc) => {
            currentKeys.delete(this.getDocKey(task, doc));
          });
        } else {
          currentKeys.delete(`${task.nameFr}::metiers_docs`);
        }
      });
      this.compliantDocKeys.set(currentKeys);
    } else {
      // Toggle ON: marquer toutes les tâches standard visibles conformes
      const currentKeys = new Set(this.compliantDocKeys());
      this.visibleTasks().forEach((task) => {
        if (!task.nameFr.includes("Documents Supplémentaires")) {
          task.documents.forEach((doc) => {
            currentKeys.add(this.getDocKey(task, doc));
          });
        } else {
          currentKeys.add(`${task.nameFr}::metiers_docs`);
        }
      });
      this.compliantDocKeys.set(currentKeys);
      this.taskNotCompletedKeys.set(new Set());
      this.selectedRejectionKeys.set(new Set());
      this.selectedEmailBankTemplate.set('');
    }
  }

  // Helper methods for Dossier Jobs and Additional Documents
  getDossierJobObjects(): JobEntry[] {
    const ids = [
      this.sharedState.selectedDossierJobId1(),
      this.sharedState.selectedDossierJobId2(),
      this.sharedState.selectedDossierJobId3(),
    ].filter((id) => !!id);

    const allJobs = this.jobService.getAllJobs();
    return ids
      .map((id) => allJobs.find((j) => j.id === id))
      .filter((j): j is JobEntry => !!j);
  }

  isSubsidizedEducationJob(job: JobEntry): boolean {
    if (!job) return false;
    const title = (job.title || "").toUpperCase();
    const titleEn = (job.titleEn || "").toUpperCase();
    const programs = (job.contracts || []).map((c) => (c.program || "").toUpperCase()).join(" ");
    const subKeywords = [
      "PFOR", "PFS-MR", "PFOEP", "PFUMR", "PIES-MR", "PMEP", "ESNEM",
      "PFDM", "PFMD", "UTPNCM", "ROTP", "NOCP", "MMTP", "SUBVENTION"
    ];
    if (subKeywords.some((kw) => title.includes(kw) || titleEn.includes(kw) || programs.includes(kw))) return true;
    return false;
  }

  isSubsidizedDoc(doc: DocumentItem): boolean {
    const name = doc.nameFr;
    return (
      name.includes("Lettre d'admission") ||
      name.includes("Plan de cours") ||
      name.includes("Formulaire d'études subventionnées")
    );
  }

  isTaskBasedAdditionalDoc(doc: DocumentItem): boolean {
    const name = doc.nameFr;
    return (
      name.includes("Relevé") ||
      name.includes("Relevés") ||
      name.includes("libération") ||
      name.includes("service antérieur")
    );
  }

  shouldShowAdditionalDoc(doc: DocumentItem): boolean {
    if (this.isSubsidizedDoc(doc)) return true;
    if (this.isTaskBasedAdditionalDoc(doc)) return true;

    // Pour un postulant PFOR, les documents professionnels spécifiques aux métiers
    // (permis d'exercice, membre en règle, etc.) ne s'appliquent pas car il s'agit d'un programme d'études universitaires.
    if (this.isPforDossier()) {
      return false;
    }

    const jobs = this.getDossierJobObjects();
    if (jobs.length === 0) return false;

    const docName = doc.nameFr;

    const cvJobIds = [
      "00152", "00155", "00335", "00372", "00378", "00406", "00190", "00194",
      "00195", "00198", "00204", "00374", "00153", "00191", "00349", "00390", "00398"
    ];
    const permitJobIds = [
      "00149", "00161", "00214", "00152", "00153", "00190", "00191", "00194",
      "00195", "00198", "00204", "00335", "00372", "00374", "00390", "00393", "00406"
    ];
    const goodStandingJobIds = [
      "00152", "00153", "00190", "00191", "00194", "00198", "00204", "00335",
      "00372", "00374", "00390", "00393"
    ];
    const specialtyJobIds = [
      "00152", "00191", "00372", "00390", "00393", "00164", "00349"
    ];
    const experienceJobIds = [
      "00137", "00155", "00189", "00203", "00208", "00211", "00166", "00398", "00390"
    ];

    const hasCvJob = jobs.some((j) => cvJobIds.includes(j.id));
    const hasPermitJob = jobs.some((j) => permitJobIds.includes(j.id));
    const hasGoodStandingJob = jobs.some((j) => goodStandingJobIds.includes(j.id));
    const hasSpecialtyJob = jobs.some((j) => specialtyJobIds.includes(j.id));
    const hasExpJob = jobs.some((j) => experienceJobIds.includes(j.id));

    if (docName.includes("Curriculum vitae")) return hasCvJob;
    if (docName.includes("Permis d'exercice")) return hasPermitJob;
    if (docName.includes("Lettre de membre en règle")) return hasGoodStandingJob;
    if (docName.includes("Certificat / Attestation de spécialité")) return hasSpecialtyJob;
    if (docName.includes("Preuve d'expérience spécifique")) return hasExpJob;

    return false;
  }

  isAdditionalDocRequiredForJob(docNameFr: string, jobId: string): boolean {
    if (this.isPforDossier()) {
      return false;
    }

    const cvJobIds = [
      "00152", "00155", "00335", "00372", "00378", "00406", "00190", "00194",
      "00195", "00198", "00204", "00374", "00153", "00191", "00349", "00390", "00398"
    ];
    const permitJobIds = [
      "00149", "00161", "00214", "00152", "00153", "00190", "00191", "00194",
      "00195", "00198", "00204", "00335", "00372", "00374", "00390", "00393", "00406"
    ];
    const goodStandingJobIds = [
      "00152", "00153", "00190", "00191", "00194", "00198", "00204", "00335",
      "00372", "00374", "00390", "00393"
    ];
    const specialtyJobIds = [
      "00152", "00191", "00372", "00390", "00393", "00164", "00349"
    ];
    const experienceJobIds = [
      "00137", "00155", "00189", "00203", "00208", "00211", "00166", "00398", "00390"
    ];

    if (docNameFr.includes("Curriculum vitae")) return cvJobIds.includes(jobId);
    if (docNameFr.includes("Permis d'exercice")) return permitJobIds.includes(jobId);
    if (docNameFr.includes("Lettre de membre en règle")) return goodStandingJobIds.includes(jobId);
    if (docNameFr.includes("Certificat / Attestation de spécialité")) return specialtyJobIds.includes(jobId);
    if (docNameFr.includes("Preuve d'expérience spécifique")) return experienceJobIds.includes(jobId);

    return false;
  }

  getJobSpecificDocText(jobId: string, docNameFr: string, isFrench: boolean): string {
    if (docNameFr.includes("Curriculum vitae")) {
      if (jobId === "00191") {
        return isFrench
          ? "Curriculum vitae remontant jusqu’à de cinq ans quant à l’expérience en tant que dentiste."
          : "Curriculum vitae going back up to five years regarding experience as a dentist.";
      }
      return isFrench
        ? "Curriculum vitae (CV) récent à jour."
        : "Recent up-to-date Curriculum Vitae (CV).";
    }

    if (docNameFr.includes("Permis d'exercice")) {
      if (jobId === "00149" || jobId === "00161" || jobId === "00214") {
        return isFrench
          ? "Détenir un permis de conduire provincial/territorial en règle."
          : "Hold a valid provincial/territorial driver’s license.";
      }
      if (jobId === "00152") {
        return isFrench
          ? "Fournir un permis ou inscription sans restriction (statut actif) délivré par l’autorité de réglementation provinciale ou territoriale OU une Lettre de conformité (« Good Standing ») émise par l’autorité de réglementation."
          : "Provide an unrestricted license or registration (active status) issued by the provincial or territorial regulatory authority OR a Letter of Good Standing issued by the regulatory authority.";
      }
      if (jobId === "00153") {
        return isFrench
          ? "Fournir soit un permis, une certification ou autorisation sans restriction d’exercer comme technologue en radiation médicale (en règle et en vigueur) provenant d’un organisme de réglementation provincial/territorial reconnu OU la certification d’une association professionnelle ayant conclu une entente réciproque avec l’Association canadienne des technologues en radiation médicale (ACTRM)."
          : "Provide either an unrestricted license, certification, or practice permit to practice as a medical radiation technologist (in good standing and active) from a recognized provincial/territorial regulatory body OR certification from a professional association with a reciprocal agreement with CAMRT.";
      }
      if (jobId === "00190") {
        return isFrench
          ? "Permis/licence d’exercice en règle (à titre actif) en tant que physiothérapeute émis par un organisme de réglementation provincial ou territorial."
          : "Valid (active) license/permit to practice as a physiotherapist issued by a provincial or territorial regulatory body.";
      }
      if (jobId === "00191") {
        return isFrench
          ? "Autorisation en règle et sans restriction d’exercer la Médecine dentaire de la part d’une autorité réglementaire d’une province/d’un territoire du Canada."
          : "Valid and unrestricted license/permit to practice Dentistry from a provincial/territorial regulatory authority in Canada.";
      }
      if (jobId === "00194") {
        return isFrench
          ? "Permis d’exercice de la pharmacie sans restriction en règle."
          : "Valid unrestricted license to practice pharmacy.";
      }
      if (jobId === "00195") {
        return isFrench
          ? "Permis d’exercice en règle (état actif) en soins infirmiers en tant qu’infirmier autorisé ou infirmier en pratique octroyé par un organisme de réglementation provincial ou territorial du Canada."
          : "Valid (active state) nursing practice license as a registered nurse or practical nurse issued by a provincial or territorial regulatory body in Canada.";
      }
      if (jobId === "00198") {
        return isFrench
          ? "Permis en règle et sans restriction (état actif) d’exercer comme travailleur social, délivré par une autorité / association réglementaire provinciale ou territoriale."
          : "Valid and unrestricted license/permit (active state) to practice as a social worker issued by a provincial or territorial regulatory authority/association.";
      }
      if (jobId === "00204") {
        return isFrench
          ? "Autorisé à pratiquer le droit dans une province canadienne ou un territoire canadien."
          : "Authorized to practice law in a Canadian province or territory.";
      }
      if (jobId === "00335") {
        return isFrench
          ? "Fournir une preuve de permis en règle pour agir en tant qu’assistant dentaire délivré par une autorité de réglementation canadienne provinciale ou territoriale."
          : "Provide proof of a valid registration/license as a dental assistant issued by a Canadian provincial or territorial regulatory authority.";
      }
      if (jobId === "00372") {
        return isFrench
          ? "Fournir une preuve de détention d’une autorisation en règle de travailler comme infirmier auxiliaire autorisé/immatriculé émise par un organisme de réglementation provincial ou territorial."
          : "Provide proof of holding a valid registration/license as a licensed/registered practical nurse issued by a provincial or territorial regulatory authority.";
      }
      if (jobId === "00374") {
        return isFrench
          ? "Certificat en règle du Conseil de certification des adjoints au médecin du Canada (CCAMC) et permis/licence en règle (en vigueur) d’exercer comme adjoint au médecin délivré(e) par une autorité réglementaire d’une province ou d’un territoire du Canada."
          : "Valid certification from the Physician Assistant Certification Council of Canada (PACCC) and a valid active license to practice as a physician assistant issued by a provincial or territorial regulatory authority of Canada.";
      }
      if (jobId === "00390") {
        return isFrench
          ? "Permis d’exercice valide et sans restriction pour pratiquer la médecine à titre de spécialiste (selon la spécialité) dans toute province ou tout territoire du Canada."
          : "Valid and unrestricted license to practice medicine as a specialist (according to the specialty) in any province or territory of Canada.";
      }
      if (jobId === "00393") {
        return isFrench
          ? "Détenir une Autorisation en règle et sans restriction d’exercer la Médecine en tant que médecin de famille dans une province ou un territoire du Canada."
          : "Hold a valid and unrestricted license to practice Family Medicine in a province or territory of Canada.";
      }
      if (jobId === "00406") {
        return isFrench
          ? "Fournir une preuve d'inscription actuelle ou en cours au permis ou privilèges hospitaliers de base ou certification en vigueur pour exercer à titre de paramédical(e), délivrés par un organisme de réglementation provincial ou territorial canadien."
          : "Provide proof of current registration/licensure or active base hospital standard privileges or certification to practice as a paramedic, issued by a Canadian provincial or territorial regulatory authority.";
      }
      return isFrench
        ? "Permis d'exercice ou licence professionnelle sans restriction."
        : "Unrestricted practice permit or professional license.";
    }

    if (docNameFr.includes("Lettre de membre en règle")) {
      if (jobId === "00190") {
        return isFrench
          ? "Lettre de l’organisme de réglementation du candidat attestant que ce dernier est « En règle »."
          : "Letter from the candidate's regulatory body confirming they are \"In good standing\".";
      }
      if (jobId === "00191") {
        return isFrench
          ? "Lettre de l’autorité réglementaire professionnelle attestant que le candidat est en règle."
          : "Letter from the professional regulatory authority confirming that the candidate is in good standing.";
      }
      if (jobId === "00204") {
        return isFrench
          ? "Être « membre en règle », en exercice ou non, du Barreau d'une province ou d’un territoire."
          : "Be a \"member in good standing\", practicing or non-practicing, of the Bar of a province or territory.";
      }
      if (jobId === "00374") {
        return isFrench
          ? "Lettre de l’autorité professionnelle réglementaire ou de son superviseur en clinique, selon le cas, attestant que le candidat est en règle."
          : "Letter from the professional regulatory authority or clinical supervisor, as applicable, confirming that the candidate is in good standing.";
      }
      if (jobId === "00390") {
        return isFrench
          ? "Attestation de bonne conduite professionnelle délivrée par l’organisme de réglementation provincial ou territorial du candidat."
          : "Certificate of professional good standing issued by the candidate’s provincial or territorial regulatory body.";
      }
      if (jobId === "00393") {
        return isFrench
          ? "Lettre des autorités de réglementation de la province/territoire du candidat attestant que ce dernier est « en règle »."
          : "Letter from the regulatory authorities of the candidate’s province/territory confirming that the candidate is in \"good standing\".";
      }
      return isFrench
        ? "Fournir une lettre de l'organisme de réglementation de la profession du candidat attestant que ce dernier est « en règle »."
        : "Provide a letter from the professional regulatory body confirming that the candidate is in good standing.";
    }

    if (docNameFr.includes("Certificat / Attestation de spécialité")) {
      if (jobId === "00152") {
        return isFrench
          ? "Fournir soit la certification de la Société canadienne de science de laboratoire médical (SCSLM) OU la certification de l'alliance canadienne des organismes de réglementation des professionnels de laboratoire médical (ACORPLM), incluant la réussite des examens du «TLM généraliste»."
          : "Provide either the certification from the Canadian Society for Medical Laboratory Science (CSMLS) OR the certification from the Canadian Alliance of Medical Laboratory Professionals Regulators (CAMLPR), including successfully passing the 'General MLT' exams.";
      }
      if (jobId === "00191") {
        return isFrench
          ? "Certificat du Bureau national d’examen dentaire du Canada (BNED)."
          : "Certificate from the National Dental Examining Board of Canada (NDEB).";
      }
      if (jobId === "00349") {
        return isFrench
          ? "Accrédité et reconnu comme un leader au sein d’une tradition de foi par l’autorité de gouvernance de cette même tradition de foi qui exerce une supervision au Canada, et tel que recommandé par le membre désigné du CIAMC. Avoir été endossé comme aumônier par le CIAMC. Avoir réussi une entrevue et jugé apte par un comité présidé par le D Svc Aum."
          : "Accredited and recognized as a faith group leader by the governing authority of that faith group which exercises supervision in Canada, and as recommended by the ICCDF. Be endorsed as a chaplain by the ICCDF. Successfully pass an interview and be deemed suitable by a committee chaired by the D Chap Svc.";
      }
      if (jobId === "00372") {
        return isFrench
          ? "Fournir une preuve de certification comme infirmier auxiliaire autorisé/immatriculé en soins peropératoires."
          : "Provide proof of certification as a licensed/registered practical nurse in perioperative care.";
      }
      if (jobId === "00390") {
        return isFrench
          ? "Achèvement d’une formation spécialisée dans un programme de résidence agréé par le Collège royal des médecins et chirurgiens du Canada, et Certification et titre de fellow du Collège royal des médecins et chirurgiens du Canada dans l’une des spécialités médicales requises."
          : "Completion of specialized training in a residency program accredited by the Royal College of Physicians and Surgeons of Canada, and Certification and fellowship designation from the Royal College of Physicians and Surgeons of Canada in one of the required specialties.";
      }
      if (jobId === "00393") {
        return isFrench
          ? "Certification en médecine familiale du Collège des médecins de famille du Canada."
          : "Certification in Family Medicine from the College of Family Physicians of Canada.";
      }
      return isFrench
        ? "Certificat ou attestation officielle de spécialité (BNED, CCAMC, Collège Royal, etc.)"
        : "Official specialty certificate or attestation (NDEB, CACMS, Royal College, etc.)";
    }

    if (docNameFr.includes("Preuve d'expérience spécifique")) {
      if (jobId === "00137") {
        return isFrench
          ? "Expérience dans un ou plusieurs des domaines suivants : photographie, photojournalisme, conception graphique ou multimédia."
          : "Experience in one or more of the following fields: photography, photojournalism, graphic design, or multimedia.";
      }
      if (jobId === "00155") {
        return isFrench
          ? "A travaillé en tant que technologue en électronique biomédicale pendant une période totale d’au moins six (6) mois au cours des deux (2) dernières années."
          : "Had worked as a biomedical electronics technologist for a total period of at least six (6) months within the last two (2) years.";
      }
      if (jobId === "00189") {
        return isFrench
          ? "Au moins trois mois d'expérience pertinente dans un ou plusieurs des domaines suivants : industrie de la construction, gestion des installations, services d'incendies, services de l'environnement, géomatique, gestion de projet, service militaire."
          : "At least three months of relevant experience in one or more of the following fields: construction industry, facility management, fire services, environmental services, geomatics, project management, military service.";
      }
      if (jobId === "00203") {
        return isFrench
          ? "Fournir une preuve d’au moins une (1) année d’expérience cumulative dans deux ou plusieurs des domaines suivants : communications, journalisme, commercialisation, affaires publiques, relations publiques, recherche sur l'opinion publique, médias numériques ou sociaux."
          : "Provide proof of at least one (1) year of cumulative experience in two or more of the following fields: communications, journalism, marketing, public affairs, public relations, public opinion research, digital or social media.";
      }
      if (jobId === "00208") {
        return isFrench
          ? "Au moins une ou plusieurs années de travail à temps plein dans un ou plusieurs des domaines suivants : sélection, recrutement (RH), recherche en sciences sociales, orientation scolaire/professionnelle."
          : "At least one or more years of full-time work in one or more of the following fields: selection, recruitment (HR), social science research, academic/career counseling.";
      }
      if (jobId === "00211") {
        return isFrench
          ? "Fournir une preuve d’au moins trois (3) ans cumulatifs d’expérience à temps plein dans l’un ou plusieurs des domaines suivants : élaboration d’un programme d’études, expert-conseil en éducation, conception de l’instruction, formation du personnel, enseignement/instruction, expert-conseil en instruction, développement de l’instruction."
          : "Provide proof of at least three (3) cumulative years of full-time experience in one or more of the following fields: curriculum development, education consultant, instructional design, staff training, teaching/instruction, instructional consultant, instructional development.";
      }
      if (jobId === "00166") {
        return isFrench
          ? "Fournir une preuve d’expérience comme musicien professionnel dans une variété d’ensembles et dans divers styles de musique, p. ex. à titre de musicien travaillant à son propre compte, ou à temps plein avec une orchestre, un ensemble ou un groupe de musique local."
          : "Provide proof of experience as a professional musician in a variety of ensembles and in various styles of music, e.g. as a self-employed musician, or full-time with a local orchestra, ensemble, or music group.";
      }
      if (jobId === "00390") {
        return isFrench
          ? "Pour toutes les spécialités (à l’exception de la psychiatrie et de la médecine physique et réadaptation) : Être employé à temps plein dans un poste clinique au sein d’un établissement de soins de santé civil."
          : "For all specialties, except psychiatry and physical medicine and rehabilitation (physiatry): Be employed full-time in a clinical position within a civilian healthcare facility.";
      }
      if (jobId === "00398") {
        return isFrench
          ? "Un minimum de deux années d’expérience cumulative en gestion à temps plein au cours des cinq dernières années dans un milieu de soins de santé."
          : "A minimum of two years of cumulative full-time management experience within the last five years in a healthcare setting.";
      }
      return isFrench
        ? "Preuve d'expérience spécifique (gestion, portfolio, accréditation)."
        : "Proof of specific experience (management, portfolio, accreditation).";
    }

    return isFrench ? docNameFr : docNameFr;
  }

  getDisplayLabelForAdditionalDoc(doc: DocumentItem, reason: RejectionReason): string {
    const dossierJobs = this.getDossierJobObjects();
    if (dossierJobs.length > 0) {
      const matchingJobs = dossierJobs.filter((j) =>
        this.isAdditionalDocRequiredForJob(doc.nameFr, j.id)
      );
      if (matchingJobs.length > 0) {
        const texts = matchingJobs.map((j) =>
          this.getJobSpecificDocText(j.id, doc.nameFr, true)
        );
        const uniqueTexts = Array.from(new Set(texts));
        return uniqueTexts.join(" — ");
      }
    }
    return reason.labelFr;
  }

  hasVisibleTaskBasedDocs(task: Task): boolean {
    if (!task || !task.documents) return false;
    return task.documents.some((d) => this.isTaskBasedAdditionalDoc(d) && this.shouldShowDoc(task, d));
  }

  hasVisibleAdditionalDocs(task: Task): boolean {
    if (!task || !task.documents) return false;
    if (this.isPforDossier()) return false;
    const dossierJobs = this.getDossierJobObjects();
    if (dossierJobs.length === 0) return false;
    return dossierJobs.some((j) => this.hasJobAdditionalDocs(task, j));
  }

  hasJobAdditionalDocs(task: Task, job: JobEntry): boolean {
    if (!task || !task.documents || !job) return false;
    if (this.isPforDossier()) return false;
    return task.documents.some(
      (d) =>
        !this.isSubsidizedDoc(d) &&
        !this.isTaskBasedAdditionalDoc(d) &&
        this.isAdditionalDocRequiredForJob(d.nameFr, job.id) &&
        this.shouldShowDoc(task, d)
    );
  }

  hasVisibleSubsidizedDocs(task: Task): boolean {
    if (!task || !task.documents) return false;
    return task.documents.some((d) => this.isSubsidizedDoc(d) && this.shouldShowDoc(task, d));
  }

  getDossierJobsSummaryTextFr(): string {
    const jobs = this.getDossierJobObjects();
    if (jobs.length === 0) return "";
    return jobs.map((j) => `${j.title} (${j.id})`).join(", ");
  }

  getDossierJobsSummaryTextEn(): string {
    const jobs = this.getDossierJobObjects();
    if (jobs.length === 0) return "";
    return jobs.map((j) => `${j.titleEn || j.title} (${j.id})`).join(", ");
  }

  // Computed Tasks based on Stage
  visibleTasks = computed(() => {
    const currentStage = this.stage();
    const tasks = this.allTasks();

    if (currentStage === "intro" || currentStage === "recruiter-dossier-type") {
      return [];
    }

    if (currentStage === "minor-check") {
      // In Minor check, we only want Birth Certificate and Parental Consent tasks.
      // The "Partie H" is now inside "Consentement du parent", so we don't need the general App Form task here.
      return tasks.filter(
        (t) =>
          t.nameFr.includes("Certificat de naissance") ||
          t.nameFr.includes("Consentement du parent"),
      );
    }

    // GD Role: filter offer tasks based on Local vs OTA dossier type
    if (this.selectedRole() === "gestionnaire") {
      
      return tasks.filter((t) => {
        if (t.nameFr.includes("Consentement du parent")) return false;

        // Filter Offer tasks
        if (t.section === "Courriel d'offre" || t.nameFr.includes("Offre")) {
          return t.nameFr === "Offre normale" || t.nameFr.toLowerCase().includes("subventionn");
        }

        return true;
      });
    }

    // Main Stage: Exclude Parental Consent
    return tasks.filter((t) => {
      if (t.nameFr.includes("Consentement du parent")) return false;

      return true;
    });
  });

  // Action: User clicks "Oui" (Minor)
  startMinorCheck() {
    this.isUnderAge.set(true);
    this.stage.set("minor-check");
    const tasks = this.visibleTasks();
    if (tasks.length > 0) this.selectTask(tasks[0]);
  }

  // Recruiter actions for Minor Check -> Dossier Type flow
  onRecruiterMinorCheckNon() {
    this.isUnderAge.set(false);
    this.stage.set("recruiter-dossier-type");
  }

  backToRecruiterMinorCheck() {
    if (this.isUnderAge()) {
      this.stage.set("minor-check");
      const tasks = this.visibleTasks();
      if (tasks.length > 0) this.selectTask(tasks[0]);
    } else {
      this.stage.set("intro");
    }
  }

  selectRecruiterDossierType(type: 'normal' | 'pfor') {
    this.recruiterDossierType.set(type);
    if (type === 'pfor') {
      this.sharedState.isPostulantPfor.set(true);
    } else {
      this.sharedState.isPostulantPfor.set(false);
    }
    this.stage.set("main");
    const tasks = this.visibleTasks();
    if (tasks.length > 0) this.selectTask(tasks[0]);
  }

  // Action: User clicks "Non" (Adult) or finishes minor check
  startMainProgram() {
    if (this.selectedRole() === "recruiter") {
      this.stage.set("recruiter-dossier-type");
      return;
    }
    if (this.stage() === "intro") {
      this.isUnderAge.set(false);
    }
    this.stage.set("main");
    const tasks = this.visibleTasks();
    if (tasks.length > 0) this.selectTask(tasks[0]);
  }

  // Action: GD user chooses dossier type (Local or OTA)
  selectGdDossierType(type: 'Local' | 'OTA') {
    this.evaluationMedicaleType.set(type === 'OTA' ? 'Dossier OTA' : 'Dossier régulier');
    if (type === 'OTA') {
      const mtl = this.recruitmentCentersList.find(c => c.city === 'Montréal') || this.recruitmentCentersList[0];
      this.offreLieuVille.set('Montréal');
      this.offreLieuEnrolement.set(mtl.fullFr);
      this.offreHeureArriveePostulant.set('07h30');
      this.offreHeureArriveeInvites.set('09h40');
    } else {
      const savedVille = (typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_ville')) || 'Québec';
      const centerObj = this.recruitmentCentersList.find(c => c.city === savedVille) || this.recruitmentCentersList[0];
      this.offreLieuVille.set(savedVille);
      this.offreLieuEnrolement.set((typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_enrolement')) || centerObj.fullFr);
    }
    this.stage.set("main");
    const tasks = this.visibleTasks();
    if (tasks.length > 0) this.selectTask(tasks[0]);
  }

  // Check if the 4 specific minor documents are compliant
  isMinorCheckComplete = computed(() => {
    const keys = this.compliantDocKeys();

    // Convert to array explicitly typed as string[] to avoid TS inference issues
    const keysArray = Array.from(keys) as string[];

    // 1. Certificat de naissance (Check parents)
    const hasBirthCert = keysArray.some(
      (k) =>
        k.includes("Certificat de naissance") &&
        k.includes("::Certificat de naissance"),
    );

    // 2. Parent ID (Inside Consent task)
    const hasParentId = keysArray.some(
      (k) =>
        k.includes("Consentement du parent") &&
        k.includes("::Pièce d'identité du parent"),
    );

    // 3. Parent Selfie (Inside Consent task)
    const hasParentSelfie = keysArray.some(
      (k) =>
        k.includes("Consentement du parent") &&
        (k.includes("::Selfie du parent") || k.includes("::Égoportrait (Selfie) du parent")),
    );

    // 4. Formulaire demande Partie H (Inside Consent task now)
    const hasPartH = keysArray.some(
      (k) =>
        k.includes("Consentement du parent") &&
        k.includes("::Formulaire de demande d'emploi - Partie H"),
    );

    return hasBirthCert && hasParentId && hasParentSelfie && hasPartH;
  });

  // --- CORE LOGIC ---

  // Actions
  selectTask(task: Task) {
    this.selectedTask.set(task);
    if (task.nameFr.includes("Offre normale")) {
      if (this.offreDateArriveeUnite() === '2025 au plus tard 16h00') {
        this.offreDateArriveeUnite.set('2026 au plus tard 16h00');
      }
    } else if (task.nameFr.toLowerCase().includes("subventionn")) {
      if (this.offreDateArriveeUnite() === '2026 au plus tard 16h00') {
        this.offreDateArriveeUnite.set('2025 au plus tard 16h00');
      }
    }
  }

  toggleTaskNotCompleted(task: Task) {
    const willBeNotCompleted = !this.isTaskNotCompleted(task);

    this.taskNotCompletedKeys.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(task.nameFr)) {
        newSet.delete(task.nameFr);
      } else {
        newSet.add(task.nameFr);
      }
      return newSet;
    });

    if (willBeNotCompleted) {
      // Clear compliant keys for all documents in this task
      this.compliantDocKeys.update((set) => {
        const newSet = new Set(set);
        task.documents.forEach((doc) => {
          newSet.delete(this.getDocKey(task, doc));
        });
        return newSet;
      });

      // Clear selected rejection reasons for all documents in this task
      this.selectedRejectionKeys.update((set) => {
        const newSet = new Set(set);
        const dossierJobs = this.getDossierJobObjects();
        task.documents.forEach((doc) => {
          doc.reasons.forEach((reason) => {
            newSet.delete(this.getReasonKey(doc, reason));
            dossierJobs.forEach((j) => {
              newSet.delete(this.getJobReasonKey(j, doc, reason));
            });
          });
        });
        return newSet;
      });
    }
  }

  isTaskNotCompleted(task: Task): boolean {
    return this.taskNotCompletedKeys().has(task.nameFr);
  }

  toggleReason(task: Task, doc: DocumentItem, reason: RejectionReason) {
    const reasonKey = this.getReasonKey(doc, reason);

    // If we select a rejection, the document is no longer "Compliant"
    this.setCompliantState(task, doc, false);
    if (task.nameFr.includes("Documents Supplémentaires")) {
      const suppKey = `${task.nameFr}::metiers_docs`;
      this.compliantDocKeys.update((set) => {
        const newSet = new Set(set);
        newSet.delete(suppKey);
        return newSet;
      });
    }

    this.selectedRejectionKeys.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(reasonKey)) {
        newSet.delete(reasonKey);
      } else {
        newSet.add(reasonKey);
        
        // Uncheck others if "Inexistant au dossier" is selected, and vice versa
        if (reason.id.includes("inexist")) {
          // Uncheck all other reasons for this document
          doc.reasons.forEach(r => {
            if (r.id !== reason.id) {
               newSet.delete(this.getReasonKey(doc, r));
            }
          });
        } else {
          // If we check another reason, uncheck "Inexistant au dossier"
          doc.reasons.forEach(r => {
            if (r.id.includes("inexist")) {
               newSet.delete(this.getReasonKey(doc, r));
            }
          });
        }
      }
      return newSet;
    });
  }

  toggleJobReason(task: Task, job: JobEntry, doc: DocumentItem, reason: RejectionReason) {
    const jobKey = this.getJobReasonKey(job, doc, reason);
    const generalKey = this.getReasonKey(doc, reason);

    this.setCompliantState(task, doc, false);
    if (task.nameFr.includes("Documents Supplémentaires")) {
      const suppKey = `${task.nameFr}::metiers_docs`;
      this.compliantDocKeys.update((set) => {
        const newSet = new Set(set);
        newSet.delete(suppKey);
        return newSet;
      });
    }

    this.selectedRejectionKeys.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(generalKey)) {
        newSet.delete(generalKey);
        const dossierJobs = this.getDossierJobObjects();
        for (const j of dossierJobs) {
          if (j.id !== job.id && this.isAdditionalDocRequiredForJob(doc.nameFr, j.id)) {
            newSet.add(this.getJobReasonKey(j, doc, reason));
          }
        }
      } else {
        if (newSet.has(jobKey)) {
          newSet.delete(jobKey);
        } else {
          newSet.add(jobKey);
        }
      }
      return newSet;
    });
  }

  // Helpers for Additional Job Docs Compliance
  hasAdditionalJobDocsRejections(task: Task): boolean {
    const dossierJobs = this.getDossierJobObjects();
    if (dossierJobs.length === 0) return false;
    return task.documents.some((doc) => {
      if (!this.isSubsidizedDoc(doc) && !this.isTaskBasedAdditionalDoc(doc)) {
        return doc.reasons.some((reason) =>
          dossierJobs.some(
            (job) =>
              this.isAdditionalDocRequiredForJob(doc.nameFr, job.id) &&
              this.isJobReasonSelected(job, doc, reason)
          )
        );
      }
      return false;
    });
  }

  isAdditionalJobDocsCompliant(task?: Task): boolean {
    const t = task || this.visibleTasks().find((taskItem) => taskItem.nameFr.includes("Documents Supplémentaires"));
    if (!t) return false;
    const key = `${t.nameFr}::metiers_docs`;
    return this.compliantDocKeys().has(key) && !this.hasAdditionalJobDocsRejections(t);
  }

  toggleAdditionalJobDocsCompliant(task: Task) {
    if (this.isAdditionalJobDocsCompliant(task)) {
      // Toggle OFF
      const key = `${task.nameFr}::metiers_docs`;
      this.compliantDocKeys.update((set) => {
        const newSet = new Set(set);
        newSet.delete(key);
        return newSet;
      });
    } else {
      // Toggle ON:
      // 1. Clear any selected rejection keys for job-specific additional docs
      this.selectedRejectionKeys.update((set) => {
        const newSet = new Set(set);
        const dossierJobs = this.getDossierJobObjects();
        task.documents.forEach((doc) => {
          if (!this.isSubsidizedDoc(doc) && !this.isTaskBasedAdditionalDoc(doc)) {
            doc.reasons.forEach((r) => {
              newSet.delete(this.getReasonKey(doc, r));
              dossierJobs.forEach((j) => {
                newSet.delete(this.getJobReasonKey(j, doc, r));
              });
            });
          }
        });
        return newSet;
      });

      // 2. Mark as compliant
      const key = `${task.nameFr}::metiers_docs`;
      this.compliantDocKeys.update((set) => {
        const newSet = new Set(set);
        newSet.add(key);
        return newSet;
      });
    }
  }

  // Toggle "Conforme" state
  toggleCompliant(task: Task, doc: DocumentItem) {
    if (this.isCompliant(task, doc)) {
      // If already compliant, toggle OFF
      this.setCompliantState(task, doc, false);
    } else {
      // If turning ON:
      // 1. Clear rejections (cannot be both compliant and rejected)
      this.selectedRejectionKeys.update((set) => {
        const newSet = new Set(set);
        const dossierJobs = this.getDossierJobObjects();
        doc.reasons.forEach((r) => {
          newSet.delete(this.getReasonKey(doc, r));
          dossierJobs.forEach((j) => {
            newSet.delete(this.getJobReasonKey(j, doc, r));
          });
        });
        return newSet;
      });

      // 2. Set Compliant State explicitly
      this.setCompliantState(task, doc, true);
    }
  }

  // Helpers
  private getReasonKey(doc: DocumentItem, reason: RejectionReason): string {
    return `${doc.nameFr}::${reason.id}`;
  }

  private getJobReasonKey(job: JobEntry, doc: DocumentItem, reason: RejectionReason): string {
    return `${doc.nameFr}::${reason.id}::${job.id}`;
  }

  private getDocKey(task: Task, doc: DocumentItem): string {
    return `${task.nameFr}::${doc.nameFr}`;
  }

  private setCompliantState(
    task: Task,
    doc: DocumentItem,
    isCompliant: boolean,
  ) {
    const key = this.getDocKey(task, doc);
    this.compliantDocKeys.update((set) => {
      const newSet = new Set(set);
      if (isCompliant) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }

  // State Checkers
  isJobReasonSelected(job: JobEntry, doc: DocumentItem, reason: RejectionReason): boolean {
    return (
      this.selectedRejectionKeys().has(this.getJobReasonKey(job, doc, reason)) ||
      this.selectedRejectionKeys().has(this.getReasonKey(doc, reason))
    );
  }

  isReasonSelected(doc: DocumentItem, reason: RejectionReason): boolean {
    if (this.selectedRejectionKeys().has(this.getReasonKey(doc, reason))) {
      return true;
    }
    const dossierJobs = this.getDossierJobObjects();
    return dossierJobs.some((j) =>
      this.selectedRejectionKeys().has(this.getJobReasonKey(j, doc, reason))
    );
  }

  hasRejections(doc: DocumentItem): boolean {
    return doc.reasons.some((r) => this.isReasonSelected(doc, r));
  }

  hasConfirmationReasons(doc: DocumentItem): boolean {
    return doc.reasons.some((r) => r.isConfirmation);
  }

  hasAdditionalDocReasons(doc: DocumentItem): boolean {
    return doc.reasons.some((r) => r.isAdditionalDoc);
  }

  hasNormalReasons(doc: DocumentItem): boolean {
    return doc.reasons.some((r) => !r.isConfirmation && !r.isAdditionalDoc);
  }

  // A document is Compliant only if explicitly marked so
  isCompliant(task: Task, doc: DocumentItem): boolean {
    return this.compliantDocKeys().has(this.getDocKey(task, doc));
  }

  hasTaskRejections(task: Task): boolean {
    return (
      this.isTaskNotCompleted(task) ||
      task.documents.some((doc) => this.hasRejections(doc))
    );
  }

  isTaskCompliant(task: Task): boolean {
    if (task.nameFr.includes("Documents Supplémentaires")) {
      if (this.hasTaskRejections(task)) {
        return false;
      }
      if (this.isPforDossier()) {
        return true;
      }
      if (this.hasVisibleAdditionalDocs(task)) {
        return this.isAdditionalJobDocsCompliant(task);
      }
      return true;
    }

    const isIdentity = task.nameFr.startsWith("Pièce d'identité avec photo");

    if (isIdentity) {
      const hasId = task.documents.some(
        (d) =>
          !d.nameFr.toLowerCase().includes("selfie") &&
          !d.nameFr.toLowerCase().includes("invalide") &&
          this.isCompliant(task, d),
      );
      return hasId;
    }

    const isConsentement = task.nameFr.includes("Consentement du parent");
    if (isConsentement) {
      return task.documents.every((d) => this.isCompliant(task, d));
    }

    // For other tasks, it's compliant if any 1 document is compliant
    return task.documents.some((d) => this.isCompliant(task, d));
  }

  allTasksCompliant = computed(() => {
    const tasks = this.visibleTasks();
    if (tasks.length === 0) return false;
    return tasks.every((task) => {
      // Le formulaire MDN 2977 n'est pas obligatoire pour la conformité finale
      if (task.nameFr.includes("MDN 2977")) {
        return true;
      }
      if (task.nameFr.includes("Courriel d'offre")) {
        return true;
      }
      if (
        task.nameFr.includes("Formulaire de demande d'emploi notée") ||
        task.nameFr.includes("Formulaire de demande d’emploi noté")
      ) {
        return true;
      }
      return this.isTaskCompliant(task);
    });
  });

  hasSelectedRejections = computed(() => {
    return this.selectedRejectionKeys().size > 0 || this.taskNotCompletedKeys().size > 0;
  });

  isPremierContactActive = computed(() => {
    return (
      this.selectedRole() === 'gestionnaire' &&
      this.premierContactCourriel()
    );
  });

  isAvisFermetureActive = computed(() => {
    return (
      this.selectedRole() === 'gestionnaire' &&
      this.avisFermetureCourriel()
    );
  });

  isAnnexeQActive = computed(() => {
    return (
      this.selectedRole() === 'gestionnaire' &&
      this.annexeQCourriel()
    );
  });

  isMedicalEvaluationActive = computed(() => {
    return (
      this.selectedRole() === 'gestionnaire' &&
      (this.evaluationMedicalePartie1() ||
        this.evaluationMedicalePartie2() ||
        this.evaluationMedicalePartie1Et2())
    );
  });

  hasAnyGdSelection = computed(() => {
    if (this.selectedRole() !== 'gestionnaire') return false;
    return (
      this.isPremierContactActive() ||
      (this.selectedTask()?.nameFr === 'Premier contact' && this.premierContactSubPanelMode() === 'note') ||
      (this.selectedTask()?.nameFr?.includes('Offre') && this.offreSubPanelMode() === 'note') ||
      this.isAvisFermetureActive() ||
      this.isAnnexeQActive() ||
      this.isMedicalEvaluationActive() ||
      this.offreNormaleChecked() ||
      this.offreEtudesSubventionneesChecked() ||
      this.rappelCeremonieChecked() ||
      this.hasSelectedRejections() ||
      this.forceGeneralReminder() ||
      this.selectedEmailBankTemplate() !== '' ||
      this.allTasksCompliant()
    );
  });

  // A document is "Active" if it is either Compliant OR has Rejections
  isDocActive(task: Task, doc: DocumentItem): boolean {
    return this.isCompliant(task, doc) || this.hasRejections(doc);
  }

  // LOGIC: Visibility of documents based on Task rules
  shouldShowDoc(task: Task, doc: DocumentItem): boolean {
    if (this.isTaskNotCompleted(task)) {
      return false;
    }

    if (task.nameFr.includes("Documents Supplémentaires")) {
      if (this.isDocActive(task, doc)) return true;
      return this.shouldShowAdditionalDoc(doc);
    }

    // NEW: Minor Check Logic for "Certificat de naissance"
    // In minor check, we only want the actual "Certificat de naissance" (long form), not citizenship card/PR card.
    if (
      this.stage() === "minor-check" &&
      task.nameFr.startsWith("Certificat de naissance")
    ) {
      return doc.nameFr === "Certificat de naissance";
    }

    // PFOR Admission Letter: Only visible for PFOR dossiers
    if (doc.nameFr.includes("Lettre d'admission sans condition")) {
      if (this.isDocActive(task, doc)) return true;
      return this.isPforDossier();
    }

    // 1. If this specific document is active (being worked on), always show it.
    if (this.isDocActive(task, doc)) return true;

    // 2. Logic for "Pièce d'identité"
    // Rule: If one ID is active, hide other IDs. Always keep Selfie visible.
    if (task.nameFr.startsWith("Pièce d'identité")) {
      const isSelfie = doc.nameFr.toLowerCase().includes("selfie");

      // Always show selfie
      if (isSelfie) return true;

      // For other IDs: Check if ANY other NON-SELFIE document is active
      const otherMainIdActive = task.documents.some(
        (d) =>
          d !== doc &&
          !d.nameFr.toLowerCase().includes("selfie") &&
          this.isDocActive(task, d),
      );

      // If another main ID is active, hide this one.
      return !otherMainIdActive;
    }

    // 3. Logic for "Certificat de naissance" (Normal Mode)
    // Rule: If one document is active, hide the others.
    if (task.nameFr.startsWith("Certificat de naissance")) {
      const otherActive = task.documents.some(
        (d) => d !== doc && this.isDocActive(task, d),
      );
      return !otherActive;
    }

    // Default: Show everything
    return true;
  }

  // LOGIC: Visibility of reasons based on Stage (NEW)
  shouldShowReason(
    task: Task,
    doc: DocumentItem,
    reason: RejectionReason,
  ): boolean {
    // The previous complex logic for Part H is removed because the reasons have been moved
    // to the appropriate task in the data structure itself.
    return true;
  }

  // Email Bank & Reminder State
  selectedEmailBankTemplate = signal<string>("");
  isEmailBankDropdownOpen = signal<boolean>(false);

  forceGeneralReminder = computed(() => this.selectedEmailBankTemplate() === "general_reminder");

  toggleEmailBankDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isEmailBankDropdownOpen.update((v) => !v);
  }

  selectEmailBankTemplate(templateId: string) {
    if (this.selectedEmailBankTemplate() === templateId) {
      this.selectedEmailBankTemplate.set("");
    } else {
      this.selectedEmailBankTemplate.set(templateId);
    }
    this.isEmailBankDropdownOpen.set(false);
  }

  toggleGeneralReminder() {
    this.selectEmailBankTemplate("general_reminder");
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isEmailBankDropdownOpen() && !target.closest('.email-bank-dropdown-container')) {
      this.isEmailBankDropdownOpen.set(false);
    }
  }

  // Triage Medical State
  triageMedicalRequis = signal(false);

  toggleTriageMedical() {
    this.triageMedicalRequis.update((v) => !v);
  }

  // Offer Email State
  offreNormaleChecked = signal(false);
  offreEtudesSubventionneesChecked = signal(false);

  // Form fields for offer email
  readonly recruitmentCentersList: RecruitmentCenter[] = RECRUITMENT_CENTERS;
  
  // Rappel cérémonie d'assermentation state
  rappelCeremonieChecked = signal(false);
  rappelCeremonieRalliementChecked = signal(false);
  rappelCeremonieDate = signal<string>('');
  rappelCeremonieHeurePostulant = signal<string>((typeof localStorage !== 'undefined' && localStorage.getItem('rappel_heure_postulant')) || '7h30');
  rappelCeremonieHeureInvites = signal<string>((typeof localStorage !== 'undefined' && localStorage.getItem('rappel_heure_invites')) || '10h15');
  rappelCeremonieLieu = signal<string>('Québec');

  offreLieuVille = signal<string>((typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_ville')) || 'Québec');
  offreUniteAffectation = signal<string>('3229');
  readonly unitesAffectation = UNITS_LIST;
  offreMetier = signal<string>('');
  offreMetierSearchQuery = signal<string>('');
  offreMetierDropdownOpen = signal<boolean>(false);
  offreProgrammeEnrolement = signal<string>('');
  offreElement = signal<string>('');
  offreDureeContrat = signal<string>('');
  offreEtudesSubventionnees = signal<string>('');
  offreDureeEtudesSubventionnees = signal<string>('');
  readonly enrolmentHoursList: string[] = ENROLMENT_HOURS;
  testEsomRecruitmentCenterCity = signal<string>('Québec');

  getTestEsomCenter(): RecruitmentCenter {
    return this.recruitmentCentersList.find(c => c.city === this.testEsomRecruitmentCenterCity()) || this.recruitmentCentersList[0];
  }
  offreHeureArriveePostulant = signal<string>((typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_postulant')) || '8h00');
  offreHeureArriveeInvites = signal<string>((typeof localStorage !== 'undefined' && localStorage.getItem('offre_heure_invites')) || '10h00');
  offreDateEnrolement = signal<string>('');
  offreLieuEnrolement = signal<string>((typeof localStorage !== 'undefined' && localStorage.getItem('offre_lieu_enrolement')) || RECRUITMENT_CENTERS[0].fullFr);
  offreDateArriveeUnite = signal<string>('');
  offreElementsManquants = signal<string>('Spécimen de chèque');
  offreDateElementsManquants = signal<string>('');
  offreSerieCours = signal<string>('');
  offreDateCoursDebut = signal<string>('');
  offreDateCoursFin = signal<string>('');
  offreFormulairePpp = signal<boolean>(false);
  offreFormulairePcu = signal<boolean>(false);
  offreFormulaireCroixSouvenir = signal<boolean>(false);
  offreFormulaireBeneficiaire = signal<boolean>(false);

  toggleOffreFormulairePpp() {
    this.offreFormulairePpp.update(v => !v);
    this.autoActivateOffreEmail();
  }

  toggleOffreFormulairePcu() {
    this.offreFormulairePcu.update(v => !v);
    this.autoActivateOffreEmail();
  }

  toggleOffreFormulaireCroixSouvenir() {
    this.offreFormulaireCroixSouvenir.update(v => !v);
    this.autoActivateOffreEmail();
  }

  toggleOffreFormulaireBeneficiaire() {
    this.offreFormulaireBeneficiaire.update(v => !v);
    this.autoActivateOffreEmail();
  }

  hasAnyOffreFormulairesSupplementaires(): boolean {
    return this.offreFormulairePpp() ||
      this.offreFormulairePcu() ||
      this.offreFormulaireCroixSouvenir() ||
      this.offreFormulaireBeneficiaire();
  }

  getOffreFormulairesSupplementairesPlain(lang: 'fr' | 'en'): string {
    if (!this.hasAnyOffreFormulairesSupplementaires()) {
      return '';
    }

    let txt = '';
    if (lang === 'fr') {
      txt += "Et voici des liens vers des formulaires supplémentaires que vous devez remplir et me renvoyer par courriel.\n";
      if (this.offreFormulairePpp()) {
        txt += "• Identification des plus proches parents : https://simontheriault8-cyber.github.io/Documents/Identification%20des%20plus%20proches%20parents.pdf\n";
      }
      if (this.offreFormulairePcu()) {
        txt += "• Personnes à contacter en cas d'urgence : https://simontheriault8-cyber.github.io/Documents/Personne%20%C3%A0%20contacter%20en%20cas%20d'urgence.pdf\n";
      }
      if (this.offreFormulaireCroixSouvenir()) {
        txt += "• Désignation des récipiendaires de la Croix du souvenir : https://simontheriault8-cyber.github.io/Documents/D%C3%A9signation%20des%20r%C3%A9cipiendaires%20de%20la%20Croix%20du%20souvenir.pdf\n";
      }
      if (this.offreFormulaireBeneficiaire()) {
        txt += "• Désignation ou changement de bénéficiaire : https://simontheriault8-cyber.github.io/Documents/D%C3%A9signation%20ou%20changement%20de%20b%C3%A9n%C3%A9ficiaire.pdf\n";
      }
      txt += "\n";
    } else {
      txt += "And here are links to additional forms that you must complete and return to me by email.\n";
      if (this.offreFormulairePpp()) {
        txt += "• Next of Kin Identification : https://simontheriault8-cyber.github.io/Documents/Identification%20des%20plus%20proches%20parents.pdf\n";
      }
      if (this.offreFormulairePcu()) {
        txt += "• Emergency Contact Notification : https://simontheriault8-cyber.github.io/Documents/Personne%20%C3%A0%20contacter%20en%20cas%20d'urgence.pdf\n";
      }
      if (this.offreFormulaireCroixSouvenir()) {
        txt += "• Designation of Memorial Cross Recipients : https://simontheriault8-cyber.github.io/Documents/D%C3%A9signation%20des%20r%C3%A9cipiendaires%20de%20la%20Croix%20du%20souvenir.pdf\n";
      }
      if (this.offreFormulaireBeneficiaire()) {
        txt += "• Naming or Substitution of a Beneficiary : https://simontheriault8-cyber.github.io/Documents/Naming%20or%20Substitution%20of%20a%20Beneficiary.pdf\n";
      }
      txt += "\n";
    }
    return txt;
  }

  getOffreFormulairesSupplementairesHtml(lang: 'fr' | 'en'): string {
    if (!this.hasAnyOffreFormulairesSupplementaires()) {
      return '';
    }

    let html = '';
    if (lang === 'fr') {
      html += `<p style="margin-top: 10px; margin-bottom: 6px;">Et voici des liens vers des formulaires supplémentaires que vous devez remplir et me renvoyer par courriel.</p>`;
      html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
      if (this.offreFormulairePpp()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Identification%20des%20plus%20proches%20parents.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Identification des plus proches parents</a></li>`;
      }
      if (this.offreFormulairePcu()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Personne%20%C3%A0%20contacter%20en%20cas%20d'urgence.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Personnes à contacter en cas d'urgence</a></li>`;
      }
      if (this.offreFormulaireCroixSouvenir()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/D%C3%A9signation%20des%20r%C3%A9cipiendaires%20de%20la%20Croix%20du%20souvenir.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Désignation des récipiendaires de la Croix du souvenir</a></li>`;
      }
      if (this.offreFormulaireBeneficiaire()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/D%C3%A9signation%20ou%20changement%20de%20b%C3%A9n%C3%A9ficiaire.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Désignation ou changement de bénéficiaire</a></li>`;
      }
      html += `</ul>`;
    } else {
      html += `<p style="margin-top: 10px; margin-bottom: 6px;">And here are links to additional forms that you must complete and return to me by email.</p>`;
      html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
      if (this.offreFormulairePpp()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Identification%20des%20plus%20proches%20parents.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Next of Kin Identification</a></li>`;
      }
      if (this.offreFormulairePcu()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Personne%20%C3%A0%20contacter%20en%20cas%20d'urgence.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Emergency Contact Notification</a></li>`;
      }
      if (this.offreFormulaireCroixSouvenir()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/D%C3%A9signation%20des%20r%C3%A9cipiendaires%20de%20la%20Croix%20du%20souvenir.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Designation of Memorial Cross Recipients</a></li>`;
      }
      if (this.offreFormulaireBeneficiaire()) {
        html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Naming%20or%20Substitution%20of%20a%20Beneficiary.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Naming or Substitution of a Beneficiary</a></li>`;
      }
      html += `</ul>`;
    }
    return html;
  }

  // Sub-panel mode for Offer task
  offreSubPanelMode = signal<'courriel' | 'note'>('courriel');

  // Form fields for offer note
  noteStatutCivil = signal<string>('célibataire');
  noteConjoint = signal<string>('N/A');
  noteConjointTexte = signal<string>('');
  noteEnfantCount = signal<string>('0');
  noteEnfantDetails = signal<{ sex: string; year: string }[]>([]);
  notePlaqueImm = signal<string>('');
  noteBrisBail = signal<string>('N/A');
  noteEntreposage = signal<string>('N/A');
  noteSermentDeclaration = signal<string>('Serment');
  noteInviteMil = signal<string>('N/A');
  noteInviteMilTexte = signal<string>('');
  noteSvcMilAnt = signal<string>('N/A');
  noteBeneficiaire = signal<string>('');
  noteDateCourrielConfirmation = signal<string>('');
  copiedNoteNotification = signal<boolean>(false);

  getEffectiveNoteDateCourrielConfirmation(): string {
    const val = this.noteDateCourrielConfirmation();
    if (val && val.trim().length > 0) {
      return val;
    }
    return getTodayDateString();
  }

  readonly statutCivilOptions: string[] = [
    'célibataire',
    'marié(e)',
    'conjoint(e) de fait',
    'divorcé(e)',
    'séparé(e)',
    'veuf/veuve'
  ];

  readonly ouiNonOptions: string[] = [
    'N/A',
    'oui'
  ];

  readonly brisBailOptions: string[] = [
    'N/A',
    'Refus du post',
    'Accepté par le post'
  ];

  readonly entreposageOptions: string[] = [
    'N/A',
    'Refus du post',
    'Accepté par le post'
  ];

  readonly sermentDeclarationOptions: string[] = [
    'Serment',
    'Déclaration',
    'Serment RP',
    'Déclaration RP'
  ];

  readonly svcMilAntOptions: string[] = [
    'N/A',
    'Force régulière',
    'Première réserve',
    'Cadets / Rangers',
    'Armée étrangère'
  ];

  // Helper to dynamically generate child age years
  getEnfantYears(): string[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 18; y <= currentYear; y++) {
      years.push(y.toString());
    }
    return years.reverse(); // Newest first
  }

  onEnfantCountChange(count: string) {
    const num = parseInt(count, 10);
    if (!isNaN(num) && num >= 0 && num <= 20) {
      this.noteEnfantCount.set(count);
      const currentDetails = this.noteEnfantDetails();
      const newDetails = [];
      const years = this.getEnfantYears();
      const defaultYear = years.length > 0 ? years[0] : '';
      for (let i = 0; i < num; i++) {
        if (i < currentDetails.length) {
          newDetails.push(currentDetails[i]);
        } else {
          newDetails.push({ sex: 'M', year: defaultYear });
        }
      }
      this.noteEnfantDetails.set(newDetails);
    } else if (count === '') {
      this.noteEnfantCount.set('');
      this.noteEnfantDetails.set([]);
    }
    this.autoActivateOffreEmail();
  }

  updateEnfantDetail(index: number, field: 'sex' | 'year', value: string) {
    const details = [...this.noteEnfantDetails()];
    if (details[index]) {
      details[index] = { ...details[index], [field]: value };
      this.noteEnfantDetails.set(details);
      this.autoActivateOffreEmail();
    }
  }

  getUniteAffectationObj() {
    const target = this.offreUniteAffectation();
    const session = this.unitesAffectation.find(u => u.id === target || u.uic === target)
      || (target === 'st-jean' ? this.unitesAffectation.find(u => u.id === '3613' || u.uic === '3613') : null)
      || this.unitesAffectation.find(u => u.id === '3613')
      || this.unitesAffectation[0];
    if (!session) return { nom: 'N/A', adressePlain: '', adresseHtml: '', uic: '' };
    
    let displayNom = session.officialName;
    if (session.id === '3613' || session.uic === '3613' || target === 'st-jean') {
      displayNom = 'ÉCOLE DE LEADERSHIP ET DE RECRUES DES FORCES CANADIENNES';
    }

    return {
      nom: displayNom,
      adressePlain: session.addressPlain,
      adresseHtml: session.addressHtml,
      uic: session.uic || session.id
    };
  }

  isUic3613Selected(): boolean {
    const unitObj = this.getUniteAffectationObj();
    return unitObj.uic === '3613' || this.offreUniteAffectation() === '3613' || this.offreUniteAffectation() === 'st-jean';
  }

  getOfferFormattedNote(): string {
    const metier = this.offreMetier() || '189 génie de construction';
    const statut = this.noteStatutCivil() || 'célibataire';
    
    const conjointOpt = this.noteConjoint() || 'N/A';
    const conjoint = conjointOpt === 'oui' ? (this.noteConjointTexte() || 'À CONFIRMER') : conjointOpt;
    
    const count = parseInt(this.noteEnfantCount() || '0', 10);
    let enfant = 'N/A';
    if (!isNaN(count) && count > 0) {
      enfant = this.noteEnfantDetails()
        .map(c => `${c.sex} ${c.year}`)
        .join(', ');
    }

    const plaque = this.notePlaqueImm().trim() || 'À confirmer';
    const brisBail = this.noteBrisBail() || 'N/A';
    const entreposage = this.noteEntreposage() || 'N/A';
    const serment = this.noteSermentDeclaration() || 'Serment';
    const inviteMilOpt = this.noteInviteMil() || 'N/A';
    const inviteMil = inviteMilOpt === 'oui' ? (this.noteInviteMilTexte() || 'À CONFIRMER') : inviteMilOpt;
    const svcMilAnt = this.noteSvcMilAnt() || 'N/A';
    const beneficiaire = this.noteBeneficiaire();
    const dateCourriel = this.getEffectiveNoteDateCourrielConfirmation();

    let note = `Postulant accepte l’offre – ${metier}\n`;
    note += `Statut : ${statut}\n`;
    note += `Conjoint : ${conjoint}\n`;
    note += `Enfant : ${enfant}\n`;
    note += `Plaque IMM : ${plaque}\n`;
    note += `Bris de bail : ${brisBail}\n`;
    note += `Entreposage : ${entreposage}\n`;
    note += `${serment}\n`;
    note += `Invité mil : ${inviteMil}\n`;
    note += `Svc Mil ant : ${svcMilAnt}\n`;
    note += `Bénéficiaire : ${beneficiaire}`;
    if (dateCourriel) {
      note += `\nCourriel de confirmation envoyé au postulant le : ${dateCourriel}`;
    }

    return note;
  }

  copyNoteToClipboard() {
    const note = this.getOfferFormattedNote();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(note);
    }
    this.copiedNoteNotification.set(true);
    setTimeout(() => this.copiedNoteNotification.set(false), 2000);
  }

  onOffreHeurePostulantChange(val: string) {
    this.offreHeureArriveePostulant.set(val);
    try {
      localStorage.setItem('offre_heure_postulant', val);
    } catch {}
    this.autoActivateOffreEmail();
  }

  onOffreHeureInvitesChange(val: string) {
    this.offreHeureArriveeInvites.set(val);
    try {
      localStorage.setItem('offre_heure_invites', val);
    } catch {}
    this.autoActivateOffreEmail();
  }

  onNoteConjointTexteInput(val: string) {
    this.noteConjointTexte.set(val);
    this.autoActivateOffreEmail();
  }

  onOffreLieuVilleChange(city: string) {
    this.offreLieuVille.set(city);
    const center = this.recruitmentCentersList.find(c => c.city === city);
    if (center) {
      this.offreLieuEnrolement.set(center.fullFr);
      if (this.evaluationMedicaleType() !== 'Dossier OTA') {
        try {
          localStorage.setItem('offre_lieu_ville', city);
          localStorage.setItem('offre_lieu_enrolement', center.fullFr);
        } catch {}
      }
    }
    this.autoActivateOffreEmail();
  }

  getSelectedRecruitmentCenter(): RecruitmentCenter {
    return this.recruitmentCentersList.find(c => c.city === this.offreLieuVille()) || this.recruitmentCentersList[0];
  }

  getOffreDateEnrolementFull(lang: 'fr' | 'en' = 'fr'): string {
    const raw = this.offreDateEnrolement().trim();
    const postulantTime = this.offreHeureArriveePostulant() || '8h00';
    const guestTime = this.offreHeureArriveeInvites() || (this.offreEtudesSubventionneesChecked() ? '9h45' : '10h00');
    
    if (lang === 'en') {
      if (!raw) {
        return `at ${postulantTime} (Guest arrival at ${guestTime})`;
      }
      return `${raw} at ${postulantTime} (Guest arrival at ${guestTime})`;
    }

    if (!raw) {
      return `à ${postulantTime} (Arrivée des invités à ${guestTime})`;
    }
    return `${raw} à ${postulantTime} (Arrivée des invités à ${guestTime})`;
  }

  getOffreDateArriveeUniteFull(): string {
    const raw = this.offreDateArriveeUnite().trim();
    if (!raw) {
      return 'au plus tard 16h00';
    }
    if (raw.includes('au plus tard')) {
      return raw;
    }
    return `${raw} au plus tard 16h00`;
  }

  getOffreDatesCoursFull(): string {
    const debut = this.offreDateCoursDebut().trim();
    const fin = this.offreDateCoursFin().trim();
    if (debut && fin) {
      return `Du ${debut} au ${fin}`;
    }
    if (debut) {
      return `À partir du ${debut}`;
    }
    if (fin) {
      return `Jusqu'au ${fin}`;
    }
    return '';
  }

  getJourSemaineFr(dateStr: string): string {
    if (!dateStr || !dateStr.trim()) return '';
    const str = dateStr.trim();
    
    // 1. Try ISO or YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
      if (!isNaN(d.getTime())) {
        const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        return days[d.getDay()];
      }
    }

    // 2. Try DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const d = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
      if (!isNaN(d.getTime())) {
        const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        return days[d.getDay()];
      }
    }

    // 3. Try "12 septembre 2026" or "12 sept 2026" or "12 sept. 2026"
    const monthsMap: Record<string, number> = {
      'janvier': 0, 'janv': 0, 'jan': 0,
      'février': 1, 'fevrier': 1, 'févr': 1, 'fevr': 1, 'fév': 1, 'fev': 1,
      'mars': 2, 'mar': 2,
      'avril': 3, 'avr': 3,
      'mai': 4,
      'juin': 5,
      'juillet': 6, 'juil': 6,
      'août': 7, 'aout': 7,
      'septembre': 8, 'sept': 8, 'sep': 8,
      'octobre': 9, 'oct': 9,
      'novembre': 10, 'nov': 10,
      'décembre': 11, 'decembre': 11, 'déc': 11, 'dec': 11
    };

    const textMatch = str.match(/(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})/);
    if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthKey = textMatch[2].toLowerCase().replace('.', '');
      const year = parseInt(textMatch[3], 10);
      const monthIdx = monthsMap[monthKey];
      if (monthIdx !== undefined) {
        const d = new Date(year, monthIdx, day);
        if (!isNaN(d.getTime())) {
          const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
          return days[d.getDay()];
        }
      }
    }

    return '';
  }

  getJourSemaineEn(dateStr: string): string {
    if (!dateStr || !dateStr.trim()) return '';
    const str = dateStr.trim();
    
    // 1. Try ISO or YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
      if (!isNaN(d.getTime())) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[d.getDay()];
      }
    }

    // 2. Try DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const d = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
      if (!isNaN(d.getTime())) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[d.getDay()];
      }
    }

    // 3. Try "12 septembre 2026" or French/English month names
    const monthsMap: Record<string, number> = {
      'janvier': 0, 'janv': 0, 'jan': 0, 'january': 0,
      'février': 1, 'fevrier': 1, 'févr': 1, 'fevr': 1, 'fév': 1, 'fev': 1, 'february': 1, 'feb': 1,
      'mars': 2, 'mar': 2, 'march': 2,
      'avril': 3, 'avr': 3, 'april': 3, 'apr': 3,
      'mai': 4, 'may': 4,
      'juin': 5, 'june': 5, 'jun': 5,
      'juillet': 6, 'juil': 6, 'july': 6, 'jul': 6,
      'août': 7, 'aout': 7, 'august': 7, 'aug': 7,
      'septembre': 8, 'sept': 8, 'sep': 8, 'september': 8,
      'octobre': 9, 'oct': 9, 'october': 9,
      'novembre': 10, 'nov': 10, 'november': 10,
      'décembre': 11, 'decembre': 11, 'déc': 11, 'dec': 11, 'december': 11
    };

    const textMatch = str.match(/(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})/);
    if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthKey = textMatch[2].toLowerCase().replace('.', '');
      const year = parseInt(textMatch[3], 10);
      const monthIdx = monthsMap[monthKey];
      if (monthIdx !== undefined) {
        const d = new Date(year, monthIdx, day);
        if (!isNaN(d.getTime())) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return days[d.getDay()];
        }
      }
    }

    return '';
  }

  // Computed job type and available enrollment programs
  offreJobType = computed<JobCategory | null>(() => {
    return this.jobService.detectJobType(this.offreMetier());
  });

  availableOffreProgrammes = computed<string[]>(() => {
    return this.jobService.getProgramsForJobType(this.offreJobType());
  });

  offreDetectedElement = computed<MilitaryElement | null>(() => {
    return this.jobService.detectJobElement(this.offreMetier());
  });

  getFilteredJobsForOffre(): JobEntry[] {
    const query = this.offreMetierSearchQuery();
    if (!query || query.trim() === "") {
      return this.jobService.getAllJobs();
    }
    return this.jobService.searchJobs(query);
  }

  selectOffreMetier(job: JobEntry) {
    const text = `${job.id} - ${job.title}`;
    this.offreMetier.set(text);
    this.offreMetierSearchQuery.set(text);
    this.offreMetierDropdownOpen.set(false);

    // Automatic element selection
    const element = job.element || this.jobService.getJobElement(job.id);
    if (element && element !== 'CMP') {
      this.offreElement.set(element);
    } else if (element === 'CMP') {
      // For CMP, applicant chooses element: user will select manually
      this.offreElement.set('');
    }

    // Validate whether currently selected programme is still valid for this job category
    const validProgs = this.jobService.getProgramsForJobType(job.category || (this.jobService.isOfficerJob(job.id) ? 'officier' : 'mr'));
    if (this.offreProgrammeEnrolement() && !validProgs.includes(this.offreProgrammeEnrolement())) {
      this.offreProgrammeEnrolement.set('');
    }
    
    // Auto-fill PFOR contract duration if Subsidized Studies is checked
    if (this.offreEtudesSubventionneesChecked() && job.contracts) {
      const pfor = job.contracts.find(c => c.program.toUpperCase() === 'PFOR');
      if (pfor) {
        this.offreDureeContrat.set(pfor.duration);
      }
    }
    this.autoActivateOffreEmail();
  }

  onOffreMetierQueryChange(val: string) {
    this.offreMetierSearchQuery.set(val);
    this.offreMetier.set(val);
    this.offreMetierDropdownOpen.set(true);

    const detectedElem = this.jobService.detectJobElement(val);
    if (detectedElem && detectedElem !== 'CMP') {
      this.offreElement.set(detectedElem);
    } else if (detectedElem === 'CMP') {
      this.offreElement.set('');
    }

    const detectedType = this.jobService.detectJobType(val);
    const validProgs = this.jobService.getProgramsForJobType(detectedType);
    if (this.offreProgrammeEnrolement() && !validProgs.includes(this.offreProgrammeEnrolement())) {
      this.offreProgrammeEnrolement.set('');
    }
    if (val && val.trim().length > 0) {
      this.autoActivateOffreEmail();
    }
  }

  clearOffreMetier(event?: Event) {
    if (event) event.stopPropagation();
    this.offreMetier.set('');
    this.offreMetierSearchQuery.set('');
    this.offreElement.set('');
  }

  closeOffreMetierDropdownDelayed() {
    setTimeout(() => {
      this.offreMetierDropdownOpen.set(false);
    }, 200);
  }

  clearOtherGdEmails(except: 'premierContact' | 'medical1' | 'medical2' | 'medical1et2' | 'avisFermeture' | 'annexeQ' | 'offreNormale' | 'offreEtudes' | 'rappelCeremonie') {
    if (except !== 'premierContact') this.premierContactCourriel.set(false);
    if (except !== 'medical1') this.evaluationMedicalePartie1.set(false);
    if (except !== 'medical2') this.evaluationMedicalePartie2.set(false);
    if (except !== 'medical1et2') this.evaluationMedicalePartie1Et2.set(false);
    if (except !== 'avisFermeture') this.avisFermetureCourriel.set(false);
    if (except !== 'annexeQ') this.annexeQCourriel.set(false);
    if (except !== 'offreNormale') this.offreNormaleChecked.set(false);
    if (except !== 'offreEtudes') this.offreEtudesSubventionneesChecked.set(false);
    if (except !== 'rappelCeremonie') {
      this.rappelCeremonieChecked.set(false);
      this.rappelCeremonieRalliementChecked.set(false);
    }
  }

  togglePremierContactCourriel() {
    const nextVal = !this.premierContactCourriel();
    if (nextVal) {
      this.clearOtherGdEmails('premierContact');
    }
    this.premierContactCourriel.set(nextVal);
  }

  togglePremierContactTask(type: 'medical' | 'entrevue' | 'gambit' | 'psps' | 'selfie' | 'iptad' | 'seaf') {
    let nextVal = false;
    if (type === 'medical') {
      nextVal = !this.premierContactMedical();
      this.premierContactMedical.set(nextVal);
    } else if (type === 'entrevue') {
      nextVal = !this.premierContactEntrevue();
      this.premierContactEntrevue.set(nextVal);
    } else if (type === 'gambit') {
      nextVal = !this.premierContactGambit();
      this.premierContactGambit.set(nextVal);
    } else if (type === 'psps') {
      nextVal = !this.premierContactPsps();
      this.premierContactPsps.set(nextVal);
    } else if (type === 'selfie') {
      nextVal = !this.premierContactSelfie();
      this.premierContactSelfie.set(nextVal);
    } else if (type === 'iptad') {
      nextVal = !this.premierContactIptad();
      this.premierContactIptad.set(nextVal);
    } else if (type === 'seaf') {
      nextVal = !this.premierContactSeaf();
      this.premierContactSeaf.set(nextVal);
    }

    if (nextVal || this.premierContactMedical() || this.premierContactEntrevue() || this.premierContactGambit() || this.premierContactPsps() || this.premierContactSelfie() || this.premierContactIptad() || this.premierContactSeaf()) {
      this.clearOtherGdEmails('premierContact');
      this.premierContactCourriel.set(true);
    }
  }

  toggleEvaluationMedicalePartie1() {
    const nextVal = !this.evaluationMedicalePartie1();
    if (nextVal) {
      this.clearOtherGdEmails('medical1');
    }
    this.evaluationMedicalePartie1.set(nextVal);
  }

  toggleEvaluationMedicalePartie2() {
    const nextVal = !this.evaluationMedicalePartie2();
    if (nextVal) {
      this.clearOtherGdEmails('medical2');
    }
    this.evaluationMedicalePartie2.set(nextVal);
  }

  toggleEvaluationMedicalePartie1Et2() {
    const nextVal = !this.evaluationMedicalePartie1Et2();
    if (nextVal) {
      this.clearOtherGdEmails('medical1et2');
    }
    this.evaluationMedicalePartie1Et2.set(nextVal);
  }

  toggleAvisFermetureCourriel() {
    const nextVal = !this.avisFermetureCourriel();
    if (nextVal) {
      this.clearOtherGdEmails('avisFermeture');
    }
    this.avisFermetureCourriel.set(nextVal);
  }

  onAvisFermetureDelaiChange(val: string) {
    this.avisFermetureDelaiJours.set(val);
    this.clearOtherGdEmails('avisFermeture');
    this.avisFermetureCourriel.set(true);
  }

  onAvisFermetureDateChange(val: string) {
    this.avisFermetureDate.set(val);
    if (val) {
      this.clearOtherGdEmails('avisFermeture');
      this.avisFermetureCourriel.set(true);
    }
  }

  toggleAvisFermetureTask(type: 'entrevue' | 'medicale' | 'gambit' | 'psps') {
    let nextVal = false;
    if (type === 'entrevue') {
      nextVal = !this.avisFermetureEntrevue();
      this.avisFermetureEntrevue.set(nextVal);
    } else if (type === 'medicale') {
      nextVal = !this.avisFermetureMedicale();
      this.avisFermetureMedicale.set(nextVal);
    } else if (type === 'gambit') {
      nextVal = !this.avisFermetureGambit();
      this.avisFermetureGambit.set(nextVal);
    } else if (type === 'psps') {
      nextVal = !this.avisFermeturePsps();
      this.avisFermeturePsps.set(nextVal);
    }

    if (nextVal || this.avisFermetureEntrevue() || this.avisFermetureMedicale() || this.avisFermetureGambit() || this.avisFermeturePsps()) {
      this.clearOtherGdEmails('avisFermeture');
      this.avisFermetureCourriel.set(true);
    }
  }

  toggleAnnexeQCourriel() {
    const nextVal = !this.annexeQCourriel();
    if (nextVal) {
      this.clearOtherGdEmails('annexeQ');
    }
    this.annexeQCourriel.set(nextVal);
  }

  onAnnexeQAlphaChange(val: string) {
    this.annexeQAlphaPostulant.set(val);
    if (val && val.trim().length > 0) {
      this.clearOtherGdEmails('annexeQ');
      this.annexeQCourriel.set(true);
    }
  }

  onPforMatriculeChange(val: string) {
    this.pforMatricule.set(val);
  }

  getFormattedPforMatricule(): string {
    let raw = this.pforMatricule()?.trim() || '';
    if (raw) {
      if (raw.startsWith('(') && raw.endsWith(')')) {
        raw = raw.substring(1, raw.length - 1).trim();
      }
      return raw || '(xxxxxxxxx)';
    }
    return '(xxxxxxxxx)';
  }

  autoActivateOffreEmail() {
    const isSub = this.selectedTask()?.nameFr.toLowerCase().includes('subventionn') || false;
    if (isSub) {
      if (!this.offreEtudesSubventionneesChecked()) {
        this.clearOtherGdEmails('offreEtudes');
        this.offreEtudesSubventionneesChecked.set(true);
        if (this.offreDateArriveeUnite() === '2026 au plus tard 16h00') {
          this.offreDateArriveeUnite.set('2025 au plus tard 16h00');
        }
      }
    } else {
      if (!this.offreNormaleChecked()) {
        this.clearOtherGdEmails('offreNormale');
        this.offreNormaleChecked.set(true);
        if (this.offreDateArriveeUnite() === '2025 au plus tard 16h00') {
          this.offreDateArriveeUnite.set('2026 au plus tard 16h00');
        }
      }
    }
  }

  setOffreProgrammeEnrolement(val: string) {
    this.offreProgrammeEnrolement.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreElement(val: string) {
    this.offreElement.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreDureeContrat(val: string) {
    this.offreDureeContrat.set(val);
    if (val && val.trim().length > 0) this.autoActivateOffreEmail();
  }

  setOffreEtudesSubventionnees(val: string) {
    this.offreEtudesSubventionnees.set(val);
    if (val && val.trim().length > 0) this.autoActivateOffreEmail();
  }

  setOffreDureeEtudesSubventionnees(val: string) {
    this.offreDureeEtudesSubventionnees.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreDateEnrolement(val: string) {
    this.offreDateEnrolement.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreDateArriveeUnite(val: string) {
    this.offreDateArriveeUnite.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreUniteAffectation(val: string) {
    this.offreUniteAffectation.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreUniteAffectationObj(unit: UnitSession) {
    this.offreUniteAffectation.set(unit.id);
    this.autoActivateOffreEmail();
  }

  setCourseSession(session: CourseSession) {
    this.offreSerieCours.set(session.serie);
    this.offreDateCoursDebut.set(session.dateDebut);
    this.offreDateCoursFin.set(session.dateFin);
    this.autoActivateOffreEmail();
  }

  clearCourseSession() {
    this.offreSerieCours.set('');
    this.offreDateCoursDebut.set('');
    this.offreDateCoursFin.set('');
  }

  setOffreDateCoursDebut(val: string) {
    this.offreDateCoursDebut.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreDateCoursFin(val: string) {
    this.offreDateCoursFin.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreDateElementsManquants(val: string) {
    this.offreDateElementsManquants.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  setOffreElementsManquants(val: string) {
    this.offreElementsManquants.set(val);
    if (val && val.trim().length > 0) this.autoActivateOffreEmail();
  }

  setNoteStatutCivil(val: string) {
    this.noteStatutCivil.set(val);
    this.autoActivateOffreEmail();
  }

  setNoteConjoint(val: string) {
    this.noteConjoint.set(val);
    this.autoActivateOffreEmail();
  }

  setNotePlaqueImm(val: string) {
    this.notePlaqueImm.set(val);
    if (val && val.trim().length > 0) this.autoActivateOffreEmail();
  }

  setNoteBrisBail(val: string) {
    this.noteBrisBail.set(val);
    this.autoActivateOffreEmail();
  }

  setNoteEntreposage(val: string) {
    this.noteEntreposage.set(val);
    this.autoActivateOffreEmail();
  }

  setNoteSermentDeclaration(val: string) {
    this.noteSermentDeclaration.set(val);
    this.autoActivateOffreEmail();
  }

  setNoteInviteMil(val: string) {
    this.noteInviteMil.set(val);
    this.autoActivateOffreEmail();
  }

  setNoteInviteMilTexte(val: string) {
    this.noteInviteMilTexte.set(val);
    if (val && val.trim().length > 0) this.autoActivateOffreEmail();
  }

  setNoteSvcMilAnt(val: string) {
    this.noteSvcMilAnt.set(val);
    this.autoActivateOffreEmail();
  }

  setNoteBeneficiaire(val: string) {
    this.noteBeneficiaire.set(val);
    if (val && val.trim().length > 0) this.autoActivateOffreEmail();
  }

  setNoteDateCourrielConfirmation(val: string) {
    this.noteDateCourrielConfirmation.set(val);
    if (val) this.autoActivateOffreEmail();
  }

  onRappelCeremonieDateSelected(date: string) {
    this.rappelCeremonieDate.set(date);
    if (date) {
      this.clearOtherGdEmails('rappelCeremonie');
      this.rappelCeremonieChecked.set(true);
    }
  }

  onRappelCeremonieHeurePostulantChange(val: string) {
    this.rappelCeremonieHeurePostulant.set(val);
    try {
      localStorage.setItem('rappel_heure_postulant', val);
    } catch {}
    this.clearOtherGdEmails('rappelCeremonie');
    this.rappelCeremonieChecked.set(true);
  }

  onRappelCeremonieHeureInvitesChange(val: string) {
    this.rappelCeremonieHeureInvites.set(val);
    try {
      localStorage.setItem('rappel_heure_invites', val);
    } catch {}
    this.clearOtherGdEmails('rappelCeremonie');
    this.rappelCeremonieChecked.set(true);
  }

  onRappelCeremonieLieuChange(val: string) {
    this.rappelCeremonieLieu.set(val);
    this.clearOtherGdEmails('rappelCeremonie');
    this.rappelCeremonieChecked.set(true);
  }

  toggleOffreNormale() {
    const nextVal = !this.offreNormaleChecked();
    if (nextVal) {
      this.clearOtherGdEmails('offreNormale');
      if (this.offreDateArriveeUnite() === '2025 au plus tard 16h00') {
        this.offreDateArriveeUnite.set('2026 au plus tard 16h00');
      }
    }
    this.offreNormaleChecked.set(nextVal);
  }

  toggleOffreEtudesSubventionnees() {
    const nextVal = !this.offreEtudesSubventionneesChecked();
    if (nextVal) {
      this.clearOtherGdEmails('offreEtudes');
      if (this.offreDateArriveeUnite() === '2026 au plus tard 16h00') {
        this.offreDateArriveeUnite.set('2025 au plus tard 16h00');
      }
      
      const metierText = this.offreMetier();
      const match = metierText.match(/^(\d{5})/);
      if (match) {
        const jobId = match[1];
        const job = this.jobService.getJobById(jobId);
        if (job && job.contracts) {
          const pfor = job.contracts.find(c => c.program.toUpperCase() === 'PFOR');
          if (pfor) {
            this.offreDureeContrat.set(pfor.duration);
          }
        }
      }
    }
    this.offreEtudesSubventionneesChecked.set(nextVal);
  }

  toggleRappelCeremonie() {
    const nextVal = !this.rappelCeremonieChecked();
    if (nextVal) {
      this.clearOtherGdEmails('rappelCeremonie');
    } else {
      this.rappelCeremonieRalliementChecked.set(false);
    }
    this.rappelCeremonieChecked.set(nextVal);
  }

  toggleRappelCeremonieRalliement() {
    const nextVal = !this.rappelCeremonieRalliementChecked();
    if (nextVal) {
      this.clearOtherGdEmails('rappelCeremonie');
      this.rappelCeremonieChecked.set(true);
    }
    this.rappelCeremonieRalliementChecked.set(nextVal);
  }

  // Computed Content Generators

  // Helper to structure selected rejections by Task -> Items
  private getStructuredRejections() {
    
    const selectedKeys = this.selectedRejectionKeys();
    const taskNotCompletedKeys = this.taskNotCompletedKeys();
    // Use Map to preserve insertion order of tasks
    const tasksMap = new Map<
      Task,
      { doc: DocumentItem; reason: RejectionReason }[]
    >();

    // Iterate over all tasks instead of only visible tasks to include minor check rejections
    for (const task of this.allTasks()) {
      const isVisible = this.visibleTasks().some(vt => vt.nameFr === task.nameFr);
      
      const hasRejections = task.documents.some(doc => 
        doc.reasons.some(reason => this.isReasonSelected(doc, reason))
      );
      const isNotCompleted = taskNotCompletedKeys.has(task.nameFr);

      if (!isVisible && !hasRejections && !isNotCompleted) {
        continue;
      }

      if (isNotCompleted) {
        tasksMap.set(task, []);
      }
      for (const doc of task.documents) {
        for (const reason of doc.reasons) {
          if (this.isReasonSelected(doc, reason)) {
            if (!tasksMap.has(task)) {
              tasksMap.set(task, []);
            }
            tasksMap.get(task)!.push({ doc, reason });
          }
        }
      }
    }
    return tasksMap;
  }

  getRejectionReasonsForCompliantNote(): string {
    const selectedKeys = this.selectedRejectionKeys();
    const taskNotCompletedKeys = this.taskNotCompletedKeys();
    const notes: string[] = [];
    let hasNormalReassignment = false;

    for (const task of this.allTasks()) {
      const isVisible = this.visibleTasks().some(vt => vt.nameFr === task.nameFr);
      const isNotCompleted = taskNotCompletedKeys.has(task.nameFr);
      const hasRejections = task.documents.some(doc => 
        doc.reasons.some(reason => this.isReasonSelected(doc, reason))
      );

      if (!isVisible && !hasRejections && !isNotCompleted) {
        continue;
      }

      if (isNotCompleted) {
        notes.push(`Tâche "${task.nameFr}" non complétée`);
        hasNormalReassignment = true;
      }
      for (const doc of task.documents) {
        for (const reason of doc.reasons) {
          if (this.isReasonSelected(doc, reason)) {
            notes.push(reason.logNoteFr);
            if (!reason.isConfirmation) {
              hasNormalReassignment = true;
            }
          }
        }
      }
    }

    if (notes.length === 0) return "";

    const combinedReasons = notes.join(" / ");
    const closureSuffix =
      "Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.";

    let noteTxt = "";
    if (hasNormalReassignment) {
      noteTxt = `${combinedReasons}, la/les tâches réattribuées et courriel explicatif envoyé.`;
    } else {
      noteTxt = `${combinedReasons}.`;
    }

    noteTxt = noteTxt.trim();
    if (noteTxt.endsWith(".")) {
      noteTxt = noteTxt.slice(0, -1);
    }
    noteTxt += ". " + closureSuffix;

    return noteTxt;
  }

  getPforCompliantNoteClean(): string {
    const jobSlots = [
      { index: 1, job: this.getDossierJob(1), failedCe: this.sharedState.dossierJobFailedCe1() },
      { index: 2, job: this.getDossierJob(2), failedCe: this.sharedState.dossierJobFailedCe2() },
      { index: 3, job: this.getDossierJob(3), failedCe: this.sharedState.dossierJobFailedCe3() },
    ].filter((s): s is { index: number; job: JobEntry; failedCe: boolean } => !!s.job);

    let jobsText = "le métier XXX";
    if (jobSlots.length > 0) {
      const admissibleJobIds: string[] = [];
      for (const slot of jobSlots) {
        if (!slot.failedCe && !this.isJobClosed(slot.job.id)) {
          admissibleJobIds.push(slot.job.id);
        }
      }
      if (admissibleJobIds.length > 0) {
        const label = admissibleJobIds.length > 1 ? "les métiers" : "le métier";
        jobsText = `${label} ${admissibleJobIds.join(", ")}`;
      } else {
        const allJobIds = jobSlots.map(s => s.job.id);
        const label = allJobIds.length > 1 ? "les métiers" : "le métier";
        jobsText = `${label} ${allJobIds.join(", ")}`;
      }
    }

    let note = `Étape 1 (Terminée) - Courriel FAC101 PFOR et courriel contenant le lien PA envoyés pour ${jobsText}, Tag CCM pour suite du traitement : -Cpl Plourde (DML) - Sgt Fournier-Tremblay (DSE) - Sgt Larochelle (DQC), Sgt-Recruteur : Cpl Plourde (DML) – Sgt Plante (DRI) – Sgt David (DCI) – Sgt Fournier-Tremblay (DSE) – Sgt Richer (DQC)`;

    const extraRejections = this.getRejectionReasonsForCompliantNote();
    if (extraRejections) {
      note += `\n${extraRejections}`;
    }

    return note;
  }

  getBigAceCompliantNoteClean(): string {
    const jobSlots = [
      { index: 1, job: this.getDossierJob(1), failedCe: this.sharedState.dossierJobFailedCe1() },
      { index: 2, job: this.getDossierJob(2), failedCe: this.sharedState.dossierJobFailedCe2() },
      { index: 3, job: this.getDossierJob(3), failedCe: this.sharedState.dossierJobFailedCe3() },
    ].filter((s): s is { index: number; job: JobEntry; failedCe: boolean } => !!s.job);

    let firstLine = "";

    if (jobSlots.length === 0) {
      firstLine = "Étape 1 (En cours) - Big ACE admissible pour les métiers xxx, xxx, xxx.";
    } else {
      const admissibleJobIds: string[] = [];
      const failedCeJobIds: string[] = [];
      const closedJobIds: string[] = [];

      for (const slot of jobSlots) {
        if (slot.failedCe) {
          failedCeJobIds.push(slot.job.id);
        } else if (this.isJobClosed(slot.job.id)) {
          closedJobIds.push(slot.job.id);
        } else {
          admissibleJobIds.push(slot.job.id);
        }
      }

      const parts: string[] = [];

      if (admissibleJobIds.length > 0) {
        const label = admissibleJobIds.length > 1 ? "les métiers" : "le métier";
        parts.push(`Big ACE admissible pour ${label} ${admissibleJobIds.join(", ")}.`);
      }

      const hasFailedCe = failedCeJobIds.length > 0;
      const hasClosed = closedJobIds.length > 0;

      if (hasFailedCe && hasClosed) {
        const cePart = failedCeJobIds.length > 1
          ? `les métiers ${failedCeJobIds.join(", ")} (ne rencontrent pas les CE)`
          : `le métier ${failedCeJobIds[0]} (ne rencontre pas les CE)`;
        const closedPart = closedJobIds.length > 1
          ? `les métiers ${closedJobIds.join(", ")} (fermé)`
          : `le métier ${closedJobIds[0]} (fermé)`;
        parts.push(`Inadmissible pour ${cePart} et ${closedPart}, retirés du dossier.`);
      } else if (hasFailedCe) {
        if (failedCeJobIds.length === 1) {
          parts.push(`Inadmissible pour le métier ${failedCeJobIds[0]} car il ne rencontre pas les CE et a été retiré du dossier.`);
        } else {
          parts.push(`Inadmissible pour les métiers ${failedCeJobIds.join(", ")} car ils ne rencontrent pas les CE et ont été retirés du dossier.`);
        }
      } else if (hasClosed) {
        if (closedJobIds.length === 1) {
          parts.push(`Inadmissible pour le métier ${closedJobIds[0]} car il est fermé et a été retiré du dossier.`);
        } else {
          parts.push(`Inadmissible pour les métiers ${closedJobIds.join(", ")} car ils sont fermés et ont été retirés du dossier.`);
        }
      }

      firstLine = `Étape 1 (En cours) - ${parts.join(" ")}`;
    }

    let note = `${firstLine} Webinaire CAF 101 envoyé, tâche planifiez votre séance d'information des FAC 101 attribuée.`;

    const extraRejections = this.getRejectionReasonsForCompliantNote();
    if (extraRejections) {
      note += `\n${extraRejections}`;
    }

    return note;
  }

  getBigAceCompliantNote(): string {
    let note = this.sharedState.isPostulantPfor() ? this.getPforCompliantNoteClean() : this.getBigAceCompliantNoteClean();
    if (this.triageMedicalRequis()) {
      note += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
    }
    return note;
  }

  getRejectionAndReminderNoteText(): string {
    if (this.selectedEmailBankTemplate() === "verification_edo_vs_pfor") {
      return "Courriel de vérification de programme EDO VS PFOR envoyé au postulant.";
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_age_57") {
      return "Étape 1 (En cours) - Âge maximal d'admissibilité dépassé (57 ans et plus) : Inadmissible pour un enrôlement dans les FAC, courriel envoyé, fermeture du dossier.";
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_pr_3ans") {
      return "Étape 1 (En cours) - Résident permanent de moins de 3 ans (Inadmissible) : Courriel d'inadmissibilité envoyé (résultat du calculateur IRCC +3 ans ou citoyenneté requis avant de repostuler), fermeture du dossier.";
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_non_citoyen_ni_pr") {
      return "Étape 1 (En cours) - Ni citoyen canadien ni résident permanent (Inadmissible) : Inadmissible pour un enrôlement dans les FAC (citoyenneté canadienne ou résidence permanente requise pour repostuler), courriel envoyé, fermeture du dossier.";
    }

    const closureSuffix =
      " Postulant averti de la fermeture de son dossier si aucune action n'est prise d'ici 30 jours.";

    if (
      this.forceGeneralReminder() &&
      this.selectedRejectionKeys().size === 0
    ) {
      return (
        "Courriel de rappel de tâches envoyé au postulant." + closureSuffix
      );
    }

    const selectedKeys = this.selectedRejectionKeys();
    const taskNotCompletedKeys = this.taskNotCompletedKeys();
    const notes: string[] = [];
    let hasNameMismatch = false;
    let hasNormalReassignment = false;

    for (const task of this.allTasks()) {
      const isVisible = this.visibleTasks().some(vt => vt.nameFr === task.nameFr);
      const isNotCompleted = taskNotCompletedKeys.has(task.nameFr);
      const hasRejections = task.documents.some(doc => 
        doc.reasons.some(reason => this.isReasonSelected(doc, reason))
      );

      if (!isVisible && !hasRejections && !isNotCompleted) {
        continue;
      }

      if (isNotCompleted) {
        notes.push(`Tâche "${task.nameFr}" non complétée`);
        hasNormalReassignment = true;
      }
      for (const doc of task.documents) {
        for (const reason of doc.reasons) {
          if (this.isReasonSelected(doc, reason)) {
            notes.push(reason.logNoteFr);
            if (reason.id === "emp_nom_parent") {
              hasNameMismatch = true;
            }
            if (!reason.isConfirmation) {
              hasNormalReassignment = true;
            }
          }
        }
      }
    }

    if (notes.length === 0) return "";

    const combinedReasons = notes.join(" / ");
    const prefix = "Étape 1 (en cours) - ";

    let noteTxt = "";

    if (this.isUnderAge()) {
      noteTxt = `${prefix}${combinedReasons}. En attente de la confirmation du consentement parental pour continuer le Big ACE.`;
    } else {
      if (hasNameMismatch) {
        noteTxt = `${prefix}${combinedReasons}.`;
      } else {
        if (hasNormalReassignment) {
          noteTxt = `${prefix}${combinedReasons}, la/les tâches réattribuées et courriel explicatif envoyé.`;
        } else {
          noteTxt = `${prefix}${combinedReasons}.`;
        }
      }
    }

    if (noteTxt) {
      noteTxt = noteTxt.trim();
      if (noteTxt.endsWith(".")) {
        noteTxt = noteTxt.slice(0, -1);
      }
      noteTxt += "." + closureSuffix;
    }

    return noteTxt;
  }

  generatedNote = computed(() => {
    const notes: string[] = [];

    // 0. Premier Contact Note
    if (this.premierContactSubPanelMode() === 'note' && this.selectedTask()?.nameFr === 'Premier contact') {
      const noteLines: string[] = [
        `IPTAD : ${this.premierContactNoteIptad()}`,
        `SEAF : ${this.premierContactNoteSeaf()}`,
        `Entrevue : ${this.premierContactNoteEntrevue()}`,
        `Médical : ${this.premierContactNoteMedical()}`,
        `PSPS : ${this.premierContactNotePsps()}`,
        `Gambit : ${this.premierContactNoteGambit()}`,
        `ANX Q : ${this.premierContactNoteAnxQ()}`
      ];
      notes.push(noteLines.join('\n'));
    } else if (this.isPremierContactActive()) {
      let msg = "Courriel de premier contact envoyé au postulant.";
      const tasks: string[] = [];
      if (this.premierContactMedical()) tasks.push("Médical");
      if (this.premierContactEntrevue()) tasks.push("Entrevue");
      if (this.premierContactGambit()) tasks.push("Gambit");
      if (this.premierContactPsps()) tasks.push("PSPS");
      if (this.premierContactSelfie()) tasks.push("Selfie");
      if (this.premierContactIptad()) tasks.push("IPTAD");
      if (this.premierContactSeaf()) tasks.push("SEAF");

      if (tasks.length > 0) {
        const tasksStr = tasks.length > 1 
          ? tasks.slice(0, -1).join(', ') + ' et ' + tasks[tasks.length - 1] 
          : tasks[0];
        
        const attrib = tasks.length > 1 
          ? 'attribués' 
          : (tasks[0] === 'Entrevue' ? 'attribuée' : 'attribué');
          
        msg += ` ${tasksStr} ${attrib}.`;
      }
      notes.push(msg);
    }

    // 0.5. Avis de fermeture Note
    if (this.isAvisFermetureActive()) {
      notes.push(`courriel d'avis de fermeture :\n\n${this.getAvisFermetureEmailPlain()}`);
    }

    // 0.6. Annexe Q Note
    if (this.isAnnexeQActive()) {
      notes.push(`Annexe Q prête à faire\nDocuments PSPS insérés dans CFRIM\nCourriel au CCM envoyé`);
    }

    // 1. Medical Evaluation Note
    if (this.isMedicalEvaluationActive()) {
      const medInfo = this.getMedicalPartsInfo();
      if (medInfo) {
        if (this.evaluationMedicaleType() === 'Dossier OTA') {
          notes.push(`Rendez-vous pour l'évaluation médicale - ${medInfo.labelFr} directement fixé au centre de recrutement de Montréal (Dossier OTA). Courriel d'information envoyé au postulant pour consultation des détails dans son portail.`);
        } else {
          notes.push(`Tâche « Évaluation médicale - ${medInfo.labelFr} » attribuée au postulant dans son portail. Courriel explicatif envoyé pour la sélection d'une plage horaire au centre de recrutement attitré.`);
        }
      }
    }

    // 2. Offre normale Note
    if (this.offreNormaleChecked()) {
      notes.push(this.getOfferFormattedNote());
    }

    // 3. Offre études subventionnées Note
    if (this.offreEtudesSubventionneesChecked()) {
      notes.push(this.getOfferFormattedNote());
    }

    // 3.5 Rappel cérémonie d'assermentation Note
    if (this.rappelCeremonieChecked()) {
      notes.push(`Transmission d'un courriel de rappel pour la cérémonie d'assermentation du ${this.rappelCeremonieDate() || '____'}.`);
    }

    // 3.6 Tentative communication pour offre Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'tentative_offre_gd') {
      let tentativeNote = "Tentative de communication effectuer pour l'offre, courriel envoyé au postulant lui demandant de rappeler son GD";
      if (this.triageMedicalRequis()) {
        tentativeNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return tentativeNote;
    }

    // 3.7 Vérification Dossier Cadet Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'verification_dossier_cadet') {
      let cadetNote = "Courriel de vérification de dossier cadet envoyé à MDN.CJRURSCEstJ1RH-CJRRCSUEasternJ1HR.DND@forces.gc.ca.";
      if (this.triageMedicalRequis()) {
        cadetNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return cadetNote;
    }

    // 3.8 Bris de bail et entreposage Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'bris_bail_entreposage') {
      let brisNote = "Transmission des informations et documents requis concernant le bris de bail et l'entreposage.";
      if (this.triageMedicalRequis()) {
        brisNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return brisNote;
    }

    // 3.9 Demande NAV/TAN & Claims X - CSPN partie 1 Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'demande_nav_tan') {
      let navTanNote = "Demande de numéro de NAV/TAN et création de compte claims X envoyée à CRFCQcReclamations@forces.gc.ca pour CSPN partie 1.";
      if (this.triageMedicalRequis()) {
        navTanNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return navTanNote;
    }

    // 3.10 Demande d'autorisation pour un CSPN Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'demande_autorisation_cspn') {
      let cspnNote = "Demande d’autorisation pour un CSPN envoyée.";
      if (this.triageMedicalRequis()) {
        cspnNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return cspnNote;
    }

    // 3.11 Documents requis - Conjoint(e) de fait Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'documents_conjoint_de_fait') {
      let cdfNote = "Courriel de demande de documents pour statut de conjoint(e) de fait envoyé au postulant.";
      if (this.triageMedicalRequis()) {
        cdfNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return cdfNote;
    }

    // 3.12 Demande SDPM pour conjoint militaire Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'demande_sdpm_conjoint_militaire') {
      let sdpmNote = "Demande de SDPM/MPRR pour conjoint militaire envoyée à CRFCQcAdmin@forces.gc.ca.";
      if (this.triageMedicalRequis()) {
        sdpmNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return sdpmNote;
    }

    // 3.13 Test ESOM / Confirmation Note (Volet GD)
    if (this.selectedEmailBankTemplate() === 'test_esom_confirmation') {
      const center = this.getTestEsomCenter();
      let esomNote = `Courriel de convocation au test ESOM envoyé au candidat (${center.city}).`;
      if (this.triageMedicalRequis()) {
        esomNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
      }
      return esomNote;
    }

    // 4. All tasks compliant Note
    if (this.allTasksCompliant()) {
      notes.push(this.sharedState.isPostulantPfor() ? this.getPforCompliantNoteClean() : this.getBigAceCompliantNoteClean());
    } else {
      // 5. Rejection / Incomplete tasks / Reminder Note
      const rejectionNoteText = this.getRejectionAndReminderNoteText();
      if (rejectionNoteText) {
        notes.push(rejectionNoteText);
      }
    }

    if (notes.length === 0) return "";

    let finalNote = notes.join("\n\n");

    if (this.triageMedicalRequis()) {
      finalNote += "\n\nMÉDICAL - TRIAGE PAR MED CHU REQUIS";
    }

    return finalNote;
  });

  displayedNote = computed(() => {
    if (this.sharedState.includeLinkedEmail() && this.sharedState.reoMergedNote()) {
      return this.sharedState.reoMergedNote();
    }
    return this.generatedNote();
  });

  // Check if current selection triggers a specific Email Scenario
  activeEmailScenario = computed<EmailScenario | null>(() => {
    if (this.selectedEmailBankTemplate() === "verification_edo_vs_pfor") {
      return this.emailScenariosService.getScenario("verification_edo_vs_pfor") || null;
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_age_57") {
      return this.emailScenariosService.getScenario("inadmissibilite_age_57") || null;
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_pr_3ans") {
      return this.emailScenariosService.getScenario("inadmissibilite_pr_3ans") || null;
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_non_citoyen_ni_pr") {
      return this.emailScenariosService.getScenario("inadmissibilite_non_citoyen_ni_pr") || null;
    }

    if (
      this.forceGeneralReminder() &&
      this.selectedRejectionKeys().size === 0
    ) {
      return this.emailScenariosService.getScenario("general_reminder") || null;
    }

    const keysArray = Array.from(this.selectedRejectionKeys()) as string[];

    // Trigger for "File Closed due to Basic Academic Criteria"
    const fileClosedAcademics = keysArray.some((k) =>
      k.includes("educ_non_admissible"),
    );
    if (fileClosedAcademics) {
      return (
        this.emailScenariosService.getScenario("educ_non_admissible") || null
      );
    }

    // Trigger for "Parental Consent Required"
    // Checks for 'naiss_parents' (Birth Cert) OR 'emp_nom_parent' (Now in Consent Task)
    const needsParentalConsent = keysArray.some(
      (k) => k.includes("naiss_parents") || k.includes("emp_nom_parent"),
    );

    if (needsParentalConsent) {
      return (
        this.emailScenariosService.getScenario("parental_consent_required") ||
        null
      );
    }

    return null;
  });

  cleanInstructionForText(instruction: string, indent: string = '        '): string {
    if (!instruction) return '';
    let clean = instruction.replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, url, text) => {
      const trimmedText = text.trim();
      if (trimmedText === url.trim() || trimmedText === url.replace(/^https?:\/\//, '')) {
        return url;
      }
      return `${trimmedText} (${url})`;
    });
    clean = clean.replace(/<[^>]+>/g, '');
    return clean.replace(/\n/g, `\n${indent}`);
  }

  private getCompliantNonMandatoryTasksPlain(lang: 'fr' | 'en' = 'fr'): string {
    const structure = this.getStructuredRejections();
    if (structure.size === 0) return "";

    const relevantTasks: { task: Task; items: { doc: DocumentItem; reason: RejectionReason }[]; notCompleted: boolean }[] = [];

    for (const [task, items] of structure.entries()) {
      const isIdentity = task.nameFr.startsWith("Pièce d'identité avec photo");
      const isFormNote = task.nameFr.includes("Formulaire de demande d'emploi notée") || task.nameFr.includes("Formulaire de demande d’emploi noté");
      const isMdn2977 = task.nameFr.includes("MDN 2977");

      if (isIdentity) {
        const selfieItems = items.filter(i => i.doc.nameFr.toLowerCase().includes("selfie"));
        if (selfieItems.length > 0) {
          relevantTasks.push({ task, items: selfieItems, notCompleted: false });
        }
      } else if (isFormNote || isMdn2977) {
        const notCompleted = this.taskNotCompletedKeys().has(task.nameFr);
        if (items.length > 0 || notCompleted) {
          relevantTasks.push({ task, items, notCompleted });
        }
      }
    }

    if (relevantTasks.length === 0) return "";

    let text = "";
    if (lang === 'fr') {
      text += `Veuillez également compléter ou corriger la/les tâche(s) suivante(s) sur votre portail :`;
      for (const { task, items, notCompleted } of relevantTasks) {
        const taskName = task.nameFr;
        text += `\n\n• ${taskName}`;
        if (notCompleted) {
          text += `\n    ◦ Vous n'avez pas complété cette tâche sur votre portail.`;
          text += `\n      → Veuillez vous connecter à votre portail et la compléter.`;
        }
        const groupedItems = new Map<DocumentItem, { doc: DocumentItem; reason: RejectionReason }[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc)!.push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i) => i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} et ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1];
          }

          text += `\n    ◦ ${doc.nameFr} : ${labelsStr}`;

          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              text += `\n      → ${this.cleanInstructionForText(item.reason.instructionFr, '        ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              const cleanLink = item.reason.linkFr.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$2 ($1)');
              text += `\n      🔗 ${cleanLink}`;
            }
          }
        }
      }
    } else {
      text += `Please also complete or correct the following task(s) on your portal:`;
      for (const { task, items, notCompleted } of relevantTasks) {
        const taskName = task.nameEn || task.nameFr;
        text += `\n\n• ${taskName}`;
        if (notCompleted) {
          text += `\n    ◦ You have not completed this task on your portal.`;
          text += `\n      → Please log in to your portal and complete it.`;
        }
        const groupedItems = new Map<DocumentItem, { doc: DocumentItem; reason: RejectionReason }[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc)!.push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i) => i.reason.labelEn || i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} and ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
          }

          text += `\n    ◦ ${doc.nameEn || doc.nameFr} : ${labelsStr}`;

          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            const instr = item.reason.instructionEn || item.reason.instructionFr;
            if (!uniqueInstructions.has(instr)) {
              uniqueInstructions.add(instr);
              text += `\n      → ${this.cleanInstructionForText(instr, '        ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            const link = item.reason.linkEn || item.reason.linkFr;
            if (link && !uniqueLinks.has(link)) {
              uniqueLinks.add(link);
              const cleanLink = link.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$2 ($1)');
              text += `\n      🔗 ${cleanLink}`;
            }
          }
        }
      }
    }

    return text;
  }

  private getCompliantNonMandatoryTasksHtml(lang: 'fr' | 'en' = 'fr'): string {
    const structure = this.getStructuredRejections();
    if (structure.size === 0) return "";

    const relevantTasks: { task: Task; items: { doc: DocumentItem; reason: RejectionReason }[]; notCompleted: boolean }[] = [];

    for (const [task, items] of structure.entries()) {
      const isIdentity = task.nameFr.startsWith("Pièce d'identité avec photo");
      const isFormNote = task.nameFr.includes("Formulaire de demande d'emploi notée") || task.nameFr.includes("Formulaire de demande d’emploi noté");
      const isMdn2977 = task.nameFr.includes("MDN 2977");

      if (isIdentity) {
        const selfieItems = items.filter(i => i.doc.nameFr.toLowerCase().includes("selfie"));
        if (selfieItems.length > 0) {
          relevantTasks.push({ task, items: selfieItems, notCompleted: false });
        }
      } else if (isFormNote || isMdn2977) {
        const notCompleted = this.taskNotCompletedKeys().has(task.nameFr);
        if (items.length > 0 || notCompleted) {
          relevantTasks.push({ task, items, notCompleted });
        }
      }
    }

    if (relevantTasks.length === 0) return "";

    let html = "";
    if (lang === 'fr') {
      html += `<p><strong>Veuillez également compléter ou corriger la/les tâche(s) suivante(s) sur votre portail :</strong></p>`;
      html += `<ul style="margin-top: 0; padding-left: 20px;">`;
      for (const { task, items, notCompleted } of relevantTasks) {
        const taskName = task.nameFr;
        html += `<li style="margin-bottom: 15px;"><span style="text-decoration: underline; font-weight: bold;">${taskName}</span>`;
        html += `<ul style="margin-top: 5px; list-style-type: circle; padding-left: 20px;">`;
        if (notCompleted) {
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="color: #FF0000; font-weight: bold;">Vous n'avez pas complété cette tâche sur votre portail.</span>`;
          html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; Veuillez vous connecter à votre portail et la compléter.</div>`;
          html += `</li>`;
        }
        const groupedItems = new Map<DocumentItem, { doc: DocumentItem; reason: RejectionReason }[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc)!.push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i) => i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} et ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1];
          }

          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameFr} : <span style="color: #FF0000;">${labelsStr}</span></strong></span>`;

          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionFr.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkFr}</div>`;
            }
          }
          html += `</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul>`;
    } else {
      html += `<p><strong>Please also complete or correct the following task(s) on your portal:</strong></p>`;
      html += `<ul style="margin-top: 0; padding-left: 20px;">`;
      for (const { task, items, notCompleted } of relevantTasks) {
        const taskName = task.nameEn || task.nameFr;
        html += `<li style="margin-bottom: 15px;"><span style="text-decoration: underline; font-weight: bold;">${taskName}</span>`;
        html += `<ul style="margin-top: 5px; list-style-type: circle; padding-left: 20px;">`;
        if (notCompleted) {
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="color: #FF0000; font-weight: bold;">You have not completed this task on your portal.</span>`;
          html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; Please log in to your portal and complete it.</div>`;
          html += `</li>`;
        }
        const groupedItems = new Map<DocumentItem, { doc: DocumentItem; reason: RejectionReason }[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc)!.push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i) => i.reason.labelEn || i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} and ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
          }

          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameEn || doc.nameFr} : <span style="color: #FF0000;">${labelsStr}</span></strong></span>`;

          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            const instr = item.reason.instructionEn || item.reason.instructionFr;
            if (!uniqueInstructions.has(instr)) {
              uniqueInstructions.add(instr);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${instr.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            const link = item.reason.linkEn || item.reason.linkFr;
            if (link && !uniqueLinks.has(link)) {
              uniqueLinks.add(link);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${link}</div>`;
            }
          }
          html += `</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul>`;
    }

    return html;
  }

  getCompliantEmailHtml(): string {
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;

    const nonMandatoryTasksHtmlFr = this.getCompliantNonMandatoryTasksHtml('fr');
    const nonMandatoryTasksHtmlEn = this.getCompliantNonMandatoryTasksHtml('en');
    const dossierJobs = this.getDossierJobObjects().filter((j) => j.id !== '00003');

    // --- FRENCH BLOCK ---
    html += `<p><strong>English message will follow.</strong></p>`;
    html += `<p>Bonjour,</p>`;
    html += `<p>Merci beaucoup d’avoir fourni vos documents et fait votre choix de profession.</p>`;
    html += `<p>Afin de pouvoir continuer votre processus, vous devrez <span style="background-color: #00FF00; font-weight: bold; padding: 0 4px;">OBLIGATOIREMENT</span> :</p>`;
    
    html += `<p><strong>1-Vous informer :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
    html += `  <li style="margin-bottom: 5px;">Regarder et comprendre le contenu de la présentation suivante : <a href="https://youtu.be/hYzMRYYBnag" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Présentation Forces 101</a></li>`;
    if (dossierJobs.length > 0) {
      const jobLinksFr = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, true, true)).join(', ');
      html += `  <li style="margin-bottom: 5px;">Regarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits : ${jobLinksFr}</li>`;
    } else {
      html += `  <li style="margin-bottom: 5px;">Regarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits <a href="https://forces.ca/fr/carrieres/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Carrières | Forces armées canadiennes</a></li>`;
    }
    html += `  <li style="margin-bottom: 5px;">Explorer et bien comprendre la section <a href="https://forces.ca/fr/instruction-de-base/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Instruction de base</a> du site Forces.ca</li>`;
    html += `</ul>`;

    html += `<p><strong>2-Après avoir regardé la vidéo, Prendre rendez-vous pour une consultation via le calendrier de votre portail.</strong> <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Lien vers le Portail d'enrôlement des Forces armées canadiennes</a>&nbsp;<span style="background-color: #00FF00; padding: 0 4px; font-weight: 500;">De nouvelles plages horaires ouvriront d’ici 14 jours sur votre portail.</span></p>`;

    html += `<p>Cette consultation auprès d’un recruteur sera nécessaire afin de valider votre connaissance des professions militaires qui vous intéressent, de la nature du cours de qualification militaire de base (QMB) et des exigences que comporte un engagement au sein de la force régulière des Forces armées canadiennes. Cette consultation n’est pas une entrevue officielle. Lorsque votre dossier sera distribué à un gestionnaire de dossier, celui-ci vous attribuera une tâche pour prendre un rendez-vous avec un conseiller en carrière militaire et c’est avec ce conseiller que vous ferez votre entrevue officielle pour un emploie dans les forces armées canadienne.</p>`;

    if (nonMandatoryTasksHtmlFr) {
      html += nonMandatoryTasksHtmlFr;
    }

    html += `<p>Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</p>`;
    html += `<p>Merci encore et au plaisir de votre faire votre connaissance.</p>`;

    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    html += `<br><hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"><br>`;

    // --- ENGLISH BLOCK ---
    html += `<p>Hello,</p>`;
    html += `<p>Thank you very much for providing your documents and selecting your preferred occupation.</p>`;
    html += `<p>In order to continue your application process, You will be <span style="background-color: #00FF00; font-weight: bold; padding: 0 4px;">REQUIRED</span> to:</p>`;

    html += `<p><strong>1- Inform yourself :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
    html += `  <li style="margin-bottom: 5px;">Watch and understand the content of the following presentation: <a href="https://youtu.be/oKuX_ROtASw" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Forces 101 Presentation</a></li>`;
    if (dossierJobs.length > 0) {
      const jobLinksEn = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, false, true)).join(', ');
      html += `  <li style="margin-bottom: 5px;">Watch the video and review the description of the trade(s) you are registered for : ${jobLinksEn}</li>`;
    } else {
      html += `  <li style="margin-bottom: 5px;">Watch the video and review the description of the trade(s) you are registered for. <a href="https://forces.ca/en/careers/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Careers | Canadian Armed Forces</a></li>`;
    }
    html += `  <li style="margin-bottom: 5px;">Explore and fully understand the <a href="https://forces.ca/en/basic-training/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Basic Training</a> section of the Forces.ca website.</li>`;
    html += `</ul>`;

    html += `<p><strong>2-After viewing the video, <span style="font-weight: bold;">Schedule an appointment</span> for a consultation through your portal calendar.</strong> <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Canadian Armed Forces enrolment Portal link</a>&nbsp;<span style="background-color: #00FF00; padding: 0 4px; font-weight: 500;">New time slots will open on your portal within 14 days.</span></p>`;

    html += `<p>This consultation with a recruiter will be required to validate your understanding of the military occupations that interest you, the nature of the Basic Military Qualification (BMQ), and the requirements associated with enrolling in the Regular Force of the Canadian Armed Forces. This consultation is not an official interview. Once your file has been assigned to a file administrator, you will be given a task to schedule an appointment with a Military Career Counsellor. It is with this counsellor that you will complete your official interview for employment with the Canadian Armed Forces.</p>`;

    if (nonMandatoryTasksHtmlEn) {
      html += nonMandatoryTasksHtmlEn;
    }

    html += `<p>If no action is taken, your file will be automatically deactivated after 30 days.</p>`;
    html += `<p>Thank you again, and we look forward to meeting you.</p>`;

    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    html += `</div>`;
    return html;
  }

  getCompliantEmailPlain(): string {
    let plain = "";

    const nonMandatoryTasksFr = this.getCompliantNonMandatoryTasksPlain('fr');
    const nonMandatoryTasksEn = this.getCompliantNonMandatoryTasksPlain('en');
    const dossierJobs = this.getDossierJobObjects().filter((j) => j.id !== '00003');

    // --- FRENCH ---
    plain += `English message will follow.\n\n`;
    plain += `Bonjour,\n\n`;
    plain += `Merci beaucoup d’avoir fourni vos documents et fait votre choix de profession.\n\n`;
    plain += `Afin de pouvoir continuer votre processus, vous devrez OBLIGATOIREMENT :\n\n`;
    plain += `1-Vous informer :\n`;
    plain += `•\tRegarder et comprendre le contenu de la présentation suivante : Présentation Forces 101 (https://youtu.be/hYzMRYYBnag)\n`;
    if (dossierJobs.length > 0) {
      const jobLinksFr = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, true, false)).join(', ');
      plain += `•\tRegarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits : ${jobLinksFr}\n`;
    } else {
      plain += `•\tRegarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits Carrières | Forces armées canadiennes (https://forces.ca/fr/carrieres/)\n`;
    }
    plain += `•\tExplorer et bien comprendre la section Instruction de base du site Forces.ca (https://forces.ca/fr/instruction-de-base/)\n\n`;
    plain += `2-Après avoir regardé la vidéo, Prendre rendez-vous pour une consultation via le calendrier de votre portail. Lien vers le Portail d'enrôlement des Forces armées canadiennes (https://www.cafoap-pclfac.forces.gc.ca/) De nouvelles plages horaires ouvriront d’ici 14 jours sur votre portail.\n\n`;
    plain += `Cette consultation auprès d’un recruteur sera nécessaire afin de valider votre connaissance des professions militaires qui vous intéressent, de la nature du cours de qualification militaire de base (QMB) et des exigences que comporte un engagement au sein de la force régulière des Forces armées canadiennes. Cette consultation n’est pas une entrevue officielle. Lorsque votre dossier sera distribué à un gestionnaire de dossier, celui-ci vous attribuera une tâche pour prendre un rendez-vous avec un conseiller en carrière militaire et c’est avec ce conseiller que vous ferez votre entrevue officielle pour un emploie dans les forces armées canadienne.\n\n`;
    if (nonMandatoryTasksFr) {
      plain += `${nonMandatoryTasksFr}\n\n`;
    }
    plain += `Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.\n\n`;
    plain += `Merci encore et au plaisir de votre faire votre connaissance.\n\n`;
    plain += this.getSignatureFr();

    plain += `\n\n______________________________________________________________________________\n\n`;

    // --- ENGLISH ---
    plain += `Hello,\n\n`;
    plain += `Thank you very much for providing your documents and selecting your preferred occupation.\n\n`;
    plain += `In order to continue your application process, You will be REQUIRED to:\n\n`;
    plain += `1- Inform yourself :\n`;
    plain += `•\tWatch and understand the content of the following presentation: Forces 101 Presentation (https://youtu.be/oKuX_ROtASw)\n`;
    if (dossierJobs.length > 0) {
      const jobLinksEn = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, false, false)).join(', ');
      plain += `•\tWatch the video and review the description of the trade(s) you are registered for : ${jobLinksEn}\n`;
    } else {
      plain += `•\tWatch the video and review the description of the trade(s) you are registered for. Careers | Canadian Armed Forces (https://forces.ca/en/careers/)\n`;
    }
    plain += `•\tExplore and fully understand the Basic Training section of the Forces.ca website (https://forces.ca/en/basic-training/)\n\n`;
    plain += `2-After viewing the video, Schedule an appointment for a consultation through your portal calendar. Canadian Armed Forces enrolment Portal link (https://www.cafoap-pclfac.forces.gc.ca/) New time slots will open on your portal within 14 days.\n\n`;
    plain += `This consultation with a recruiter will be required to validate your understanding of the military occupations that interest you, the nature of the Basic Military Qualification (BMQ), and the requirements associated with enrolling in the Regular Force of the Canadian Armed Forces. This consultation is not an official interview. Once your file has been assigned to a file administrator, you will be given a task to schedule an appointment with a Military Career Counsellor. It is with this counsellor that you will complete your official interview for employment with the Canadian Armed Forces.\n\n`;
    if (nonMandatoryTasksEn) {
      plain += `${nonMandatoryTasksEn}\n\n`;
    }
    plain += `If no action is taken, your file will be automatically deactivated after 30 days.\n\n`;
    plain += `Thank you again, and we look forward to meeting you.\n\n`;
    plain += this.getSignatureEn();

    return plain;
  }

  getPforJobLinkMarkup(jobId: string, isFrench: boolean, isHtml: boolean): string {
    const job = this.jobService.getAllJobs().find((j) => j.id === jobId);
    const urlInfo = JOB_URLS[jobId];

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
        return `<a href="${url}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">${titleText}</a>`;
      } else {
        return `${titleText} (${url})`;
      }
    }
    if (job) {
      const fallbackUrl = isFrench ? 'https://forces.ca/fr/carrieres/' : 'https://forces.ca/en/careers/';
      if (isHtml) {
        return `<a href="${fallbackUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">${titleText}</a>`;
      } else {
        return `${titleText} (${fallbackUrl})`;
      }
    }
    return titleText;
  }

  getCompliantPforEmailHtml(): string {
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;

    const nonMandatoryTasksHtmlFr = this.getCompliantNonMandatoryTasksHtml('fr');
    const nonMandatoryTasksHtmlEn = this.getCompliantNonMandatoryTasksHtml('en');
    const dossierJobs = this.getDossierJobObjects().filter((j) => j.id !== '00003');

    // --- FRENCH BLOCK ---
    html += `<p><span style="background-color: #FFFF00; font-weight: bold;">English message will follow.</span></p>`;
    html += `<p>Bonjour,</p>`;
    html += `<p>Merci beaucoup d’avoir fourni vos documents et fait votre choix de profession.<br>`;
    html += `Afin de pouvoir continuer votre processus, vous devrez <span style="background-color: #00FF00; font-weight: bold; padding: 0 4px;">OBLIGATOIREMENT</span> :</p>`;

    html += `<p style="margin-bottom: 5px;"><strong>1- Vous informer :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
    html += `  <li style="margin-bottom: 5px;">Regarder et comprendre le contenu de la présentation suivante : <a href="https://www.youtube.com/watch?v=UaCQUp-_ZUc" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Présentation Forces 101</a></li>`;
    if (dossierJobs.length > 0) {
      const jobLinksFr = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, true, true)).join(', ');
      html += `  <li style="margin-bottom: 5px;">Regarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits : ${jobLinksFr}</li>`;
    } else {
      html += `  <li style="margin-bottom: 5px;">Regarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits <a href="https://forces.ca/fr/carrieres/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Carrières | Forces armées canadiennes</a></li>`;
    }
    html += `  <li style="margin-bottom: 5px;">Explorer la section <a href="https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/faq-faq/faq-faq-fra.asp" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Foire aux Questions</a> du site internet du Collège militaire royal de Saint-Jean</li>`;
    html += `  <li style="margin-bottom: 5px;">Explorer la <a href="https://www.youtube.com/@cmrsjrmcsj" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">chaîne Youtube</a> du Collège militaire royal de Saint-Jean</li>`;
    html += `</ul>`;

    html += `<p style="margin-bottom: 5px;"><strong>2- Vous assurer que toutes les tâches sur votre portail sont complétées :</strong></p>`;
    html += `<p style="margin-top: 0; margin-bottom: 15px;">Veuillez vous connecter à votre portail afin de vous assurer que toutes les tâches sont complétées : <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Lien vers le Portail d'enrôlement des Forces armées canadiennes</a></p>`;

    html += `<p style="margin-bottom: 5px;"><strong>3- Si vous êtes un athlète de haut-niveau, vous pouvez vous rendre sur les sites internets des équipes sportives :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
    html += `  <li style="margin-bottom: 5px;">Équipes du CMR Saint-Jean, les Remparts : <a href="https://gorempartsgo.ca" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">gorempartsgo.ca</a></li>`;
    html += `  <li style="margin-bottom: 5px;">Équipes du CMR du Canada situé à Kingston, les Paladins: <a href="https://gopaladinsgo.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Royal Military College of Canada - Official Athletics Website</a></li>`;
    html += `</ul>`;

    html += `<p>Si vous êtes un athlète de haut-niveau, il est possible pour vous de communiquer avec l’une des équipes pour vous informer au sujet des différentes équipes et des sélections de ces équipes. Pour savoir avec laquelle des équipes communiquer, n’hésitez pas à poser la question au centre de recrutement qui traite votre dossier.</p>`;

    if (nonMandatoryTasksHtmlFr) {
      html += nonMandatoryTasksHtmlFr;
    }

    html += this.getPforCaf101HighDemandWarningHtml('fr');

    html += `<p style="margin-bottom: 5px;"><span style="background-color: #00FF00; font-weight: bold;">Journée portes ouvertes et visites - Futurs étudiants - Collège militaire royal de Saint-Jean</span></p>`;
    html += `<p>Nous vous invitons à profiter de la <span style="background-color: #00FF00;">journée portes ouvertes du Collège militaire royal de Saint-Jean</span>, qui se tiendra le <span style="background-color: #00FF00; font-weight: bold;">31 octobre 2026 de 8 h 30 à 16 h</span>. <span style="background-color: #00FF00;">Aucune inscription n'est nécessaire</span>.<br>Venez découvrir le milieu de vie des aspirants de marine et élèves-officiers, visiter les installations du Collège et rencontrer les professeurs, les aspirants de marine et élèves-officiers ainsi que les recruteurs qui seront disponibles pour répondre à vos questions.<br>Des visites guidées d'environ 60 minutes sont offertes en continu tout au long de la journée, vous permettant d'arriver au moment qui vous convient le mieux.<br>Nous espérons avoir l'occasion de vous accueillir et de vous faire découvrir tout ce que le Collège militaire royal de Saint-Jean peut vous offrir dans le cadre de votre futur parcours académique et militaire.</p>`;

    html += `<p>Si vous ne prenez aucune action dans votre portail, votre dossier fermera automatiquement dans 30 jours.</p>`;

    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    html += `<br><hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"><br>`;

    // --- ENGLISH BLOCK ---
    html += `<p>Hello,</p>`;
    html += `<p>Thank you very much for providing your documents and selecting your preferred occupation.<br>`;
    html += `In order to continue your application process, You will be <span style="background-color: #00FF00; font-weight: bold; padding: 0 4px;">REQUIRED</span> to:</p>`;

    html += `<p style="margin-bottom: 5px;"><strong>1- Inform yourself :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
    html += `  <li style="margin-bottom: 5px;">Watch and understand the content of the following presentation: <a href="https://www.youtube.com/watch?v=nGGLc_Ynr-I" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Forces 101 Presentation</a></li>`;
    if (dossierJobs.length > 0) {
      const jobLinksEn = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, false, true)).join(', ');
      html += `  <li style="margin-bottom: 5px;">Watch the video and review the description of the trade(s) you are registered for : ${jobLinksEn}</li>`;
    } else {
      html += `  <li style="margin-bottom: 5px;">Watch the video and review the description of the trade(s) you are registered for. <a href="https://forces.ca/en/careers/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Careers | Canadian Armed Forces</a></li>`;
    }
    html += `  <li style="margin-bottom: 5px;">Explore the <a href="https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/faq-faq/faq-faq-eng.asp" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Frequently Asked Questions</a> section of the Royal Military College Saint-Jean</li>`;
    html += `  <li style="margin-bottom: 5px;">Explore the <a href="https://www.youtube.com/@cmrsjrmcsj" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Youtube Channel</a> of the Royal Military College Saint-Jean</li>`;
    html += `</ul>`;

    html += `<p style="margin-bottom: 5px;"><strong>2- Ensure all tasks on your portal are completed:</strong></p>`;
    html += `<p style="margin-top: 0; margin-bottom: 15px;">Please log in to your portal to verify and ensure that all required tasks are completed: <a href="https://www.cafoap-pclfac.forces.gc.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Canadian Armed Forces Enrolment Portal link</a></p>`;

    html += `<p style="margin-bottom: 5px;"><strong>3- If you are a high-level athlete, you can visit the websites of sports teams: </strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
    html += `  <li style="margin-bottom: 5px;">RMC Saint-Jean Sports teams Les Remparts: <a href="https://gorempartsgo.ca" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">gorempartsgo.ca</a></li>`;
    html += `  <li style="margin-bottom: 5px;">RMC of Canada located in Kingston Sports teams The Paladins: <a href="https://gopaladinsgo.ca/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Royal Military College of Canada - Official Athletics Website</a></li>`;
    html += `</ul>`;

    html += `<p>If you are a high-performance athlete, you may contact one of the teams to learn more about the different teams and their selection processes. If you are unsure which team to contact, please do not hesitate to ask the recruiting centre handling your application.</p>`;

    if (nonMandatoryTasksHtmlEn) {
      html += nonMandatoryTasksHtmlEn;
    }

    html += this.getPforCaf101HighDemandWarningHtml('en');

    html += `<p style="margin-bottom: 5px;"><span style="background-color: #00FF00; font-weight: bold;">Open House and Visits - Future Students - Royal Military College Saint-Jean</span></p>`;
    html += `<p>We invite you to take advantage of the <span style="background-color: #00FF00;">Royal Military College Saint-Jean Open House</span>, which will be held on <span style="background-color: #00FF00; font-weight: bold;">October 31, 2026, from 8:30 a.m. to 4:00 p.m.</span> <span style="background-color: #00FF00;">No registration is required</span>.<br>Come and discover the life of naval cadets and officer cadets, tour the College facilities, and meet professors, naval cadets and officer cadets, as well as recruiters who will be available to answer your questions.<br>Guided tours of approximately 60 minutes are offered continuously throughout the day, allowing you to arrive at whatever time suits you best.<br>We hope to have the opportunity to welcome you and show you everything that Royal Military College Saint-Jean has to offer as part of your future academic and military journey.</p>`;

    html += `<p>If no action is taken in your portal, your file will automatically close within 30 days.</p>`;

    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    html += `</div>`;
    return html;
  }

  getPforCaf101HighDemandWarningHtml(lang: 'fr' | 'en'): string {
    const dossierJobs = this.getDossierJobObjects().filter(
      (j) => j.id !== '00003' && this.jobService.isJobInGestionDesAttentes(j.id)
    );
    if (dossierJobs.length === 0) return '';
    let html = '';
    if (lang === 'fr') {
      html += `<p>Sachez que parmi les métiers que vous avez sélectionnés, dans votre demande d'enrôlement, figurent les suivants :</p>`;
      html += `<ul style="margin-top: 5px; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
      for (const j of dossierJobs) {
        html += `  <li style="margin-bottom: 5px;"><strong>${j.title} (${j.id})</strong></li>`;
      }
      html += `</ul>`;
      html += `<p>Nous souhaitons vous informer que ce ou ces métiers suscitent actuellement un très grand nombre de candidatures. Par conséquent, il est possible que votre dossier ne soit pas traité pour ces choix en raison de la forte concurrence et des dossiers déjà actuellement en traitement.</p>`;
      html += `<p>En tenant compte de cette situation, vous pouvez soit maintenir ce ou ces choix, soit consulter les autres possibilités offertes par les Collèges militaires du Canada en utilisant le lien suivant :<br>`;
      html += `<a href="https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/brochure/brochure-fra.asp#occu" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Liste des programmes admissibles par métier</a></p>`;
      html += `<p style="margin-bottom: 20px;">Nous vous invitons à nous faire part de votre décision dans les meilleurs délais afin de poursuivre le traitement de votre dossier.</p>`;
    } else {
      html += `<p>Please be aware that among the occupations you have selected in your enrolment application are the following:</p>`;
      html += `<ul style="margin-top: 5px; margin-bottom: 15px; list-style-type: disc; padding-left: 20px;">`;
      for (const j of dossierJobs) {
        html += `  <li style="margin-bottom: 5px;"><strong>${j.titleEn || j.title} (${j.id})</strong></li>`;
      }
      html += `</ul>`;
      html += `<p>We would like to inform you that this occupation / these occupations are currently receiving a very large number of applications. Consequently, it is possible that your file may not be processed for these choices due to strong competition and the files currently in processing.</p>`;
      html += `<p>Considering this situation, you may either maintain this choice / these choices or explore the other opportunities offered by the Canadian Military Colleges using the following link:<br>`;
      html += `<a href="https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/brochure/brochure-eng.asp#occu" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">List of Eligible Programs by Occupation</a></p>`;
      html += `<p style="margin-bottom: 20px;">We invite you to let us know your decision as soon as possible in order to continue processing your application.</p>`;
    }
    return html;
  }

  getPforCaf101HighDemandWarningPlain(lang: 'fr' | 'en'): string {
    const dossierJobs = this.getDossierJobObjects().filter(
      (j) => j.id !== '00003' && this.jobService.isJobInGestionDesAttentes(j.id)
    );
    if (dossierJobs.length === 0) return '';
    let plain = '';
    if (lang === 'fr') {
      plain += `Sachez que parmi les métiers que vous avez sélectionnés, dans votre demande d'enrôlement, figurent les suivants :\n`;
      for (const j of dossierJobs) {
        plain += `• ${j.title} (${j.id})\n`;
      }
      plain += `\nNous souhaitons vous informer que ce ou ces métiers suscitent actuellement un très grand nombre de candidatures. Par conséquent, il est possible que votre dossier ne soit pas traité pour ces choix en raison de la forte concurrence et des dossiers déjà actuellement en traitement.\n\n`;
      plain += `En tenant compte de cette situation, vous pouvez soit maintenir ce ou ces choix, soit consulter les autres possibilités offertes par les Collèges militaires du Canada en utilisant le lien suivant :\n`;
      plain += `Liste des programmes admissibles par métier (https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/brochure/brochure-fra.asp#occu)\n\n`;
      plain += `Nous vous invitons à nous faire part de votre décision dans les meilleurs délais afin de poursuivre le traitement de votre dossier.\n\n`;
    } else {
      plain += `Please be aware that among the occupations you have selected in your enrolment application are the following:\n`;
      for (const j of dossierJobs) {
        plain += `• ${j.titleEn || j.title} (${j.id})\n`;
      }
      plain += `\nWe would like to inform you that this occupation / these occupations are currently receiving a very large number of applications. Consequently, it is possible that your file may not be processed for these choices due to strong competition and the files currently in processing.\n\n`;
      plain += `Considering this situation, you may either maintain this choice / these choices or explore the other opportunities offered by the Canadian Military Colleges using the following link:\n`;
      plain += `List of Eligible Programs by Occupation (https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/brochure/brochure-eng.asp#occu)\n\n`;
      plain += `We invite you to let us know your decision as soon as possible in order to continue processing your application.\n\n`;
    }
    return plain;
  }

  getCompliantPforEmailPlain(): string {
    let plain = "";

    const nonMandatoryTasksFr = this.getCompliantNonMandatoryTasksPlain('fr');
    const nonMandatoryTasksEn = this.getCompliantNonMandatoryTasksPlain('en');
    const dossierJobs = this.getDossierJobObjects().filter((j) => j.id !== '00003');

    // --- FRENCH ---
    plain += `English message will follow.\n\n`;
    plain += `Bonjour,\n\n`;
    plain += `Merci beaucoup d’avoir fourni vos documents et fait votre choix de profession.\n`;
    plain += `Afin de pouvoir continuer votre processus, vous devrez OBLIGATOIREMENT :\n\n`;
    plain += `1- Vous informer :\n`;
    plain += `• Regarder et comprendre le contenu de la présentation suivante : Présentation Forces 101 (https://www.youtube.com/watch?v=UaCQUp-_ZUc)\n`;
    if (dossierJobs.length > 0) {
      const jobLinksFr = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, true, false)).join(', ');
      plain += `• Regarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits : ${jobLinksFr}\n`;
    } else {
      plain += `• Regarder la vidéo et description du ou des métier/s pour lesquels vous êtes inscrits Carrières | Forces armées canadiennes (https://forces.ca/fr/carrieres/)\n`;
    }
    plain += `• Explorer la section Foire aux Questions du site internet du Collège militaire royal de Saint-Jean (https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/faq-faq/faq-faq-fra.asp)\n`;
    plain += `• Explorer la chaîne Youtube du Collège militaire royal de Saint-Jean (https://www.youtube.com/@cmrsjrmcsj)\n\n`;
    plain += `2- Vous assurer que toutes les tâches sur votre portail sont complétées :\n`;
    plain += `Veuillez vous connecter à votre portail afin de vous assurer que toutes les tâches sont complétées : Lien vers le Portail d'enrôlement des Forces armées canadiennes (https://www.cafoap-pclfac.forces.gc.ca/)\n\n`;
    plain += `3- Si vous êtes un athlète de haut-niveau, vous pouvez vous rendre sur les sites internets des équipes sportives :\n`;
    plain += `• Équipes du CMR Saint-Jean, les Remparts : gorempartsgo.ca (https://gorempartsgo.ca)\n`;
    plain += `• Équipes du CMR du Canada situé à Kingston, les Paladins: Royal Military College of Canada - Official Athletics Website (https://gopaladinsgo.ca/)\n\n`;
    plain += `Si vous êtes un athlète de haut-niveau, il est possible pour vous de communiquer avec l’une des équipes pour vous informer au sujet des différentes équipes et des sélections de ces équipes. Pour savoir avec laquelle des équipes communiquer, n’hésitez pas à poser la question au centre de recrutement qui traite votre dossier.\n\n`;

    if (nonMandatoryTasksFr) {
      plain += `${nonMandatoryTasksFr}\n\n`;
    }

    plain += this.getPforCaf101HighDemandWarningPlain('fr');

    plain += `Journée portes ouvertes et visites - Futurs étudiants - Collège militaire royal de Saint-Jean\n`;
    plain += `Nous vous invitons à profiter de la journée portes ouvertes du Collège militaire royal de Saint-Jean, qui se tiendra le 31 octobre 2026 de 8 h 30 à 16 h. Aucune inscription n'est nécessaire.\nVenez découvrir le milieu de vie des aspirants de marine et élèves-officiers, visiter les installations du Collège et rencontrer les professeurs, les aspirants de marine et élèves-officiers ainsi que les recruteurs qui seront disponibles pour répondre à vos questions.\nDes visites guidées d'environ 60 minutes sont offertes en continu tout au long de la journée, vous permettant d'arriver au moment qui vous convient le mieux.\nNous espérons avoir l'occasion de vous accueillir et de vous faire découvrir tout ce que le Collège militaire royal de Saint-Jean peut vous offrir dans le cadre de votre futur parcours académique et militaire.\n\n`;

    plain += `Si vous ne prenez aucune action dans votre portail, votre dossier fermera automatiquement dans 30 jours.\n\n`;

    plain += this.getSignatureFr();

    plain += `\n\n______________________________________________________________________________\n\n`;

    // --- ENGLISH ---
    plain += `Hello,\n\n`;
    plain += `Thank you very much for providing your documents and selecting your preferred occupation.\n`;
    plain += `In order to continue your application process, You will be REQUIRED to:\n\n`;
    plain += `1- Inform yourself :\n`;
    plain += `• Watch and understand the content of the following presentation: Forces 101 Presentation (https://www.youtube.com/watch?v=nGGLc_Ynr-I)\n`;
    if (dossierJobs.length > 0) {
      const jobLinksEn = dossierJobs.map((j) => this.getPforJobLinkMarkup(j.id, false, false)).join(', ');
      plain += `• Watch the video and review the description of the trade(s) you are registered for : ${jobLinksEn}\n`;
    } else {
      plain += `• Watch the video and review the description of the trade(s) you are registered for. Careers | Canadian Armed Forces (https://forces.ca/en/careers/)\n`;
    }
    plain += `• Explore the Frequently Asked Questions section of the Royal Military College Saint-Jean (https://www.cmrsj-rmcsj.forces.gc.ca/fe-fs/faq-faq/faq-faq-eng.asp)\n`;
    plain += `• Explore the Youtube Channel of the Royal Military College Saint-Jean (https://www.youtube.com/@cmrsjrmcsj)\n\n`;
    plain += `2- Ensure all tasks on your portal are completed:\n`;
    plain += `Please log in to your portal to verify and ensure that all required tasks are completed: Canadian Armed Forces Enrolment Portal link (https://www.cafoap-pclfac.forces.gc.ca/)\n\n`;
    plain += `3- If you are a high-level athlete, you can visit the websites of sports teams: \n`;
    plain += `• RMC Saint-Jean Sports teams Les Remparts: gorempartsgo.ca (https://gorempartsgo.ca)\n`;
    plain += `• RMC of Canada located in Kingston Sports teams The Paladins: Royal Military College of Canada - Official Athletics Website (https://gopaladinsgo.ca/)\n\n`;
    plain += `If you are a high-performance athlete, you may contact one of the teams to learn more about the different teams and their selection processes. If you are unsure which team to contact, please do not hesitate to ask the recruiting centre handling your application.\n\n`;

    if (nonMandatoryTasksEn) {
      plain += `${nonMandatoryTasksEn}\n\n`;
    }

    plain += this.getPforCaf101HighDemandWarningPlain('en');

    plain += `Open House and Visits - Future Students - Royal Military College Saint-Jean\n`;
    plain += `We invite you to take advantage of the Royal Military College Saint-Jean Open House, which will be held on October 31, 2026, from 8:30 a.m. to 4:00 p.m. No registration is required.\nCome and discover the life of naval cadets and officer cadets, tour the College facilities, and meet professors, naval cadets and officer cadets, as well as recruiters who will be available to answer your questions.\nGuided tours of approximately 60 minutes are offered continuously throughout the day, allowing you to arrive at whatever time suits you best.\nWe hope to have the opportunity to welcome you and show you everything that Royal Military College Saint-Jean has to offer as part of your future academic and military journey.\n\n`;

    plain += `If no action is taken in your portal, your file will automatically close within 30 days.\n\n`;

    plain += this.getSignatureEn();

    return plain;
  }

  getCompliantPforLienPaEmailHtml(): string {
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;

    // --- FRENCH BLOCK ---
    html += `<p><span style="background-color: #FFFF00; font-weight: bold;">English message will follow.</span></p>`;
    html += `<p>Bonjour,</p>`;
    html += `<p>Nous vous remercions de votre intérêt envers les Forces Armées Canadiennes (FAC). Dans votre demande, vous avez sélectionné le Programme de Formation des Officiers de la Régulière (PFOR).</p>`;
    html += `<p>Afin de poursuivre le traitement de votre demande, nous devons obtenir vos documents scolaires. <strong>Voici comment procéder pour nous les transmettre :</strong></p>`;

    html += `<ol style="list-style-type: decimal; padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">`;
    html += `  <li style="margin-bottom: 10px;">Visitez le site web du Collège militaire royal du Canada (CMR) à l’adresse suivante :<br><a href="https://services.rmc.ca/apex/f?p=APPLICATIONS:LOGIN:0::::P1010_PASSWORD:363a11f2b0ebff75ce81e7555bdeaa8649377535ad84ec84f0660bf4af1a8477&cs=1j-Ipn31px0rKVtc1ZH6kM4wpMY0" target="_blank" style="color: #4f46e5; text-decoration: underline;">Admissions - Collège militaire royal du Canada (CMR) (rmc.ca)</a><br><br><strong>Remarque :</strong> Vous pourriez avoir à copier-coller le lien dans votre navigateur ou à changer de navigateur pour accéder au lien (ex. Firefox ou Chrome).</li>`;
    html += `  <li style="margin-bottom: 10px;">Vous devrez remplir le formulaire à l’aide de votre numéro de matricule que vous trouverez dans le volet latéral gauche de votre portail du postulant.</li>`;
    html += `  <li style="margin-bottom: 10px;">Vous devrez numériser vos relevés de notes officiels, y compris le verso (études secondaires et postsecondaires), puis les télécharger sur le site. (Même si vous l’avez déjà fait sur votre portail Forces.ca au début de votre processus de recrutement)</li>`;
    html += `</ol>`;

    html += `<p><strong>***Une personne ayant suivi ses études à l’extérieur du Canada, du Royaume-Uni, des États-Unis d’Amérique, de la France et/ou en possession d’un baccalauréat international doit obtenir une évaluation comparative des études par une tierce partie agréée. Les évaluations générales ne seront pas acceptées. Vous devrez ensuite télécharger les résultats de cette évaluation sur le portail du PFOR via le lien fourni ci-dessus. ***</strong></p>`;

    html += `<p>Une fois que les documents requis auront été reçus, votre dossier sera examiné par le Collège militaire royal du Canada (Kingston) pour les postulantes et postulants seniors, et par le CMR Saint-Jean pour les postulantes et postulants juniors. (Faites une capture d’écran de la page de confirmation que vos documents ont été déposés avec succès puis téléversez la sur votre portail du Postulant en ligne)</p>`;

    html += `<p>S’il est établi que vous satisfaisiez aux exigences minimales et que le Collège décide de traiter votre demande, le centre de recrutement pourra continuer le traitement de votre dossier et vous en serai informé par courriel ou en recevant des tâches supplémentaires sur votre portail.</p>`;

    html += `<p>Si vous avez des questions, n’hésitez pas à communiquer avec nous par courriel à <a href="mailto:PFOR_CRFC_Quebec@Forces.gc.ca" style="color: #4f46e5; text-decoration: underline;">PFOR_CRFC_Quebec@Forces.gc.ca</a>.</p>`;

    html += `<p>Nous vous remercions de votre intérêt à joindre les Forces armées canadiennes.</p>`;

    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    html += `<br><hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"><br>`;

    // --- ENGLISH BLOCK ---
    html += `<p>Hello,</p>`;
    html += `<p>Thank you for your interest in the Canadian Armed Forces (CAF). In your application, you have selected the Regular Officer Training Plan (ROTP).</p>`;
    html += `<p>To continue processing your application, we need supporting academic documentation. <strong>Here's how to proceed to submit it:</strong></p>`;

    html += `<ol style="list-style-type: decimal; padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">`;
    html += `  <li style="margin-bottom: 10px;">Visit the Royal Military College of Canada (RMC) website at the following link:<br><a href="https://services.rmc.ca/apex/f?p=APPLICATIONS:LOGIN:0::::P1010_PASSWORD:363a11f2b0ebff75ce81e7555bdeaa8649377535ad84ec84f0660bf4af1a8477&cs=1j-Ipn31px0rKVtc1ZH6kM4wpMY0" target="_blank" style="color: #4f46e5; text-decoration: underline;">Royal Military College of Canada (RMC)</a><br><br><strong>Note:</strong> You may need to copy and paste the link into your browser or change browsers to access the link (e.g., Firefox or Chrome).</li>`;
    html += `  <li style="margin-bottom: 10px;">You will need to fill in the form using your service number which you can find in the left sidebar of your applicant portal.</li>`;
    html += `  <li style="margin-bottom: 10px;">You will need to scan your official transcripts, including the back (secondary and post-secondary), and upload them to the site. (Even if you have already done so on your portal when you begin your online application)</li>`;
    html += `</ol>`;

    html += `<p><strong>***Applicants who studied outside Canada, United Kingdom, United States of America, France and/or who hold an International Baccalaureate must obtain a comparative educational assessment from an accredited third party. General evaluations will not be accepted. You must then upload the results of this evaluation to the ROTP portal via the link provided above. ***</strong></p>`;

    html += `<p>Once the required documents have been received, your file will be reviewed by the Royal Military College of Canada (Kingston) for senior applicants, and by CMR Saint-Jean for junior applicants. (Make sure you take a screenshot of the confirmation page for the deposit of your document and upload them on your online profile)</p>`;

    html += `<p>If it is determined that you meet the minimum requirements and the College decides to process your application, the recruitment centre will be able to continue processing your file, and you will be informed either by email or by receiving additional tasks on your portal.</p>`;

    html += `<p>For any questions, please feel free to contact us by email to: <a href="mailto:PFOR_CRFC_Quebec@Forces.gc.ca" style="color: #4f46e5; text-decoration: underline;">PFOR_CRFC_Quebec@Forces.gc.ca</a>.</p>`;

    html += `<p>Thank you for your interest in joining the Canadian Armed Forces.</p>`;

    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    html += `</div>`;
    return html;
  }

  getCompliantPforLienPaEmailPlain(): string {
    let plain = "";

    // --- FRENCH ---
    plain += `English message will follow.\n\n`;
    plain += `Bonjour,\n\n`;
    plain += `Nous vous remercions de votre intérêt envers les Forces Armées Canadiennes (FAC). Dans votre demande, vous avez sélectionné le Programme de Formation des Officiers de la Régulière (PFOR).\n\n`;
    plain += `Afin de poursuivre le traitement de votre demande, nous devons obtenir vos documents scolaires. Voici comment procéder pour nous les transmettre :\n\n`;
    plain += `1. Visitez le site web du Collège militaire royal du Canada (CMR) à l’adresse suivante :\n`;
    plain += `Admissions - Collège militaire royal du Canada (CMR) (rmc.ca) (https://services.rmc.ca/apex/f?p=APPLICATIONS:LOGIN:0::::P1010_PASSWORD:363a11f2b0ebff75ce81e7555bdeaa8649377535ad84ec84f0660bf4af1a8477&cs=1j-Ipn31px0rKVtc1ZH6kM4wpMY0)\n\n`;
    plain += `Remarque : Vous pourriez avoir à copier-coller le lien dans votre navigateur ou à changer de navigateur pour accéder au lien (ex. Firefox ou Chrome).\n\n`;
    plain += `2. Vous devrez remplir le formulaire à l’aide de votre numéro de matricule que vous trouverez dans le volet latéral gauche de votre portail du postulant.\n\n`;
    plain += `3. Vous devrez numériser vos relevés de notes officiels, y compris le verso (études secondaires et postsecondaires), puis les télécharger sur le site. (Même si vous l’avez déjà fait sur votre portail Forces.ca au début de votre processus de recrutement)\n\n`;
    plain += `***Une personne ayant suivi ses études à l’extérieur du Canada, du Royaume-Uni, des États-Unis d’Amérique, de la France et/ou en possession d’un baccalauréat international doit obtenir une évaluation comparative des études par une tierce partie agréée. Les évaluations générales ne seront pas acceptées. Vous devrez ensuite télécharger les résultats de cette évaluation sur le portail du PFOR via le lien fourni ci-dessus. ***\n\n`;
    plain += `Une fois que les documents requis auront été reçus, votre dossier sera examiné par le Collège militaire royal du Canada (Kingston) pour les postulantes et postulants seniors, et par le CMR Saint-Jean pour les postulantes et postulants juniors. (Faites une capture d’écran de la page de confirmation que vos documents ont été déposés avec succès puis téléversez la sur votre portail du Postulant en ligne)\n\n`;
    plain += `S’il est établi que vous satisfaisiez aux exigences minimales et que le Collège décide de traiter votre demande, le centre de recrutement pourra continuer le traitement de votre dossier et vous en serai informé par courriel ou en recevant des tâches supplémentaires sur votre portail.\n\n`;
    plain += `Si vous avez des questions, n’hésitez pas à communiquer avec nous par courriel à PFOR_CRFC_Quebec@Forces.gc.ca.\n\n`;
    plain += `Nous vous remercions de votre intérêt à joindre les Forces armées canadiennes.\n\n`;
    plain += this.getSignatureFr();

    plain += `\n\n______________________________________________________________________________\n\n`;

    // --- ENGLISH ---
    plain += `Hello,\n\n`;
    plain += `Thank you for your interest in the Canadian Armed Forces (CAF). In your application, you have selected the Regular Officer Training Plan (ROTP).\n\n`;
    plain += `To continue processing your application, we need supporting academic documentation. Here's how to proceed to submit it:\n\n`;
    plain += `1. Visit the Royal Military College of Canada (RMC) website at the following link:\n`;
    plain += `Royal Military College of Canada (RMC) (https://services.rmc.ca/apex/f?p=APPLICATIONS:LOGIN:0::::P1010_PASSWORD:363a11f2b0ebff75ce81e7555bdeaa8649377535ad84ec84f0660bf4af1a8477&cs=1j-Ipn31px0rKVtc1ZH6kM4wpMY0)\n\n`;
    plain += `Note: You may need to copy and paste the link into your browser or change browsers to access the link (e.g., Firefox or Chrome).\n\n`;
    plain += `2. You will need to fill in the form using your service number which you can find in the left sidebar of your applicant portal.\n\n`;
    plain += `3. You will need to scan your official transcripts, including the back (secondary and post-secondary), and upload them to the site. (Even if you have already done so on your portal when you begin your online application)\n\n`;
    plain += `***Applicants who studied outside Canada, United Kingdom, United States of America, France and/or who hold an International Baccalaureate must obtain a comparative educational assessment from an accredited third party. General evaluations will not be accepted. You must then upload the results of this evaluation to the ROTP portal via the link provided above. ***\n\n`;
    plain += `Once the required documents have been received, your file will be reviewed by the Royal Military College of Canada (Kingston) for senior applicants, and by CMR Saint-Jean for junior applicants. (Make sure you take a screenshot of the confirmation page for the deposit of your document and upload them on your online profile)\n\n`;
    plain += `If it is determined that you meet the minimum requirements and the College decides to process your application, the recruitment centre will be able to continue processing your file, and you will be informed either by email or by receiving additional tasks on your portal.\n\n`;
    plain += `For any questions, please feel free to contact us by email to: PFOR_CRFC_Quebec@Forces.gc.ca.\n\n`;
    plain += `Thank you for your interest in joining the Canadian Armed Forces.\n\n`;
    plain += this.getSignatureEn();

    return plain;
  }


  // Helper for generating dynamic lists
  private getElementsManquantsBlocks(lang: 'fr' | 'en' = 'fr'): {
    dateLimiteStr: string;
    elementsPlain: string;
    elementsHtmlList: string;
  } {
    const dateLimite = this.offreDateElementsManquants()?.trim();
    const dateLimiteStr = dateLimite ? ` ${dateLimite}` : '';
    const elementsText = this.offreElementsManquants() || '';
    const elementsList = elementsText.split('\n').map(e => e.trim()).filter(e => e.length > 0);
    
    let elementsPlain = '';
    elementsList.forEach((el, idx) => {
      let displayEl = el;
      if (lang === 'en') {
        if (displayEl.toLowerCase() === 'spécimen de chèque' || displayEl.toLowerCase() === 'specimen de cheque') {
          displayEl = 'Void cheque';
        }
      }
      elementsPlain += `${idx + 1}.\t${displayEl}\n`;
    });
    if (elementsPlain) {
      elementsPlain += '\n\n';
    }

    let elementsHtmlList = '<ol style="margin-top: 0; margin-bottom: 15px; padding-left: 20px;">';
    elementsList.forEach(el => {
      let displayEl = el;
      if (lang === 'en') {
        if (displayEl.toLowerCase() === 'spécimen de chèque' || displayEl.toLowerCase() === 'specimen de cheque') {
          displayEl = 'Void cheque';
        }
      }
      elementsHtmlList += `<li>${displayEl}</li>`;
    });
    elementsHtmlList += '</ol>';

    return { dateLimiteStr, elementsPlain, elementsHtmlList };
  }

  getOffreOtaSectionPlainFr(): string {
    const dateEnrol = this.offreDateEnrolement().trim() || 'jour / mois / année';
    const heurePostulant = this.offreHeureArriveePostulant() || '07h30';
    const heureInvites = this.offreHeureArriveeInvites() || '09h40';
    const lieuEnrol = 'Centre de recrutement des Forces Canadiennes, 1600 boulevard René-Lévesque Ouest, bureau 140, Montréal, QC, H3H 1P9';
    const rawDateArrivee = this.offreDateArriveeUnite().trim();
    const jourSemaine = this.getJourSemaineFr(rawDateArrivee) || 'jour de la semaine';
    const dateArriveeFormatted = rawDateArrivee || 'jour / mois / année';
    const unitObj = this.getUniteAffectationObj();
    const nomUnite = unitObj.nom || 'N/A';
    const serie = this.offreSerieCours().trim();
    const debut = this.offreDateCoursDebut().trim();
    const fin = this.offreDateCoursFin().trim();
    let datesCours = 'jour / mois / année au jour / mois / année';
    if (debut && fin) {
      datesCours = debut + ' au ' + fin;
    } else if (debut) {
      datesCours = debut;
    }

    const isUic3613 = this.isUic3613Selected();

    let txt = "Veuillez lire ce courriel - attentivement et au complet - afin d’être prêt pour votre enrôlement.\n\n";
    txt += "1. (Si vous ne l’avez pas déjà fourni) Transmettre (par courriel ou par téléphone) l’information suivante, le PLUS RAPIDEMENT POSSIBLE avant votre enrôlement :\n";
    txt += "• Votre numéro d’assurance social;\n";
    txt += "• Le numéro d’immatriculation de votre véhicule (si utilisé pour aller à St-Jean);\n";
    txt += "• Les coordonnées d’une personne à contacter en cas d'urgence: prénom et nom de famille / adresse du domicile incluant le code postal / numéro de téléphone / le lien que vous avez avec cette personne (père, mère, frère, sœur, conjoint(e), ami, etc.);\n";
    txt += "• Les coordonnées d’un bénéficiaire en cas de décès qui doit être âgé de 18 ans ou plus. Les informations que vous devez fournir au sujet de cette personne sont : prénom et nom de famille / adresse du domicile incluant le code postal / numéro de téléphone / date de naissance du bénéficiaire: le jour, le mois et l’année / le lien que vous avez avec cette personne (père, mère, frère, sœur, conjoint(e), ami, etc.);\n\n";

    txt += "2. Si cela s’applique, vous devez envoyer une photo des documents suivant en répondant à ce courriel:\n";
    txt += "• Certificats de naissance de votre conjoint(e), de vos enfants (copie originale);\n";
    txt += "• Mariage au Canada: certificat de mariage (copie originale);\n";
    txt += "• Mariage à l’étranger : certificat de mariage (copie originale) - doit être rédigé en français ou en anglais; s’il est écrit dans une autre langue, il doit être accompagné d’une traduction;\n\n";

    txt += "3. Instruction concernant les documents suivants :\n";
    txt += `• TBS 330-61-FR (https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf) : vous devez compléter ce formulaire et l'apporter à ${nomUnite}. Les sections du formulaire que vous devez remplir sont de B à K;\n`;
    txt += "• Union de fait_procédure (https://simontheriault8-cyber.github.io/Documents/instruction%20UF.pdf) : si votre état civil est conjoint de fait, veuillez prendre connaissance de ce document;\n";
    txt += "• Exemples de tenue de ville (https://simontheriault8-cyber.github.io/Documents/Exemples%20-%20Tenue%20de%20ville.pdf), tenue vestimentaire pour la cérémonie;\n";
    if (isUic3613) {
      txt += "• Instruction_de_ralliement_ELRFC_FR (https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf) : instructions de ralliement pour l’École de leadership et de recrues des Forces canadiennes.\n";
    }
    txt += "\n";

    txt += "4. La journée de votre enrôlement, assurez-vous d’avoir en main les documents suivants :\n";
    txt += "• Spécimen de chèque;\n";
    txt += "• Pièce d’identité valide avec photo;\n";
    txt += "• Certificat de naissance ou de citoyenneté original de vous et de vos dépendants s’il y a lieu;\n";
    txt += "• Conjoint de fait: preuves d’adresses comme spécifié dans le document Word en pièce jointe;\n";
    txt += "• Carte d’assurance maladie provinciale de votre conjoint(e), de vos enfants (copie originale) s’il réside avec vous;\n";
    txt += "• Preuve officielle de la Cour si votre état civil est divorcé.\n\n";

    txt += "5. Photo le jour de l’enrôlement:\n";
    txt += "• Apportez votre appareil photo ou cellulaire si vous désirez avoir des photos de la cérémonie.\n\n";

    txt += "6. Information à communiquer si des événements particuliers se produisent avant la journée de votre enrôlement :\n";
    txt += "• Si vous recevez une contravention avant votre enrôlement, vous devez la payer et apporter la preuve de paiement. Si vous êtes dans l’impossibilité de la payer, veuillez nous contacter avant votre enrôlement;\n";
    txt += "• Si vous avez des obligations envers la justice qui n’ont pas été déclarées lors de votre entrevue avec le conseiller en carrière militaire;\n";
    txt += "• Si vous changez d’adresse ou d’état civil, vous devez nous aviser immédiatement afin que la bonne information se retrouve sur vos documents d’enrôlement;\n";
    txt += "• Si vous avez un changement au niveau médical, veuillez aviser la section médicale au poste 4909 le plus tôt possible avant votre enrôlement.\n\n";

    txt += "7. Informez-vous sur l’éthos des forces armées canadiennes en cliquant sur le lien suivant:\n";
    txt += "• Énoncé d'éthique de la Défense - Canada.ca (https://www.canada.ca/fr/ministere-defense-nationale/services/avantages-militaires/ethique-defense/publications-politiques/enonce.html)\n\n";

    txt += "Enrôlement administratif et assermentation:\n";
    txt += `Date: ${dateEnrol}\n`;
    txt += `Heure d’arrivée: ${heurePostulant}\n`;
    txt += `Heure de la présentation Teams pour les invités: ${heureInvites} via un lien qui sera envoyé le lundi de la semaine de votre enrôlement.\n`;
    txt += `Lieu: ${lieuEnrol}\n`;
    txt += "Habillement: tenue de ville propre\n\n";

    txt += "Unité d'affectation :\n";
    txt += `• Date d'arrivée : Vous devez vous présenter à ${nomUnite} le ${jourSemaine} : ${dateArriveeFormatted} au plus tard à 16h00.\n`;
    if (serie) {
      txt += `• Numéro du cours : ${serie}\n`;
      txt += `• Dates du cours : ${datesCours}\n`;
    }
    txt += "\n";

    txt += "Un retard lors de la journée de votre enrôlement n’est pas acceptable.\n\n";

    txt += "Pour toutes questions, veuillez contacter l’adresse courriel suivante \n";
    txt += ": appointments.montreal@forces.gc.ca\n\n";

    txt += "Merci de votre intérêt envers les Forces armées canadiennes,\n\n";
    txt += "«Veuillez prendre note que l’information que nous recueillons sert uniquement à des fins de sélection et d’emploi et elle ne peut être fournie qu’à d’autres employés autorisés du Ministère de la Défense nationale. En d’autres termes, il nous est interdit de divulguer sans votre consentement, des renseignements qui vous concernent à des gens comme des membres de votre famille, votre conjoint, votre employeur ou professeur. Si une personne non autorisée nous appelait pour poser des questions à votre sujet, nous lui dirions de communiquer avec vous. Par ailleurs, si vous désirez faire une demande d’accès à des renseignements personnels ou une demande de modification à des renseignements incorrects ou qui ne sont pas clairs, vous pouvez le faire par écrit en vertu de la Loi sur la protection des renseignements personnels.»\n\n";

    txt += this.getSignatureFr();

    return txt;
  }

  getOffreOtaSectionPlainEn(): string {
    const dateEnrol = this.offreDateEnrolement().trim() || 'day / month / year';
    const heurePostulant = this.offreHeureArriveePostulant() || '07h30';
    const heureInvites = this.offreHeureArriveeInvites() || '09h40';
    const lieuEnrol = 'Canadian Forces Recruiting Centre, 1600 René-Lévesque Boulevard West, Suite 140, Montreal, QC, H3H 1P9';
    const rawDateArrivee = this.offreDateArriveeUnite().trim();
    const jourSemaine = this.getJourSemaineEn(rawDateArrivee) || 'day of the week';
    const dateArriveeFormatted = rawDateArrivee || 'day / month / year';
    const unitObj = this.getUniteAffectationObj();
    const nomUnite = unitObj.nom || 'N/A';
    const serie = this.offreSerieCours().trim();
    const debut = this.offreDateCoursDebut().trim();
    const fin = this.offreDateCoursFin().trim();
    let datesCours = 'day / month / year to day / month / year';
    if (debut && fin) {
      datesCours = debut + ' to ' + fin;
    } else if (debut) {
      datesCours = debut;
    }

    const isUic3613 = this.isUic3613Selected();

    let txt = "Please read this email - carefully and in its entirety - in order to be prepared for your enrolment.\n\n";
    txt += "1. (If you have not already provided it) Submit (by email or phone) the following information, AS SOON AS POSSIBLE before your enrolment:\n";
    txt += "• Your Social Insurance Number;\n";
    txt += "• Your vehicle licence plate number (if used to travel to St-Jean);\n";
    txt += "• Contact information for an emergency contact: first and last name / home address including postal code / phone number / relationship to you (father, mother, brother, sister, spouse/partner, friend, etc.);\n";
    txt += "• Contact information for a beneficiary in the event of death who must be 18 years of age or older. The information you must provide about this person is: first and last name / home address including postal code / phone number / date of birth of the beneficiary: day, month, and year / relationship to you (father, mother, brother, sister, spouse/partner, friend, etc.);\n\n";

    txt += "2. If applicable, you must send a photo of the following documents by replying to this email:\n";
    txt += "• Birth certificates of your spouse/partner, your children (original copy);\n";
    txt += "• Marriage in Canada: marriage certificate (original copy);\n";
    txt += "• Marriage abroad: marriage certificate (original copy) - must be in French or English; if in another language, it must be accompanied by a certified translation;\n\n";

    txt += "3. Instructions regarding the following documents:\n";
    txt += `• 330-61-EN SSACF (https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf) : you must complete this form and bring it to ${nomUnite}. The sections of the form you must complete are from B to K;\n`;
    txt += "• Common-law_partership_procedure (https://simontheriault8-cyber.github.io/Documents/instruction%20UF%20en.pdf) : if your marital status is common-law, please review this document;\n";
    txt += "• Business casual examples (https://simontheriault8-cyber.github.io/Documents/Exemples%20-%20Tenue%20de%20ville.pdf), dress code for the ceremony;\n";
    if (isUic3613) {
      txt += "• CFLRS_Joining_Instructions_EN (https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf) : joining instructions for the Canadian Forces Leadership and Recruit School.\n";
    }
    txt += "\n";

    txt += "4. On the day of your enrolment, ensure you have the following documents in hand:\n";
    txt += "• Void cheque;\n";
    txt += "• Valid photo identification;\n";
    txt += "• Original birth certificate or citizenship certificate for yourself and your dependants if applicable;\n";
    txt += "• Common-law partner: proof of address as specified in the attached Word document;\n";
    txt += "• Provincial health insurance card of your spouse/partner, your children (original copy) if residing with you;\n";
    txt += "• Official court document if your marital status is divorced.\n\n";

    txt += "5. Photos on the day of enrolment:\n";
    txt += "• Bring your camera or mobile phone if you wish to take photos of the ceremony.\n\n";

    txt += "6. Information to report if specific events occur before your enrolment day:\n";
    txt += "• If you receive a ticket/fine before your enrolment, you must pay it and bring proof of payment. If you are unable to pay it, please contact us before your enrolment;\n";
    txt += "• If you have any legal obligations that were not declared during your interview with the military career counsellor;\n";
    txt += "• If you change your address or marital status, you must notify us immediately so that the correct information appears on your enrolment documents;\n";
    txt += "• If you experience any medical change, please notify the medical section at extension 4909 as soon as possible before your enrolment.\n\n";

    txt += "7. Learn about the Canadian Armed Forces ethos by clicking on the following link:\n";
    txt += "• Statement of Defence Ethics - Canada.ca (https://www.canada.ca/en/department-national-defence/services/benefits-military/defence-ethics/policies-publications/statement.html)\n\n";

    txt += "Administrative Enrolment and Swearing-in Ceremony:\n";
    txt += `Date: ${dateEnrol}\n`;
    txt += `Arrival time: ${heurePostulant}\n`;
    txt += `Teams presentation time for guests: ${heureInvites} via a link that will be sent on Monday of the week of your enrolment.\n`;
    txt += `Location: ${lieuEnrol}\n`;
    txt += "Dress: Clean business casual\n\n";

    txt += "Posting unit:\n";
    txt += `• Arrival date: You must report to ${nomUnite} on ${jourSemaine}: ${dateArriveeFormatted} by 16:00 at the latest.\n`;
    if (serie) {
      txt += `• Course number: ${serie}\n`;
      txt += `• Course dates: ${datesCours}\n`;
    }
    txt += "\n";

    txt += "Tardiness on the day of your enrolment is not acceptable.\n\n";

    txt += "For any questions, please contact the following email address:\n";
    txt += "appointments.montreal@forces.gc.ca\n\n";

    txt += "Thank you for your interest in the Canadian Armed Forces,\n\n";
    txt += "«Please note that the information we collect is used solely for selection and employment purposes and may only be provided to other authorized employees of the Department of National Defence. In other words, we are prohibited from disclosing, without your consent, information concerning you to individuals such as members of your family, your spouse, your employer, or your teacher. If an unauthorized person were to contact us with questions about you, we would instruct them to contact you directly. Furthermore, if you wish to submit a request for access to personal information or a request for correction of information that is incorrect or unclear, you may do so in writing pursuant to the Privacy Act.»\n\n";

    txt += this.getSignatureEn();

    return txt;
  }

  getOffreOtaEmailPlain(): string {
    const fr = "English message will follow.\n\n" + this.getOffreOtaSectionPlainFr();
    const en = this.getOffreOtaSectionPlainEn();
    return `${fr}\n\n______________________________________________________________________________\n\n${en}`;
  }

  getOffreOtaSectionHtmlFr(): string {
    const dateEnrol = this.offreDateEnrolement().trim() || 'jour / mois / année';
    const heurePostulant = this.offreHeureArriveePostulant() || '07h30';
    const heureInvites = this.offreHeureArriveeInvites() || '09h40';
    const lieuEnrolHtml = 'Centre de recrutement des Forces Canadiennes, 1600 boulevard René-Lévesque Ouest, bureau 140, Montréal, QC, H3H 1P9';
    const rawDateArrivee = this.offreDateArriveeUnite().trim();
    const jourSemaine = this.getJourSemaineFr(rawDateArrivee) || 'jour de la semaine';
    const dateArriveeFormatted = rawDateArrivee || 'jour / mois / année';
    const unitObj = this.getUniteAffectationObj();
    const nomUnite = unitObj.nom || 'N/A';
    const serie = this.offreSerieCours().trim();
    const debut = this.offreDateCoursDebut().trim();
    const fin = this.offreDateCoursFin().trim();
    let datesCours = 'jour / mois / année au jour / mois / année';
    if (debut && fin) {
      datesCours = debut + ' au ' + fin;
    } else if (debut) {
      datesCours = debut;
    }

    let html = '';
    
    // Header surligné en jaune
    html += `<p style="margin-bottom: 12px;"><span style="background-color: #ffff00;">Veuillez lire ce courriel - attentivement et au complet - afin d’être prêt pour votre enrôlement.</span></p>`;

    // 1.
    html += `<p style="margin-bottom: 6px;"><strong>1. (Si vous ne l’avez pas déjà fourni) Transmettre (par courriel ou par téléphone) l’information suivante, le PLUS RAPIDEMENT POSSIBLE avant votre enrôlement :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Votre numéro d’assurance social;</li>`;
    html += `<li>Le numéro d’immatriculation de votre véhicule (si utilisé pour aller à St-Jean);</li>`;
    html += `<li>Les coordonnées d’une <u><strong>personne à contacter en cas d'urgence</strong></u>: prénom et nom de famille / adresse du domicile incluant le code postal / numéro de téléphone / le lien que vous avez avec cette personne (père, mère, frère, sœur, conjoint(e), ami, etc.);</li>`;
    html += `<li>Les coordonnées d’un <u><strong>bénéficiaire en cas de décès</strong></u> qui doit être âgé de 18 ans ou plus. Les informations que vous devez fournir au sujet de cette personne sont : prénom et nom de famille / adresse du domicile incluant le code postal / numéro de téléphone / date de naissance du bénéficiaire: le jour, le mois et l’année / le lien que vous avez avec cette personne (père, mère, frère, sœur, conjoint(e), ami, etc.);</li>`;
    html += `</ul>`;

    // 2.
    html += `<p style="margin-bottom: 6px;"><strong>2. Si cela s’applique, vous devez envoyer une <span style="background-color: #ffff00;">photo</span> des documents suivant en répondant à ce courriel:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Certificats de naissance de votre conjoint(e), de vos enfants (copie originale);</li>`;
    html += `<li>Mariage au Canada: certificat de mariage (copie originale);</li>`;
    html += `<li>Mariage à l’étranger : certificat de mariage (copie originale) - doit être rédigé en français ou en anglais; s’il est écrit dans une autre langue, il doit être accompagné d’une traduction;</li>`;
    html += `</ul>`;

    const isUic3613 = this.isUic3613Selected();

    // 3.
    html += `<p style="margin-bottom: 6px;"><strong>3. Instruction concernant les documents suivants :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">TBS 330-61-FR</a> : vous devez compléter ce formulaire et l'apporter à ${nomUnite}. Les sections du formulaire que vous devez remplir sont de B à K;</li>`;
    html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/instruction%20UF.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Union de fait_procédure</a> : si votre état civil est conjoint de fait, veuillez prendre connaissance de ce document;</li>`;
    html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Exemples%20-%20Tenue%20de%20ville.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Exemples de tenue de ville</a>, tenue vestimentaire pour la cérémonie;</li>`;
    if (isUic3613) {
      html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Instruction_de_ralliement_ELRFC_FR</a> : instructions de ralliement pour l’École de leadership et de recrues des Forces canadiennes.</li>`;
    }
    html += `</ul>`;

    // 4.
    html += `<p style="margin-bottom: 6px;"><strong>4. La journée de votre enrôlement, assurez-vous d’avoir en main les documents suivants :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Spécimen de chèque;</li>`;
    html += `<li>Pièce d’identité valide avec photo;</li>`;
    html += `<li>Certificat de naissance ou de citoyenneté original de vous et de vos dépendants s’il y a lieu;</li>`;
    html += `<li>Conjoint de fait: preuves d’adresses comme spécifié dans le document Word en pièce jointe;</li>`;
    html += `<li>Carte d’assurance maladie provinciale de votre conjoint(e), de vos enfants (copie originale) s’il réside avec vous;</li>`;
    html += `<li>Preuve officielle de la Cour si votre état civil est divorcé.</li>`;
    html += `</ul>`;

    // 5.
    html += `<p style="margin-bottom: 6px;"><strong>5. Photo le jour de l’enrôlement:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Apportez votre appareil photo ou cellulaire si vous désirez avoir des photos de la cérémonie.</li>`;
    html += `</ul>`;

    // 6.
    html += `<p style="margin-bottom: 6px;"><strong>6. Information à communiquer si des événements particuliers se produisent avant la journée de votre enrôlement :</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Si vous recevez une contravention avant votre enrôlement, vous devez la payer et apporter la preuve de paiement. Si vous êtes dans l’impossibilité de la payer, veuillez nous contacter avant votre enrôlement;</li>`;
    html += `<li>Si vous avez des obligations envers la justice qui n’ont pas été déclarées lors de votre entrevue avec le conseiller en carrière militaire;</li>`;
    html += `<li>Si vous changez d’adresse ou d’état civil, vous devez nous aviser immédiatement afin que la bonne information se retrouve sur vos documents d’enrôlement;</li>`;
    html += `<li>Si vous avez un changement au niveau médical, veuillez aviser la section médicale au poste 4909 le plus tôt possible avant votre enrôlement.</li>`;
    html += `</ul>`;

    // 7.
    html += `<p style="margin-bottom: 6px;"><strong>7. Informez-vous sur l’éthos des forces armées canadiennes en cliquant sur le lien suivant:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 16px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li><a href="https://www.canada.ca/fr/ministere-defense-nationale/services/avantages-militaires/ethique-defense/publications-politiques/enonce.html" target="_blank" style="color: #2563eb; text-decoration: underline;">Énoncé d'éthique de la Défense - Canada.ca</a></li>`;
    html += `</ul>`;

    // Enrôlement administratif et assermentation
    html += `<p style="margin-bottom: 14px;"><u><strong>Enrôlement administratif et assermentation:</strong></u><br>`;
    html += `<strong>Date:</strong> ${dateEnrol}<br>`;
    html += `<strong>Heure d’arrivée:</strong> ${heurePostulant}<br>`;
    html += `<strong>Heure de la présentation Teams pour les invités:</strong> ${heureInvites} via un lien qui sera envoyé le lundi de la semaine de votre enrôlement.<br>`;
    html += `<strong>Lieu:</strong> ${lieuEnrolHtml}<br>`;
    html += `<strong>Habillement:</strong> tenue de ville propre</p>`;

    // Unité d'affectation
    html += `<p style="margin-bottom: 6px;"><u><strong>Unité d'affectation :</strong></u></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li><strong>Date d'arrivée :</strong> Vous devez vous présenter à ${nomUnite} le <strong>${jourSemaine} : ${dateArriveeFormatted}</strong> au plus tard à 16h00.</li>`;
    if (serie) {
      html += `<li><strong>Numéro du cours :</strong> ${serie}</li>`;
      html += `<li><strong>Dates du cours :</strong> ${datesCours}</li>`;
    }
    html += `</ul>`;

    // Avertissements
    html += `<p style="margin-bottom: 14px;"><span style="background-color: #ffff00;">Un retard lors de la journée de votre enrôlement n’est pas acceptable.</span></p>`;

    // Contact
    html += `<p style="margin-bottom: 14px;">Pour toutes questions, veuillez contacter l’adresse courriel suivante<br>`;
    html += `: <a href="mailto:appointments.montreal@forces.gc.ca" style="color: #2563eb; text-decoration: underline;">appointments.montreal@forces.gc.ca</a></p>`;

    html += `<p style="margin-bottom: 12px;">Merci de votre intérêt envers les Forces armées canadiennes,</p>`;

    // Mention légale de confidentialité en rouge et italique
    html += `<p style="color: #c00000; font-style: italic; font-size: 10pt; line-height: 1.4; margin-bottom: 16px;">«Veuillez prendre note que l’information que nous recueillons sert uniquement à des fins de sélection et d’emploi et elle ne peut être fournie qu’à d’autres employés autorisés du Ministère de la Défense nationale. En d’autres termes, il nous est interdit de divulguer sans votre consentement, des renseignements qui vous concernent à des gens comme des membres de votre famille, votre conjoint, votre employeur ou professeur. Si une personne non autorisée nous appelait pour poser des questions à votre sujet, nous lui dirions de communiquer avec vous. Par ailleurs, si vous désirez faire une demande d’accès à des renseignements personnels ou une demande de modification à des renseignements incorrects ou qui ne sont pas clairs, vous pouvez le faire par écrit en vertu de la Loi sur la protection des renseignements personnels.»</p>`;

    // Signature
    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    return html;
  }

  getOffreOtaSectionHtmlEn(): string {
    const dateEnrol = this.offreDateEnrolement().trim() || 'day / month / year';
    const heurePostulant = this.offreHeureArriveePostulant() || '07h30';
    const heureInvites = this.offreHeureArriveeInvites() || '09h40';
    const lieuEnrolHtml = 'Canadian Forces Recruiting Centre, 1600 René-Lévesque Boulevard West, Suite 140, Montreal, QC, H3H 1P9';
    const rawDateArrivee = this.offreDateArriveeUnite().trim();
    const jourSemaine = this.getJourSemaineEn(rawDateArrivee) || 'day of the week';
    const dateArriveeFormatted = rawDateArrivee || 'day / month / year';
    const unitObj = this.getUniteAffectationObj();
    const nomUnite = unitObj.nom || 'N/A';
    const serie = this.offreSerieCours().trim();
    const debut = this.offreDateCoursDebut().trim();
    const fin = this.offreDateCoursFin().trim();
    let datesCours = 'day / month / year to day / month / year';
    if (debut && fin) {
      datesCours = debut + ' to ' + fin;
    } else if (debut) {
      datesCours = debut;
    }

    let html = '';
    
    // Header surligné en jaune
    html += `<p style="margin-bottom: 12px;"><span style="background-color: #ffff00;">Please read this email - carefully and in its entirety - in order to be prepared for your enrolment.</span></p>`;

    // 1.
    html += `<p style="margin-bottom: 6px;"><strong>1. (If you have not already provided it) Submit (by email or phone) the following information, AS SOON AS POSSIBLE before your enrolment:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Your Social Insurance Number;</li>`;
    html += `<li>Your vehicle licence plate number (if used to travel to St-Jean);</li>`;
    html += `<li>Contact information for an <u><strong>emergency contact</strong></u>: first and last name / home address including postal code / phone number / relationship to you (father, mother, brother, sister, spouse/partner, friend, etc.);</li>`;
    html += `<li>Contact information for a <u><strong>beneficiary in the event of death</strong></u> who must be 18 years of age or older. The information you must provide about this person is: first and last name / home address including postal code / phone number / date of birth of the beneficiary: day, month, and year / relationship to you (father, mother, brother, sister, spouse/partner, friend, etc.);</li>`;
    html += `</ul>`;

    // 2.
    html += `<p style="margin-bottom: 6px;"><strong>2. If applicable, you must send a <span style="background-color: #ffff00;">photo</span> of the following documents by replying to this email:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Birth certificates of your spouse/partner, your children (original copy);</li>`;
    html += `<li>Marriage in Canada: marriage certificate (original copy);</li>`;
    html += `<li>Marriage abroad: marriage certificate (original copy) - must be in French or English; if in another language, it must be accompanied by a certified translation;</li>`;
    html += `</ul>`;

    const isUic3613 = this.isUic3613Selected();

    // 3.
    html += `<p style="margin-bottom: 6px;"><strong>3. Instructions regarding the following documents:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">330-61-EN SSACF</a> : you must complete this form and bring it to ${nomUnite}. The sections of the form you must complete are from B to K;</li>`;
    html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/instruction%20UF%20en.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Common-law_partership_procedure</a> : if your marital status is common-law, please review this document;</li>`;
    html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Exemples%20-%20Tenue%20de%20ville.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Business casual examples</a>, dress code for the ceremony;</li>`;
    if (isUic3613) {
      html += `<li><a href="https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">CFLRS_Joining_Instructions_EN</a> : joining instructions for the Canadian Forces Leadership and Recruit School.</li>`;
    }
    html += `</ul>`;

    // 4.
    html += `<p style="margin-bottom: 6px;"><strong>4. On the day of your enrolment, ensure you have the following documents in hand:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Void cheque;</li>`;
    html += `<li>Valid photo identification;</li>`;
    html += `<li>Original birth certificate or citizenship certificate for yourself and your dependants if applicable;</li>`;
    html += `<li>Common-law partner: proof of address as specified in the attached Word document;</li>`;
    html += `<li>Provincial health insurance card of your spouse/partner, your children (original copy) if residing with you;</li>`;
    html += `<li>Official court document if your marital status is divorced.</li>`;
    html += `</ul>`;

    // 5.
    html += `<p style="margin-bottom: 6px;"><strong>5. Photos on the day of enrolment:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>Bring your camera or mobile phone if you wish to take photos of the ceremony.</li>`;
    html += `</ul>`;

    // 6.
    html += `<p style="margin-bottom: 6px;"><strong>6. Information to report if specific events occur before your enrolment day:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li>If you receive a ticket/fine before your enrolment, you must pay it and bring proof of payment. If you are unable to pay it, please contact us before your enrolment;</li>`;
    html += `<li>If you have any legal obligations that were not declared during your interview with the military career counsellor;</li>`;
    html += `<li>If you change your address or marital status, you must notify us immediately so that the correct information appears on your enrolment documents;</li>`;
    html += `<li>If you experience any medical change, please notify the medical section at extension 4909 as soon as possible before your enrolment.</li>`;
    html += `</ul>`;

    // 7.
    html += `<p style="margin-bottom: 6px;"><strong>7. Learn about the Canadian Armed Forces ethos by clicking on the following link:</strong></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 16px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li><a href="https://www.canada.ca/en/department-national-defence/services/benefits-military/defence-ethics/policies-publications/statement.html" target="_blank" style="color: #2563eb; text-decoration: underline;">Statement of Defence Ethics - Canada.ca</a></li>`;
    html += `</ul>`;

    // Enrôlement administratif et assermentation
    html += `<p style="margin-bottom: 14px;"><u><strong>Administrative Enrolment and Swearing-in Ceremony:</strong></u><br>`;
    html += `<strong>Date:</strong> ${dateEnrol}<br>`;
    html += `<strong>Arrival time:</strong> ${heurePostulant}<br>`;
    html += `<strong>Teams presentation time for guests:</strong> ${heureInvites} via a link that will be sent on Monday of the week of your enrolment.<br>`;
    html += `<strong>Location:</strong> ${lieuEnrolHtml}<br>`;
    html += `<strong>Dress:</strong> Clean business casual</p>`;

    // Unité d'affectation
    html += `<p style="margin-bottom: 6px;"><u><strong>Posting unit:</strong></u></p>`;
    html += `<ul style="margin-top: 0; margin-bottom: 14px; padding-left: 20px; list-style-type: disc;">`;
    html += `<li><strong>Arrival date:</strong> You must report to ${nomUnite} on <strong>${jourSemaine} : ${dateArriveeFormatted}</strong> by 16:00 at the latest.</li>`;
    if (serie) {
      html += `<li><strong>Course number:</strong> ${serie}</li>`;
      html += `<li><strong>Course dates:</strong> ${datesCours}</li>`;
    }
    html += `</ul>`;

    // Avertissements
    html += `<p style="margin-bottom: 14px;"><span style="background-color: #ffff00;">Tardiness on the day of your enrolment is not acceptable.</span></p>`;

    // Contact
    html += `<p style="margin-bottom: 14px;">For any questions, please contact the following email address<br>`;
    html += `: <a href="mailto:appointments.montreal@forces.gc.ca" style="color: #2563eb; text-decoration: underline;">appointments.montreal@forces.gc.ca</a></p>`;

    html += `<p style="margin-bottom: 12px;">Thank you for your interest in the Canadian Armed Forces,</p>`;

    // Mention légale de confidentialité en rouge et italique
    html += `<p style="color: #c00000; font-style: italic; font-size: 10pt; line-height: 1.4; margin-bottom: 16px;">«Please note that the information we collect is used solely for selection and employment purposes and may only be provided to other authorized employees of the Department of National Defence. In other words, we are prohibited from disclosing, without your consent, information concerning you to individuals such as members of your family, your spouse, your employer, or your teacher. If an unauthorized person were to contact us with questions about you, we would instruct them to contact you directly. Furthermore, if you wish to submit a request for access to personal information or a request for correction of information that is incorrect or unclear, you may do so in writing pursuant to the Privacy Act.»</p>`;

    // Signature
    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    return html;
  }

  getOffreOtaEmailHtml(): string {
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000; line-height: 1.4;">`;
    html += `<p><strong>English message will follow.</strong></p>`;
    html += this.getOffreOtaSectionHtmlFr();
    html += `<br><hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"><br>`;
    html += this.getOffreOtaSectionHtmlEn();
    html += `</div>`;
    return html;
  }

  getOffreNormaleEmailPlain(): string {
    if (this.evaluationMedicaleType() === 'Dossier OTA') {
      return this.getOffreOtaEmailPlain();
    }
    const metier = this.offreMetier();
    const prog = this.offreProgrammeEnrolement();
    const elem = this.offreElement();
    const dateEnrolFr = this.getOffreDateEnrolementFull('fr');
    const dateEnrolEn = this.getOffreDateEnrolementFull('en');
    const selectedCenter = this.getSelectedRecruitmentCenter();
    const lieuEnrolFr = selectedCenter ? selectedCenter.fullFr : this.offreLieuEnrolement();
    const lieuEnrolEn = selectedCenter ? selectedCenter.fullEn : this.offreLieuEnrolement();
    const dateArrivee = this.getOffreDateArriveeUniteFull();
    const datesCours = this.getOffreDatesCoursFull();
    const hasCourseDates = !!this.offreSerieCours().trim() && !!datesCours;

    let fr = "English message will follow.\n\n";
    fr += "Bonjour,\n\n";
    fr += "Tout d’abord, je tiens à vous féliciter d’avoir complété le processus de sélection des Forces armées Canadiennes.\n\n";
    fr += "Vous trouverez, plus bas, les détails de l’offre d’emploi discutée aujourd’hui :\n\n";
    fr += `Métier :    ${metier}\n`;
    fr += `Programme d’enrôlement :        ${prog}\n`;
    fr += `Élément :                             ${elem}\n\n`;
    fr += `Date d’enrôlement :   ${dateEnrolFr}\n`;
    fr += `Lieu de l’enrôlement : ${lieuEnrolFr}\n`;
    fr += "Stationnement : Veuillez prévoir du temps supplémentaire pour trouver une place de stationnement, car les espaces disponibles autour du bâtiment sont limités. Faites attention où vous stationnerez afin d’éviter de faire remorquer votre véhicule ou d’avoir une contravention.   \n";
    fr += this.getTeamsLinkPlainFr();
    fr += `Unité d’affectation : ${this.getUniteAffectationObj().nom}\n${this.getUniteAffectationObj().adressePlain}\n\n`;
    fr += `Date d’arrivée à votre unité:  ${dateArrivee}\n`;
    if (hasCourseDates) {
      fr += `Vos dates de cours :      ${datesCours}\n`;
    }
    fr += `\n\n`;
    const { dateLimiteStr, elementsPlain } = this.getElementsManquantsBlocks('fr');
    fr += `Veuillez me faire parvenir les éléments suivant au plus tard le${dateLimiteStr} :\n\n`;
    fr += elementsPlain;
    fr += this.getOffreFormulairesSupplementairesPlain('fr');
    fr += this.getOffreLinksBlockPlain('fr');
    fr += this.getOffreEvenementsParticuliersPlainFr();
    fr += "Pour toute autre question, n’hésitez pas à communiquer avec moi. \n\n\n";
    fr += "Merci, bonne journée\n\n";
    fr += this.getSignatureFr();

    let en = "Hello,\n\n";
    en += "First of all, I would like to congratulate you on completing the selection process for the Canadian Armed Forces.\n\n";
    en += "Below you will find the details of the job offer discussed today:\n\n";
    en += `Occupation:    ${metier}\n`;
    en += `Enrolment program:        ${prog}\n`;
    en += `Element:                             ${elem}\n\n`;
    en += `Enrolment date:   ${dateEnrolEn}\n`;
    en += `Enrolment location: ${lieuEnrolEn}\n`;
    en += "Parking: Please allow extra time to find a parking space, as available spaces around the building are limited. Please be careful where you park to avoid having your vehicle towed or receiving a parking ticket.   \n";
    en += this.getTeamsLinkPlainEn();
    en += `Posting unit: ${this.getUniteAffectationObj().nom}\n${this.getUniteAffectationObj().adressePlain}\n\n`;
    en += `Arrival date at your unit:  ${dateArrivee}\n`;
    if (hasCourseDates) {
      en += `Your course dates:      ${datesCours}\n`;
    }
    en += `\n\n`;
    const blocksEn = this.getElementsManquantsBlocks('en');
    en += `Please send me the following items no later than${blocksEn.dateLimiteStr}:\n\n`;
    en += blocksEn.elementsPlain;
    en += this.getOffreFormulairesSupplementairesPlain('en');
    en += this.getOffreLinksBlockPlain('en');
    en += this.getOffreEvenementsParticuliersPlainEn();
    en += "If you have any further questions, please do not hesitate to contact me. \n\n\n";
    en += "Thank you, have a nice day\n\n";
    en += this.getSignatureEn();

    return `${fr}\n\n______________________________________________________________________________\n\n${en}`;
  }

  private isConjointDeFaitSelected(): boolean {
    const st = (this.noteStatutCivil() || '').toLowerCase();
    return st.includes('conjoint');
  }

  getTeamsLinkPlainFr(): string {
    const city = this.offreLieuVille();
    if (city === 'Montréal') {
      return "Lien pour assister à la cérémonie par Teams : https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn\n\n\n";
    } else if (city === 'Québec') {
      return "Lien pour assister à la cérémonie par Teams : https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U\n\n\n";
    }
    return "\n\n";
  }

  getTeamsLinkPlainEn(): string {
    const city = this.offreLieuVille();
    if (city === 'Montréal') {
      return "Link to attend the ceremony via Teams: https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn\n\n\n";
    } else if (city === 'Québec') {
      return "Link to attend the ceremony via Teams: https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U\n\n\n";
    }
    return "\n\n";
  }

  getTeamsLinkHtmlFr(): string {
    const city = this.offreLieuVille();
    if (city === 'Montréal') {
      return `<p><strong>Lien pour assister à la cérémonie par Teams :</strong> <a href="https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn" target="_blank" style="color: #2563eb; text-decoration: underline;">https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn</a></p>`;
    } else if (city === 'Québec') {
      return `<p><strong>Lien pour assister à la cérémonie par Teams :</strong> <a href="https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U" target="_blank" style="color: #2563eb; text-decoration: underline;">https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U</a></p>`;
    }
    return "";
  }

  getTeamsLinkHtmlEn(): string {
    const city = this.offreLieuVille();
    if (city === 'Montréal') {
      return `<p><strong>Link to attend the ceremony via Teams:</strong> <a href="https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn" target="_blank" style="color: #2563eb; text-decoration: underline;">https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn</a></p>`;
    } else if (city === 'Québec') {
      return `<p><strong>Link to attend the ceremony via Teams:</strong> <a href="https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U" target="_blank" style="color: #2563eb; text-decoration: underline;">https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U</a></p>`;
    }
    return "";
  }

  getOffreLinksBlockPlain(lang: 'fr' | 'en'): string {
    const isConjoint = this.isConjointDeFaitSelected();
    const uniteNom = this.getUniteAffectationObj().nom;
    const isUic3613 = this.isUic3613Selected();

    if (lang === 'fr') {
      let res = '';
      if (isUic3613) {
        if (isConjoint) {
          res += `Voici les liens vers vos instructions de ralliement, instruction pour union de fait et votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.\n`;
          res += "Instructions de ralliement (QMB/QMBO) : https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf\n";
          res += "Instruction union de fait : https://simontheriault8-cyber.github.io/Documents/instruction%20UF.pdf\n";
          res += "Demande de cote de sécurité (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf\n";
        } else {
          res += `Voici les liens vers vos instructions de ralliement et votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.\n`;
          res += "Instructions de ralliement (QMB/QMBO) : https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf\n";
          res += "Demande de cote de sécurité (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf\n";
        }
      } else {
        if (isConjoint) {
          res += `Voici les liens vers votre instruction pour union de fait et votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.\n`;
          res += "Instruction union de fait : https://simontheriault8-cyber.github.io/Documents/instruction%20UF.pdf\n";
          res += "Demande de cote de sécurité (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf\n";
        } else {
          res += `Voici le lien vers votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.\n`;
          res += "Demande de cote de sécurité (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf\n";
        }
      }

      res += "Voici un exemple de tenue de ville, tenue vestimentaire pour la cérémonie : https://simontheriault8-cyber.github.io/Documents/Exemples - Tenue de ville.pdf\n";
      res += "\n\n\n";
      return res;
    } else {
      let res = '';
      if (isUic3613) {
        if (isConjoint) {
          res += `Here are the links to your joining instructions, common-law partnership instructions and your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.\n`;
          res += "Joining Instructions (BMQ/BMOQ) : https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf\n";
          res += "Common-Law partnership instruction : https://simontheriault8-cyber.github.io/Documents/instruction%20UF%20en.pdf\n";
          res += "Security Screening Application (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf\n";
        } else {
          res += `Here are the links to your joining instructions and your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.\n`;
          res += "Joining Instructions (BMQ/BMOQ) : https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf\n";
          res += "Security Screening Application (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf\n";
        }
      } else {
        if (isConjoint) {
          res += `Here are the links to your common-law partnership instructions and your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.\n`;
          res += "Common-Law partnership instruction : https://simontheriault8-cyber.github.io/Documents/instruction%20UF%20en.pdf\n";
          res += "Security Screening Application (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf\n";
        } else {
          res += `Here is the link to your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.\n`;
          res += "Security Screening Application (TBS330-61) : https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf\n";
        }
      }

      res += "Here is an example of business casual / dress code for the ceremony : https://simontheriault8-cyber.github.io/Documents/Exemples - Tenue de ville.pdf\n";
      res += "\n\n\n";
      return res;
    }
  }

  getOffreLinksBlockHtml(lang: 'fr' | 'en'): string {
    const isConjoint = this.isConjointDeFaitSelected();
    const uniteNom = this.getUniteAffectationObj().nom;
    const isUic3613 = this.isUic3613Selected();

    if (lang === 'fr') {
      let res = '<p>';
      if (isUic3613) {
        if (isConjoint) {
          res += `Voici les liens vers vos instructions de ralliement, instruction pour union de fait et votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Instructions de ralliement (QMB/QMBO)</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/instruction%20UF.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Instruction union de fait</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Demande de cote de sécurité (TBS330-61)</a>`;
        } else {
          res += `Voici les liens vers vos instructions de ralliement et votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Instructions de ralliement (QMB/QMBO)</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Demande de cote de sécurité (TBS330-61)</a>`;
        }
      } else {
        if (isConjoint) {
          res += `Voici les liens vers votre instruction pour union de fait et votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/instruction%20UF.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Instruction union de fait</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Demande de cote de sécurité (TBS330-61)</a>`;
        } else {
          res += `Voici le lien vers votre demande de cote de sécurité (TBS330-61). La demande de cote de sécurité devra être complété de la section B à la section K et apporté à : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/TBS%20330-61-Formulaire%20de%20consentement%20et%20de%20demande%20de%20filtrage%20de%20s%C3%A9curit%C3%A9.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Demande de cote de sécurité (TBS330-61)</a>`;
        }
      }

      res += `<br>Voici un exemple de tenue de ville, tenue vestimentaire pour la cérémonie : <a href="https://simontheriault8-cyber.github.io/Documents/Exemples - Tenue de ville.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Tenue de ville</a>`;
      res += `</p>`;
      return res;
    } else {
      let res = '<p>';
      if (isUic3613) {
        if (isConjoint) {
          res += `Here are the links to your joining instructions, common-law partnership instructions and your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Joining Instructions (BMQ/BMOQ)</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/instruction%20UF%20en.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Common-Law partnership instruction</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Security Screening Application (TBS330-61)</a>`;
        } else {
          res += `Here are the links to your joining instructions and your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Joining Instructions (BMQ/BMOQ)</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Security Screening Application (TBS330-61)</a>`;
        }
      } else {
        if (isConjoint) {
          res += `Here are the links to your common-law partnership instructions and your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.\n`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/instruction%20UF%20en.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Common-Law partnership instruction</a><br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Security Screening Application (TBS330-61)</a>`;
        } else {
          res += `Here is the link to your security screening application (TBS330-61). The security screening application must be completed from section B to section K and brought to : ${uniteNom}.<br>`;
          res += `<a href="https://simontheriault8-cyber.github.io/Documents/330-61-Security%20Screening%20Application%20and%20Consent%20Form.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Security Screening Application (TBS330-61)</a>`;
        }
      }

      res += `<br>Here is an example of business casual / dress code for the ceremony : <a href="https://simontheriault8-cyber.github.io/Documents/Exemples - Tenue de ville.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Tenue de ville</a>`;
      res += `</p>`;
      return res;
    }
  }

  getOffreEvenementsParticuliersPlainFr(): string {
    let res = "Information à communiquer si des événements particuliers se produisent avant la journée de votre enrôlement :\n\n";
    res += "•\tSi vous recevez une contravention avant votre enrôlement, vous devez la payer et apporter la preuve de paiement. Si vous êtes dans l’impossibilité de la payer, veuillez nous contacter avant votre enrôlement;\n\n";
    res += "•\tSi vous avez des obligations envers la justice qui n’ont pas été déclarées lors de votre entrevue avec le conseiller en carrière militaire;\n\n";
    res += "•\tSi vous changez d’adresse ou d’état civil, vous devez nous aviser immédiatement afin que la bonne information se retrouve sur vos documents d’enrôlement;\n\n";
    res += "•\tSi vous avez un changement au niveau médical, veuillez aviser votre gestionnaire de dossier le plus tôt possible avant votre enrôlement.\n\n\n";
    return res;
  }

  getOffreEvenementsParticuliersPlainEn(): string {
    let res = "Information to report if specific events occur before the day of your enrolment:\n\n";
    res += "•\tIf you receive a ticket/fine before your enrolment, you must pay it and bring proof of payment. If you are unable to pay it, please contact us before your enrolment;\n\n";
    res += "•\tIf you have legal obligations that were not declared during your interview with the military career counsellor;\n\n";
    res += "•\tIf you change your address or marital status, you must notify us immediately so that the correct information appears on your enrolment documents;\n\n";
    res += "•\tIf you experience any medical changes, please notify your file manager as soon as possible before your enrolment.\n\n\n";
    return res;
  }

  getOffreEvenementsParticuliersHtmlFr(): string {
    return `<p style="margin-top: 10px; margin-bottom: 6px;"><strong>Information à communiquer si des événements particuliers se produisent avant la journée de votre enrôlement :</strong></p>
<ul style="list-style-type: disc; margin-top: 5px; margin-bottom: 15px; padding-left: 20px;">
  <li style="margin-bottom: 6px;">Si vous recevez une contravention avant votre enrôlement, vous devez la payer et apporter la preuve de paiement. Si vous êtes dans l’impossibilité de la payer, veuillez nous contacter avant votre enrôlement;</li>
  <li style="margin-bottom: 6px;">Si vous avez des obligations envers la justice qui n’ont pas été déclarées lors de votre entrevue avec le conseiller en carrière militaire;</li>
  <li style="margin-bottom: 6px;">Si vous changez d’adresse ou d’état civil, vous devez nous aviser immédiatement afin que la bonne information se retrouve sur vos documents d’enrôlement;</li>
  <li style="margin-bottom: 6px;">Si vous avez un changement au niveau médical, veuillez aviser votre gestionnaire de dossier le plus tôt possible avant votre enrôlement.</li>
</ul>`;
  }

  getOffreEvenementsParticuliersHtmlEn(): string {
    return `<p style="margin-top: 10px; margin-bottom: 6px;"><strong>Information to report if specific events occur before the day of your enrolment:</strong></p>
<ul style="list-style-type: disc; margin-top: 5px; margin-bottom: 15px; padding-left: 20px;">
  <li style="margin-bottom: 6px;">If you receive a ticket/fine before your enrolment, you must pay it and bring proof of payment. If you are unable to pay it, please contact us before your enrolment;</li>
  <li style="margin-bottom: 6px;">If you have legal obligations that were not declared during your interview with the military career counsellor;</li>
  <li style="margin-bottom: 6px;">If you change your address or marital status, you must notify us immediately so that the correct information appears on your enrolment documents;</li>
  <li style="margin-bottom: 6px;">If you experience any medical changes, please notify your file manager as soon as possible before your enrolment.</li>
</ul>`;
  }

  getOffreNormaleEmailHtml(): string {
    if (this.evaluationMedicaleType() === 'Dossier OTA') {
      return this.getOffreOtaEmailHtml();
    }
    const metier = this.offreMetier();
    const prog = this.offreProgrammeEnrolement();
    const elem = this.offreElement();
    const dateEnrolFr = this.getOffreDateEnrolementFull('fr');
    const dateEnrolEn = this.getOffreDateEnrolementFull('en');
    const selectedCenter = this.getSelectedRecruitmentCenter();
    const lieuEnrolFr = (selectedCenter ? selectedCenter.fullFr : this.offreLieuEnrolement()).replace(/\n/g, '<br>');
    const lieuEnrolEn = (selectedCenter ? selectedCenter.fullEn : this.offreLieuEnrolement()).replace(/\n/g, '<br>');
    const dateArrivee = this.getOffreDateArriveeUniteFull();
    const datesCours = this.getOffreDatesCoursFull();
    const hasCourseDates = !!this.offreSerieCours().trim() && !!datesCours;

    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;

    // --- FRENCH BLOCK ---
    html += `<p><strong>English message will follow.</strong></p>`;
    html += `<p>Bonjour,</p>`;
    html += `<p>Tout d’abord, je tiens à vous féliciter d’avoir complété le processus de sélection des Forces armées Canadiennes.</p>`;
    html += `<p>Vous trouverez, plus bas, les détails de l’offre d’emploi discutée aujourd’hui :</p>`;
    html += `<p><strong>Métier :</strong> ${metier}<br><strong>Programme d’enrôlement :</strong> ${prog}<br><strong>Élément :</strong> ${elem}</p>`;
    html += `<p><strong>Date d’enrôlement :</strong> ${dateEnrolFr}<br>`;
    html += `<strong>Lieu de l’enrôlement :</strong> ${lieuEnrolFr}<br>`;
    html += `<strong>Stationnement :</strong> Veuillez prévoir du temps supplémentaire pour trouver une place de stationnement, car les espaces disponibles autour du bâtiment sont limités. Faites attention où vous stationnerez afin d’éviter de faire remorquer votre véhicule ou d’avoir une contravention.<br>`;
    html += this.getTeamsLinkHtmlFr();
    html += `<p><strong>Unité d’affectation :</strong> ${this.getUniteAffectationObj().nom}<br>${this.getUniteAffectationObj().adresseHtml}<br>`;
    html += `<strong>Date d’arrivée à votre unité :</strong> ${dateArrivee}`;
    if (hasCourseDates) {
      html += `<br><strong>Vos dates de cours :</strong> ${datesCours}`;
    }
    html += `</p>`;
    const { dateLimiteStr, elementsHtmlList } = this.getElementsManquantsBlocks('fr');
    html += `<p>Veuillez me faire parvenir les éléments suivant au plus tard le${dateLimiteStr} :</p>`;
    html += elementsHtmlList;
    html += this.getOffreFormulairesSupplementairesHtml('fr');
    html += this.getOffreLinksBlockHtml('fr');
    html += this.getOffreEvenementsParticuliersHtmlFr();
    html += `<p>Pour toute autre question, n’hésitez pas à communiquer avec moi.</p>`;
    html += `<p>Merci, bonne journée</p>`;
    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    html += `<br><hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"><br>`;

    // --- ENGLISH BLOCK ---
    html += `<p>Hello,</p>`;
    html += `<p>First of all, I would like to congratulate you on completing the selection process for the Canadian Armed Forces.</p>`;
    html += `<p>Below you will find the details of the job offer discussed today:</p>`;
    html += `<p><strong>Occupation:</strong> ${metier}<br><strong>Enrolment program:</strong> ${prog}<br><strong>Element:</strong> ${elem}</p>`;
    html += `<p><strong>Enrolment date:</strong> ${dateEnrolEn}<br>`;
    html += `<strong>Enrolment location:</strong> ${lieuEnrolEn}<br>`;
    html += `<strong>Parking:</strong> Please allow extra time to find a parking space, as available spaces around the building are limited. Please be careful where you park to avoid having your vehicle towed or receiving a parking ticket.<br>`;
    html += this.getTeamsLinkHtmlEn();
    html += `<p><strong>Posting unit:</strong> ${this.getUniteAffectationObj().nom}<br>${this.getUniteAffectationObj().adresseHtml}<br>`;
    html += `<strong>Arrival date at your unit:</strong> ${dateArrivee}`;
    if (hasCourseDates) {
      html += `<br><strong>Your course dates:</strong> ${datesCours}`;
    }
    html += `</p>`;
    const blocksHtmlEn = this.getElementsManquantsBlocks('en');
    html += `<p>Please send me the following items no later than${blocksHtmlEn.dateLimiteStr}:</p>`;
    html += blocksHtmlEn.elementsHtmlList;
    html += this.getOffreFormulairesSupplementairesHtml('en');
    html += this.getOffreLinksBlockHtml('en');
    html += this.getOffreEvenementsParticuliersHtmlEn();
    html += `<p>If you have any further questions, please do not hesitate to contact me.</p>`;
    html += `<p>Thank you, have a nice day</p>`;
    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    html += `</div>`;
    return html;
  }

  getOffreEtudesSubventionneesEmailPlain(): string {
    if (this.evaluationMedicaleType() === 'Dossier OTA') {
      return this.getOffreOtaEmailPlain();
    }
    const metier = this.offreMetier();
    const prog = this.offreProgrammeEnrolement();
    const elem = this.offreElement();
    const dureeContrat = this.offreDureeContrat();
    const etudesSub = this.offreEtudesSubventionnees();
    const dureeEtudesSub = this.offreDureeEtudesSubventionnees();
    const dateEnrolFr = this.getOffreDateEnrolementFull('fr');
    const dateEnrolEn = this.getOffreDateEnrolementFull('en');
    const selectedCenter = this.getSelectedRecruitmentCenter();
    const lieuEnrolFr = selectedCenter ? selectedCenter.fullFr : this.offreLieuEnrolement();
    const lieuEnrolEn = selectedCenter ? selectedCenter.fullEn : this.offreLieuEnrolement();
    const dateArrivee = this.getOffreDateArriveeUniteFull();
    const datesCours = this.getOffreDatesCoursFull();
    const hasCourseDates = !!this.offreSerieCours().trim() && !!datesCours;

    let fr = "English message will follow.\n\n";
    fr += "Bonjour,\n\n";
    fr += "Tout d’abord, je tiens à vous féliciter d’avoir complété le processus de sélection des Forces armées Canadiennes.\n\n";
    fr += "Vous trouverez, plus bas, les détails de l’offre d’emploi discutée aujourd’hui :\n\n";
    fr += `Métier : ${metier}\n`;
    fr += `Programme d’enrôlement :     ${prog}\n`;
    fr += `Élément :      ${elem}\n`;
    fr += `Durée du contrat :    ${dureeContrat}\n`;
    fr += `Études subventionnées :     ${etudesSub}\n`;
    fr += `Durée des études subventionnées :     ${dureeEtudesSub}\n\n`;
    fr += `Date d’enrôlement :   ${dateEnrolFr}\n`;
    fr += `Lieu de l’enrôlement : ${lieuEnrolFr}\n`;
    fr += "Stationnement : Veuillez prévoir du temps supplémentaire pour trouver une place de stationnement, car les espaces disponibles autour du bâtiment sont limités. Faites attention où vous stationnerez afin d’éviter de faire remorquer votre véhicule ou d’avoir une contravention.\n";
    fr += this.getTeamsLinkPlainFr();
    fr += `Unité d’affectation : ${this.getUniteAffectationObj().nom}\n${this.getUniteAffectationObj().adressePlain}\n\n`;
    fr += `Date d’arrivée à votre unité:  ${dateArrivee}\n`;
    if (hasCourseDates) {
      fr += `Vos dates de cours :    ${datesCours}\n`;
    }
    fr += `\n\n`;
    const { dateLimiteStr, elementsPlain } = this.getElementsManquantsBlocks('fr');
    fr += `Veuillez prendre connaissance des documents joints au courriel et me retourner les documents suivants au plus tard le${dateLimiteStr} :\n\n`;
    fr += elementsPlain;
    fr += this.getOffreFormulairesSupplementairesPlain('fr');
    fr += this.getOffreLinksBlockPlain('fr');
    fr += this.getOffreEvenementsParticuliersPlainFr();
    fr += "Pour toute autre question, n’hésitez pas à communiquer avec moi. \n\n\n";
    fr += this.getSignatureFr();

    let en = "Hello,\n\n";
    en += "First of all, I would like to congratulate you on completing the selection process for the Canadian Armed Forces.\n\n";
    en += "Below you will find the details of the job offer discussed today:\n\n";
    en += `Occupation: ${metier}\n`;
    en += `Enrolment program:     ${prog}\n`;
    en += `Element:      ${elem}\n`;
    en += `Contract duration:    ${dureeContrat}\n`;
    en += `Subsidized education:     ${etudesSub}\n`;
    en += `Subsidized education duration:     ${dureeEtudesSub}\n\n`;
    en += `Enrolment date:   ${dateEnrolEn}\n`;
    en += `Enrolment location: ${lieuEnrolEn}\n`;
    en += "Parking: Please allow extra time to find a parking space, as available spaces around the building are limited. Please be careful where you park to avoid having your vehicle towed or receiving a parking ticket.\n";
    en += this.getTeamsLinkPlainEn();
    en += `Posting unit: ${this.getUniteAffectationObj().nom}\n${this.getUniteAffectationObj().adressePlain}\n\n`;
    en += `Arrival date at your unit:  ${dateArrivee}\n`;
    if (hasCourseDates) {
      en += `Your course dates:    ${datesCours}\n`;
    }
    en += `\n\n`;
    const blocksSubEn = this.getElementsManquantsBlocks('en');
    en += `Please review the documents attached to this email and return the following documents to me no later than${blocksSubEn.dateLimiteStr}:\n\n`;
    en += blocksSubEn.elementsPlain;
    en += this.getOffreFormulairesSupplementairesPlain('en');
    en += this.getOffreLinksBlockPlain('en');
    en += this.getOffreEvenementsParticuliersPlainEn();
    en += "If you have any further questions, please do not hesitate to contact me. \n\n\n";
    en += this.getSignatureEn();

    return `${fr}\n\n______________________________________________________________________________\n\n${en}`;
  }

  getOffreEtudesSubventionneesEmailHtml(): string {
    if (this.evaluationMedicaleType() === 'Dossier OTA') {
      return this.getOffreOtaEmailHtml();
    }
    const metier = this.offreMetier();
    const prog = this.offreProgrammeEnrolement();
    const elem = this.offreElement();
    const dureeContrat = this.offreDureeContrat();
    const etudesSub = this.offreEtudesSubventionnees();
    const dureeEtudesSub = this.offreDureeEtudesSubventionnees();
    const dateEnrolFr = this.getOffreDateEnrolementFull('fr');
    const dateEnrolEn = this.getOffreDateEnrolementFull('en');
    const selectedCenter = this.getSelectedRecruitmentCenter();
    const lieuEnrolFr = (selectedCenter ? selectedCenter.fullFr : this.offreLieuEnrolement()).replace(/\n/g, '<br>');
    const lieuEnrolEn = (selectedCenter ? selectedCenter.fullEn : this.offreLieuEnrolement()).replace(/\n/g, '<br>');
    const dateArrivee = this.getOffreDateArriveeUniteFull();
    const datesCours = this.getOffreDatesCoursFull();
    const hasCourseDates = !!this.offreSerieCours().trim() && !!datesCours;

    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;

    // --- FRENCH BLOCK ---
    html += `<p><strong>English message will follow.</strong></p>`;
    html += `<p>Bonjour,</p>`;
    html += `<p>Tout d’abord, je tiens à vous féliciter d’avoir complété le processus de sélection des Forces armées Canadiennes.</p>`;
    html += `<p>Vous trouverez, plus bas, les détails de l’offre d’emploi discutée aujourd’hui :</p>`;
    html += `<p><strong>Métier :</strong> ${metier}<br><strong>Programme d’enrôlement :</strong> ${prog}<br><strong>Élément :</strong> ${elem}<br><strong>Durée du contrat :</strong> ${dureeContrat}<br><strong>Études subventionnées :</strong> ${etudesSub}<br><strong>Durée des études subventionnées :</strong> ${dureeEtudesSub}</p>`;
    html += `<p><strong>Date d’enrôlement :</strong> ${dateEnrolFr}<br>`;
    html += `<strong>Lieu de l’enrôlement :</strong> ${lieuEnrolFr}<br>`;
    html += `<strong>Stationnement :</strong> Veuillez prévoir du temps supplémentaire pour trouver une place de stationnement, car les espaces disponibles autour du bâtiment sont limités. Faites attention où vous stationnerez afin d’éviter de faire remorquer votre véhicule ou d’avoir une contravention.<br>`;
    html += this.getTeamsLinkHtmlFr();
    html += `<p><strong>Unité d’affectation :</strong> ${this.getUniteAffectationObj().nom}<br>${this.getUniteAffectationObj().adresseHtml}<br>`;
    html += `<strong>Date d’arrivée à votre unité :</strong> ${dateArrivee}`;
    if (hasCourseDates) {
      html += `<br><strong>Vos dates de cours :</strong> ${datesCours}`;
    }
    html += `</p>`;
    const { dateLimiteStr, elementsHtmlList } = this.getElementsManquantsBlocks('fr');
    html += `<p>Veuillez prendre connaissance des documents joints au courriel et me retourner les documents suivants au plus tard le${dateLimiteStr} :</p>`;
    html += elementsHtmlList;
    html += this.getOffreFormulairesSupplementairesHtml('fr');
    html += this.getOffreLinksBlockHtml('fr');
    html += this.getOffreEvenementsParticuliersHtmlFr();
    html += `<p>Pour toute autre question, n’hésitez pas à communiquer avec moi.</p>`;
    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    html += `<br><hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"><br>`;

    // --- ENGLISH BLOCK ---
    html += `<p>Hello,</p>`;
    html += `<p>First of all, I would like to congratulate you on completing the selection process for the Canadian Armed Forces.</p>`;
    html += `<p>Below you will find the details of the job offer discussed today:</p>`;
    html += `<p><strong>Occupation:</strong> ${metier}<br><strong>Enrolment program:</strong> ${prog}<br><strong>Element:</strong> ${elem}<br><strong>Contract duration:</strong> ${dureeContrat}<br><strong>Subsidized education:</strong> ${etudesSub}<br><strong>Subsidized education duration:</strong> ${dureeEtudesSub}</p>`;
    html += `<p><strong>Enrolment date:</strong> ${dateEnrolEn}<br>`;
    html += `<strong>Enrolment location:</strong> ${lieuEnrolEn}<br>`;
    html += `<strong>Parking:</strong> Please allow extra time to find a parking space, as available spaces around the building are limited. Please be careful where you park to avoid having your vehicle towed or receiving a parking ticket.<br>`;
    html += this.getTeamsLinkHtmlEn();
    html += `<p><strong>Posting unit:</strong> ${this.getUniteAffectationObj().nom}<br>${this.getUniteAffectationObj().adresseHtml}<br>`;
    html += `<strong>Arrival date at your unit:</strong> ${dateArrivee}`;
    if (hasCourseDates) {
      html += `<br><strong>Your course dates:</strong> ${datesCours}`;
    }
    html += `</p>`;
    const blocksHtmlSubEn = this.getElementsManquantsBlocks('en');
    html += `<p>Please review the documents attached to this email and return the following documents to me no later than${blocksHtmlSubEn.dateLimiteStr}:</p>`;
    html += blocksHtmlSubEn.elementsHtmlList;
    html += this.getOffreFormulairesSupplementairesHtml('en');
    html += this.getOffreLinksBlockHtml('en');
    html += this.getOffreEvenementsParticuliersHtmlEn();
    html += `<p>If you have any further questions, please do not hesitate to contact me.</p>`;
    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    html += `</div>`;
    return html;
  }

  // --- CONSOLIDATED EMAIL LOGIC FOR MULTI-TASK SELECTION ---

  // Helper to extract plain text rejection body for French
  private getRejectionPlainBodyFr(): string {
    const structure = this.getStructuredRejections();
    if (structure.size === 0 && !this.forceGeneralReminder()) return "";

    const normalTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const confirmationTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const additionalDocTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();

    for (const [task, items] of structure.entries()) {
      const normalItems = items.filter((i) => !i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const confItems = items.filter((i) => i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const addItems = items.filter((i) => i.reason.isAdditionalDoc);

      if (normalItems.length > 0 || this.taskNotCompletedKeys().has(task.nameFr)) {
        normalTasks.set(task, normalItems);
      }
      if (confItems.length > 0) {
        confirmationTasks.set(task, confItems);
      }
      if (addItems.length > 0) {
        additionalDocTasks.set(task, addItems);
      }
    }

    let emailFr = "";

    if (normalTasks.size > 0) {
      emailFr += `Nous avons procédé à l'évaluation de vos documents. Bien que votre dossier progresse, certains éléments ne sont pas conformes et nécessitent des corrections de votre part pour nous permettre de poursuivre le traitement.\n\nLes tâches suivantes vous ont été réattribuées :`;
      for (const [task, items] of normalTasks.entries()) {
        const taskNameFr = task.nameFr;
        emailFr += `\n\n• ${taskNameFr}`;
        if (this.taskNotCompletedKeys().has(task.nameFr)) {
          emailFr += `\n    ◦ Vous n'avez pas complété cette tâche sur votre portail.`;
          emailFr += `\n      → Veuillez vous connecter à votre portail et la compléter.`;
        }
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} et ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1];
          }
          
          emailFr += `\n    ◦ ${doc.nameFr} : ${labelsStr}`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              emailFr += `\n      → ${this.cleanInstructionForText(item.reason.instructionFr, '        ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              emailFr += `\n      🔗 ${this.cleanInstructionForText(item.reason.linkFr, '        ')}`;
            }
          }
        }
      }
      emailFr += `\n\nEn raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées.\n\nRendez-vous sur votre portail pour les compléter : https://www.cafoap-pclfac.forces.gc.ca/`;
    }

    if (confirmationTasks.size > 0) {
      if (normalTasks.size > 0) {
        emailFr += `\n\nDe plus, nous avons besoin d'une confirmation de votre part. Veuillez répondre directement à ce courriel avec les informations demandées pour l'élément suivant :`;
      } else {
        emailFr += `Afin de poursuivre le traitement de votre dossier, nous avons besoin d'une confirmation de votre part. Veuillez répondre directement à ce courriel avec les informations demandées pour l'élément suivant :`;
      }
      for (const [task, items] of confirmationTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} et ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1];
          }
          
          emailFr += `\n\n• ${doc.nameFr} : ${labelsStr}`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              emailFr += `\n  → ${this.cleanInstructionForText(item.reason.instructionFr, '    ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              emailFr += `\n  🔗 ${this.cleanInstructionForText(item.reason.linkFr, '  ')}`;
            }
          }
        }
      }
    }

    if (additionalDocTasks.size > 0) {
      const dossierJobsFr = this.getDossierJobsSummaryTextFr();
      const generalAddDocs: { doc: any; docItems: any[] }[] = [];
      const occupSpecificDocs: { doc: any; docItems: any[] }[] = [];

      for (const [task, items] of additionalDocTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          if (this.isSubsidizedDoc(doc) || this.isTaskBasedAdditionalDoc(doc)) {
            generalAddDocs.push({ doc, docItems });
          } else {
            occupSpecificDocs.push({ doc, docItems });
          }
        }
      }

      if (normalTasks.size > 0 || confirmationTasks.size > 0) {
        emailFr += `\n\n--------------------------------------------------`;
      }

      if (generalAddDocs.length > 0) {
        emailFr += `\n\nAfin de compléter l'évaluation de votre demande d'emploi, nous aurons besoin de document(s) supplémentaire(s) :`;
        for (const { doc, docItems } of generalAddDocs) {
          emailFr += `\n\n• ${doc.nameFr}`;
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              emailFr += `\n  → ${this.cleanInstructionForText(item.reason.instructionFr, '    ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              emailFr += `\n  🔗 ${this.cleanInstructionForText(item.reason.linkFr, '  ')}`;
            }
          }
        }
      }

      const jobs = this.getDossierJobObjects();
      const jobDocsMapFr = new Map<JobEntry, string[]>();
      for (const job of jobs) {
        const reqs: string[] = [];
        for (const { doc, docItems } of occupSpecificDocs) {
          if (this.isAdditionalDocRequiredForJob(doc.nameFr, job.id)) {
            const isSelectedForJob = docItems.some((item: any) =>
              this.isJobReasonSelected(job, doc, item.reason)
            );
            if (isSelectedForJob) {
              const detail = this.getJobSpecificDocText(job.id, doc.nameFr, true);
              if (detail && !reqs.includes(detail)) {
                reqs.push(detail);
              }
            }
          }
        }
        if (reqs.length > 0) {
          jobDocsMapFr.set(job, reqs);
        }
      }

      if (jobDocsMapFr.size > 0) {
        const selectedJobsFr = Array.from(jobDocsMapFr.keys()).map(j => `${j.title} (${j.id})`).join(', ');
        const jobsHeaderTextFr = selectedJobsFr || dossierJobsFr;
        emailFr += `\n\nAfin d'évaluer votre dossier pour le(s) métier(s) sélectionné(s) (${jobsHeaderTextFr}), vous devez nous fournir le(s) document(s) supplémentaire(s) suivant(s) ou une(des) preuve(s) que vous remplissez la(les) condition(s) suivante(s) en réponse directe à ce courriel :`;
        for (const [job, reqs] of jobDocsMapFr.entries()) {
          emailFr += `\n\n• Pour ${job.id} - ${job.title} : ` + reqs.join(", ");
        }
      }
    }

    if (this.forceGeneralReminder()) {
      emailFr += `\n\nVeuillez également vous assurer de compléter les autres tâches manquantes sur votre portail.`;
    }

    emailFr += `\n\nSi vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.`;

    return emailFr;
  }

  // Helper to extract plain text rejection body for English
  private getRejectionPlainBodyEn(): string {
    const structure = this.getStructuredRejections();
    if (structure.size === 0 && !this.forceGeneralReminder()) return "";

    const normalTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const confirmationTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const additionalDocTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();

    for (const [task, items] of structure.entries()) {
      const normalItems = items.filter((i) => !i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const confItems = items.filter((i) => i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const addItems = items.filter((i) => i.reason.isAdditionalDoc);

      if (normalItems.length > 0 || this.taskNotCompletedKeys().has(task.nameFr)) {
        normalTasks.set(task, normalItems);
      }
      if (confItems.length > 0) {
        confirmationTasks.set(task, confItems);
      }
      if (addItems.length > 0) {
        additionalDocTasks.set(task, addItems);
      }
    }

    let emailEn = "";

    if (normalTasks.size > 0) {
      emailEn += `We have evaluated your documents. While your application is progressing, some items are not compliant and require corrections on your part to allow us to continue processing.\n\nThe following tasks have been reassigned to you:`;
      for (const [task, items] of normalTasks.entries()) {
        const taskNameEn = task.nameEn;
        emailEn += `\n\n• ${taskNameEn}`;
        if (this.taskNotCompletedKeys().has(task.nameFr)) {
          emailEn += `\n    ◦ You have not completed this task on your portal.`;
          emailEn += `\n      → Please log in to your portal and complete it.`;
        }
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelEn);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} and ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
          }
          
          emailEn += `\n    ◦ ${doc.nameEn} : ${labelsStr}`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionEn)) {
              uniqueInstructions.add(item.reason.instructionEn);
              emailEn += `\n      → ${this.cleanInstructionForText(item.reason.instructionEn, '        ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkEn && !uniqueLinks.has(item.reason.linkEn)) {
              uniqueLinks.add(item.reason.linkEn);
              emailEn += `\n      🔗 ${this.cleanInstructionForText(item.reason.linkEn, '        ')}`;
            }
          }
        }
      }
      emailEn += `\n\nDue to the high volume of applications, we must prioritize the processing of files where all tasks are complete.\n\nPlease log in to your portal to complete them: https://www.cafoap-pclfac.forces.gc.ca/`;
    }

    if (confirmationTasks.size > 0) {
      if (normalTasks.size > 0) {
        emailEn += `\n\nFurthermore, we require confirmation from you. Please reply directly to this email with the requested information for the following item:`;
      } else {
        emailEn += `To continue processing your application, we require confirmation from you. Please reply directly to this email with the requested information for the following item:`;
      }
      for (const [task, items] of confirmationTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelEn);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} and ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
          }
          
          emailEn += `\n\n• ${doc.nameEn} : ${labelsStr}`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionEn)) {
              uniqueInstructions.add(item.reason.instructionEn);
              emailEn += `\n  → ${this.cleanInstructionForText(item.reason.instructionEn, '    ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkEn && !uniqueLinks.has(item.reason.linkEn)) {
              uniqueLinks.add(item.reason.linkEn);
              emailEn += `\n  🔗 ${this.cleanInstructionForText(item.reason.linkEn, '  ')}`;
            }
          }
        }
      }
    }

    if (additionalDocTasks.size > 0) {
      const dossierJobsEn = this.getDossierJobsSummaryTextEn();
      const generalAddDocs: { doc: any; docItems: any[] }[] = [];
      const occupSpecificDocs: { doc: any; docItems: any[] }[] = [];

      for (const [task, items] of additionalDocTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          if (this.isSubsidizedDoc(doc) || this.isTaskBasedAdditionalDoc(doc)) {
            generalAddDocs.push({ doc, docItems });
          } else {
            occupSpecificDocs.push({ doc, docItems });
          }
        }
      }

      if (normalTasks.size > 0 || confirmationTasks.size > 0) {
        emailEn += `\n\n--------------------------------------------------`;
      }

      if (generalAddDocs.length > 0) {
        emailEn += `\n\nIn order to complete the evaluation of your employment application, we will need additional document(s):`;
        for (const { doc, docItems } of generalAddDocs) {
          emailEn += `\n\n• ${doc.nameEn}`;
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionEn)) {
              uniqueInstructions.add(item.reason.instructionEn);
              emailEn += `\n  → ${this.cleanInstructionForText(item.reason.instructionEn, '    ')}`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkEn && !uniqueLinks.has(item.reason.linkEn)) {
              uniqueLinks.add(item.reason.linkEn);
              emailEn += `\n  🔗 ${this.cleanInstructionForText(item.reason.linkEn, '  ')}`;
            }
          }
        }
      }

      const jobs = this.getDossierJobObjects();
      const jobDocsMapEn = new Map<JobEntry, string[]>();
      for (const job of jobs) {
        const reqs: string[] = [];
        for (const { doc, docItems } of occupSpecificDocs) {
          if (this.isAdditionalDocRequiredForJob(doc.nameFr, job.id)) {
            const isSelectedForJob = docItems.some((item: any) =>
              this.isJobReasonSelected(job, doc, item.reason)
            );
            if (isSelectedForJob) {
              const detail = this.getJobSpecificDocText(job.id, doc.nameFr, false);
              if (detail && !reqs.includes(detail)) {
                reqs.push(detail);
              }
            }
          }
        }
        if (reqs.length > 0) {
          jobDocsMapEn.set(job, reqs);
        }
      }

      if (jobDocsMapEn.size > 0) {
        const selectedJobsEn = Array.from(jobDocsMapEn.keys()).map(j => `${j.titleEn || j.title} (${j.id})`).join(', ');
        const jobsHeaderTextEn = selectedJobsEn || dossierJobsEn;
        emailEn += `\n\nIn order to evaluate your application for the selected occupation(s) (${jobsHeaderTextEn}), you must provide us with the following additional document(s) or proof that you meet the following condition(s) in direct reply to this email:`;
        for (const [job, reqs] of jobDocsMapEn.entries()) {
          emailEn += `\n\n• For ${job.id} - ${job.titleEn || job.title} : ` + reqs.join(", ");
        }
      }
    }

    if (this.forceGeneralReminder()) {
      emailEn += `\n\nPlease also ensure that you complete the other missing tasks on your portal.`;
    }

    emailEn += `\n\nIf you take no action, your file will be automatically deactivated after 30 days.`;

    return emailEn;
  }

  getRappelCeremonieTeamsPlainFr(): string {
    const city = this.rappelCeremonieLieu();
    if (city === 'Montréal') {
      return "Voici le lien Teams pour les invités à distance : Cérémonie d'assermentation 27 août 2026 | Rencontre-Participation | Microsoft Teams : https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn";
    } else if (city === 'Québec') {
      return "Voici le lien Teams pour les invités à distance : https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U";
    }
    return "";
  }

  getRappelCeremonieTeamsPlainEn(): string {
    const city = this.rappelCeremonieLieu();
    if (city === 'Montréal') {
      return "Here is the Teams link for remote guests: Cérémonie d'assermentation 27 août 2026 | Rencontre-Participation | Microsoft Teams : https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn";
    } else if (city === 'Québec') {
      return "Here is the Teams link for remote guests: https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U";
    }
    return "";
  }

  getRappelCeremonieTeamsHtmlFr(): string {
    const city = this.rappelCeremonieLieu();
    if (city === 'Montréal') {
      return `Voici le lien Teams pour les invités à distance : <a href="https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn" target="_blank" style="color: #2563eb; text-decoration: underline;">Cérémonie d'assermentation 27 août 2026 | Rencontre-Participation | Microsoft Teams</a>`;
    } else if (city === 'Québec') {
      return `Voici le lien Teams pour les invités à distance : <a href="https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U" target="_blank" style="color: #2563eb; text-decoration: underline;">https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U</a>`;
    }
    return "";
  }

  getRappelCeremonieTeamsHtmlEn(): string {
    const city = this.rappelCeremonieLieu();
    if (city === 'Montréal') {
      return `Here is the Teams link for remote guests: <a href="https://teams.microsoft.com/meet/269424678350987?p=U8W17Q49zAsTGFVtrn" target="_blank" style="color: #2563eb; text-decoration: underline;">Cérémonie d'assermentation 27 août 2026 | Rencontre-Participation | Microsoft Teams</a>`;
    } else if (city === 'Québec') {
      return `Here is the Teams link for remote guests: <a href="https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U" target="_blank" style="color: #2563eb; text-decoration: underline;">https://teams.live.com/meet/9379576941499?p=ddWGzRuSQH5MxDMO3U</a>`;
    }
    return "";
  }

  getRappelCeremonieAddress(): string {
    const city = this.rappelCeremonieLieu();
    const center = this.recruitmentCentersList.find(c => c.city === city);
    return center ? center.address : 'Adresse du centre';
  }

  getRappelCeremonieSectionPlainFr(): string {
    const address = this.getRappelCeremonieAddress();
    const date = this.rappelCeremonieDate() || '___________________';
    const city = this.rappelCeremonieLieu();
    const isMontreal = city === 'Montréal';

    const blocks: string[] = [
      `Bonjour,`,
      `Ce message est un rappel pour votre cérémonie d'assermentation.`,
      `Date : ${date}\nHeure : ${this.rappelCeremonieHeurePostulant()} - veuillez arriver 15 minutes à l'avance\nLieu : ${address}\nHeure d'arrivée des invités : ${this.rappelCeremonieHeureInvites()}`
    ];

    if (!isMontreal) {
      blocks.push(`Vous aurez droit à 2 invités sur place.`);
    }

    const teamsLine = this.getRappelCeremonieTeamsPlainFr().trim();
    if (teamsLine) {
      blocks.push(teamsLine);
    }

    blocks.push(`Si vous êtes dans une Union de fait, votre conjoint ou conjointe doit être présent avec vous dès votre arrivé au centre de recrutement la journée de votre cérémonie d'assermentation.`);

    blocks.push(`Veuillez apporter une pièce d'identité valide avec photo (ex: permis de conduire, carte d'assurance maladie, etc).`);

    if (this.rappelCeremonieRalliementChecked()) {
      blocks.push(`Voici le lien vers vos instructions de ralliement pour l’École de leadership et de recrues des Forces canadiennes (ELRFC) :\nInstructions de ralliement (QMB/QMBO) : https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf`);
    }

    blocks.push(`Si jamais vous êtes dans l'impossibilité de vous présenter, veuillez-nous en aviser le plus rapidement possible en répondant à ce courriel.`);
    blocks.push(`Si vous ne vous présentez pas sans nous en aviser, vous risquez la fermeture de votre dossier.`);
    blocks.push(`Si vous avez des questions, n'hésitez pas à me faire suivre un courriel.`);
    blocks.push(`Merci, bonne journée !`);

    return blocks.join('\n\n');
  }

  getRappelCeremonieSectionPlainEn(): string {
    const address = this.getRappelCeremonieAddress();
    const date = this.rappelCeremonieDate() || '___________________';
    const city = this.rappelCeremonieLieu();
    const isMontreal = city === 'Montréal';

    const blocks: string[] = [
      `Hello,`,
      `This message is a reminder for your swearing-in ceremony.`,
      `Date: ${date}\nTime: ${this.rappelCeremonieHeurePostulant()} - please arrive 15 minutes in advance\nLocation: ${address}\nGuest arrival time: ${this.rappelCeremonieHeureInvites()}`
    ];

    if (!isMontreal) {
      blocks.push(`You will be allowed 2 guests on site.`);
    }

    const teamsLine = this.getRappelCeremonieTeamsPlainEn().trim();
    if (teamsLine) {
      blocks.push(teamsLine);
    }

    blocks.push(`If you are in a common-law relationship, your spouse or common-law partner must be present with you upon arrival at the recruitment centre on the day of your swearing-in ceremony.`);

    blocks.push(`Please bring a valid photo ID (e.g. driver's licence, health insurance card, etc.).`);

    if (this.rappelCeremonieRalliementChecked()) {
      blocks.push(`Here is the link to your joining instructions for the Canadian Forces Leadership and Recruit School (CFLRS):\nJoining Instructions (BMQ/BMOQ) : https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf`);
    }

    blocks.push(`If you are unable to attend, please notify us as soon as possible by replying to this email.`);
    blocks.push(`If you fail to attend without notifying us, you risk having your file closed.`);
    blocks.push(`If you have any questions, please do not hesitate to email me.`);
    blocks.push(`Thank you, have a nice day!`);

    return blocks.join('\n\n');
  }

  getRappelCeremonieSectionHtmlFr(): string {
    const address = this.getRappelCeremonieAddress();
    const date = this.rappelCeremonieDate() || '___________________';
    const city = this.rappelCeremonieLieu();
    const isMontreal = city === 'Montréal';

    const pInvites = !isMontreal ? `<p>Vous aurez droit à 2 invités sur place.</p>` : '';
    const teamsHtml = this.getRappelCeremonieTeamsHtmlFr();
    const pTeams = teamsHtml ? `<p>${teamsHtml}</p>` : '';
    const pUnion = `<p>Si vous êtes dans une Union de fait, votre conjoint ou conjointe doit être présent avec vous dès votre arrivé au centre de recrutement la journée de votre cérémonie d'assermentation.</p>`;
    const pRalliement = this.rappelCeremonieRalliementChecked()
      ? `<p>Voici le lien vers vos instructions de ralliement pour l’École de leadership et de recrues des Forces canadiennes (ELRFC) :<br><a href="https://simontheriault8-cyber.github.io/Documents/Instruction%20de%20raliement-QMB-FR.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Instructions de ralliement (QMB/QMBO)</a></p>`
      : '';

    const htmlParts = [
      `<p>Bonjour,</p>`,
      `<p>Ce message est un rappel pour votre cérémonie d'assermentation.</p>`,
      `<ul style="margin-top: 10px; margin-bottom: 15px; padding-left: 20px;">
  <li><strong>Date :</strong> ${date}</li>
  <li><strong>Heure :</strong> ${this.rappelCeremonieHeurePostulant()} - veuillez arriver 15 minutes à l'avance</li>
  <li><strong>Lieu :</strong> ${address}</li>
  <li><strong>Heure d'arrivée des invités :</strong> ${this.rappelCeremonieHeureInvites()}</li>
</ul>`,
      pInvites,
      pTeams,
      pUnion,
      `<p>Veuillez apporter une pièce d'identité valide avec photo (ex: permis de conduire, carte d'assurance maladie, etc).</p>`,
      pRalliement,
      `<p>Si jamais vous êtes dans l'impossibilité de vous présenter, veuillez-nous en aviser le plus rapidement possible en répondant à ce courriel.</p>`,
      `<p>Si vous ne vous présentez pas sans nous en aviser, vous risquez la fermeture de votre dossier.</p>`,
      `<p>Si vous avez des questions, n'hésitez pas à me faire suivre un courriel.</p>`,
      `<p>Merci, bonne journée !</p>`
    ].filter(Boolean);

    return htmlParts.join('\n');
  }

  getRappelCeremonieSectionHtmlEn(): string {
    const address = this.getRappelCeremonieAddress();
    const date = this.rappelCeremonieDate() || '___________________';
    const city = this.rappelCeremonieLieu();
    const isMontreal = city === 'Montréal';

    const pInvites = !isMontreal ? `<p>You will be allowed 2 guests on site.</p>` : '';
    const teamsHtml = this.getRappelCeremonieTeamsHtmlEn();
    const pTeams = teamsHtml ? `<p>${teamsHtml}</p>` : '';
    const pUnion = `<p>If you are in a common-law relationship, your spouse or common-law partner must be present with you upon arrival at the recruitment centre on the day of your swearing-in ceremony.</p>`;
    const pRalliement = this.rappelCeremonieRalliementChecked()
      ? `<p>Here is the link to your joining instructions for the Canadian Forces Leadership and Recruit School (CFLRS):<br><a href="https://simontheriault8-cyber.github.io/Documents/Joining%20instructions-BMQ-EN.pdf" target="_blank" style="color: #2563eb; text-decoration: underline;">Joining Instructions (BMQ/BMOQ)</a></p>`
      : '';

    const htmlParts = [
      `<p>Hello,</p>`,
      `<p>This message is a reminder for your swearing-in ceremony.</p>`,
      `<ul style="margin-top: 10px; margin-bottom: 15px; padding-left: 20px;">
  <li><strong>Date:</strong> ${date}</li>
  <li><strong>Time:</strong> ${this.rappelCeremonieHeurePostulant()} - please arrive 15 minutes in advance</li>
  <li><strong>Location:</strong> ${address}</li>
  <li><strong>Guest arrival time:</strong> ${this.rappelCeremonieHeureInvites()}</li>
</ul>`,
      pInvites,
      pTeams,
      pUnion,
      `<p>Please bring a valid photo ID (e.g. driver's licence, health insurance card, etc.).</p>`,
      pRalliement,
      `<p>If you are unable to attend, please notify us as soon as possible by replying to this email.</p>`,
      `<p>If you fail to attend without notifying us, you risk having your file closed.</p>`,
      `<p>If you have any questions, please do not hesitate to email me.</p>`,
      `<p>Thank you, have a nice day!</p>`
    ].filter(Boolean);

    return htmlParts.join('\n');
  }

  getRappelCeremonieEmailPlain(): string {
    const fr = this.getRappelCeremonieSectionPlainFr();
    const en = this.getRappelCeremonieSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return `English message will follow.\n\n${fr}\n\n${sigFr}\n\n______________________________________________________________________________\n\n${en}\n\n${sigEn}`;
  }

  getRappelCeremonieEmailHtml(): string {
    const fr = this.getRappelCeremonieSectionHtmlFr();
    const en = this.getRappelCeremonieSectionHtmlEn();
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;
    html += `<p><strong>English message will follow.</strong></p>`;
    html += fr;
    html += `<p>${sigFr}</p>`;
    html += `<br><hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;"><br>`;
    html += en;
    html += `<p>${sigEn}</p>`;
    html += `</div>`;
    return html;
  }

  // Tentative de communication pour offre d'emploi (Volet GD)
  getTentativeOffreGdSectionPlainFr(): string {
    return `Bonjour,\n\nNous avons tenté de vous joindre par téléphone afin de vous faire une offre d’emploi. Veuillez nous rappeler le plus rapidement possible.\n\nSi vous connaissez le nom et le poste de votre gestionnaire de dossier, vous pouvez le contacter directement.\n\nDans le cas contraire, veuillez communiquer avec le centre de recrutement en charge de votre dossier à l’intérieur des heures d’ouverture.\n\nMerci et au plaisir de vous parler.`;
  }

  getTentativeOffreGdSectionPlainEn(): string {
    return `Hello,\n\nWe attempted to reach you by phone to make you a job offer. Please call us back as soon as possible.\n\nIf you know the name and extension of your file manager, you can contact them directly.\n\nOtherwise, please contact the recruiting centre in charge of your file during business hours.\n\nThank you and we look forward to speaking with you.`;
  }

  getTentativeOffreGdEmailPlain(): string {
    const fr = this.getTentativeOffreGdSectionPlainFr();
    const en = this.getTentativeOffreGdSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return `English message will follow.\n\n${fr}\n\n${sigFr}\n\n______________________________________________________________________________\n\n${en}\n\n${sigEn}`;
  }

  getTentativeOffreGdSectionHtmlFr(): string {
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Nous avons tenté de vous joindre par téléphone afin de vous faire une offre d’emploi. Veuillez nous rappeler le plus rapidement possible.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Si vous connaissez le nom et le poste de votre gestionnaire de dossier, vous pouvez le contacter directement.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Dans le cas contraire, veuillez communiquer avec le centre de recrutement en charge de votre dossier à l’intérieur des heures d’ouverture.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Merci et au plaisir de vous parler.</p>`;
  }

  getTentativeOffreGdSectionHtmlEn(): string {
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Hello,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">We attempted to reach you by phone to make you a job offer. Please call us back as soon as possible.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">If you know the name and extension of your file manager, you can contact them directly.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Otherwise, please contact the recruiting centre in charge of your file during business hours.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Thank you and we look forward to speaking with you.</p>`;
  }

  getTentativeOffreGdEmailHtml(): string {
    const fr = this.getTentativeOffreGdSectionHtmlFr();
    const en = this.getTentativeOffreGdSectionHtmlEn();
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;
    html += `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>English message will follow.</strong></p>`;
    html += fr;
    html += `<p>${sigFr}</p>`;
    html += `<br><hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;"><br>`;
    html += en;
    html += `<p>${sigEn}</p>`;
    html += `</div>`;
    return html;
  }

  // Vérification Dossier Cadet (Volet GD)
  getVerificationCadetEmailPlain(): string {
    const sigFr = this.getSignatureFr();
    return `Bonjour,\n\nPourriez-vous me confirmer si le postulant suivant a un matricule attribué comme cadet et si possible avoir sa fiche de renseignements de cadet?\n\nNom : \nPrénom : \nDDN : \n\n${sigFr}`;
  }

  getVerificationCadetEmailHtml(): string {
    const sigFr = this.getHtmlSignatureFr();
    return `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Pourriez-vous me confirmer si le postulant suivant a un matricule attribué comme cadet et si possible avoir sa fiche de renseignements de cadet?</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Nom : <br>Prénom : <br>DDN : </p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">${sigFr}</p>` +
      `</div>`;
  }

  // Bris de bail et entreposage (Volet GD)
  getBrisBailEntreposageSectionPlainFr(): string {
    return `Bonjour M./Mme XXXXX,\n\n` +
      `Voici les informations concernant le bris de bail et votre entreposage :\n\n` +
      `Lors de votre enrôlement, vous avez la possibilité de vous faire rembourser la pénalité pour votre bris de bail (2 mois). Les documents mentionnés plus bas devront être remis au commis responsable des réclamations lors de votre première semaine à l’École de leadership et de recrues des Forces canadiennes (ELRFC) à St-Jean.\n\n` +
      `Bris de bail :\n\n` +
      `Vous devrez fournir les documents suivants :\n\n` +
      `•           Bail (original)\n\n` +
      `•           Lettre de renouvellement du bail\n\n` +
      `•           Lettre du propriétaire indiquant qu’il y a une pénalité en raison du bris de bail et détaillant les mois de la pénalité et le montant payé par le locataire (vous devez fournir l’original).\n\n` +
      `•           Preuve de paiement pour les mois de la pénalité (Reçu fournis par le propriétaire détaillant les mois de la pénalité et les montants)\n\n` +
      `•           Preuves de paiement pour le dernier mois régulier de loyer payé par le locataire ainsi que le mois de quittance.\n\n` +
      `Entreposage :\n\n` +
      `Concernant l’entreposage, une personne de la base de Valcartier vous contactera pour confirmer avec vous une date après enrôlement, date à laquelle un déménageur se rendra à votre résidence pour emballer vos effets personnels et transporter le tout dans un entrepôt. Vos effets personnels seront entreposés jusqu’à la fin de votre cours de métier, en attendant votre première mutation.\n\n` +
      `Veuillez prendre note qu’il vous en coûtera 75-100$ à chaque fois que vous allez vouloir accéder à votre entrepôt, puisqu’une personne de la CIE devra se déplacer sur place.`;
  }

  getBrisBailEntreposageSectionPlainEn(): string {
    return `Hello Mr./Ms. XXXXX,\n\n` +
      `Here is the information regarding the lease break and your storage:\n\n` +
      `Upon your enrolment, you have the option to be reimbursed for the penalty for your lease break (2 months). The documents mentioned below must be submitted to the claims clerk during your first week at the Canadian Forces Leadership and Recruit School (CFLRS) in St-Jean.\n\n` +
      `Lease break:\n\n` +
      `You will need to provide the following documents:\n\n` +
      `•           Lease (original)\n\n` +
      `•           Lease renewal letter\n\n` +
      `•           Letter from the landlord indicating that there is a penalty due to the lease break and detailing the penalty months and the amount paid by the tenant (you must provide the original).\n\n` +
      `•           Proof of payment for the penalty months (Receipt provided by the landlord detailing the penalty months and amounts)\n\n` +
      `•           Proof of payment for the last regular month of rent paid by the tenant as well as the release month.\n\n` +
      `Storage:\n\n` +
      `Regarding storage, a representative from the Valcartier base will contact you to confirm a date after enrolment, on which a mover will come to your residence to pack your personal belongings and transport everything to a storage facility. Your personal belongings will be stored until the end of your occupational training course, pending your first posting.\n\n` +
      `Please note that it will cost you $75-$100 each time you wish to access your storage unit, as a company representative will have to travel on-site.`;
  }

  getBrisBailEntreposageEmailPlain(): string {
    const fr = this.getBrisBailEntreposageSectionPlainFr();
    const en = this.getBrisBailEntreposageSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return `English message will follow.\n\n${fr}\n\n${sigFr}\n\n______________________________________________________________________________\n\n${en}\n\n${sigEn}`;
  }

  getBrisBailEntreposageSectionHtmlFr(): string {
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour M./Mme XXXXX,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Voici les informations concernant le bris de bail et votre entreposage :</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Lors de votre enrôlement, vous avez la possibilité de vous faire rembourser la pénalité pour votre bris de bail (2 mois). Les documents mentionnés plus bas devront être remis au commis responsable des réclamations lors de votre première semaine à l’École de leadership et de recrues des Forces canadiennes (ELRFC) à St-Jean.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>Bris de bail :</strong></p>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Vous devrez fournir les documents suivants :</p>` +
      `<ul style="margin-top: 0cm; margin-bottom: 12.0pt; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<li style="margin-bottom: 6pt;">Bail (original)</li>` +
      `<li style="margin-bottom: 6pt;">Lettre de renouvellement du bail</li>` +
      `<li style="margin-bottom: 6pt;">Lettre du propriétaire indiquant qu’il y a une pénalité en raison du bris de bail et détaillant les mois de la pénalité et le montant payé par le locataire (vous devez fournir l’original).</li>` +
      `<li style="margin-bottom: 6pt;">Preuve de paiement pour les mois de la pénalité (Reçu fournis par le propriétaire détaillant les mois de la pénalité et les montants)</li>` +
      `<li style="margin-bottom: 6pt;">Preuves de paiement pour le dernier mois régulier de loyer payé par le locataire ainsi que le mois de quittance.</li>` +
      `</ul>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>Entreposage :</strong></p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Concernant l’entreposage, une personne de la base de Valcartier vous contactera pour confirmer avec vous une date après enrôlement, date à laquelle un déménageur se rendra à votre résidence pour emballer vos effets personnels et transporter le tout dans un entrepôt. Vos effets personnels seront entreposés jusqu’à la fin de votre cours de métier, en attendant votre première mutation.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Veuillez prendre note qu’il vous en coûtera 75-100$ à chaque fois que vous allez vouloir accéder à votre entrepôt, puisqu’une personne de la CIE devra se déplacer sur place.</p>`;
  }

  getBrisBailEntreposageSectionHtmlEn(): string {
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Hello Mr./Ms. XXXXX,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Here is the information regarding the lease break and your storage:</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Upon your enrolment, you have the option to be reimbursed for the penalty for your lease break (2 months). The documents mentioned below must be submitted to the claims clerk during your first week at the Canadian Forces Leadership and Recruit School (CFLRS) in St-Jean.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>Lease break:</strong></p>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">You will need to provide the following documents:</p>` +
      `<ul style="margin-top: 0cm; margin-bottom: 12.0pt; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<li style="margin-bottom: 6pt;">Lease (original)</li>` +
      `<li style="margin-bottom: 6pt;">Lease renewal letter</li>` +
      `<li style="margin-bottom: 6pt;">Letter from the landlord indicating that there is a penalty due to the lease break and detailing the penalty months and the amount paid by the tenant (you must provide the original).</li>` +
      `<li style="margin-bottom: 6pt;">Proof of payment for the penalty months (Receipt provided by the landlord detailing the penalty months and amounts)</li>` +
      `<li style="margin-bottom: 6pt;">Proof of payment for the last regular month of rent paid by the tenant as well as the release month.</li>` +
      `</ul>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>Storage:</strong></p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Regarding storage, a representative from the Valcartier base will contact you to confirm a date after enrolment, on which a mover will come to your residence to pack your personal belongings and transport everything to a storage facility. Your personal belongings will be stored until the end of your occupational training course, pending your first posting.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Please note that it will cost you $75-$100 each time you wish to access your storage unit, as a company representative will have to travel on-site.</p>`;
  }

  getBrisBailEntreposageEmailHtml(): string {
    const fr = this.getBrisBailEntreposageSectionHtmlFr();
    const en = this.getBrisBailEntreposageSectionHtmlEn();
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;
    html += `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>English message will follow.</strong></p>`;
    html += fr;
    html += `<p>${sigFr}</p>`;
    html += `<br><hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;"><br>`;
    html += en;
    html += `<p>${sigEn}</p>`;
    html += `</div>`;
    return html;
  }

  // Demande NAV/TAN & Claims X - CSPN partie 1 (Volet GD)
  getDemandeNavTanEmailPlain(): string {
    const sigFr = this.getSignatureFr();
    return `Bonjour,\n\nPourriez-vous nous donner un numéro de NAV/TAN pour le postulant suivant svp:\n\nSN: XXXXXXXX\nRANK : APPL/POST CIV\nFIRST NAME : XXXXXXX\nNAME : XXXXXXX\nPON :  281(QUEBEC)\nUIC : 0202(QC)\nPROV OF EMPLOYMENT :  QC\nDate de CSPN : jour-au jour -mois-année\n\n${sigFr}`;
  }

  getDemandeNavTanEmailHtml(): string {
    const sigFr = this.getHtmlSignatureFr();
    return `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Pourriez-vous nous donner un numéro de NAV/TAN pour le postulant suivant svp:</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `SN: XXXXXXXX<br>` +
      `RANK : APPL/POST CIV<br>` +
      `FIRST NAME : XXXXXXX<br>` +
      `NAME : XXXXXXX<br>` +
      `PON :  281(QUEBEC)<br>` +
      `UIC : 0202(QC)<br>` +
      `PROV OF EMPLOYMENT :  QC<br>` +
      `Date de CSPN : jour-au jour -mois-année` +
      `</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">${sigFr}</p>` +
      `</div>`;
  }

  // Demande d'autorisation pour un CSPN (Volet GD)
  getDemandeAutorisationCspnEmailPlain(): string {
    const sigFr = this.getSignatureFr();
    return `Bonjour,\n\nVoici une demande d’autorisation pour un CSPN.\n\nAlpha : XXX\nNM : XXX\nNom : XXX\nPrénom : XXX\nMétier : XXX\n\n${sigFr}`;
  }

  getDemandeAutorisationCspnEmailHtml(): string {
    const sigFr = this.getHtmlSignatureFr();
    return `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Voici une demande d’autorisation pour un CSPN.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `Alpha : XXX<br>` +
      `NM : XXX<br>` +
      `Nom : XXX<br>` +
      `Prénom : XXX<br>` +
      `Métier : XXX` +
      `</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">${sigFr}</p>` +
      `</div>`;
  }

  // Documents requis - Conjoint(e) de fait (Volet GD)
  getDocumentsConjointDeFaitSectionPlainFr(): string {
    return `Bonjour,\n\n` +
      `Vous nous avez mentionné être conjoint.e de fait. Pour votre enrôlement, nous avons besoin de prouver ce statut. Pour se faire, merci de m’envoyer par courriel :\n\n` +
      `• Une facture de vous et une facture de votre conjoint.e d’un an en arrière, soit une facture de juin 2025, qui prouve que vous habitiez ensemble l’an passé,\n` +
      `• Une facture de vous et une facture de votre conjoint.e qui prouve que vous êtes à la même adresse actuellement (soit mai/juin 2026),\n` +
      `• Le certificat de naissance de votre conjoint.e.\n\n` +
      `(Vous pouvez fournir des factures à vos noms individuels ou des factures adressées à vos deux noms)\n\n` +
      `Lors de l’assermentation :\n\n` +
      `• Apportez les factures originales et le certificat de naissance de votre conjoint.e.\n` +
      `• Votre conjoint.e devra être présent.e lors de l’assermentation pour signer les documents d’union de fait (cela prendra quelques minutes, il/elle pourra quitter par la suite)`;
  }

  getDocumentsConjointDeFaitSectionPlainEn(): string {
    return `Hello,\n\n` +
      `You mentioned to us that you are in a common-law relationship. For your enrolment, we need to establish proof of this status. To do so, please email me:\n\n` +
      `• One bill/invoice for you and one for your common-law partner from one year ago (e.g., June 2025), proving that you lived together last year,\n` +
      `• One bill/invoice for you and one for your common-law partner proving that you are currently at the same address (e.g., May/June 2026),\n` +
      `• Your common-law partner's birth certificate.\n\n` +
      `(You can provide bills in your individual names or bills addressed to both names)\n\n` +
      `At the swearing-in ceremony:\n\n` +
      `• Bring the original bills and your common-law partner's birth certificate.\n` +
      `• Your common-law partner must be present during the swearing-in ceremony to sign the common-law relationship documents (this will take a few minutes, he/she may leave afterwards)`;
  }

  getDocumentsConjointDeFaitEmailPlain(): string {
    const fr = this.getDocumentsConjointDeFaitSectionPlainFr();
    const en = this.getDocumentsConjointDeFaitSectionPlainEn();
    const sigFr = this.getSignatureFr();
    const sigEn = this.getSignatureEn();
    return `English message will follow.\n\n${fr}\n\n${sigFr}\n\n______________________________________________________________________________\n\n${en}\n\n${sigEn}`;
  }

  getDocumentsConjointDeFaitSectionHtmlFr(): string {
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Vous nous avez mentionné être conjoint.e de fait. Pour votre enrôlement, nous avons besoin de prouver ce statut. Pour se faire, merci de m’envoyer par courriel :</p>` +
      `<ul style="margin-top: 0cm; margin-bottom: 12.0pt; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<li style="margin-bottom: 6pt;">Une facture de vous et une facture de votre conjoint.e d’un an en arrière, soit une facture de juin 2025, qui prouve que vous habitiez ensemble l’an passé,</li>` +
      `<li style="margin-bottom: 6pt;">Une facture de vous et une facture de votre conjoint.e qui prouve que vous êtes à la même adresse actuellement (soit mai/juin 2026),</li>` +
      `<li style="margin-bottom: 6pt;">Le certificat de naissance de votre conjoint.e.</li>` +
      `</ul>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><em>(Vous pouvez fournir des factures à vos noms individuels ou des factures adressées à vos deux noms)</em></p>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>Lors de l’assermentation :</strong></p>` +
      `<ul style="margin-top: 0cm; margin-bottom: 12.0pt; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<li style="margin-bottom: 6pt;">Apportez les factures originales et le certificat de naissance de votre conjoint.e.</li>` +
      `<li style="margin-bottom: 6pt;">Votre conjoint.e devra être présent.e lors de l’assermentation pour signer les documents d’union de fait (cela prendra quelques minutes, il/elle pourra quitter par la suite)</li>` +
      `</ul>`;
  }

  getDocumentsConjointDeFaitSectionHtmlEn(): string {
    return `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Hello,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">You mentioned to us that you are in a common-law relationship. For your enrolment, we need to establish proof of this status. To do so, please email me:</p>` +
      `<ul style="margin-top: 0cm; margin-bottom: 12.0pt; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<li style="margin-bottom: 6pt;">One bill/invoice for you and one for your common-law partner from one year ago (e.g., June 2025), proving that you lived together last year,</li>` +
      `<li style="margin-bottom: 6pt;">One bill/invoice for you and one for your common-law partner proving that you are currently at the same address (e.g., May/June 2026),</li>` +
      `<li style="margin-bottom: 6pt;">Your common-law partner's birth certificate.</li>` +
      `</ul>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><em>(You can provide bills in your individual names or bills addressed to both names)</em></p>` +
      `<p style="margin-top: 0cm; margin-bottom: 6.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>At the swearing-in ceremony:</strong></p>` +
      `<ul style="margin-top: 0cm; margin-bottom: 12.0pt; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<li style="margin-bottom: 6pt;">Bring the original bills and your common-law partner's birth certificate.</li>` +
      `<li style="margin-bottom: 6pt;">Your common-law partner must be present during the swearing-in ceremony to sign the common-law relationship documents (this will take a few minutes, he/she may leave afterwards)</li>` +
      `</ul>`;
  }

  getDocumentsConjointDeFaitEmailHtml(): string {
    const fr = this.getDocumentsConjointDeFaitSectionHtmlFr();
    const en = this.getDocumentsConjointDeFaitSectionHtmlEn();
    const sigFr = this.getHtmlSignatureFr();
    const sigEn = this.getHtmlSignatureEn();
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;
    html += `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;"><strong>English message will follow.</strong></p>`;
    html += fr;
    html += `<p>${sigFr}</p>`;
    html += `<br><hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;"><br>`;
    html += en;
    html += `<p>${sigEn}</p>`;
    html += `</div>`;
    return html;
  }

  // Demande SDPM pour conjoint militaire (Volet GD)
  getDemandeSdpmConjointMilitaireEmailPlain(): string {
    const sigFr = this.getSignatureFr();
    return `Bonjour,\n\nLe traitement aurait besoin de SDPM/MPRR pour le membre suivant :\n\nMatricule : XXXXX\nPrénom : XXXXX\nNOM : XXXXX\nDate de naissance : XXXXX\nF rég\n\n${sigFr}`;
  }

  getDemandeSdpmConjointMilitaireEmailHtml(): string {
    const sigFr = this.getHtmlSignatureFr();
    return `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Le traitement aurait besoin de SDPM/MPRR pour le membre suivant :</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `Matricule : XXXXX<br>` +
      `Prénom : XXXXX<br>` +
      `NOM : XXXXX<br>` +
      `Date de naissance : XXXXX<br>` +
      `F rég` +
      `</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">${sigFr}</p>` +
      `</div>`;
  }

  // Test ESOM / Confirmation (Volet GD)
  getTestEsomConfirmationEmailPlain(): string {
    const center = this.getTestEsomCenter();
    const sigFr = this.getSignatureFr();
    return `Bonjour M. XXXXXX,\n\n` +
      `Dans le cadre de votre choix de métier; XXXXXXXXX, vous avez un test d’aptitudes à compléter; le ESOM (examen de sélection des officiers de la marine).\n\n` +
      `Cet examen a pour but d’évaluer vos habiletés cognitives dans les domaines de la mémorisation, de la prise de décision et de l’attention sélective.\n\n` +
      `Ce test de 60 questions est à choix multiples et il est d’une durée d’environ 1h30.\n\n` +
      `Ce test doit se faire en présentiel, c’est pourquoi nous vous invitons au Centre de recrutement pour compléter ce test :  ${center.name}\n\n` +
      `Lieu : ${center.address}\n` +
      `Stationnement : Disponible dans les rues avoisinantes (arrivez au moins 15 minutes à l’avance)\n\n` +
      `Veuillez confirmer votre disponibilité en répondant à ce courriel.\n\n` +
      `${sigFr}`;
  }

  getTestEsomConfirmationEmailHtml(): string {
    const center = this.getTestEsomCenter();
    const sigFr = this.getHtmlSignatureFr();
    return `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Bonjour M. XXXXXX,</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Dans le cadre de votre choix de métier; XXXXXXXXX, vous avez un test d’aptitudes à compléter; le ESOM (examen de sélection des officiers de la marine).</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Cet examen a pour but d’évaluer vos habiletés cognitives dans les domaines de la mémorisation, de la prise de décision et de l’attention sélective.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Ce test de 60 questions est à choix multiples et il est d’une durée d’environ 1h30.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Ce test doit se faire en présentiel, c’est pourquoi nous vous invitons au Centre de recrutement pour compléter ce test :  ${center.name}</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">` +
      `<strong>Lieu :</strong> ${center.address}<br>` +
      `<strong>Stationnement :</strong> Disponible dans les rues avoisinantes (arrivez au moins 15 minutes à l’avance)` +
      `</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">Veuillez confirmer votre disponibilité en répondant à ce courriel.</p>` +
      `<p style="margin-top: 0cm; margin-bottom: 12.0pt; line-height: normal; font-family: Calibri, sans-serif; font-size: 11.0pt; color: #000000;">${sigFr}</p>` +
      `</div>`;
  }

  getEmailSubject(): string {
    if (this.sharedState.includeLinkedEmail() && this.sharedState.reoMergedEmailHtml()) {
      return "Forces armées canadiennes/Canadian Armed Forces";
    }
    if (this.selectedEmailBankTemplate() === "demande_nav_tan") {
      return "Demande de numéro de NAV/TAN et création de compte claims X - CSPN partie 1";
    }
    if (this.selectedEmailBankTemplate() === "demande_autorisation_cspn") {
      return "Demande d’autorisation pour un CSPN";
    }
    if (this.selectedEmailBankTemplate() === "documents_conjoint_de_fait") {
      return "Documents requis - Statut de conjoint(e) de fait";
    }
    if (this.selectedEmailBankTemplate() === "demande_sdpm_conjoint_militaire") {
      return "Demande SDPM pour conjoint militaire";
    }
    if (this.selectedEmailBankTemplate() === "test_esom_confirmation") {
      return "TEST ESOM/ Confirmation";
    }
    if (this.selectedEmailBankTemplate() === "verification_dossier_cadet") {
      return "(Vérification Dossier Cadet)";
    }
    if (this.selectedEmailBankTemplate() === "bris_bail_entreposage") {
      return "Bris de bail et Entreposage";
    }
    if (this.selectedEmailBankTemplate() === "tentative_offre_gd") {
      return "Tentative de communication - Offre d'emploi";
    }
    if (this.selectedEmailBankTemplate() === "verification_edo_vs_pfor") {
      return "Vérification de programme EDO VS PFOR";
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_age_57") {
      return "Inadmissibilité - Âge (57 ans et plus)";
    }
    if (this.selectedEmailBankTemplate() === "inadmissibilite_pr_3ans") {
      return "Inadmissibilité - Résident permanent";
    }
    if (this.isPremierContactActive()) {
      return "Premier contact - Inscription aux Forces armées canadiennes";
    }
    if (this.isAvisFermetureActive()) {
      return "Avis de fermeture de dossier";
    }
    if (this.isAnnexeQActive()) {
      return "Annexe Q - Attestation de sécurité";
    }
    if (this.offreNormaleChecked() || this.offreEtudesSubventionneesChecked()) {
      return "Offre d'emploi - Forces armées canadiennes";
    }
    if (this.rappelCeremonieChecked()) {
      return "Rappel - Cérémonie d'assermentation";
    }
    if (this.isMedicalEvaluationActive()) {
      return "Évaluation médicale - Forces armées canadiennes";
    }
    return "Suivi de votre candidature - Forces armées canadiennes";
  }

  // Consolidated Plain Text Email
  getCombinedPlainString(ignoreMerge: boolean = false): string {
    if (!ignoreMerge && this.sharedState.includeLinkedEmail() && this.sharedState.reoMergedEmailPlain()) {
      return this.sharedState.reoMergedEmailPlain();
    }

    if (this.selectedEmailBankTemplate() === "demande_nav_tan") {
      return this.getDemandeNavTanEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "demande_autorisation_cspn") {
      return this.getDemandeAutorisationCspnEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "documents_conjoint_de_fait") {
      return this.getDocumentsConjointDeFaitEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "demande_sdpm_conjoint_militaire") {
      return this.getDemandeSdpmConjointMilitaireEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "test_esom_confirmation") {
      return this.getTestEsomConfirmationEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "tentative_offre_gd") {
      return this.getTentativeOffreGdEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "verification_dossier_cadet") {
      return this.getVerificationCadetEmailPlain();
    }
    if (this.selectedEmailBankTemplate() === "bris_bail_entreposage") {
      return this.getBrisBailEntreposageEmailPlain();
    }

    const scenario = this.activeEmailScenario();
    if (scenario && (
      scenario.id === "verification_edo_vs_pfor" ||
      scenario.id === "inadmissibilite_age_57" ||
      scenario.id === "inadmissibilite_pr_3ans" ||
      (!this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections())
    )) {
      return this.sharedState.getCustomizedScenarioText(scenario.bodyText);
    }

    // Standalone full emails if selected alone
    if (this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getPremierContactEmailPlain();
    }

    if (this.isAvisFermetureActive() && !this.isPremierContactActive() && !this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getAvisFermetureEmailPlain();
    }

    if (this.isAnnexeQActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getAnnexeQEmailPlain();
    }

    if (this.offreNormaleChecked() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.hasSelectedRejections()) {
      return this.getOffreNormaleEmailPlain();
    }

    if (this.offreEtudesSubventionneesChecked() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.hasSelectedRejections() && !this.rappelCeremonieChecked()) {
      return this.getOffreEtudesSubventionneesEmailPlain();
    }

    if (this.rappelCeremonieChecked() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getRappelCeremonieEmailPlain();
    }

    if (this.allTasksCompliant() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.rappelCeremonieChecked()) {
      return this.sharedState.isPostulantPfor() ? this.getCompliantPforEmailPlain() : this.getCompliantEmailPlain();
    }

    const frBlocks: string[] = [];
    const enBlocks: string[] = [];

    // 0. Premier contact
    if (this.isPremierContactActive()) {
      frBlocks.push(this.getPremierContactSectionPlainFr());
      enBlocks.push(this.getPremierContactSectionPlainEn());
    }

    // 0.5 Avis de fermeture
    if (this.isAvisFermetureActive()) {
      frBlocks.push(this.getAvisFermetureSectionPlainFr());
      enBlocks.push(this.getAvisFermetureSectionPlainEn());
    }

    // 0.6 Annexe Q
    if (this.isAnnexeQActive()) {
      frBlocks.push(this.getAnnexeQSectionPlainFr());
      enBlocks.push(this.getAnnexeQSectionPlainEn());
    }

    // 1. Medical Evaluation
    if (this.isMedicalEvaluationActive()) {
      const medInfo = this.getMedicalPartsInfo();
      if (medInfo) {
        frBlocks.push(this.getMedicalSectionPlainFr(medInfo.labelFr));
        enBlocks.push(this.getMedicalSectionPlainEn(medInfo.labelEn));
      }
    }

    // 2. Offre normale
    if (this.offreNormaleChecked()) {
      frBlocks.push(this.getOffreNormaleEmailPlain());
    }

    // 3. Offre études subventionnées
    if (this.offreEtudesSubventionneesChecked()) {
      frBlocks.push(this.getOffreEtudesSubventionneesEmailPlain());
    }

    // 3.5 Rappel cérémonie d'assermentation
    if (this.rappelCeremonieChecked()) {
      frBlocks.push(this.getRappelCeremonieSectionPlainFr());
      enBlocks.push(this.getRappelCeremonieSectionPlainEn());
    }

    // 4. All tasks compliant
    if (this.allTasksCompliant()) {
      frBlocks.push(this.sharedState.isPostulantPfor() ? this.getCompliantPforEmailPlain() : this.getCompliantEmailPlain());
    }

    // 5. Rejection / Incomplete tasks / Reminder
    if (!this.allTasksCompliant() && (this.hasSelectedRejections() || (this.forceGeneralReminder() && this.selectedRejectionKeys().size === 0))) {
      const rejFr = this.getRejectionPlainBodyFr();
      const rejEn = this.getRejectionPlainBodyEn();
      if (rejFr) frBlocks.push(rejFr);
      if (rejEn) enBlocks.push(rejEn);
    }

    if (frBlocks.length === 0) return "";

    let plain = `English message will follow.\n\nBonjour,\n\n`;
    plain += frBlocks.join("\n\n--------------------------------------------------\n\n");
    plain += `\n\n` + this.getSignatureFr();

    plain += `\n\n______________________________________________________________________________\n\nHello,\n\n`;
    plain += enBlocks.join("\n\n--------------------------------------------------\n\n");
    plain += `\n\n` + this.getSignatureEn();

    return plain;
  }

  // Plain Text Version (for fallback)
  generatedEmailPlain = computed(() => {
    return this.getCombinedPlainString();
  });


  getCombinedRawHtmlString(ignoreMerge: boolean = false): string {
    if (!ignoreMerge && this.sharedState.includeLinkedEmail() && this.sharedState.reoMergedEmailHtml()) {
      return this.sharedState.reoMergedEmailHtml();
    }

    if (this.selectedEmailBankTemplate() === "demande_nav_tan") {
      return this.getDemandeNavTanEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "demande_autorisation_cspn") {
      return this.getDemandeAutorisationCspnEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "documents_conjoint_de_fait") {
      return this.getDocumentsConjointDeFaitEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "demande_sdpm_conjoint_militaire") {
      return this.getDemandeSdpmConjointMilitaireEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "test_esom_confirmation") {
      return this.getTestEsomConfirmationEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "tentative_offre_gd") {
      return this.getTentativeOffreGdEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "verification_dossier_cadet") {
      return this.getVerificationCadetEmailHtml();
    }
    if (this.selectedEmailBankTemplate() === "bris_bail_entreposage") {
      return this.getBrisBailEntreposageEmailHtml();
    }

    const scenario = this.activeEmailScenario();
    if (scenario && (
      scenario.id === "verification_edo_vs_pfor" ||
      scenario.id === "inadmissibilite_age_57" ||
      scenario.id === "inadmissibilite_pr_3ans" ||
      (!this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections())
    )) {
      return this.sharedState.getCustomizedScenarioHtml(scenario.bodyHtml);
    }

    // Standalone full emails if selected alone
    if (this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getPremierContactEmailHtml();
    }

    if (this.isAvisFermetureActive() && !this.isPremierContactActive() && !this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getAvisFermetureEmailHtml();
    }

    if (this.isAnnexeQActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.isMedicalEvaluationActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getAnnexeQEmailHtml();
    }

    if (this.offreNormaleChecked() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.hasSelectedRejections()) {
      return this.getOffreNormaleEmailHtml();
    }

    if (this.offreEtudesSubventionneesChecked() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.hasSelectedRejections() && !this.rappelCeremonieChecked()) {
      return this.getOffreEtudesSubventionneesEmailHtml();
    }

    if (this.rappelCeremonieChecked() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.hasSelectedRejections()) {
      return this.getRappelCeremonieEmailHtml();
    }

    if (this.allTasksCompliant() && !this.isMedicalEvaluationActive() && !this.isPremierContactActive() && !this.isAvisFermetureActive() && !this.offreNormaleChecked() && !this.offreEtudesSubventionneesChecked() && !this.rappelCeremonieChecked()) {
      return this.sharedState.isPostulantPfor() ? this.getCompliantPforEmailHtml() : this.getCompliantEmailHtml();
    }

    const frSections: string[] = [];
    const enSections: string[] = [];

    // 0. Premier contact
    if (this.isPremierContactActive()) {
      frSections.push(this.getPremierContactSectionHtmlFr());
      enSections.push(this.getPremierContactSectionHtmlEn());
    }

    // 0.5 Avis de fermeture
    if (this.isAvisFermetureActive()) {
      frSections.push(this.getAvisFermetureSectionHtmlFr());
      enSections.push(this.getAvisFermetureSectionHtmlEn());
    }

    // 0.6 Annexe Q
    if (this.isAnnexeQActive()) {
      frSections.push(this.getAnnexeQSectionHtmlFr());
      enSections.push(this.getAnnexeQSectionHtmlEn());
    }

    // 1. Medical Evaluation
    if (this.isMedicalEvaluationActive()) {
      const medInfo = this.getMedicalPartsInfo();
      if (medInfo) {
        frSections.push(this.getMedicalSectionHtmlFr(medInfo.labelFr));
        enSections.push(this.getMedicalSectionHtmlEn(medInfo.labelEn));
      }
    }

    // 2. Offre normale
    if (this.offreNormaleChecked()) {
      frSections.push(this.getOffreNormaleEmailHtml());
    }

    // 3. Offre études subventionnées
    if (this.offreEtudesSubventionneesChecked()) {
      frSections.push(this.getOffreEtudesSubventionneesEmailHtml());
    }

    // 3.5 Rappel cérémonie d'assermentation
    if (this.rappelCeremonieChecked()) {
      frSections.push(this.getRappelCeremonieSectionHtmlFr());
      enSections.push(this.getRappelCeremonieSectionHtmlEn());
    }

    // 4. All tasks compliant
    if (this.allTasksCompliant()) {
      frSections.push(this.sharedState.isPostulantPfor() ? this.getCompliantPforEmailHtml() : this.getCompliantEmailHtml());
    }

    // 5. Rejections / Incomplete tasks / Reminder
    if (!this.allTasksCompliant() && (this.hasSelectedRejections() || (this.forceGeneralReminder() && this.selectedRejectionKeys().size === 0))) {
      const rejFr = this.getRejectionHtmlFr();
      const rejEn = this.getRejectionHtmlEn();
      if (rejFr) frSections.push(rejFr);
      if (rejEn) enSections.push(rejEn);
    }

    if (frSections.length === 0) return "";

    let html = `<div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">`;
    html += `<p>English message will follow.</p><p>Bonjour,</p>`;
    html += frSections.join('<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 20px 0;">');
    html += `<p>` + this.getHtmlSignatureFr() + `</p>`;

    html += `<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;"><p>Hello,</p>`;
    html += enSections.join('<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 20px 0;">');
    html += `<p>` + this.getHtmlSignatureEn() + `</p>`;

    html += `</div>`;
    return html;
  }

  // HTML Version (for rich text display and Copy/Paste)
  generatedEmailHtml = computed((): SafeHtml => {
    const rawHtml = this.getCombinedRawHtmlString();
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });

  isPforCompliant = computed(() => {
    return this.selectedRole() === 'recruiter' && this.sharedState.isPostulantPfor() && this.allTasksCompliant();
  });

  generatedPforCaf101EmailHtml = computed((): SafeHtml => {
    return this.sanitizer.bypassSecurityTrustHtml(this.getCompliantPforEmailHtml());
  });

  generatedPforLienPaEmailHtml = computed((): SafeHtml => {
    return this.sanitizer.bypassSecurityTrustHtml(this.getCompliantPforLienPaEmailHtml());
  });

  getRejectionHtmlFr(): string {
    const structure = this.getStructuredRejections();
    if (structure.size === 0 && !this.forceGeneralReminder()) return "";

    const normalTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const confirmationTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const additionalDocTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();

    for (const [task, items] of structure.entries()) {
      const normalItems = items.filter((i) => !i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const confItems = items.filter((i) => i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const addItems = items.filter((i) => i.reason.isAdditionalDoc);

      if (normalItems.length > 0 || this.taskNotCompletedKeys().has(task.nameFr)) {
        normalTasks.set(task, normalItems);
      }
      if (confItems.length > 0) {
        confirmationTasks.set(task, confItems);
      }
      if (addItems.length > 0) {
        additionalDocTasks.set(task, addItems);
      }
    }

    let html = "";

    if (normalTasks.size > 0) {
      html += `<p>Nous avons procédé à l'évaluation de vos documents. Bien que votre dossier progresse, certains éléments ne sont pas conformes et nécessitent des corrections de votre part pour nous permettre de poursuivre le traitement.</p>`;
      html += `<p>Les tâches suivantes vous ont été réattribuées :</p>`;
      html += `<ul style="margin-top: 0; padding-left: 20px;">`;
      for (const [task, items] of normalTasks.entries()) {
        const taskNameFr = task.nameFr;
        html += `<li style="margin-bottom: 15px;"><span style="text-decoration: underline; font-weight: bold;">${taskNameFr}</span>`;
        html += `<ul style="margin-top: 5px; list-style-type: circle; padding-left: 20px;">`;
        if (this.taskNotCompletedKeys().has(task.nameFr)) {
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="color: #FF0000; font-weight: bold;">Vous n'avez pas complété cette tâche sur votre portail.</span>`;
          html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&rarr; Veuillez vous connecter à votre portail et la compléter.</div>`;
          html += `</li>`;
        }
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} et ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1];
          }
          
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameFr} : <span style="color: #FF0000;">${labelsStr}</span></strong></span>`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionFr.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkFr}</div>`;
            }
          }
          html += `</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul>`;
      html += `<p>En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées.</p>`;
      html += `<p>Rendez-vous sur votre portail pour les compléter : <a href="https://www.cafoap-pclfac.forces.gc.ca/">https://www.cafoap-pclfac.forces.gc.ca/</a></p>`;
    }

    if (confirmationTasks.size > 0) {
      if (normalTasks.size > 0) {
        html += `<p>De plus, nous avons besoin d'une confirmation de votre part. Veuillez répondre directement à ce courriel avec les informations demandées pour l'élément suivant :</p>`;
      } else {
        html += `<p>Afin de poursuivre le traitement de votre dossier, nous avons besoin d'une confirmation de votre part. Veuillez répondre directement à ce courriel avec les informations demandées pour l'élément suivant :</p>`;
      }
      html += `<ul style="margin-top: 0; padding-left: 20px;">`;
      for (const [task, items] of confirmationTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelFr);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} et ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1];
          }
          
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameFr} : <span style="color: #FF0000;">${labelsStr}</span></strong></span>`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionFr.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkFr}</div>`;
            }
          }
          html += `</li>`;
        }
      }
      html += `</ul>`;
    }

    if (additionalDocTasks.size > 0) {
      const dossierJobsFr = this.getDossierJobsSummaryTextFr();
      const generalAddDocs: { doc: any; docItems: any[] }[] = [];
      const occupSpecificDocs: { doc: any; docItems: any[] }[] = [];

      for (const [task, items] of additionalDocTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          if (this.isSubsidizedDoc(doc) || this.isTaskBasedAdditionalDoc(doc)) {
            generalAddDocs.push({ doc, docItems });
          } else {
            occupSpecificDocs.push({ doc, docItems });
          }
        }
      }

      if (normalTasks.size > 0 || confirmationTasks.size > 0) {
        html += `<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;">`;
      }

      if (generalAddDocs.length > 0) {
        html += `<p>Afin de compléter l'évaluation de votre demande d'emploi, nous aurons besoin de document(s) supplémentaire(s) :</p>`;
        html += `<ul style="margin-top: 0; padding-left: 20px;">`;
        for (const { doc, docItems } of generalAddDocs) {
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameFr}</strong></span>`;
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionFr)) {
              uniqueInstructions.add(item.reason.instructionFr);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionFr.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkFr && !uniqueLinks.has(item.reason.linkFr)) {
              uniqueLinks.add(item.reason.linkFr);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkFr}</div>`;
            }
          }
          html += `</li>`;
        }
        html += `</ul>`;
      }

      const jobs = this.getDossierJobObjects();
      const jobDocsMapFr = new Map<JobEntry, string[]>();
      for (const job of jobs) {
        const reqs: string[] = [];
        for (const { doc, docItems } of occupSpecificDocs) {
          if (this.isAdditionalDocRequiredForJob(doc.nameFr, job.id)) {
            const isSelectedForJob = docItems.some((item: any) =>
              this.isJobReasonSelected(job, doc, item.reason)
            );
            if (isSelectedForJob) {
              const detail = this.getJobSpecificDocText(job.id, doc.nameFr, true);
              if (detail && !reqs.includes(detail)) {
                reqs.push(detail);
              }
            }
          }
        }
        if (reqs.length > 0) {
          jobDocsMapFr.set(job, reqs);
        }
      }

      if (jobDocsMapFr.size > 0) {
        const selectedJobsFr = Array.from(jobDocsMapFr.keys()).map(j => `${j.title} (${j.id})`).join(', ');
        const jobsHeaderTextFr = selectedJobsFr || dossierJobsFr;
        html += `<p style="margin-top: 15px; font-weight: bold; color: #000000;">Afin d'évaluer votre dossier pour le(s) métier(s) sélectionné(s) (${jobsHeaderTextFr}), vous devez nous fournir le(s) document(s) supplémentaire(s) suivant(s) ou une(des) preuve(s) que vous remplissez la(les) condition(s) suivante(s) en réponse directe à ce courriel :</p>`;
        html += `<ul style="margin-top: 5px; list-style-type: disc; padding-left: 20px;">`;
        for (const [job, reqs] of jobDocsMapFr.entries()) {
          html += `<li style="margin-bottom: 8px;"><strong>Pour ${job.id} - ${job.title} :</strong> <span style="background-color: yellow; padding: 0 2px;">` + reqs.join(", ") + `</span></li>`;
        }
        html += `</ul>`;
      }
    }

    if (this.forceGeneralReminder()) {
      html += `<p>Veuillez également vous assurer de compléter les autres tâches manquantes sur votre portail.</p>`;
    }

    html += `<p><strong>Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</strong></p>`;

    return `<!-- START_TASK_BODY_FR -->${html}<!-- END_TASK_BODY_FR -->`;
  }

  getRejectionHtmlEn(): string {
    const structure = this.getStructuredRejections();
    if (structure.size === 0 && !this.forceGeneralReminder()) return "";

    const normalTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const confirmationTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();
    const additionalDocTasks = new Map<Task, { doc: DocumentItem; reason: RejectionReason }[]>();

    for (const [task, items] of structure.entries()) {
      const normalItems = items.filter((i) => !i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const confItems = items.filter((i) => i.reason.isConfirmation && !i.reason.isAdditionalDoc);
      const addItems = items.filter((i) => i.reason.isAdditionalDoc);

      if (normalItems.length > 0 || this.taskNotCompletedKeys().has(task.nameFr)) {
        normalTasks.set(task, normalItems);
      }
      if (confItems.length > 0) {
        confirmationTasks.set(task, confItems);
      }
      if (addItems.length > 0) {
        additionalDocTasks.set(task, addItems);
      }
    }

    let html = "";

    if (normalTasks.size > 0) {
      html += `<p>We have evaluated your documents. While your application is progressing, some items are not compliant and require corrections on your part to allow us to continue processing.</p>`;
      html += `<p>The following tasks have been reassigned to you:</p>`;
      html += `<ul style="margin-top: 0; padding-left: 20px;">`;
      for (const [task, items] of normalTasks.entries()) {
        const taskNameEn = task.nameEn;
        html += `<li style="margin-bottom: 15px;"><span style="text-decoration: underline; font-weight: bold;">${taskNameEn}</span>`;
        html += `<ul style="margin-top: 5px; list-style-type: circle; padding-left: 20px;">`;
        if (this.taskNotCompletedKeys().has(task.nameFr)) {
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="color: #FF0000; font-weight: bold;">You have not completed this task on your portal.</span>`;
          html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&rarr; Please log in to your portal and complete it.</div>`;
          html += `</li>`;
        }
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelEn);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} and ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
          }
          
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameEn} : <span style="color: #FF0000;">${labelsStr}</span></strong></span>`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionEn)) {
              uniqueInstructions.add(item.reason.instructionEn);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionEn.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkEn && !uniqueLinks.has(item.reason.linkEn)) {
              uniqueLinks.add(item.reason.linkEn);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkEn}</div>`;
            }
          }
          html += `</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul>`;
      html += `<p>Due to the high volume of applications, we must prioritize the processing of files where all tasks are complete.</p>`;
      html += `<p>Please log in to your portal to complete them: <a href="https://www.cafoap-pclfac.forces.gc.ca/">https://www.cafoap-pclfac.forces.gc.ca/</a></p>`;
    }

    if (confirmationTasks.size > 0) {
      if (normalTasks.size > 0) {
        html += `<p>Furthermore, we require confirmation from you. Please reply directly to this email with the requested information for the following item:</p>`;
      } else {
        html += `<p>To continue processing your application, we require confirmation from you. Please reply directly to this email with the requested information for the following item:</p>`;
      }
      html += `<ul style="margin-top: 0; padding-left: 20px;">`;
      for (const [task, items] of confirmationTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          const labels = docItems.map((i: any) => i.reason.labelEn);
          let labelsStr = "";
          if (labels.length === 1) {
            labelsStr = labels[0];
          } else if (labels.length === 2) {
            labelsStr = `${labels[0]} and ${labels[1]}`;
          } else {
            labelsStr = labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
          }
          
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameEn} : <span style="color: #FF0000;">${labelsStr}</span></strong></span>`;
          
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionEn)) {
              uniqueInstructions.add(item.reason.instructionEn);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionEn.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkEn && !uniqueLinks.has(item.reason.linkEn)) {
              uniqueLinks.add(item.reason.linkEn);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkEn}</div>`;
            }
          }
          html += `</li>`;
        }
      }
      html += `</ul>`;
    }

    if (additionalDocTasks.size > 0) {
      const dossierJobsEn = this.getDossierJobsSummaryTextEn();
      const generalAddDocs: { doc: any; docItems: any[] }[] = [];
      const occupSpecificDocs: { doc: any; docItems: any[] }[] = [];

      for (const [task, items] of additionalDocTasks.entries()) {
        const groupedItems = new Map<any, any[]>();
        for (const item of items) {
          if (!groupedItems.has(item.doc)) groupedItems.set(item.doc, []);
          groupedItems.get(item.doc).push(item);
        }
        for (const [doc, docItems] of groupedItems.entries()) {
          if (this.isSubsidizedDoc(doc) || this.isTaskBasedAdditionalDoc(doc)) {
            generalAddDocs.push({ doc, docItems });
          } else {
            occupSpecificDocs.push({ doc, docItems });
          }
        }
      }

      if (normalTasks.size > 0 || confirmationTasks.size > 0) {
        html += `<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;">`;
      }

      if (generalAddDocs.length > 0) {
        html += `<p>In order to complete the evaluation of your employment application, we will need additional document(s):</p>`;
        html += `<ul style="margin-top: 0; padding-left: 20px;">`;
        for (const { doc, docItems } of generalAddDocs) {
          html += `<li style="margin-bottom: 10px;">`;
          html += `<span style="background-color: yellow; padding: 0 2px;"><strong>${doc.nameEn}</strong></span>`;
          const uniqueInstructions = new Set<string>();
          for (const item of docItems) {
            if (!uniqueInstructions.has(item.reason.instructionEn)) {
              uniqueInstructions.add(item.reason.instructionEn);
              html += `<div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px; line-height: 1.5; color: #000000;">&rarr; ${item.reason.instructionEn.replace(/\n/g, "<br>")}</div>`;
            }
          }
          const uniqueLinks = new Set<string>();
          for (const item of docItems) {
            if (item.reason.linkEn && !uniqueLinks.has(item.reason.linkEn)) {
              uniqueLinks.add(item.reason.linkEn);
              html += `<div style="margin-left: 20px; margin-top: 4px; color: #000000;">&#128279; ${item.reason.linkEn}</div>`;
            }
          }
          html += `</li>`;
        }
        html += `</ul>`;
      }

      const jobs = this.getDossierJobObjects();
      const jobDocsMapEn = new Map<JobEntry, string[]>();
      for (const job of jobs) {
        const reqs: string[] = [];
        for (const { doc, docItems } of occupSpecificDocs) {
          if (this.isAdditionalDocRequiredForJob(doc.nameFr, job.id)) {
            const isSelectedForJob = docItems.some((item: any) =>
              this.isJobReasonSelected(job, doc, item.reason)
            );
            if (isSelectedForJob) {
              const detail = this.getJobSpecificDocText(job.id, doc.nameFr, false);
              if (detail && !reqs.includes(detail)) {
                reqs.push(detail);
              }
            }
          }
        }
        if (reqs.length > 0) {
          jobDocsMapEn.set(job, reqs);
        }
      }

      if (jobDocsMapEn.size > 0) {
        const selectedJobsEn = Array.from(jobDocsMapEn.keys()).map(j => `${j.titleEn || j.title} (${j.id})`).join(', ');
        const jobsHeaderTextEn = selectedJobsEn || dossierJobsEn;
        html += `<p style="margin-top: 15px; font-weight: bold; color: #000000;">In order to evaluate your application for the selected occupation(s) (${jobsHeaderTextEn}), you must provide us with the following additional document(s) or proof that you meet the following condition(s) in direct reply to this email:</p>`;
        html += `<ul style="margin-top: 5px; list-style-type: disc; padding-left: 20px;">`;
        for (const [job, reqs] of jobDocsMapEn.entries()) {
          html += `<li style="margin-bottom: 8px;"><strong>For ${job.id} - ${job.titleEn || job.title} :</strong> <span style="background-color: yellow; padding: 0 2px;">` + reqs.join(", ") + `</span></li>`;
        }
        html += `</ul>`;
      }
    }

    if (this.forceGeneralReminder()) {
      html += `<p>Please also ensure that you complete the other missing tasks on your portal.</p>`;
    }

    html += `<p><strong>If you take no action, your file will be automatically deactivated after 30 days.</strong></p>`;

    return `<!-- START_TASK_BODY_EN -->${html}<!-- END_TASK_BODY_EN -->`;
  }

  // Helper to get raw HTML string for clipboard and display
  

  // Combined Action: Copy HTML to clipboard AND Open Empty Outlook Window
  async exportToOutlook() {
    // 1. Copy to Clipboard
    try {
      // Logic for Scenario vs Default
      const scenario = this.activeEmailScenario();

      let htmlContent = this.getCombinedRawHtmlString();
      let textContent = this.getCombinedPlainString();
      const subject = this.getEmailSubject();

      // Modern Clipboard API supporting HTML
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
        // Fallback
        await navigator.clipboard.writeText(textContent);
      }

      this.copiedEmail.set(true);
      setTimeout(() => this.copiedEmail.set(false), 3000);

      // 2. Open Outlook
      if (this.selectedEmailBankTemplate() === 'verification_dossier_cadet') {
        const mailtoLink = `mailto:MDN.CJRURSCEstJ1RH-CJRRCSUEasternJ1HR.DND@forces.gc.ca?subject=${encodeURIComponent('(Vérification Dossier Cadet)')}`;
        window.location.href = mailtoLink;
        return;
      }
      if (this.selectedEmailBankTemplate() === 'demande_nav_tan') {
        const mailtoLink = `mailto:CRFCQcReclamations@forces.gc.ca?subject=${encodeURIComponent(subject)}`;
        window.location.href = mailtoLink;
        return;
      }
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}`;
      window.location.href = mailtoLink;
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  async exportToOutlookCaf101() {
    try {
      const htmlContent = this.getCompliantPforEmailHtml();
      const textContent = this.getCompliantPforEmailPlain();
      const subject = "(1/2) Collège militaire canadien - Séance d'information virtuelle/ Canadian Military College - Virtual information session";

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

      this.copiedEmailCaf101.set(true);
      setTimeout(() => this.copiedEmailCaf101.set(false), 3000);

      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}`;
      window.location.href = mailtoLink;
    } catch (err) {
      console.error("Failed to copy CAF 101 email", err);
    }
  }

  async exportToOutlookLienPa() {
    try {
      const htmlContent = this.getCompliantPforLienPaEmailHtml();
      const textContent = this.getCompliantPforLienPaEmailPlain();
      const subject = "(2/2)Collège militaire canadien - Portail d'admission / Canadian Military College - Admission Portal";

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

      this.copiedEmailLienPa.set(true);
      setTimeout(() => this.copiedEmailLienPa.set(false), 3000);

      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}`;
      window.location.href = mailtoLink;
    } catch (err) {
      console.error("Failed to copy Lien PA email", err);
    }
  }

  async copyNote() {
    try {
      await navigator.clipboard.writeText(this.displayedNote());
      this.copiedNote.set(true);
      setTimeout(() => this.copiedNote.set(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }
}
