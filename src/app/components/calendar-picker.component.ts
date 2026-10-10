import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  HostListener,
  ElementRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-calendar-picker",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-picker.component.html',
})
export class CalendarPickerComponent {
  private elementRef = inject(ElementRef);

  @Input() label: string = "";
  @Input() value: string = "";
  @Input() placeholder: string = "Sélectionner une date...";
  @Input() buttonText: string = "Calendrier";
  @Input() helperText: string = "";
  @Input() position: 'auto' | 'top' | 'bottom' = 'auto';
  @Input() align: 'right' | 'left' = 'right';

  @Output() dateSelected = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  isOpen = signal<boolean>(false);
  isOpenUpward = signal<boolean>(false);
  currentYear = signal<number>(2026);
  currentMonth = signal<number>(new Date().getMonth());

  monthsFrList = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  daysOfWeekShort = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  calendarGrid = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const padCount = (firstDay + 6) % 7;
    const pads = Array.from({ length: padCount }, (_, i) => i);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const trailingCount = 42 - (padCount + totalDays);
    const trailPads = Array.from({ length: trailingCount }, (_, i) => i);
    return { pads, days, trailPads };
  });

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleCalendar(event?: Event) {
    if (event) event.stopPropagation();
    if (!this.isOpen()) {
      if (this.value) {
        this.syncCalendarToValue();
      }
      this.calculatePosition();
    }
    this.isOpen.update((v) => !v);
  }

  private calculatePosition() {
    if (this.position === 'top') {
      this.isOpenUpward.set(true);
      return;
    }
    if (this.position === 'bottom') {
      this.isOpenUpward.set(false);
      return;
    }
    // Auto-detect based on screen and container boundaries
    try {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Height of calendar popup is ~300px
      // Open upward only if there is genuinely not enough space below in viewport (< 300px)
      // and significantly more space above (>= 300px)
      if (spaceBelow < 300 && spaceAbove >= 300 && spaceAbove > spaceBelow) {
        this.isOpenUpward.set(true);
      } else {
        this.isOpenUpward.set(false);
      }
    } catch {
      this.isOpenUpward.set(false);
    }
  }

  private syncCalendarToValue() {
    if (!this.value) return;

    // Check for DD-MM-YYYY format
    const ddmmyyyy = this.value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyy) {
      const monthIdx = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      if (monthIdx >= 0 && monthIdx <= 11) {
        this.currentMonth.set(monthIdx);
      }
      this.currentYear.set(year);
      return;
    }

    // Check for YYYY-MM-DD format
    const yyyymmdd = this.value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const monthIdx = parseInt(yyyymmdd[2], 10) - 1;
      if (monthIdx >= 0 && monthIdx <= 11) {
        this.currentMonth.set(monthIdx);
      }
      this.currentYear.set(year);
      return;
    }

    const yearMatch = this.value.match(/\b(20\d\d)\b/);
    if (yearMatch) {
      this.currentYear.set(parseInt(yearMatch[1], 10));
    }
    for (let i = 0; i < this.monthsFrList.length; i++) {
      if (this.value.toLowerCase().includes(this.monthsFrList[i].toLowerCase())) {
        this.currentMonth.set(i);
        break;
      }
    }
  }

  prevMonth(event?: Event) {
    if (event) event.stopPropagation();
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
  }

  nextMonth(event?: Event) {
    if (event) event.stopPropagation();
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
  }

  isSelectedDay(dayNum: number): boolean {
    if (!this.value) return false;
    const monthName = this.monthsFrList[this.currentMonth()].toLowerCase();
    const year = this.currentYear();
    const target = `${dayNum} ${monthName} ${year}`;
    if (this.value.toLowerCase().includes(target)) return true;

    const dStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const mNum = this.currentMonth() + 1;
    const mStr = mNum < 10 ? `0${mNum}` : `${mNum}`;
    if (this.value.includes(`${dStr}-${mStr}-${year}`) || this.value.includes(`${dayNum}-${mNum}-${year}`)) {
      return true;
    }
    return false;
  }

  selectDate(day: number, event?: Event) {
    if (event) event.stopPropagation();
    const monthName = this.monthsFrList[this.currentMonth()].toLowerCase();
    const year = this.currentYear();
    const formatted = `${day} ${monthName} ${year}`;
    this.dateSelected.emit(formatted);
    this.isOpen.set(false);
  }

  selectToday(event?: Event) {
    if (event) event.stopPropagation();
    const today = new Date();
    const day = today.getDate();
    const monthName = this.monthsFrList[today.getMonth()].toLowerCase();
    const year = today.getFullYear();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(year);
    const formatted = `${day} ${monthName} ${year}`;
    this.dateSelected.emit(formatted);
    this.isOpen.set(false);
  }

  onClear(event?: Event) {
    if (event) event.stopPropagation();
    this.cleared.emit();
    this.isOpen.set(false);
  }
}
