import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { NdaPreviewComponent } from './nda-preview';
import { NdaFormData, defaultFormData } from '../../models/nda-form-data';
import { TemplateService } from '../../services/template.service';

class StubTemplateService {
  body = '';
  loadMutualNdaStandardTerms(): Observable<string> {
    return of(this.body);
  }
}

function fullData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...defaultFormData(),
    governingLaw: 'Delaware',
    jurisdiction: 'New Castle, DE',
    party1: { name: 'Alice', title: 'CEO', company: 'Acme', address: 'a@a.com' },
    party2: { name: 'Bob', title: 'CTO', company: 'Globex', address: 'b@b.com' },
    ...overrides,
  };
}

describe('NdaPreviewComponent', () => {
  let fixture: ComponentFixture<NdaPreviewComponent>;
  let component: NdaPreviewComponent;
  let stub: StubTemplateService;

  function setup(data: NdaFormData, termsMd = ''): void {
    stub.body = termsMd;
    fixture = TestBed.createComponent(NdaPreviewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    stub = new StubTemplateService();
    await TestBed.configureTestingModule({
      imports: [NdaPreviewComponent],
      providers: [{ provide: TemplateService, useValue: stub }],
    }).compileComponents();
  });

  it('renders the cover page heading', () => {
    setup(fullData());
    const h1 = fixture.nativeElement.querySelector('header h1') as HTMLElement;
    expect(h1.textContent).toContain('Mutual Non-Disclosure Agreement');
  });

  it('renders party names and company values from the input', () => {
    setup(fullData());
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
    expect(text).toContain('Acme');
    expect(text).toContain('Globex');
  });

  it('renders Governing Law and Jurisdiction values', () => {
    setup(fullData());
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Delaware');
    expect(text).toContain('New Castle, DE');
  });

  it('mndaTermLabel singularises "year" for years=1', () => {
    setup(fullData({ mndaTerm: { kind: 'fixed', years: 1 } }));
    expect(component.mndaTermLabel()).toBe('Expires 1 year from Effective Date.');
  });

  it('mndaTermLabel pluralises "years" for years>1', () => {
    setup(fullData({ mndaTerm: { kind: 'fixed', years: 5 } }));
    expect(component.mndaTermLabel()).toBe('Expires 5 years from Effective Date.');
  });

  it('mndaTermLabel uses the until-terminated copy when kind=untilTerminated', () => {
    setup(fullData({ mndaTerm: { kind: 'untilTerminated' } }));
    expect(component.mndaTermLabel()).toBe(
      'Continues until terminated in accordance with the terms of the MNDA.',
    );
  });

  it('confidentialityLabel uses the perpetual copy when kind=perpetual', () => {
    setup(fullData({ termOfConfidentiality: { kind: 'perpetual' } }));
    expect(component.confidentialityLabel()).toBe('In perpetuity.');
  });

  it('renders the Modifications section only when modifications is non-empty', () => {
    setup(fullData());
    expect((fixture.nativeElement.textContent as string).includes('MNDA Modifications')).toBeFalse();

    setup(fullData({ modifications: 'Custom clause X.' }));
    expect(fixture.nativeElement.textContent).toContain('MNDA Modifications');
    expect(fixture.nativeElement.textContent).toContain('Custom clause X.');
  });

  it('renders the loaded standard terms markdown as HTML', () => {
    setup(fullData(), '# Standard Terms\n\nHello **world**.');
    const html = fixture.nativeElement.querySelector('.standard-terms').innerHTML as string;
    expect(html).toContain('<h1>Standard Terms</h1>');
    expect(html).toContain('<strong>world</strong>');
  });
});
