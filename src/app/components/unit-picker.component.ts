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
import { UnitSession, UNITS_LIST } from '../data/units.data';

@Component({
  selector: 'app-unit-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unit-picker.component.html',
})
export class UnitPickerComponent {
  private elementRef = inject(ElementRef);

  @Input() selectedId: string = '';

  @Output() unitSelected = new EventEmitter<UnitSession>();
  @Output() cleared = new EventEmitter<void>();

  isOpen = signal<boolean>(false);
  searchQuery = signal<string>('');
  isTyping = signal<boolean>(false);

  allUnits: UnitSession[] = UNITS_LIST;

  selectedUnit = computed<UnitSession | null>(() => {
    if (!this.selectedId) return null;
    return this.allUnits.find(u => u.id === this.selectedId || u.uic === this.selectedId) || null;
  });

  inputValue = computed<string>(() => {
    if (this.isTyping()) {
      return this.searchQuery();
    }
    const sel = this.selectedUnit();
    if (sel) {
      return `UIC ${sel.uic} - ${sel.abbrevCFR}`;
    }
    return this.searchQuery();
  });

  filteredUnits = computed<UnitSession[]>(() => {
    const q = this.normalizeStr(this.searchQuery().trim());
    if (!q) return this.allUnits;

    return this.allUnits.filter((unit) => {
      const uic = this.normalizeStr(unit.uic);
      const abbrev = this.normalizeStr(unit.abbrevCFR);
      const offName = this.normalizeStr(unit.officialName || '');
      const combined = `uic ${uic} - ${abbrev} ${offName}`;
      return (
        uic.includes(q) ||
        abbrev.includes(q) ||
        offName.includes(q) ||
        combined.includes(q) ||
        q.includes(uic) ||
        q.includes(abbrev)
      );
    });
  });

  private normalizeStr(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  isCurrentUnit(unit: UnitSession): boolean {
    const sel = this.selectedUnit();
    return sel ? sel.id === unit.id || sel.uic === unit.uic : false;
  }

  onFocus() {
    this.isTyping.set(true);
    const sel = this.selectedUnit();
    this.searchQuery.set(sel ? `UIC ${sel.uic} - ${sel.abbrevCFR}` : '');
    this.isOpen.set(true);
  }

  onInput(val: string) {
    this.isTyping.set(true);
    this.searchQuery.set(val);
    if (!this.isOpen()) {
      this.isOpen.set(true);
    }
  }

  selectUnit(unit: UnitSession) {
    this.unitSelected.emit(unit);
    this.isTyping.set(false);
    this.searchQuery.set(`UIC ${unit.uic} - ${unit.abbrevCFR}`);
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
      const sel = this.selectedUnit();
      this.searchQuery.set(sel ? `UIC ${sel.uic} - ${sel.abbrevCFR}` : '');
    }
  }
}
