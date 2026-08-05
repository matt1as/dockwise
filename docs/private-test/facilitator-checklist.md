# Dockwise private test — facilitator checklist

## Test goal

Validate whether five beginner sailors can understand and use the core training loop without coaching from Mattias.

## Tester profile

Prefer people who:

- describe themselves as beginner or early-stage sailors;
- have limited docking confidence;
- can use a modern phone browser;
- are not already familiar with Dockwise.

Do not recruit from a public post for this round. Use personal contacts only after Mattias approves the wording and recipient.

## Before each session

- Confirm the tester has the private LAN URL.
- Confirm the tester is on the same Wi-Fi as the Mac.
- Start the local app with `npm run start:lan`.
- Do not ask the tester to create an account.
- Open a blank/private browser context if practical so previous local storage does not bias the session.
- Have the tester handout and feedback form ready.

## During each session

- Start a timer; target 20–25 minutes.
- Do not explain the lesson before the tester tries it.
- Record the first point of confusion verbatim.
- Record whether the tester completes or abandons each lesson.
- Note whether the tester can find the next action without help.
- Note technical failures separately from product confusion.
- Do not correct the tester’s sailing assumptions during the first attempt.

## Minimum evidence per tester

- Completed first-run Learn flow.
- Attempted Momentum and neutral.
- Attempted Rudder needs flow.
- Attempted Arrive alongside.
- Tried phone engine and rudder controls.
- Gave feedback without being prompted toward a positive answer.

## After each session

- Save the anonymized feedback using a tester label such as `T01`.
- Record one strongest positive signal and one blocking confusion.
- Record whether the tester would try another lesson.
- Reset local browser data before the next tester if needed.

## Release checks before tester 1

```bash
npm test
npm run build
npm run verify:build
npm run test:browser
```

Then verify manually:

- `npm run start:lan` serves the app on the current Mac LAN address.
- A phone on the same Wi-Fi can load the Learn screen.
- No account is required to complete the test flow.
- The app still works if Supabase is unavailable.
- Reloading does not expose test credentials or local secrets.

## Stop conditions

Pause the test round if:

- a tester cannot load the app;
- the simulator reports a physically impossible lesson state;
- a test exposes another tester’s progress;
- the app asks for secrets or unnecessary personal data;
- the facilitator must explain the basic task repeatedly.
