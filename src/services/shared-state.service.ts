import { Injectable, signal, computed } from "@angular/core";

export const DEFAULT_SIG_FR = `Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes`;

export const DEFAULT_SIG_EN = `Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

export const DEFAULT_SIG_OTA_FR = `Centre de recrutement des Forces canadiennes Québec, Détachement Montréal
Forces armées canadiennes
Tél. : 514-390-4999
www.forces.ca`;

export const DEFAULT_SIG_OTA_EN = `Canadian Forces Recruiting Centre Quebec, Detachment Montreal
Canadian Armed Forces
Tel. : 514-390-4999
www.forces.ca`;

@Injectable({
  providedIn: "root",
})
export class SharedStateService {
  hasReoEmailGenerated = signal<boolean>(false);
  hasReassignedTasks = signal<boolean>(false);

  // Automatically merges when both reattributed tasks email and reorientation email are generated
  includeLinkedEmail = computed(() => {
    return this.hasReassignedTasks() && this.hasReoEmailGenerated();
  });

  recruiterResetTrigger = signal<number>(0);

  triggerRecruiterReset() {
    this.recruiterResetTrigger.update((n) => n + 1);
  }

  // Stored output from Task panel
  taskNote = signal<string>("");
  taskEmailFr = signal<string>("");
  taskEmailEn = signal<string>("");
  taskEmailHtmlFr = signal<string>("");
  taskEmailHtmlEn = signal<string>("");
  taskEmailHtmlGeneral = signal<string>("");

  // Task bodies for Reorientation intelligent merge
  taskBodyHtmlFr = signal<string>("");
  taskBodyHtmlEn = signal<string>("");
  taskBodyPlainFr = signal<string>("");
  taskBodyPlainEn = signal<string>("");

  // Stored output from Reorientation panel for merging in App component
  reoMergedEmailHtml = signal<string>("");
  reoMergedEmailPlain = signal<string>("");
  reoMergedNote = signal<string>("");

  isPostulantPfor = signal<boolean>(false);

  // Selected Jobs in Candidate Dossier (Shared between App main header panel and Reorientation tab)
  selectedDossierJobId1 = signal<string>("");
  selectedDossierJobId2 = signal<string>("");
  selectedDossierJobId3 = signal<string>("");
  searchDossierQuery1 = signal<string>("");
  searchDossierQuery2 = signal<string>("");
  searchDossierQuery3 = signal<string>("");
  dossierJobFailedCe1 = signal<boolean>(false);
  dossierJobFailedCe2 = signal<boolean>(false);
  dossierJobFailedCe3 = signal<boolean>(false);

  // Extra selection tests signals (ECE, ESOM, CEOPM, CSPN)
  testEcePassed = signal<boolean>(false);
  testEsomPassed = signal<boolean>(false);
  testCeopmPassed = signal<boolean>(false);
  testCspnPassed = signal<boolean>(false);
  testCspnNotCompleted = signal<boolean>(false);
  testCspn00182Passed = signal<boolean>(false);
  testCspn00183Passed = signal<boolean>(false);
  testCspn00184Passed = signal<boolean>(false);

  resetSharedRecruiterState() {
    this.taskNote.set("");
    this.taskEmailFr.set("");
    this.taskEmailEn.set("");
    this.taskEmailHtmlFr.set("");
    this.taskEmailHtmlEn.set("");
    this.taskEmailHtmlGeneral.set("");
    this.taskBodyHtmlFr.set("");
    this.taskBodyHtmlEn.set("");
    this.taskBodyPlainFr.set("");
    this.taskBodyPlainEn.set("");
    this.reoMergedEmailHtml.set("");
    this.reoMergedEmailPlain.set("");
    this.reoMergedNote.set("");
    this.hasReassignedTasks.set(false);
    this.hasReoEmailGenerated.set(false);
    this.isPostulantPfor.set(false);
    this.selectedDossierJobId1.set("");
    this.selectedDossierJobId2.set("");
    this.selectedDossierJobId3.set("");
    this.searchDossierQuery1.set("");
    this.searchDossierQuery2.set("");
    this.searchDossierQuery3.set("");
    this.dossierJobFailedCe1.set(false);
    this.dossierJobFailedCe2.set(false);
    this.dossierJobFailedCe3.set(false);
    this.testEcePassed.set(false);
    this.testEsomPassed.set(false);
    this.testCeopmPassed.set(false);
    this.testCspnPassed.set(false);
    this.testCspnNotCompleted.set(false);
    this.testCspn00182Passed.set(false);
    this.testCspn00183Passed.set(false);
    this.testCspn00184Passed.set(false);
  }

  // Custom Signatures Signals (Normal)
  isOtaDossier = signal<boolean>(false);

  customSignatureFr = signal<string>(
    localStorage.getItem("custom_signature_fr") !== null
      ? (localStorage.getItem("custom_signature_fr") ?? "")
      : DEFAULT_SIG_FR
  );
  customSignatureEn = signal<string>(
    localStorage.getItem("custom_signature_en") !== null
      ? (localStorage.getItem("custom_signature_en") ?? "")
      : DEFAULT_SIG_EN
  );

  // Custom Signatures Signals (OTA)
  customSignatureOtaFr = signal<string>(
    localStorage.getItem("custom_signature_ota_fr") !== null
      ? (localStorage.getItem("custom_signature_ota_fr") ?? "")
      : DEFAULT_SIG_OTA_FR
  );
  customSignatureOtaEn = signal<string>(
    localStorage.getItem("custom_signature_ota_en") !== null
      ? (localStorage.getItem("custom_signature_ota_en") ?? "")
      : DEFAULT_SIG_OTA_EN
  );

  // Signal aliases for compatibility with signature manager
  customSigFr = this.customSignatureFr;
  customSigEn = this.customSignatureEn;
  customSigOtaFr = this.customSignatureOtaFr;
  customSigOtaEn = this.customSignatureOtaEn;

  getSignatureFr(isOta = this.isOtaDossier()): string {
    return isOta ? this.customSignatureOtaFr() : this.customSignatureFr();
  }

  getSignatureEn(isOta = this.isOtaDossier()): string {
    return isOta ? this.customSignatureOtaEn() : this.customSignatureEn();
  }

  getSignatureOtaFr(): string {
    return this.customSignatureOtaFr();
  }

  getSignatureOtaEn(): string {
    return this.customSignatureOtaEn();
  }

  getHtmlSignatureFr(isOta = this.isOtaDossier()): string {
    const sig = this.getSignatureFr(isOta);
    if (!sig || !sig.trim()) {
      return "";
    }
    let html = this.getHtmlSignature(sig);
    html = html.replace(
      "Centre d’assistance | Forces armées canadiennes",
      `<a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance</a> | <a href="https://forces.ca/fr/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Forces armées canadiennes</a>`
    );
    return html;
  }

  getHtmlSignatureEn(isOta = this.isOtaDossier()): string {
    const sig = this.getSignatureEn(isOta);
    if (!sig || !sig.trim()) {
      return "";
    }
    let html = this.getHtmlSignature(sig);
    html = html.replace(
      "Help Centre | Canadian Armed Forces",
      `<a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre</a> | <a href="https://forces.ca/en/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Canadian Armed Forces</a>`
    );
    return html;
  }

  getHtmlSignature(sig: string): string {
    if (!sig || !sig.trim()) {
      return "";
    }
    // 1. Convert newlines to <br>
    let html = sig.replace(/\n/g, "<br>");

    // 2. Auto-link URLs
    html = html.replace(
      /(?<!href=")(https?:\/\/[^\s\)<>]+)/g,
      '<a href="$1" target="_blank" class="text-indigo-600 hover:underline">$1</a>'
    );
    return html;
  }

  saveSignatures(fr: string, en: string, otaFr?: string, otaEn?: string) {
    this.customSignatureFr.set(fr);
    this.customSignatureEn.set(en);
    localStorage.setItem("custom_signature_fr", fr);
    localStorage.setItem("custom_signature_en", en);

    if (otaFr !== undefined) {
      this.customSignatureOtaFr.set(otaFr);
      localStorage.setItem("custom_signature_ota_fr", otaFr);
    }
    if (otaEn !== undefined) {
      this.customSignatureOtaEn.set(otaEn);
      localStorage.setItem("custom_signature_ota_en", otaEn);
    }
  }

  saveCustomSignatures(fr: string, en: string) {
    this.saveSignatures(fr, en);
  }

  saveCustomOtaSignatures(otaFr: string, otaEn: string) {
    this.customSignatureOtaFr.set(otaFr);
    this.customSignatureOtaEn.set(otaEn);
    localStorage.setItem("custom_signature_ota_fr", otaFr);
    localStorage.setItem("custom_signature_ota_en", otaEn);
  }

  resetToDefault(type: 'all' | 'normal' | 'ota' = 'all') {
    this.resetSignatures(type);
  }

  resetSignatures(type: 'all' | 'normal' | 'ota' = 'all') {
    if (type === 'all' || type === 'normal') {
      this.customSignatureFr.set(DEFAULT_SIG_FR);
      this.customSignatureEn.set(DEFAULT_SIG_EN);
      localStorage.setItem("custom_signature_fr", DEFAULT_SIG_FR);
      localStorage.setItem("custom_signature_en", DEFAULT_SIG_EN);
    }
    if (type === 'all' || type === 'ota') {
      this.customSignatureOtaFr.set(DEFAULT_SIG_OTA_FR);
      this.customSignatureOtaEn.set(DEFAULT_SIG_OTA_EN);
      localStorage.setItem("custom_signature_ota_fr", DEFAULT_SIG_OTA_FR);
      localStorage.setItem("custom_signature_ota_en", DEFAULT_SIG_OTA_EN);
    }
  }

  getCustomizedScenarioText(bodyText: string, isOta = this.isOtaDossier()): string {
    let text = bodyText;
    const sigFr = this.getSignatureFr(isOta);
    const sigEn = this.getSignatureEn(isOta);
    
    let regexFr = new RegExp("Cordialement,[\\s\\S]*?Centre d’assistance \\| Forces armées canadiennes", "g");
    text = text.replace(regexFr, sigFr ? sigFr : "");
    
    let regexEn = new RegExp("Sincerely,[\\s\\S]*?Help Centre \\| Canadian Armed Forces", "g");
    text = text.replace(regexEn, sigEn ? sigEn : "");
    
    return text;
  }

  getCustomizedScenarioHtml(bodyHtml: string, isOta = this.isOtaDossier()): string {
    let html = bodyHtml;
    const htmlSigFr = this.getHtmlSignatureFr(isOta);
    const htmlSigEn = this.getHtmlSignatureEn(isOta);
    
    let regexFr = new RegExp("<p>Cordialement,<\\/p>\\s*<p>L’équipe de recrutement[\\s\\S]*?Forces armées canadiennes(?:<\\/a>)?<\\/p>", "g");
    html = html.replace(regexFr, htmlSigFr ? "<p>" + htmlSigFr + "</p>" : "");

    let fallbackRegexFr = new RegExp("<p>Cordialement,<\\/p>[\\s\\S]*?Forces armées canadiennes(?:<\\/a>)?<\\/p>", "g");
    html = html.replace(fallbackRegexFr, htmlSigFr ? "<p>" + htmlSigFr + "</p>" : "");
    
    let regexEn = new RegExp("<p>Sincerely,<\\/p>[\\s\\S]*?Canadian Armed Forces(?:<\\/a>)?<\\/p>", "g");
    html = html.replace(regexEn, htmlSigEn ? "<p>" + htmlSigEn + "</p>" : "");
    
    return html;
  }
}
