import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseSession, COURSE_SESSIONS_LIST } from '../data/course-sessions.data';

@Component({
  selector: 'app-course-series-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-series-picker.component.html',
})
export class CourseSeriesPickerComponent {
  private elementRef = inject(ElementRef);

  @Input() serie: string = '';
  @Input() dateDebut: string = '';
  @Input() dateFin: string = '';

  @Output() courseSelected = new EventEmitter<CourseSession>();
  @Output() cleared = new EventEmitter<void>();

  isOpen = signal<boolean>(false);
  searchQuery = signal<string>('');
  isTyping = signal<boolean>(false);

  allSessions: CourseSession[] = COURSE_SESSIONS_LIST;

  selectedSession = computed<CourseSession | null>(() => {
    const s = this.serie;
    const deb = this.dateDebut;
    const fin = this.dateFin;

    if (!deb && !fin && !s) return null;

    const exact = this.allSessions.find(
      (item) =>
        (!s || item.serie === s) &&
        (!deb || item.dateDebut.toLowerCase() === deb.toLowerCase()) &&
        (!fin || item.dateFin.toLowerCase() === fin.toLowerCase())
    );
    if (exact) return exact;

    if (deb && fin) {
      const byDates = this.allSessions.find(
        (item) =>
          item.dateDebut.toLowerCase() === deb.toLowerCase() &&
          item.dateFin.toLowerCase() === fin.toLowerCase()
      );
      if (byDates) return byDates;
    }

    return null;
  });

  getFormattedCourse(session: CourseSession): string {
    return `Série ${session.serie} (Du ${session.dateDebut} au ${session.dateFin})`;
  }

  inputValue = computed<string>(() => {
    if (this.isTyping()) {
      return this.searchQuery();
    }
    const sel = this.selectedSession();
    if (sel) {
      return this.getFormattedCourse(sel);
    }
    if (this.serie || (this.dateDebut && this.dateFin)) {
      const s = this.serie ? `Série ${this.serie} ` : '';
      return `${s}(Du ${this.dateDebut} au ${this.dateFin})`.trim();
    }
    return this.searchQuery();
  });

  filteredSessions = computed<CourseSession[]>(() => {
    const q = this.normalizeStr(this.searchQuery().trim());
    if (!q) return this.allSessions;

    return this.allSessions.filter((session) => {
      const sNum = this.normalizeStr(session.serie);
      const sDeb = this.normalizeStr(session.dateDebut);
      const sFin = this.normalizeStr(session.dateFin);
      const full = `serie ${sNum} du ${sDeb} au ${sFin}`;

      return (
        sNum.includes(q) ||
        sDeb.includes(q) ||
        sFin.includes(q) ||
        full.includes(q) ||
        q.includes(sNum) ||
        q.includes(sDeb)
      );
    });
  });

  private normalizeStr(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  isCurrentSession(session: CourseSession): boolean {
    const sel = this.selectedSession();
    if (sel && sel.id === session.id) return true;
    if (
      this.serie === session.serie &&
      this.dateDebut.toLowerCase() === session.dateDebut.toLowerCase() &&
      this.dateFin.toLowerCase() === session.dateFin.toLowerCase()
    ) {
      return true;
    }
    return false;
  }

  getEffectiveDates(): string {
    const sel = this.selectedSession();
    if (sel) {
      return `${sel.dateDebut} au ${sel.dateFin}`;
    }
    return `${this.dateDebut} au ${this.dateFin}`;
  }

  onFocus() {
    this.isTyping.set(true);
    const sel = this.selectedSession();
    if (sel) {
      this.searchQuery.set(this.getFormattedCourse(sel));
    } else if (this.serie || (this.dateDebut && this.dateFin)) {
      const s = this.serie ? `Série ${this.serie} ` : '';
      this.searchQuery.set(`${s}(Du ${this.dateDebut} au ${this.dateFin})`.trim());
    } else {
      this.searchQuery.set('');
    }
    this.isOpen.set(true);
  }

  onInput(val: string) {
    this.isTyping.set(true);
    this.searchQuery.set(val);
    if (!this.isOpen()) {
      this.isOpen.set(true);
    }
  }

  selectSession(session: CourseSession) {
    this.courseSelected.emit(session);
    this.isTyping.set(false);
    this.searchQuery.set(this.getFormattedCourse(session));
    this.isOpen.set(false);
  }

  onClear(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.cleared.emit();
    this.isTyping.set(false);
    this.searchQuery.set('');
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.isTyping.set(false);
      const sel = this.selectedSession();
      if (sel) {
        this.searchQuery.set(this.getFormattedCourse(sel));
      } else if (this.serie || (this.dateDebut && this.dateFin)) {
        const s = this.serie ? `Série ${this.serie} ` : '';
        this.searchQuery.set(`${s}(Du ${this.dateDebut} au ${this.dateFin})`.trim());
      } else {
        this.searchQuery.set('');
      }
    }
  }
}
