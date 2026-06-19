import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { GoogleGsiService } from './google-gsi.service';

@Component({
  selector: 'app-google-sign-in',
  standalone: true,
  template: `<div #host class="google-sign-in-host"></div>`,
  styles: `
    .google-sign-in-host {
      display: flex;
      justify-content: center;
      min-height: 44px;
    }
  `,
})
export class GoogleSignInComponent implements OnChanges {
  private readonly gsi = inject(GoogleGsiService);

  @Input() clientId = '';
  @Input() disabled = false;
  @Output() credential = new EventEmitter<string>();
  @Output() loadError = new EventEmitter<string>();

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientId'] || changes['disabled']) {
      void this.render();
    }
  }

  private async render(): Promise<void> {
    const host = this.hostRef.nativeElement;
    host.innerHTML = '';

    if (!this.clientId || this.disabled) return;

    try {
      await this.gsi.renderButton(host, this.clientId, (token) => this.credential.emit(token));
    } catch {
      this.loadError.emit('Could not load Google Sign-In.');
    }
  }
}
