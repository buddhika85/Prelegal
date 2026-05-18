import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TemplateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches the standard terms markdown from /templates/Mutual-NDA.md', () => {
    const expected = '# Standard Terms\nbody';
    let received: string | undefined;

    service.loadMutualNdaStandardTerms().subscribe((md) => (received = md));

    const req = http.expectOne('/templates/Mutual-NDA.md');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('text');
    req.flush(expected);

    expect(received).toBe(expected);
  });

  it('shares one HTTP request across multiple subscribers via shareReplay', () => {
    const responses: string[] = [];
    service.loadMutualNdaStandardTerms().subscribe((md) => responses.push(md));
    service.loadMutualNdaStandardTerms().subscribe((md) => responses.push(md));

    const req = http.expectOne('/templates/Mutual-NDA.md');
    req.flush('cached');

    expect(responses).toEqual(['cached', 'cached']);
  });

  it('replays the cached body to a subscriber that arrives after the response', () => {
    let late: string | undefined;
    service.loadMutualNdaStandardTerms().subscribe();
    http.expectOne('/templates/Mutual-NDA.md').flush('once');

    service.loadMutualNdaStandardTerms().subscribe((md) => (late = md));
    expect(late).toBe('once');
  });
});
