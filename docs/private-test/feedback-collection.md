# Dockwise private-test feedback collection

**Purpose:** collect useful product evidence without paid tools, public forms, or unnecessary personal data.

## Recommended method: local facilitator notes

Use Mattias's existing local text editor or a paper sheet during each session. This is the lowest-data option and works with the LAN-only test.

1. Assign the participant a code such as `T01`, `T02`, etc. Keep the name/contact-to-code mapping only in Mattias's private address book or a temporary handwritten note; do not copy names into the research file.
2. Before starting, ask for verbal consent to take anonymized usability notes. Record `consent: yes` and the date, not a signature or contact details.
3. Record observations under the code only. Use the existing `feedback-form.md` as the worksheet.
4. Separate technical faults from learning/confusion. Quote only short, non-identifying phrases when useful.
5. Do not audio/video record, capture screenshots, or collect browsing history unless the participant gives separate, specific permission. Recording is unnecessary for this five-person round.
6. At the end, ask the participant to answer the neutral questions before Mattias shares his interpretation.
7. Store the notes in a local folder outside any public repository, for example `~/Documents/Dockwise-private-test/`. Do not put participant notes in Git, GitHub, the public site, Supabase, analytics, or a shared cloud document.
8. Use a separate summary file containing only codes and aggregated counts. Do not combine the summary with the contact list.
9. Keep raw notes only until the round is synthesized and any follow-up corrections are complete—default **30 days maximum**—then securely delete the raw notes and any code key. Keep only genuinely anonymous aggregate findings if still useful.
10. If a participant asks to withdraw their notes before deletion, delete that participant's raw notes and remove their row from the working summary where practical.

This is a practical data-minimization workflow, not a legal determination of GDPR compliance. If the project later handles a larger cohort, accounts, recordings, or cloud storage, review the privacy approach before doing so.

## Free fallback if a digital response is necessary

If a participant cannot give feedback live, Mattias may send the questions in a one-to-one message and manually copy only anonymous answers into the local worksheet. Tell them not to include names, email addresses, boat registration, precise location, or other sensitive details. Do not use a public Google Form, public spreadsheet, mailing-list tool, or third-party survey service for this round.

If a local HTML form is used, keep it offline/local and verify that it does not submit to a network endpoint. The form should have no name/email fields and should not load external analytics or fonts.

## Minimal data inventory

Keep:

- tester code;
- session date;
- device category and browser, only for troubleshooting;
- task outcomes and observations;
- short answers to the feedback questions;
- consent-to-notes marker and withdrawal/deletion status.

Avoid:

- full name, email, phone number, address, personnummer, age, employer, exact marina/boat identity;
- account credentials, passwords, payment data, health data, or precise location;
- IP addresses, analytics identifiers, cookies for research purposes, or hidden tracking;
- identifiable photos, recordings, or screenshots;
- claims that a participant endorsed or validated Dockwise.

## Suggested local file layout

```text
~/Documents/Dockwise-private-test/
  raw/
    T01.md
    T02.md
  summary.md
  deletion-date.txt
```

Do not create `contacts.csv` in the research folder. If a code key is needed temporarily, keep it separate from `raw/` and delete it first after synthesis.

## End-of-round summary template

```text
Round: Dockwise private beginner test
Dates:
Participants completed: __ / 5
Devices: __ phone, __ desktop/laptop

Core task outcomes:
- Started first lesson without substantial help: __ / __
- Meaningful core sequence attempt: __ / __
- Could state at least one intended learning: __ / __
- Would try another lesson/return: __ / __
- Plausible enough to practise with: __ / __

Repeated confusion themes:
1.
2.
3.

Repeated positive signals:
1.
2.

Technical issues (separate from product confusion):

Decision: supported / mixed / not supported / safety or privacy stop
Next smallest change:
Raw-note deletion date:
```

## Privacy stop conditions

Pause collection if the app requests unnecessary personal data, exposes one participant's progress to another, sends notes or identifiers to an unexpected service, or if a participant's identity becomes attached to a quote or screenshot without permission. Fix the issue before continuing.
