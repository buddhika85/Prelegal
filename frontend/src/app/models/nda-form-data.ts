export type TermSelection =
  | { kind: 'fixed'; years: number }
  | { kind: 'untilTerminated' };

export type ConfidentialityTermSelection =
  | { kind: 'fixed'; years: number }
  | { kind: 'perpetual' };

export interface Party {
  name: string;
  title: string;
  company: string;
  address: string;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTerm: TermSelection;
  termOfConfidentiality: ConfidentialityTermSelection;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
}

export const emptyParty = (): Party => ({
  name: '',
  title: '',
  company: '',
  address: '',
});

export const defaultFormData = (): NdaFormData => ({
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: new Date().toISOString().slice(0, 10),
  mndaTerm: { kind: 'fixed', years: 1 },
  termOfConfidentiality: { kind: 'fixed', years: 1 },
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1: emptyParty(),
  party2: emptyParty(),
});
