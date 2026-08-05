# Dockwise: Two-Week Private Validation Protocol

**Purpose:** Determine whether five beginner sailors can understand and enjoy Dockwise's core teaching loop—read a short briefing, try a maneuver, observe the result, and repeat—without facilitator rescue. This is a private usability and learning validation, not a test of real-world seamanship.

**Scope:** Five testers, local/LAN build only, no public launch, no paid services, no required account, and no contact with prospective testers without explicit owner approval.

## 1. Tester profile

Recruit five adults who meet all of the following:

- Beginner sailors: roughly 0–2 years of sailing or fewer than 10 docking sessions; comfortable saying “I don't know.”
- Have used a sailboat or sailing simulator enough to recognize bow, stern, port/starboard, throttle, rudder, and dock lines, but are not instructors, delivery skippers, or simulator/game experts.
- Mix devices where practical: at least two phone/tablet users and two laptop/desktop users; record device/input method.
- Mix confidence levels and backgrounds; do not recruit only friends who will be agreeable.
- Able to attend one 50–60 minute session during the two-week window, with an optional 20-minute follow-up.

Do not collect unnecessary personal data. Assign IDs T1–T5. Capture only sailing experience band, device, session date, completion metrics, quotes, and consent status.

## 2. Humane, low-cost guardrails

- Private invitation only after the project owner approves the exact invite list/message; do not cold-contact anyone.
- Describe it as trying an early simulator, not proving sailing ability. “There are no wrong answers; we are testing the product.”
- Participation is voluntary; testers may pause or stop at any time and may skip a task without explanation.
- No account, email, Supabase, payment, or public posting is required. Use local browser storage and a fresh/private browser profile where possible.
- Do not record video, audio, screen, or faces by default. Take lightweight notes only; ask permission separately before any recording.
- One facilitator observes silently. Do not explain controls or solve a maneuver during the first attempt; answer only “what would you normally try next?” if the tester is stuck. Give a neutral reset after 60 seconds of visible frustration.
- Offer a short break halfway through. Keep the session to 60 minutes maximum.
- If compensation is appropriate, use a small pre-approved thank-you (for example, coffee or a sailing-club snack); never make payment contingent on success.

## 3. Standard session setup

**Environment:** Run the existing Vite app on the facilitator's laptop and share over the same LAN, or use localhost on the test device. Use the local-only path; leave optional cloud account controls untouched. Start with a clean progress state and the default simulation speed.

**Materials:** One-page consent/introduction, facilitator script, task sheet, stopwatch, and a spreadsheet or plain Markdown notes file. The tester sees only the task prompts, not the success thresholds.

**Session length:** 55 minutes target (60-minute hard stop).

| Time | Activity | Facilitator behavior |
|---|---|---|
| 0–5 min | Welcome, consent, background | Explain purpose, privacy, stop-rights; ask sailing/device questions. |
| 5–10 min | Orientation | Show only how to open a lesson and where Run/Reset are. Ask tester to narrate what they think the rest does. |
| 10–25 min | Lessons 1–4 | Observe fundamentals in order; allow one retry per lesson. |
| 25–30 min | Break and check-in | Ask for a break; capture first impressions, not solutions. |
| 30–43 min | Lessons 5–7 | Test spring departure, wind assistance, and first real arrival. Skip a lesson if frustration exceeds 3/5. |
| 43–50 min | Choice challenge | Tester chooses one of lessons 8–10, preferably lesson 10 if they feel ready. |
| 50–55 min | Questionnaire and close | Complete questionnaire; ask one “keep/change/remove” question; explain next steps. |

If a tester is slow, preserve the same order and skip lesson 6 before skipping lesson 7. Never extend the session to chase a completion metric.

## 4. Task/lesson protocol

For every task, read the prompt verbatim, then ask the tester to think aloud. Log: started, completed/failed/skipped, retries, facilitator intervention, notable confusion, and a one-sentence quote. A lesson counts as independently completed only when the app reports completion without the facilitator naming the control sequence.

| Task | Lesson | Prompt to tester | Primary learning/usability signal |
|---|---|---|---|
| A | 1. Momentum and neutral | “Start the lesson. Show me how you would build a little way, then stop gently. Tell me what you expect Neutral to do.” | Understands that Neutral removes thrust but does not erase momentum; can start/run/reset. |
| B | 2. Rudder needs flow | “Try the suggested comparison and explain when the rudder seems to work.” | Notices rudder authority depends on water flow/prop wash; reads the comparison without coaching. |
| C | 3. Reverse prop walk | “Use the smallest experiment you think will reveal the sideways reverse effect.” | Discovers the effect through a short astern pulse and can describe direction/strength qualitatively. |
| D | 4. Controlled pivot | “Reach the target heading while staying controlled. What would you change after the bow starts turning?” | Uses short inputs/early counter-steer rather than holding full power; understands correction timing. |
| E | 5. Leave on aft spring | “Depart using the tutorial line. Decide when to release it.” | Finds Connect tutorial lines, understands spring geometry, releases before overload. |
| F | 6. Leave in offshore wind | “Repeat the departure with the wind helping. Use as little power as you can.” | Treats wind as assistance, monitors line load, does not simply add speed. |
| G | 7. Arrive alongside | “Approach and settle alongside, parallel and clear, with no step-by-step help.” | Core product test: plans low-speed approach, selects Neutral early, stops without contact. |
| H (choice) | 8, 9, or 10 | “Choose the challenge that feels useful. Tell me why you chose it, then attempt it once.” | Motivation, perceived relevance, transfer to bow-to/stern-to/mixed conditions, and whether choice UI is legible. |

Do not coach the “correct” sailing technique. If the simulator behaves unexpectedly, mark the attempt as a product issue rather than treating the tester's behavior as failure.

## 5. Success signals to record

### Per-tester signals

- **Independent operation:** can open a lesson, find Run, change engine/rudder, use Reset, and interpret the completion/failure state without facilitator pointing.
- **Learning signal:** after lessons 1–4, can explain in their own words at least two of: momentum/Neutral, rudder flow, prop walk, early counter-steer.
- **Transfer signal:** on lesson 7 or the choice challenge, applies at least one idea from lessons 1–4 without being reminded.
- **Emotional signal:** reports no distress and rates frustration during the session at 3/5 or lower; facilitator pauses immediately if this is not true.
- **Product signal:** can identify what to try next from the lesson briefing, experiment, steps, or hints; note the exact point where they cannot.

### Aggregate signals

Treat the private validation as a pass when all of the following are true:

1. **5/5** can start and reset a lesson without facilitator intervention.
2. **4/5** independently complete at least three of lessons 1–4 on a first or second attempt, with no collision.
3. **3/5** independently complete lesson 7 (alongside arrival) by the app's success state, with no collision; the remaining testers can state a plausible next adjustment.
4. **4/5** correctly explain Neutral/momentum and rudder flow after the fundamentals; **3/5** can describe prop walk or spring departure accurately enough to guide a next attempt.
5. **4/5** can find and use the relevant hint or experiment text without being directed to a specific sentence.
6. Median ratings are **≥4/5** for “I understood what to try next” and “I would try another lesson.” No tester rates overall frustration 5/5.
7. There are **no unresolved blocker defects** that prevent starting, controlling, resetting, or seeing a completion/failure result on either mobile or desktop. Any collision, line-load, misleading copy, or layout issue is logged with reproduction steps.
8. At least **3/5** voluntarily choose to attempt a second lesson/challenge after the scheduled tasks, or explicitly request a follow-up. This is a motivation signal, not a required completion.

A failed aggregate criterion is a learning signal: do not move the threshold or coach testers to manufacture a pass. Classify the response as **continue privately with fixes**, **retest**, or **stop/pivot** after reviewing notes.

## 6. Structured feedback questionnaire

Ask immediately after the session. Use 1–5 scales unless noted: 1 = strongly disagree/very poor, 5 = strongly agree/excellent. Keep open answers short; read questions neutrally.

### Background (record, do not over-collect)

1. Sailing experience: none / <1 year / 1–2 years / other: ____
2. Approximate docking experience: 0 / 1–5 / 6–10 / 10+
3. Device and input: phone / tablet / laptop / desktop; mouse / touch / trackpad / other

### Understanding and usability

4. I understood what each lesson was trying to teach. **1 2 3 4 5**
5. I usually knew what to try next. **1 2 3 4 5**
6. I could tell what the boat was doing and why. **1 2 3 4 5**
7. I could find controls, Run, Reset, hints, and lesson progress. **1 2 3 4 5**
8. The amount of text/instruction felt: far too little / a little too little / right / a little too much / far too much
9. Which lesson or screen was hardest to understand? What did you expect instead?
10. What, if anything, felt misleading, broken, or unexpectedly difficult?

### Learning and confidence

11. After trying Dockwise, I better understand why Neutral does not stop a moving boat instantly. **1 2 3 4 5**
12. After trying Dockwise, I better understand why a rudder needs water flow. **1 2 3 4 5**
13. I could apply something from an earlier lesson in a later challenge. **1 2 3 4 5**
14. Which concept would you want another example or explanation for?
15. What did you discover without the facilitator telling you?

### Comfort and motivation

16. The session pace felt: much too slow / a little slow / right / a little fast / much too fast
17. My peak frustration was **1 2 3 4 5** (1 none, 5 overwhelming).
18. I would try another Dockwise lesson on my own. **1 2 3 4 5**
19. I would recommend this to a beginner sailor. **1 2 3 4 5**
20. If you could change one thing before the next test, what would it be?
21. Complete: **Keep ____; change ____; remove ____ .**
22. May we invite you for one optional 20-minute follow-up? yes / no

## 7. Two-week schedule

### Days 1–2: Prepare, do not recruit yet

- Finalize the private invite only after owner approval; recruit five plus one backup only if approved.
- Create T1–T5 note templates and the questionnaire.
- Run a 20-minute facilitator rehearsal on desktop and mobile using lessons 1, 4, 7, and 10.
- Confirm local/LAN instructions, fresh progress state, browser support, and a manual fallback (screenshots plus notes if LAN fails).

### Days 3–5: Invite and schedule privately

- Send the approved short invite individually; offer two time windows and say “about 55 minutes, stop anytime.”
- Collect only consent, availability, experience band, and device. Do not ask testers to create accounts.
- Schedule three sessions in the first week and two in the second, leaving at least one recovery day between sessions.

### Days 6–8: Run first three sessions (T1–T3)

- Follow the same script and task order.
- After each session, spend 15 minutes tagging observations as comprehension, navigation, physics feedback, copy, performance, or motivation.
- Fix only safety/blocker issues between sessions if possible; record every change so results remain interpretable. Do not silently change lesson difficulty or prompts.

### Days 9–11: Synthesize midpoint and run T4

- Review the first three sessions for repeated blockers. If a change is necessary, freeze a dated build and use it consistently for T4–T5.
- Run T4 with the same protocol; probe only repeated issues, not individual preferences.

### Days 12–13: Run T5 and optional follow-ups

- Run T5. Offer optional follow-ups only to clarify a repeated issue; never pressure a tester to return.
- If a tester asks for another challenge, capture the request as motivation evidence rather than adding unscripted tasks to the acceptance score.

### Day 14: Decide and report

- Tabulate all acceptance criteria, defect severity, completion counts, ratings, and representative quotes by tester ID.
- Produce three decisions: **fix and retest**, **continue private validation**, or **stop/pivot**.
- Share the internal summary only with the project owner/team; no public launch, testimonial, or external contact without separate approval.

## 8. Minimal data sheet

For each tester, record one row per task:

`tester_id | device/input | task | started | outcome (complete/fail/skip) | attempts | collision | facilitator intervention | confusion quote | confidence 1–5`

Add one questionnaire row per tester and a defect log with `severity (blocker/high/medium/low) | reproduction | expected | actual | device | screenshot only if consented | owner | status`.

**Decision rule:** prioritize issues repeated by at least two testers, any blocker, and any issue that causes a tester to stop or misunderstand a core concept. Do not optimize for perfect scores; optimize for clearer learning, lower frustration, and independent next actions.
