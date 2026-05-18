import { ChangeDetectionStrategy, Component, signal, viewChild, ElementRef } from '@angular/core';

import { NdaFormComponent } from './components/nda-form/nda-form';
import { NdaPreviewComponent } from './components/nda-preview/nda-preview';
import { NdaFormData, defaultFormData } from './models/nda-form-data';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NdaFormComponent, NdaPreviewComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly data = signal<NdaFormData>(defaultFormData());
  readonly previewHost = viewChild<ElementRef<HTMLElement>>('previewHost');

  onValueChange(value: NdaFormData): void {
    this.data.set(value);
  }

  async onDownload(): Promise<void> {
    const host = this.previewHost()?.nativeElement;
    const target = host?.querySelector('#nda-document') as HTMLElement | null;
    if (!target) return;

    const { default: html2pdf } = await import('html2pdf.js');
    html2pdf()
      .set({
        margin: [12, 12],
        filename: 'Mutual-NDA.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(target)
      .save();
  }
}
