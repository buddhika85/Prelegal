import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { App } from './app';
import { NdaFormData, defaultFormData } from './models/nda-form-data';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the Prelegal heading and both panes', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.topbar h1')?.textContent).toContain('Prelegal');
    expect(host.querySelector('app-nda-form')).not.toBeNull();
    expect(host.querySelector('app-nda-preview')).not.toBeNull();
  });

  it('onValueChange updates the data signal so the preview re-renders', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const next: NdaFormData = { ...defaultFormData(), governingLaw: 'California' };
    fixture.componentInstance.onValueChange(next);
    expect(fixture.componentInstance.data().governingLaw).toBe('California');
  });

  it('onDownload safely no-ops when the preview target is not yet rendered', async () => {
    const fixture = TestBed.createComponent(App);
    // Do NOT call detectChanges — previewHost will not be set.
    await expectAsync(fixture.componentInstance.onDownload()).toBeResolved();
  });
});
