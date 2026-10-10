import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-tuto-marcel",
  imports: [CommonModule],
  templateUrl: './tuto-marcel.component.html',
})
export class TutoMarcelComponent {
  @Output() close = new EventEmitter<void>();

  onBackToRoleChoice() {
    this.close.emit();
  }
}
