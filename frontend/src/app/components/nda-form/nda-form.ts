import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { startWith } from 'rxjs/operators';

import { NdaFormData, defaultFormData } from '../../models/nda-form-data';

@Component({
  selector: 'app-nda-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
  ],
  templateUrl: './nda-form.html',
  styleUrl: './nda-form.scss',
})
export class NdaFormComponent {
  readonly valueChange = output<NdaFormData>();
  readonly downloadRequested = output<void>();

  private readonly fb = new FormBuilder().nonNullable;
  private readonly defaults = defaultFormData();

  readonly form = this.fb.group({
    purpose: [this.defaults.purpose, Validators.required],
    effectiveDate: [new Date(this.defaults.effectiveDate), Validators.required],
    mndaTermKind: ['fixed' as 'fixed' | 'untilTerminated'],
    mndaTermYears: [1, [Validators.required, Validators.min(1)]],
    confidentialityKind: ['fixed' as 'fixed' | 'perpetual'],
    confidentialityYears: [1, [Validators.required, Validators.min(1)]],
    governingLaw: ['', Validators.required],
    jurisdiction: ['', Validators.required],
    modifications: [''],
    party1: this.fb.group({
      name: ['', Validators.required],
      title: [''],
      company: ['', Validators.required],
      address: [''],
    }),
    party2: this.fb.group({
      name: ['', Validators.required],
      title: [''],
      company: ['', Validators.required],
      address: [''],
    }),
  });

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => this.valueChange.emit(this.toModel()));
  }

  download(): void {
    if (this.form.valid) {
      this.downloadRequested.emit();
    } else {
      this.form.markAllAsTouched();
    }
  }

  private toModel(): NdaFormData {
    const v = this.form.getRawValue();
    const effectiveDate =
      v.effectiveDate instanceof Date
        ? v.effectiveDate.toISOString().slice(0, 10)
        : (v.effectiveDate ?? '');
    return {
      purpose: v.purpose,
      effectiveDate,
      mndaTerm:
        v.mndaTermKind === 'fixed'
          ? { kind: 'fixed', years: v.mndaTermYears ?? 1 }
          : { kind: 'untilTerminated' },
      termOfConfidentiality:
        v.confidentialityKind === 'fixed'
          ? { kind: 'fixed', years: v.confidentialityYears ?? 1 }
          : { kind: 'perpetual' },
      governingLaw: v.governingLaw,
      jurisdiction: v.jurisdiction,
      modifications: v.modifications,
      party1: v.party1,
      party2: v.party2,
    };
  }
}
