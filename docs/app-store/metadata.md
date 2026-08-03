# Dockwise App Store metadata — release candidate 1.0.0

> Preparation only. This document does not claim that a build has been uploaded, approved, priced, or released.

## Product identity

- **Name:** Dockwise
- **Bundle ID:** `io.nacka.dockwise` (provisional permanent identifier)
- **Version / build:** 1.0.0 (1)
- **Category:** Education (primary), Utilities (secondary)
- **Age rating:** 4+
- **Copyright:** © 2026 Mattias Johansson
- **Support URL:** https://matt1as.github.io/dockwise/support.html (available after Pages is switched to the bundled GitHub Actions deployment)
- **Privacy policy URL:** https://matt1as.github.io/dockwise/privacy.html (available after Pages is switched to the bundled GitHub Actions deployment)

## Subtitle

Understand the forces. Dock with confidence.

## Promotional text

Practice low-speed sailboat docking offline. See how momentum, thrust, prop walk, rudder, wind, current, and lines work together—then build skill through ten guided lessons.

## Description

Dockwise is a focused, top-down sailboat docking simulator for learning what the boat will do before committing to a maneuver.

Work through ten guided lessons or experiment freely in Sandbox. Adjust engine direction and throttle, rudder angle, prop-walk direction, wind, current, berth orientation, and dock-line arrangements. Live force arrows and plain-language guidance connect each control to the boat’s response.

Features:

- Ten guided lessons with repeatable goals and feedback
- Alongside, bow-to, and stern-to berth orientations
- Configurable prop walk, wind, current, and dock lines
- Live telemetry, line loads, collisions, and force analysis
- Saved scenarios and lesson progress stored on device
- Haptic cues for meaningful contacts, overloads, and lesson outcomes
- Full offline operation with no account, ads, analytics, or tracking

Dockwise is a qualitative training simulator, not a certified hydrodynamic model or navigation aid. Use it to understand relationships and rehearse decisions, then rely on vessel-specific instruction, seamanship, and safe judgment on the water.

## Keywords

sailing,docking,boat,training,simulator,seamanship,marina,berthing,prop walk,rudder

## TestFlight beta description

Dockwise 1.0 is an offline sailboat docking trainer with ten guided lessons and a free-form Sandbox. This beta focuses on native iPhone and iPad packaging, durable on-device progress/scenario storage, safe-area layouts, rotation, and restrained haptic feedback while preserving the browser simulator.

## What to Test

1. Launch once, begin a lesson, close the app, and verify lesson attempts/progress return after relaunch.
2. Save, rename, load, and delete Sandbox scenarios; relaunch and verify saved data remains.
3. Trigger one dock collision and one line overload. Confirm each produces a single haptic transition rather than continuous vibration.
4. Complete or fail a lesson and confirm one outcome haptic and readable result feedback.
5. Rotate between portrait and landscape on iPhone and iPad. Check that controls, coach, canvas, and bottom transport remain clear of notches, rounded corners, and the home indicator.
6. Put the device offline before launch and confirm every lesson and Sandbox feature still works.
7. Verify that no account, permission prompt, ad, analytics request, or external web dependency appears.

Please report device model, iOS version, app version/build, and reproduction steps to mattias@nacka.io.

## App Review notes

Dockwise is entirely usable offline and has no login, account, purchases, advertising, analytics, or user-generated network content. Reviewers can choose **Skip to Sandbox** from the first screen or open any lesson directly.

To exercise native features:

- Lesson and scenario changes are mirrored to iOS Preferences/UserDefaults.
- Haptics occur only when entering a collision, line-overload, lesson-success, or lesson-failure state and are deduplicated/rate-limited.
- No protected device APIs or special entitlements are requested.

The simulator is explicitly qualitative and is not represented as a navigation aid or certified vessel model.

## App Privacy answers

- **Data collected:** No
- **Data used to track you:** No
- **Third-party analytics:** No
- **Third-party advertising:** No
- **Account required:** No
- **User content sent off device:** No
- **Local data:** Lesson progress, onboarding state, and user-created scenarios remain on device (and may be included in OS-managed backups according to the user’s settings).
- **Privacy manifest required-reason API:** UserDefaults, reason `CA92.1`, used to store app-specific preferences accessible only to Dockwise.

## Export compliance

- `ITSAppUsesNonExemptEncryption`: `false`
- Dockwise does not implement non-exempt encryption. Standard platform transport behavior is not used for app content because the app operates offline.

## Pricing position

Position Dockwise as a **one-time $4.99 paid download**: no subscription, consumables, advertising, or in-app purchase. Confirm the final storefront tier and local equivalents in App Store Connect before release; no price is configured or claimed by this repository.

## Release checklist still requiring App Store Connect / full Xcode

- Confirm the bundled GitHub Pages deployment is live at the support and privacy URLs above.
- Create/select the matching App ID and App Store Connect record.
- Set the paid-app agreement and $4.99-equivalent tier.
- Add screenshots for required device classes.
- Archive, sign, upload, complete compliance/rating forms, and submit for review.
