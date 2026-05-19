import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

import { NdaFormData, defaultFormData } from '../../models/nda-form-data';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-nda-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './nda-preview.html',
  styleUrl: './nda-preview.scss',
})
export class NdaPreviewComponent {
  readonly data = input<NdaFormData>(defaultFormData());

  private readonly templates = inject(TemplateService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly standardTermsMd = toSignal(this.templates.loadMutualNdaStandardTerms(), {
    initialValue: '',
  });

  readonly standardTermsHtml = computed<SafeHtml>(() => {
    const md = this.standardTermsMd();
    if (!md) return '';
    const html = marked.parse(md, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly mndaTermLabel = computed(() => {
    const term = this.data().mndaTerm;
    return term.kind === 'fixed'
      ? `Expires ${term.years} year${term.years === 1 ? '' : 's'} from Effective Date.`
      : 'Continues until terminated in accordance with the terms of the MNDA.';
  });

  readonly confidentialityLabel = computed(() => {
    const term = this.data().termOfConfidentiality;
    return term.kind === 'fixed'
      ? `${term.years} year${term.years === 1 ? '' : 's'} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : 'In perpetuity.';
  });
}
