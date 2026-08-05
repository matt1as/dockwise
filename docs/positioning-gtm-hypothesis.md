# Dockwise: positioning and go-to-market hypothesis

**Status:** Working hypothesis for a hobby project, not validated market research.

## 1. Executive recommendation

Start with one problem, not “a sailing simulator”:

> **Dockwise is a calm, browser-based rehearsal tool for skippers of small fin-keel monohulls who want to practise the last 30 seconds of getting into a berth—before doing it for real.**

Initial wedge:

> **New or recently acquired 28–36 ft, single-engine saildrive monohull owners, especially short-handed skippers, preparing for their first season or an unfamiliar marina.**

The first product promise should be modest and credible: users can rehearse the sequence, see prop walk/wind/current/lines interact, understand why a maneuver failed, and arrive at the real boat with a plan. Do **not** promise that the model predicts every real boat or replaces on-water instruction.

The likely growth loop is manual and community-led: a sailor tries a scenario, shares a short screen recording or scenario recipe with a sailing group, another skipper asks for the same maneuver, and the maker adds/clarifies the lesson.

## 2. What is known versus what must be tested

### Known from the project

- Working browser app with Learn and Sandbox modes.
- 32 ft fin-keel sailboat, single S-drive, adjustable prop-walk direction/strength.
- Alongside, bow-to, and stern-to berth modes; mooring-line presets and custom line connections.
- Wind/current controls, telemetry, force vectors, warnings, lessons, retryable practice, desktop and mobile layouts.
- Offline/local use is possible; optional progress sync exists in the codebase.
- The README explicitly describes the model as qualitative and approximate rather than CFD or a certified navigation aid.

### Hypotheses requiring validation

- Docking anxiety is frequent and urgent enough to make people seek a simulator rather than a video, instructor, or a few low-speed practice sessions.
- The most valuable audience is owners/charterers of 28–36 ft monohulls, rather than dinghy sailors, large yachts, powerboaters, or sailing-game players.
- “Understand why the stern moves” is more compelling than “play a realistic sailing game.”
- Browser/mobile access materially lowers the barrier compared with installing a desktop simulator.
- The 32 ft single-saildrive configuration feels sufficiently representative to attract users with similar boats.
- People will share data or feedback about their boat setup and use a free hobby tool repeatedly.
- A free product can acquire users through sailing communities without paid promotion or a hosted backend.

## 3. Likely users and urgent jobs-to-be-done

### Primary: new or returning owner of a small cruising monohull

**Situation:** Boat purchase, launch, spring commissioning, move to a new berth, or first solo/short-handed trip.

**Jobs:**

- “Before I enter the marina, help me rehearse the exact sequence so I do not improvise under pressure.”
- “Show me what reverse gear and prop walk will do to my stern at low speed.”
- “Let me practise stern-to/alongside approaches and aborts without risking gelcoat, lines, neighbours, or crew confidence.”
- “Explain what I did wrong in plain language, not just give me a score.”

**Emotional outcome:** less dread and fewer surprises; a repeatable plan.

### Secondary: competent sailor who is weak specifically at close-quarters handling

**Situation:** Comfortable sailing offshore or between islands; uncomfortable in confined water.

**Jobs:**

- Isolate one variable at a time: reverse, rudder, prop walk, wind, current, or spring line.
- Practise on a laptop/phone between real-boat sessions.
- Build confidence without needing to book an instructor for every refresher.

### Secondary: sailing instructor, club mentor, or flotilla leader

**Situation:** Needs a visual aid before or after on-water teaching.

**Jobs:**

- Demonstrate forces and line geometry safely on a screen.
- Give students a repeatable homework exercise.
- Discuss a failure by replaying the scenario rather than relying on memory.

This segment may be valuable later, but it has higher trust and accuracy expectations. Do not lead with certification or institutional training until an instructor has endorsed the content.

### Low-priority audiences at launch

- Pure sailing-game players seeking graphics, exploration, racing, or multiplayer.
- Large motor yachts and twin-engine boats: their control problems differ.
- Dinghy sailors: no engine/berthing problem.
- Professional mariners: likely expect validated training systems and formal assessment.

## 4. Alternatives and competitive categories

These are alternatives users may choose, not necessarily direct substitutes:

1. **Real-boat practice with a friend/instructor** — highest physical fidelity and immediate feedback; costs time, weather, access, and sometimes money. It remains the benchmark Dockwise should complement, not disparage.
2. **YouTube, blogs, books, and club advice** — cheap and discoverable; good for concepts, weak for interactive repetition and personalised failure feedback.
3. **Online docking courses** — structured theory and exercises. NauticEd currently presents a paid “Maneuvering Under Power & Docking” course covering prop walk, spring lines, wind/current, and optional VR practice; this confirms the problem category exists, but does not establish market size or Dockwise demand. [Source](https://www.nauticed.org/sailing-courses/view/maneuvering-under-power)
4. **Broad sailing simulators** — eSail advertises tutorials plus sailing, mooring, anchoring, charting, and challenges; Sailaway is positioned around a broad sailing/weather/world simulation. These products compete for attention but are broader than a short, focused docking rehearsal. [eSail](https://www.esailyachtsimulator.com/) · [Sailaway guide](https://sailaway.world/pdf/UserGuide.pdf)
5. **Dedicated boat-docking simulators/apps** — examples found in a directional search include The Boat Docker (powerboat), Blue-2’s boat docking simulation, and the Dock Your Boat 3D app. Their existence means “docking simulator” is not an uncontested category; exact feature overlap, audience, pricing, activity, and user sentiment require direct research before making competitive claims. [Boat Docker](https://theboatdocker.com/training/welcome-to-the-boat-docker) · [Blue-2](https://www.blue-2.at/boat-docking-simulation-ru) · [App Store](https://apps.apple.com/us/app/dock-your-boat-3d/id1122445520)
6. **VR sailing/docking training** — more immersive, but requires hardware and a larger install/setup commitment. Treat VR as an eventual adjacent format, not a launch requirement.

**Competitive implication:** Dockwise should not claim “the only docking simulator” or “realistic enough for every boat.” The defensible opening is a focused teaching experience: browser-first, beginner-clear, small monohull/saildrive context, and explicit cause-and-effect.

## 5. Differentiation hypothesis

Potential reasons to choose Dockwise:

- **Narrow focus:** docking and low-speed maneuvering rather than an entire sailing world.
- **Explainable physics:** force vectors, telemetry, warnings, and coaching answer “why did the stern move?”
- **Relevant configuration:** fin keel + single S-drive + adjustable prop walk is closer to the mental model of many small cruising monohulls than a generic arcade boat. This representativeness must be tested, not assumed.
- **Line-aware practice:** users can rehearse spring lines and line presets, not only steer toward a target.
- **Low friction:** open in a browser, on desktop or phone, without a game purchase or VR headset.
- **Psychological safety:** repeat, pause, step, reset, and fail harmlessly; “Trust the process” is a useful tone anchor.
- **Honest scope:** clearly label approximations and encourage controlled calibration against the real boat.

The first three are product hypotheses. Ask users to rank them; do not build a roadmap around the maker’s intuition alone.

## 6. Positioning and messaging

### One-sentence positioning

For small-boat skippers who feel least confident when entering a berth, Dockwise is a browser-based docking rehearsal that makes prop walk, wind, current, rudder, and lines visible and repeatable—so they can practise a plan before risking the real boat.

### Landing-page headline options to test

1. **Practise docking before you reach the dock.**
2. **The last 30 seconds of sailing, rehearsed safely.**
3. **See why your stern moves. Then practise what to do about it.**
4. **A calm way to rehearse sailboat docking.**

Subhead:

> A free browser trainer for small fin-keel sailboats. Work through guided lessons or set wind, current, prop walk, and mooring lines yourself. It is a rehearsal tool—not a certified prediction of your boat.

CTA options:

- **Try the 5-minute stern-to lesson**
- **Practise a docking scenario**
- **Tell us about your boat**

Avoid leading with “physics engine,” “simulator,” or “game.” Those describe the implementation, not the user’s desired outcome. Use “simulator” for search/category clarity, but lead with confidence, rehearsal, and understanding.

## 7. Initial acquisition channels

Prioritise channels where the problem is already being discussed and where manual participation is acceptable:

1. **Local sailing clubs and owner communities** (Sweden/Nordics first, then English-language groups): offer a no-login demonstration and ask for critique, not promotion.
2. **Reddit/forums/Facebook groups**: contribute a useful explanation of prop walk, stern-to setup, or spring lines; disclose that Dockwise is the maker’s project and invite a specific test.
3. **Sailing instructors and yacht clubs**: send a two-minute demo plus one lesson link; ask whether it is useful as pre-brief/homework.
4. **Short screen recordings**: one problem per clip—“why the stern walks to port in reverse,” “recovering from a too-fast approach,” or “springing off.” These can be posted manually where allowed.
5. **SEO-shaped pages** only after learning which questions recur: “how to practise sailboat docking,” “saildrive prop walk,” “stern-to docking practice,” etc. Do not invest in broad SEO before search intent is confirmed.
6. **Product Hunt/Indie Hackers/side-project communities**: useful for maker feedback, but likely lower-quality evidence of sailor demand; treat traffic as awareness, not validation.

No paid ads, influencer campaign, or hosted analytics is needed for the first validation cycle.

## 8. 30-day low-cost validation plan

### Week 1: sharpen the problem

- Conduct 8–12 short interviews: ideally 6 target owners, 2 instructors/club mentors, and 2 sailors who do not dock under power confidently.
- Ask for a recent concrete episode, not opinions: “Tell me about the last docking that made you nervous. What did you do before it? What did you wish you could rehearse?”
- Record boat type, drive type, berth style, crew situation, weather/current, consequence/risk, current workaround, and whether they would try a browser tool.
- Do not demo first; avoid leading the interview.

**Evidence threshold:** at least 5 target users independently describe docking as a recurring or seasonally important problem and mention a current workaround they find inadequate.

### Week 2: concierge prototype

- Recruit 5 testers from interviewees.
- Give each a personally prepared scenario: their berth type, expected wind/current, and a single goal.
- Observe a screen-share or ask for a phone recording. Note where they hesitate, misunderstand controls, or disagree with the model.
- Manually explain how to map the scenario to the current 32 ft boat; this reveals configuration gaps before building them.

**Evidence threshold:** 4/5 can start the intended exercise without live help; 3/5 say the visual explanation changed their understanding; all can name one real-world situation they would practise next.

### Week 3: message and landing-page test

Create three lightweight pages or three headline variants pointing to the same live app:

- Confidence/rehearsal angle.
- Prop-walk/physics angle.
- Instructor/homework angle.

Use unique manual links or URL parameters and log visits, starts, completed first lesson, and feedback in a spreadsheet. Do not treat page views as demand.

**Evidence threshold:** among referred target sailors, at least 30% start the app and at least 15% complete the first lesson; these are provisional internal thresholds, not market benchmarks.

### Week 4: retention and referral test

- Ask testers to return once before a real sailing day and once afterward.
- Give them a “share this scenario” link or a small text recipe they can send to a crewmate.
- Ask for a one-sentence before/after response and whether they would recommend it to another skipper.
- Interview two users whose real boat behaved differently; turn mismatches into a calibration backlog, not silent claims of accuracy.

**Evidence threshold:** 5–10 users return without being individually chased, or at least 3 voluntarily share the tool/scenario with another sailor. If not, the product may be a one-time curiosity rather than a habit; test a pre-departure checklist/reminder use case before adding features.

## 9. Instrumentation and learning log

For the first phase, a local spreadsheet or privacy-preserving event log is enough. Track:

- referral source and audience type;
- device mode (mobile/desktop);
- first scenario and lesson start/completion;
- reset/retry count and abandonment point;
- selected berth mode, wind/current, and prop-walk setting;
- qualitative failure reason;
- return within 7 days;
- invite/share or unsolicited feedback;
- boat type/drive type when volunteered.

Do not collect unnecessary personal data. Make analytics optional and explain the limitations of the model. The most valuable metric is not raw traffic; it is **target sailors completing a relevant exercise and describing a real-world action they will change**.

## 10. Product priorities implied by the hypothesis

Build next only when a tester need is observed:

1. A five-minute “stern-to with reverse prop walk” onboarding path.
2. Clear reset/abort/retry and a visible “what happened” explanation.
3. Scenario presets named in sailor language: alongside, stern-to, bow-to, spring off, crosswind, current.
4. Shareable scenario recipes or URLs, preferably without accounts.
5. A simple boat-profile questionnaire: length, drive type, prop-walk direction/strength, rudder response, berth geometry.
6. Instructor mode only after at least one instructor uses the current product successfully.

Defer multiplayer, photorealistic graphics, broad boat fleets, formal certification, live weather, social feeds, and a paid backend until the core problem and repeat use are demonstrated.

## 11. Risks and falsifiers

- **Fidelity risk:** users may reject the model because their boat’s prop walk, rudder, saildrive, or windage differs. Falsifier: repeated testers say the model teaches the wrong correction even after explanation.
- **Low urgency:** sailors may prefer real practice or videos. Falsifier: interviews show docking is not painful enough to rehearse, and testers do not return before sailing.
- **Too narrow:** one 32 ft boat may not map to enough boats. Falsifier: target users want different drive/keel/berth configurations before they can learn anything.
- **Too complex:** controls may expose the model rather than teach beginners. Falsifier: most testers need live help to run the first exercise.
- **Wrong audience:** broad simulator players may produce traffic but not useful retention. Falsifier: engagement comes mainly from gamers while target owners do not complete lessons.
- **Trust/safety:** users may interpret the simulator as a guarantee. Mitigation: prominent scope disclaimer, no certification language, and explicit real-boat practice/safety framing.

## 12. Research backlog before making market claims

Verify directly, rather than infer from search results:

- active user counts, reviews, pricing, and current feature overlap for docking apps and sailing simulators;
- which languages and regions are underserved;
- frequency of searches and forum questions about saildrive prop walk, stern-to docking, and spring lines;
- whether instructors will recommend an unapproved hobby simulator;
- boat-type distribution among early testers;
- whether browser/mobile use is actually preferred over a desktop app;
- willingness to pay, only after users demonstrate repeat use.

## Bottom line

Treat Dockwise as a **focused confidence and explanation tool for small-monohull docking**, not as a general sailing game or a claim of physical certification. Get 8–12 sailors to recount real docking pain, run five concierge tests, and measure completed relevant rehearsals and voluntary referrals. Let those observations decide whether to deepen the single-saildrive niche, broaden boat profiles, or reposition toward instructor support.

### Directional sources consulted

- NauticEd docking course: https://www.nauticed.org/sailing-courses/view/maneuvering-under-power
- eSail official site: https://www.esailyachtsimulator.com/
- Sailaway guide: https://sailaway.world/pdf/UserGuide.pdf
- The Boat Docker: https://theboatdocker.com/training/welcome-to-the-boat-docker
- Blue-2 docking simulation: https://www.blue-2.at/boat-docking-simulation-ru
- Dock Your Boat 3D App Store listing: https://apps.apple.com/us/app/dock-your-boat-3d/id1122445520

These sources establish examples of categories and claims made by those products; they do **not** establish market size, user counts, superiority, or current demand for Dockwise.
