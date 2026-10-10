import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  inject,
  Output,
  EventEmitter,
  Input,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { JobDatabaseService } from "../../services/job-database.service";
import { SharedStateService } from "../../services/shared-state.service";
import { JobEntry } from "../../services/jobs-data";
import { ReorientationComponent } from "./reorientation.component";
import { PforComponent } from "./pfor.component";
import { MelComponent } from "./mel.component";

type ModalTab = "catalogue" | "reorientation" | "pfor" | "mel";

@Component({
  selector: "app-job-search-modal",
  standalone: true,
  imports: [CommonModule, ReorientationComponent, PforComponent, MelComponent],
  templateUrl: './job-search-modal.component.html',
})
export class JobSearchModalComponent {
  jobService = inject(JobDatabaseService);
  sharedState = inject(SharedStateService);
  private sanitizer = inject(DomSanitizer);

  setTab(tab: ModalTab) {
    this.activeTab.set(tab);
    if (tab === "pfor") {
      this.sharedState.isPostulantPfor.set(true);
    } else if (tab === "reorientation") {
      this.sharedState.isPostulantPfor.set(false);
    }
  }

  @Input() set showReorientationTab(val: boolean) {
    this._showReorientationTab.set(val);
    if (!val && (this.activeTab() === "reorientation" || this.activeTab() === "pfor")) {
      this.activeTab.set("catalogue");
    }
  }
  _showReorientationTab = signal<boolean>(true);

  activeTab = signal<ModalTab>("reorientation");

  filteredJobs = signal<JobEntry[]>(this.jobService.getAllJobs());

  // Window State
  position = signal({ x: 100, y: 100 });
  size = signal({ width: 1000, height: 800 });
  isFullScreen = signal(true);

  selectedJob = signal<JobEntry | null>(null);

  // Drag State
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private initialPos = { x: 0, y: 0 };

  // Resize State
  private isResizing = false;
  private resizeStart = { x: 0, y: 0 };
  private initialSize = { width: 0, height: 0 };

  @Output() closeModal = new EventEmitter<void>();
  @ViewChild(ReorientationComponent)
  reorientationComponent!: ReorientationComponent;

  isJobClosed(jobId: string): boolean {
    return this.jobService.isJobClosed(jobId);
  }

  isJobRp(jobId: string): boolean {
    return this.jobService.isJobRp(jobId);
  }

  isOfficerJob(jobId: string): boolean {
    return this.jobService.isOfficerJob(jobId);
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  expandList(items: string[] | undefined): string[] {
    if (!items) return [];
    const result: string[] = [];
    for (const item of items) {
      if (!item) continue;
      const parts = item.split(/(?=\s+(?:[o•\u2022])\s+)/i);
      for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed) {
          result.push(trimmed);
        }
      }
    }
    return result;
  }

  isBulletless(item: string): boolean {
    const trimmed = item.trim();
    return trimmed.startsWith("(") || trimmed === "ET" || trimmed === "OU";
  }

  isConnector(item: string): boolean {
    const trimmed = item.trim();
    return trimmed === "ET" || trimmed === "OU";
  }

  isSubItem(item: string): boolean {
    const trimmed = item.trim();
    return (
      /^o\s+/i.test(trimmed) ||
      /^\-\s+/.test(trimmed) ||
      /^[a-z]\.\s+/i.test(trimmed) ||
      /^•\s+/.test(trimmed)
    );
  }

  cleanSubItem(item: string): string {
    return item
      .replace(/^[\s]*[o\-•]\s+/i, "")
      .replace(/^[\s]*[a-z]\.\s+/i, "");
  }

  isParenthetical(item: string): boolean {
    return item.trim().startsWith("(");
  }

  formatTextWithNotes(text: string) {
    // Escape HTML from input text just in case, before applying our tags
    const htmlEscaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // First, match embedded notes that follow specific keywords
    // Keywords: NOC, NPC, QE, suivants, libération, actuel, PM, etc.
    const embeddedRegex =
      /(^|[^\p{L}\p{N}])(NOC|NPC|NQ|suivants|suivantes|libération|actuel|actuelle|précédent|précédents|précédente|précédentes|années|civil|agréé|accrédité|EDO|Autorisation|Canada|vitae|D\.M\.D\.|professionnelle|Pharmacie|entrée|tertiaires|MÉ|cycle|autorisé|social|restriction|territoriale|M\.S\.S\.|clinique|OAP|Sgt\/M|Sgt|règle|RECL|PSAC|Candidat|candidats|PFOR|PMEP|PFUMR|PFOEP|PIOSR|PNSCO|MÉC|TECH|SUR|SAP|ADJUC|baccalauréat|expérience|diplôme|certificat|programme|professionnel|cours|OFP|GÉNIE|santé|dentaire|ESNEM|Critique|PMED|PFDM|MSÉ|pratique|infirmiers|chacun|ES-PMNE|stages)([^\p{L}\p{N}]{1,4}?)((?:[1-9]|1[0-9]|20)(?:,\s*(?:[1-9]|1[0-9]|20))*)(?=$|[^\p{L}\p{N}])/giu;

    let formatted = htmlEscaped.replace(
      embeddedRegex,
      (match, prefix, keyword, space, notes) => {
        // Split by comma to check if any of the numbers are > 20, just to be safe
        const maybeNotes = notes
          .split(",")
          .map((n: string) => parseInt(n.trim(), 10));
        if (maybeNotes.some((n: number) => n > 20)) {
          return match; // Don't format if there are numbers > 20
        }

        // We reconstruct the string so we only wrap the number part
        const styledNotes = `<sup class="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded ml-1 tracking-tighter">${notes}</sup>`;
        return prefix + keyword + space + styledNotes;
      },
    );

    // We match space followed by 1 to 20, optionally separated by commas, at the end of string or right before a colon
    const endRegex =
      /\s+((?:[1-9]|1[0-9]|20)(?:,\s*(?:[1-9]|1[0-9]|20))*)(?:\s*:)?$/g;

    formatted = formatted.replace(endRegex, (match, notes) => {
      // Split by comma to check if any of the numbers are > 20, just to be safe
      const maybeNotes = notes
        .split(",")
        .map((n: string) => parseInt(n.trim(), 10));
      if (maybeNotes.some((n: number) => n > 20)) {
        return match; // Don't format if there are numbers > 20
      }

      const hasColon = match.includes(":");
      const suffix = hasColon ? " :" : "";

      return ` <sup class="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded ml-1 tracking-tighter">${notes}</sup>${suffix}`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  constructor() {
    // Global event listeners for drag/resize end
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("mouseup", this.onMouseUp.bind(this));
  }

  onSearch(query: string) {
    this.filteredJobs.set(this.jobService.searchJobs(query));
  }

  selectJob(job: JobEntry) {
    this.selectedJob.set(job);
  }

  clearSelection() {
    this.selectedJob.set(null);
    this.onSearch("");
  }

  formatRequirements(req: string | undefined): SafeHtml {
    if (!req) return "";

    // Check if we have both Force Reguliere and Force de Reserve
    const regForceMatch = req.match(
      /FORCE RÉGULIÈRE:(.*?)(?=FORCE DE RÉSERVE:|$)/i,
    );
    const resForceMatch = req.match(/FORCE DE RÉSERVE:(.*)/i);

    if (regForceMatch) {
      const regText = regForceMatch[1].trim();
      const resText = resForceMatch ? resForceMatch[1].trim() : null;

      let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

      // Regular Force Column
      html += `
        <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="font-bold text-indigo-900 mb-3 border-b border-indigo-200 pb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            FORCE RÉGULIÈRE
          </h3>
          <div class="text-sm text-slate-700 space-y-2">
            ${this.formatList(regText)}
          </div>
        </div>
      `;

      // Reserve Force Column (if exists)
      if (resText) {
        html += `
          <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="font-bold text-indigo-900 mb-3 border-b border-indigo-200 pb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              FORCE DE RÉSERVE
            </h3>
            <div class="text-sm text-slate-700 space-y-2">
              ${this.formatList(resText)}
            </div>
          </div>
        `;
      }

      html += "</div>";
      return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    // Fallback simple formatting
    const simpleHtml = req
      .replace(
        /(FORCE RÉGULIÈRE|FORCE DE RÉSERVE)/g,
        '<br><br><strong class="text-indigo-900">$1</strong><br>',
      )
      .replace(/^<br><br>/, "");

    return this.sanitizer.bypassSecurityTrustHtml(simpleHtml);
  }

  private formatList(text: string): string {
    // Split by periods to make a list, but only if sentences are long enough
    const sentences = text
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (sentences.length > 1) {
      return `<ul class="list-disc list-outside ml-4 space-y-1">
        ${sentences.map((s) => `<li>${s}.</li>`).join("")}
      </ul>`;
    }
    return `<p>${text}</p>`;
  }

  close() {
    this.closeModal.emit();
  }

  toggleFullScreen() {
    this.isFullScreen.update((v) => !v);
  }

  // --- Drag Logic ---
  startDrag(e: MouseEvent) {
    if (this.isFullScreen()) return;
    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.initialPos = { ...this.position() };
    e.preventDefault(); // Prevent text selection
  }

  // --- Resize Logic ---
  startResize(e: MouseEvent) {
    if (this.isFullScreen()) return;
    this.isResizing = true;
    this.resizeStart = { x: e.clientX, y: e.clientY };
    this.initialSize = { ...this.size() };
    e.stopPropagation(); // Prevent drag
    e.preventDefault();
  }

  onMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.position.set({
        x: this.initialPos.x + dx,
        y: this.initialPos.y + dy,
      });
    } else if (this.isResizing) {
      const dx = e.clientX - this.resizeStart.x;
      const dy = e.clientY - this.resizeStart.y;
      this.size.set({
        width: Math.max(300, this.initialSize.width + dx),
        height: Math.max(200, this.initialSize.height + dy),
      });
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
  }
}
