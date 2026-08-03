# Bow-to and Stern-to Berths Implementation Plan

**Goal:** Extend Dockwise so the boat can begin and maneuver alongside, bow-to, or stern-to against the quay.

**Architecture:** Keep the horizontal quay and tested half-plane collision model. Add a pure berth-state factory that sets safe perpendicular initial poses. The UI selects the berth orientation and generates appropriate end-on paired lines using the existing aft/forward attachment stations and dock cleats.

## Tasks

1. Add failing tests for alongside, bow-to, and stern-to initial headings and safe dock clearance.
2. Implement `createBerthState(mode, dockBoundaryY, gap)` in the physics module.
3. Add orientation buttons and mode-aware reset behavior to the UI.
4. Add paired bow/stern line presets when changing end-on orientation.
5. Extend the Chrome test to operate both new modes and confirm collision-free starting poses.
6. Run physics, syntax, local-browser, public-browser, and Pages deployment checks.
