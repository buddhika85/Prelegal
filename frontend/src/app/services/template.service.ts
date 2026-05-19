import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);

  private standardTerms$?: Observable<string>;

  loadMutualNdaStandardTerms(): Observable<string> {
    this.standardTerms$ ??= this.http
      .get('/templates/Mutual-NDA.md', { responseType: 'text' })
      .pipe(shareReplay(1));
    return this.standardTerms$;
  }
}
