# Dockwise private beginner-test recruitment brief

**Status:** Internal draft for Mattias. Do not send or publish without Mattias choosing each recipient and approving the final wording.

## Objective

Recruit **five private contacts over two weeks** for short, consented usability tests of Dockwise. The purpose is to learn whether a beginner can understand and practise the core docking concepts without being coached—not to collect compliments, testimonials, or a mailing list.

This is a hobby-stage experiment. There is no public launch, payment, account requirement, or paid recruitment tool.

## Product proposition being tested

> Dockwise helps a beginner sailor understand and rehearse low-speed sailboat docking—especially momentum, neutral, rudder effectiveness, prop walk, and simple alongside manoeuvres—through short guided browser lessons that can be used on a phone or desktop.

The proposition is deliberately narrower than “learn to dock a real boat.” Dockwise is a simplified training aid, not a navigation aid, instructor, or guarantee of real-world behaviour.

## Who to invite

Prefer people who meet most of these criteria:

- A personal contact Mattias can approach individually and respectfully.
- Self-described beginner or early-stage sailor, or someone with little confidence in harbour manoeuvres.
- Has sailed or is actively learning to sail, but is not a professional instructor, naval architect, simulator developer, or Dockwise contributor.
- Can use a recent phone or laptop browser.
- Can give an uninterrupted **20–25 minutes** and speak candidly while trying an unfamiliar tool.
- Is not already committed to giving positive feedback because of a close relationship; if they are close, explicitly invite criticism and treat their response as lower-confidence evidence.

Aim for variation across phone/desktop and sailing experience. Do not recruit five people who all share the same boat, instructor, or assumptions.

## Who not to invite for this round

- Anyone who would feel obliged to participate or praise the project.
- Minors unless Mattias has an appropriate, separately reviewed consent process.
- People whose health, disability, employment, or other sensitive circumstances would need to be recorded to interpret the test.
- Anyone asking for payment, an account, access to private project data, or a promise that the simulator is accurate.
- Public audiences, sailing-group posts, scraped contacts, or unsolicited bulk messages.

## What to say before they agree

Be clear that:

- It is a private usability test of an unfinished hobby project.
- It takes about 20–25 minutes and is free.
- They may use a phone or laptop; phone testing is especially useful.
- There are no right or wrong answers and the test is not a test of sailing ability.
- Mattias will mainly note task success, confusion, and their own words.
- No account or personal data is needed in Dockwise.
- They can skip a question or stop at any time.
- Their feedback will not be published or used as an endorsement without asking separately.
- The private URL must not be forwarded or posted publicly.

Do not describe the expected “correct” manoeuvre before the first attempt. Do not promise that the model matches their boat or real-world physics.

## Screening: minimum questions only

Ask conversationally, and do not build a recruitment database. Record only “fit / not fit / pending” if needed.

1. “Hur skulle du beskriva din erfarenhet av segling och hamnmanövrer—nybörjare eller relativt ny?”
2. “Har du en telefon eller laptop som du kan använda i ungefär 25 minuter?”
3. “Kan du testa privat med mig under de närmaste två veckorna?”
4. “Är det okej att jag antecknar anonymiserad feedback om vad som var tydligt eller förvirrande?”

Do **not** ask for personnummer, full address, date of birth, passwords, payment details, precise location, or unnecessary demographic information.

## Session shape

1. Mattias confirms a time and gives the current private LAN URL shortly before the session.
2. Participant reads the short handout and agrees to proceed.
3. Participant tries Learn lessons with think-aloud prompts; Mattias observes before helping.
4. Participant tries phone controls where applicable, then optionally one Sandbox experiment.
5. Mattias asks the neutral end questions and records an anonymized label such as `T01`.
6. Mattias thanks them and says what happens to the notes; no incentive is required or implied.

Target five completed sessions, but do not force a session through a technical failure or a participant who wants to stop.

## Recruitment message template

Use the separate `recruitment-message.md`. Personalize only the greeting, why Mattias thought of the person, and scheduling options. Do not add invented claims, urgency, or a request to forward the message.

## Evidence plan: beginner value proposition

### Primary outcome

A beginner can start and complete the core learning loop with little or no coaching, and reports that the lessons improved their understanding or confidence enough to practise again.

### Record per participant

- Device type: phone / desktop / laptop.
- Whether they reached the first lesson without help.
- Whether they completed or meaningfully attempted: Momentum and neutral, Rudder needs flow, and Arrive alongside.
- Number and nature of facilitator interventions; distinguish technical recovery from product explanation.
- First unprompted confusion, verbatim where possible.
- Whether they could state what to do next.
- Whether they found the simulated reaction plausible enough for practice, with reasons.
- Whether they would try another lesson or return after improvements.
- One strongest positive signal and one blocking issue.

Do not turn a smile, politeness, or “looks cool” into evidence of value.

### Provisional validation threshold after five tests

Treat the beginner proposition as **supported for the next iteration** if all of the following are true:

- At least **4 of 5** reach Learn and start the first lesson without step-by-step explanation.
- At least **4 of 5** complete or make a purposeful attempt at the core lesson sequence; no more than one abandons because the task or next action is unclear.
- At least **3 of 5** independently articulate at least one intended learning (“neutral stops adding thrust,” “rudder needs flow,” “reverse can move the stern/bow unexpectedly,” or equivalent).
- At least **3 of 5** say they would use another lesson or practise again, and their reason refers to learning/rehearsal rather than politeness.
- At least **3 of 5** judge the reactions plausible enough to rehearse with, while understanding that the model is simplified.
- No repeated high-severity trust issue: misleading safety/accuracy claim, exposure of another tester’s data, request for unnecessary personal data, or inability to use the app without an account.

This supports “promising for beginners in this narrow test,” not market fit, learning efficacy, or real-world safety.

### Invalidation or required pivot signals

Treat the proposition as **not yet supported** and revise or narrow it if any of these occur:

- **2 or more of 5** cannot start or continue the first lesson without substantial coaching about the controls or objective.
- **2 or more of 5** cannot tell what to do next, or interpret the same core control in a systematically wrong way.
- **3 or more of 5** abandon before a meaningful lesson attempt because the setup, language, or feedback is confusing.
- **3 or more of 5** say the simulation is not believable/useful enough to practise with, especially for the same reason.
- **Fewer than 3 of 5** express a credible desire to try another lesson or return, after being asked neutrally.
- Testers consistently describe a different job as more valuable (for example, boat-specific planning for one berth rather than beginner learning).
- Evidence shows the five testers were too close to Mattias or too experienced to represent the intended beginner cohort; repeat with a better sample before drawing a product conclusion.

One technical bug does not invalidate the proposition, but it must be separated from conceptual confusion and fixed before counting the affected task.

## Decision rule after the round

- **Supported:** keep the beginner proposition; fix the top repeated confusion and retest.
- **Mixed:** do not expand scope; identify the strongest segment or lesson and run a smaller focused retest.
- **Not supported:** pause recruitment and rewrite the proposition or product flow before more testing.
- **Safety/privacy stop:** pause immediately, preserve the minimum evidence, and fix the issue before another session.

Never publish participant quotes, names, screenshots, or endorsements from this round without separate explicit permission.
