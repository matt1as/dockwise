# Dockwise private-test QA/release checklist

**Scope:** five beginner testers, phones on the same Wi-Fi, private LAN only, no paid service, no public launch.

## Release decision

Do not hand off until every **P0** item passes. A failed P1 item requires either a fix or an explicit facilitator workaround documented before tester 1.

### P0 — must pass

- [ ] The exact checkout is identified and clean enough to test; no unreviewed source/config change is introduced during the round.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run verify:build` passes.
- [ ] `npm run test:browser` passes with no runtime exceptions.
- [ ] A fresh LAN server is listening on `0.0.0.0:4173`, not a stale process or a silently substituted port.
- [ ] A real phone on the same Wi-Fi loads the Learn screen from the current LAN URL.
- [ ] Learn, the first lesson, Retry/Exit, phone engine/rudder controls, and optional Sandbox work without an account.
- [ ] Refreshing or using one tester's browser does not expose another tester's local progress. Use a separate/private browser context or clear site data between testers.
- [ ] No secrets, passwords, or unnecessary personal data are requested. Tell testers not to use real passwords if they encounter the optional account panel.

### P1 — required before a smooth beginner round

- [ ] Tester URL, host Mac name, current LAN IP, port, Wi-Fi name, test duration, and stop/help instructions are in one handoff message.
- [ ] The facilitator has the tester handout, feedback form, timer, and anonymized IDs `T01`–`T05` ready.
- [ ] The host Mac is on power, will not sleep, and the terminal running Vite will remain open for the whole session.
- [ ] Firewall/router client isolation is known not to block peer-to-peer LAN access.
- [ ] A recovery path exists: reload first, then use a fresh/private tab; facilitator can restart Vite without changing the tested checkout.
- [ ] The simulator's qualitative-model disclaimer is visible/communicated; testers are not asked to treat it as navigation advice.

## Exact local verification

Run from `/Users/krabban/src/sailboat-docking-simulator`:

```bash
npm ci
npm test
npm run build
npm run verify:build
npm run test:browser
```

`npm run test:browser` requires Chrome/Chromium remote debugging on `127.0.0.1:9222` and a server at `http://127.0.0.1:4173`. It covers first-run Learn, all ten lessons, lesson retry/failure, control synchronization, persistence, signed prop walk, mobile 390 px overflow, 44 px touch targets, and runtime exceptions.

Before a tester session, start a fresh LAN server and verify ownership:

```bash
# Stop only the old Dockwise/Vite process if one is already using 4173.
lsof -nP -iTCP:4173 -sTCP:LISTEN
npm run start:lan
```

Leave that terminal open. In a second terminal, verify the listener and local HTTP response:

```bash
lsof -nP -iTCP:4173 -sTCP:LISTEN
curl -fsS -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:4173/
```

Resolve the address immediately before handoff; do not rely on the old `192.168.1.223` value:

```bash
ipconfig getifaddr en0 || true
ifconfig | awk '/inet / && $2 !~ /^(127\\.|169\\.254\\.)/ {print $2}'
```

Use the active Wi-Fi address returned by the command, for example `http://192.168.1.223:4173/`. If Vite reports another port, stop and resolve the collision rather than handing out the fallback URL.

Finally, perform one real-phone check:

1. Put the phone and Mac on the same non-guest Wi-Fi.
2. Open the exact `http://<CURRENT-LAN-IP>:4173/` URL in Safari or Chrome.
3. Confirm the Learn screen appears, tap **Start first lesson**, operate one engine and one rudder control, then reload.
4. Confirm the page returns without a blank canvas or horizontal page scroll.
5. Return to a fresh/private tab or clear site data before the first recorded session.

## Tester handoff steps

Send privately, one tester at a time or to the approved private group; do not publish the URL:

1. `Open this private URL while your phone is on the same Wi-Fi as the host Mac: http://<CURRENT-LAN-IP>:4173/`.
2. `You do not need an account. Do not enter a real password or personal information.`
3. `Set aside 20–25 minutes. Start in Learn, follow the coach, retry once if needed, try Rudder needs flow and Arrive alongside, then try the phone engine/rudder controls. Sandbox is optional.`
4. `Think aloud: say what you expect before tapping.`
5. `If it will not load, first confirm the Wi-Fi, then reload once. Report the exact URL/device/browser and what happened; do not search for or use the public Pages URL.`
6. `When finished, answer the feedback form from memory. Use only the tester label provided (T01–T05); do not include passwords or sensitive data.`

The facilitator should observe without teaching the maneuver on the first attempt, record the first confusion verbatim, separate technical failure from product confusion, and reset browser data before the next tester.

## Likely blockers / missing artifacts

- **Current LAN IP is not stable.** Resolve it immediately before each session with `ipconfig getifaddr en1` or the active-interface command; the current Mac session reports `192.168.1.223` on `en1`. Do not rely on this value after a network change.
- **The server is operator-dependent.** Phones need the host Mac's Vite process to stay alive; sleep, VPN changes, firewall prompts, guest Wi-Fi isolation, or a stale/fallback port can make the URL fail.
- **No dedicated tester URL/QR or IP-discovery helper exists.** The handoff must be assembled manually each session. A QR code is optional, but if used it must encode the current LAN URL and stay private.
- **The README points to `docs/private-test/` artifacts that are present locally but not tracked by `git ls-files` in this checkout.** Verify these files are included in the handoff/release bundle or explicitly preserve them outside version control: `tester-handout.md`, `facilitator-checklist.md`, `feedback-form.md`, and `recruitment-message.md`.
- **No PWA manifest/service worker is present.** This is acceptable for LAN browser testing, but testers cannot install an offline web app and a phone cannot continue if the host server stops. The app's offline claim means local state works without Supabase, not that the LAN URL is independent of the host.
- **Optional account UI is misleading for this round when Supabase env vars are absent.** The app correctly falls back to local-only mode, but beginners may still tap “Create free account”; instruct them not to and treat any request for credentials as a release blocker.
- **The browser automation is not a phone-network test.** It passes desktop/headless and emulated mobile checks; it does not prove Safari/Chrome on a real phone can reach the Mac. The one-phone smoke test above remains mandatory.

## Stop/rollback criteria

Pause the round if any tester cannot load the app, the app asks for secrets, one tester sees another tester's progress, a core lesson/control is technically broken, or the facilitator must repeatedly explain the basic task. Keep the terminal/server running for evidence; record the URL, device/browser, timestamp, and console/runtime symptom before restarting.
