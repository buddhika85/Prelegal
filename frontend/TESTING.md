# Testing — Mutual NDA Creator (SCRUM-3)

This file covers how to run the automated test suite and a checklist of manual scenarios to verify before merging or releasing.

---

## Automated tests

### Unit tests (Karma + Jasmine)

```bash
cd frontend
npx ng test --browsers=ChromeHeadless --watch=false
```

Covers:

| Spec | What it asserts |
| --- | --- |
| `template.service.spec.ts` | Loads `/templates/Mutual-NDA.md` over HTTP, caches via `shareReplay(1)`, replays cached body to late subscribers. |
| `nda-form.spec.ts` | Default form values, required-field validation gating, `Validators.min` on years, `valueChange` emission on updates, `toModel()` conversion for every combination of MNDA-term and confidentiality kinds, Date → ISO string conversion of `effectiveDate`, null-year fallback to `1`, `download()` only emits when the form is valid. |
| `nda-preview.spec.ts` | Cover-page heading, party + governing-law/jurisdiction rendering, `mndaTermLabel` and `confidentialityLabel` copy and pluralisation, conditional Modifications section, markdown-to-HTML rendering of standard terms. |
| `app.spec.ts` | Topbar heading present, both panes rendered, `onValueChange` updates the data signal, `onDownload` no-ops safely when the preview target is not yet rendered. |

Total: **28 specs, all passing**.

### Build verification

```bash
# Compile-time check (TS + Angular template type-check + SCSS)
npx ng build --configuration development

# AOT + tree-shake + bundle-budget gate
npx ng build --configuration production
```

Initial bundle target: ≤ 1 MB raw / typically ~150 KB over the wire. `html2pdf.js` is dynamically imported in `app.ts` so it lives in a lazy chunk (loaded only on download click).

---

## Manual test plan

Run `npx ng serve` and open `http://localhost:4200/`. Walk through each scenario below.

### 1. First paint
- [ ] Page loads with the **Prelegal — Mutual NDA Creator** topbar.
- [ ] Form is visible on the left, preview on the right.
- [ ] Preview shows the cover-page heading **Mutual Non-Disclosure Agreement**.
- [ ] Preview shows the default **Purpose**, today's date as the **Effective Date**, **Expires 1 year from Effective Date.**, and **1 year from Effective Date…** under Term of Confidentiality.
- [ ] Governing Law / Jurisdiction / both party names + companies show "—" (em-dash placeholders).
- [ ] **Download PDF** button is disabled.
- [ ] Scrolling the preview reveals the full Common Paper Standard Terms (Sections 1 through 11).
- [ ] No errors in the browser console.

### 2. Required-field validation
- [ ] Leaving Governing Law empty keeps Download disabled.
- [ ] Leaving Jurisdiction empty keeps Download disabled.
- [ ] Leaving either Party Name empty keeps Download disabled.
- [ ] Leaving either Party Company empty keeps Download disabled.
- [ ] Clearing the **Years** input under MNDA Term (with kind = fixed) disables Download.
- [ ] Filling all of the above enables Download.

### 3. Live preview synchronisation
Type/select each of the following and confirm the preview updates within ~100 ms:
- [ ] Edit **Purpose** → preview's Purpose paragraph updates.
- [ ] Pick a different **Effective Date** via the datepicker → preview shows the new date in long form (e.g. "May 18, 2026"), and both **Date** cells in the parties table mirror it.
- [ ] Toggle MNDA Term to **Continues until terminated** → Years input disappears; preview reads "Continues until terminated in accordance with the terms of the MNDA."
- [ ] Switch MNDA Term back to **Expires after a fixed term** with **3 years** → preview reads "Expires 3 years from Effective Date." (plural).
- [ ] Set **Years = 1** → preview reads "Expires 1 year from Effective Date." (singular).
- [ ] Toggle Term of Confidentiality to **In perpetuity** → preview reads "In perpetuity."
- [ ] Switch back to fixed with **7 years** → preview reads "7 years from Effective Date, but in the case of trade secrets…".
- [ ] Type **Governing Law = "California"** and **Jurisdiction = "Los Angeles County, CA"** → both appear in the **Governing Law & Jurisdiction** section.
- [ ] Add free text under **Modifications** → an **MNDA Modifications** section appears in the preview. Clearing it removes the section.
- [ ] Edit Party 1 Name, Title, Company, Notice Address → preview's parties table reflects each in the Party 1 column.
- [ ] Repeat for Party 2.

### 4. PDF download
- [ ] With every required field filled, click **Download PDF**.
- [ ] A file named **Mutual-NDA.pdf** downloads to the OS default downloads folder.
- [ ] Open the PDF.
  - [ ] Page 1 starts with the **Mutual Non-Disclosure Agreement** heading.
  - [ ] All form values you entered are present (Purpose, Effective Date in long form, MNDA Term, Term of Confidentiality, Governing Law, Jurisdiction, optional Modifications, both parties' Name/Title/Company/Notice Address/Date).
  - [ ] The full Common Paper Standard Terms (Sections 1 through 11) appear after the cover page, including the CC BY 4.0 attribution at the end.
  - [ ] No content is cut off across page breaks (the document is paginated rather than truncated).

### 5. Edge cases
- [ ] Type a non-ASCII character in Party 1 Name (e.g. "Søren Müller") → preview and PDF render the character correctly.
- [ ] Paste a multi-line **Purpose** → preview wraps the text and the PDF preserves line breaks reasonably.
- [ ] Set Effective Date to a date in the past (e.g. 2020-01-01) → it accepts and renders.
- [ ] Set Years to a large value (e.g. 99) → preview reads "Expires 99 years from Effective Date." and the PDF is unaffected.
- [ ] Refresh the browser → form resets to defaults; no stale state visible.

### 6. Layout & responsiveness
- [ ] At a desktop width (≥ 1280px) the two-column layout shows form left, preview right, both fully visible.
- [ ] Resize the window narrower than ~980px → layout collapses to single column (form first, then preview).
- [ ] Preview pane is independently scrollable on desktop.

### 7. Browser coverage (smoke)
- [ ] Latest Chrome — works.
- [ ] Latest Firefox — works.
- [ ] Latest Edge — works.
- [ ] Latest Safari (macOS) — works *or* note any html2pdf.js incompatibilities.

### 8. Network resilience
- [ ] DevTools → Network tab → throttle to "Slow 3G" → reload. The preview's cover page renders immediately; the standard terms section appears once `/templates/Mutual-NDA.md` finishes loading.
- [ ] Block `/templates/Mutual-NDA.md` (DevTools → Network → Block request URL) → reload. The cover page still renders; the standard terms section is empty but the app does not crash.

---

## Notes for reviewers

- `Mutual-NDA.md` is served as a build asset via `angular.json`. If the deploy environment uses a non-root `<base href>`, change the asset path or update `template.service.ts` accordingly.
- `html2pdf.js` is loaded only when Download is clicked. The first download click incurs ~130 KB of network transfer; subsequent clicks are instant (the chunk is cached).
- The standard-terms markdown is rendered with `marked` and bound via `bypassSecurityTrustHtml`. Because the source is a static asset under our control, this is safe. Do **not** apply this pattern to user-supplied input without re-evaluating.
