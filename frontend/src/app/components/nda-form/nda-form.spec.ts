import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NdaFormComponent } from './nda-form';
import { NdaFormData } from '../../models/nda-form-data';

describe('NdaFormComponent', () => {
  let fixture: ComponentFixture<NdaFormComponent>;
  let component: NdaFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NdaFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(NdaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('seeds the form with defaults from defaultFormData()', () => {
    const v = component.form.getRawValue();
    expect(v.purpose).toBe(
      'Evaluating whether to enter into a business relationship with the other party.',
    );
    expect(v.effectiveDate instanceof Date).toBeTrue();
    expect(v.mndaTermKind).toBe('fixed');
    expect(v.mndaTermYears).toBe(1);
    expect(v.confidentialityKind).toBe('fixed');
    expect(v.confidentialityYears).toBe(1);
  });

  it('is invalid until governing-law, jurisdiction and both party name+company are filled', () => {
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({
      governingLaw: 'Delaware',
      jurisdiction: 'New Castle, DE',
      party1: { name: 'Alice', company: 'Acme' },
      party2: { name: 'Bob', company: 'Globex' },
    });
    expect(component.form.valid).toBeTrue();
  });

  it('marks years controls invalid when cleared (Validators.required)', () => {
    component.form.controls.mndaTermYears.setValue(null as any);
    expect(component.form.controls.mndaTermYears.invalid).toBeTrue();

    component.form.controls.mndaTermYears.setValue(1);
    expect(component.form.controls.mndaTermYears.valid).toBeTrue();
  });

  it('rejects mndaTermYears below 1 via Validators.min', () => {
    component.form.controls.mndaTermYears.setValue(0);
    expect(component.form.controls.mndaTermYears.errors?.['min']).toBeTruthy();
  });

  it('emits valueChange on subsequent form updates', () => {
    const emissions: NdaFormData[] = [];
    component.valueChange.subscribe((v) => emissions.push(v));

    component.form.patchValue({ governingLaw: 'California' });
    expect(emissions.length).toBeGreaterThanOrEqual(1);
    expect(emissions[emissions.length - 1].governingLaw).toBe('California');
  });

  it('toModel: maps mndaTermKind=fixed to { kind: "fixed", years }', () => {
    component.form.patchValue({ mndaTermKind: 'fixed', mndaTermYears: 3 });
    const model = (component as any).toModel() as NdaFormData;
    expect(model.mndaTerm).toEqual({ kind: 'fixed', years: 3 });
  });

  it('toModel: maps mndaTermKind=untilTerminated to { kind: "untilTerminated" }', () => {
    component.form.patchValue({ mndaTermKind: 'untilTerminated' });
    const model = (component as any).toModel() as NdaFormData;
    expect(model.mndaTerm).toEqual({ kind: 'untilTerminated' });
  });

  it('toModel: maps confidentialityKind=fixed to { kind: "fixed", years }', () => {
    component.form.patchValue({ confidentialityKind: 'fixed', confidentialityYears: 5 });
    const model = (component as any).toModel() as NdaFormData;
    expect(model.termOfConfidentiality).toEqual({ kind: 'fixed', years: 5 });
  });

  it('toModel: maps confidentialityKind=perpetual to { kind: "perpetual" }', () => {
    component.form.patchValue({ confidentialityKind: 'perpetual' });
    const model = (component as any).toModel() as NdaFormData;
    expect(model.termOfConfidentiality).toEqual({ kind: 'perpetual' });
  });

  it('toModel: converts a Date effectiveDate to ISO yyyy-mm-dd string', () => {
    component.form.controls.effectiveDate.setValue(new Date('2030-06-15T12:00:00Z'));
    const model = (component as any).toModel() as NdaFormData;
    expect(model.effectiveDate).toBe('2030-06-15');
  });

  it('toModel: falls back to years=1 when the years control is null', () => {
    component.form.patchValue({ mndaTermYears: null as any, confidentialityYears: null as any });
    const model = (component as any).toModel() as NdaFormData;
    expect(model.mndaTerm).toEqual({ kind: 'fixed', years: 1 });
    expect(model.termOfConfidentiality).toEqual({ kind: 'fixed', years: 1 });
  });

  it('download(): emits downloadRequested only when the form is valid', () => {
    const emitted: number[] = [];
    component.downloadRequested.subscribe(() => emitted.push(1));

    component.download();
    expect(emitted.length).toBe(0);
    expect(component.form.touched).toBeTrue();

    component.form.patchValue({
      governingLaw: 'Delaware',
      jurisdiction: 'New Castle, DE',
      party1: { name: 'A', company: 'Acme' },
      party2: { name: 'B', company: 'Globex' },
    });
    component.download();
    expect(emitted.length).toBe(1);
  });
});
