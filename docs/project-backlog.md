# Windows Font Catalog — Backlog

Updated: 2026-05-22

---

# Active / Near-Term

## UI — Search Experience

- [ ] Implement multi-layered / stacked search terms
- [ ] Allow user to add multiple independent search chips
- [ ] Support removable search chips via inline `x`
- [ ] Keep search chips visually adjacent to search field
- [ ] Search should AND-combine active chips by default
- [ ] Add local-session search state persistence
- [ ] Add keyboard-friendly search-chip navigation

## UI — Font Rendering / Inspection

- [ ] Add clickable font-card detail view
- [ ] Render full character set for selected font
- [ ] Add editable custom sample text field
- [ ] Ensure sample text updates responsively while typing
- [ ] Add point-size adjustment control
- [ ] Add scalable preview rendering
- [ ] Add large-format typography preview area
- [ ] Add close/back interaction for detail mode

## UI — Search Defaults

- [ ] Support configurable default-applied search terms
- [ ] Allow user to modify persisted default search-term set
- [ ] Visually distinguish default chips from session-added chips
- [ ] Preserve default chips across sessions
- [ ] Preserve session chips independently from defaults

## UI — General Exploration

- [ ] Improve visual card density tuning
- [ ] Improve scrolling ergonomics
- [ ] Improve visual hierarchy between sample and metadata
- [ ] Keep metadata hidden/minimized during exploration workflows
- [ ] Add optional metadata reveal/expand interaction

## UI - Uncategorized
- [ ] Add some type of navigation to docs and logs
- [ ] endpoint to render log file view
- [ ] hover over card animation
- [ ] track font selection.  Show/highlight counts on card
- [ ] support comparative selection during user search.  Mark cards for a focused selection set
---

# Discovery / Backend

## Discovery

- [ ] Properly support `.ttc` font collections
- [ ] Enumerate TTC fontNumber entries
- [ ] Support multiple FontInfo entries per physical path
- [ ] Revisit path uniqueness assumptions
- [ ] Improve path normalization semantics
- [ ] Investigate recursive discovery expansion
- [ ] Investigate per-user/local-user font discovery

## API

- [ ] Keep Swagger/OpenAPI documentation aligned with implementation
- [ ] Continue expanding field-level response descriptions
- [ ] Continue expanding endpoint-level semantic descriptions
- [ ] Add richer API response models

## Diagnostics

- [ ] Consider richer probe taxonomy evolution
- [ ] Consider structured/JSON probe output
- [ ] Consider future severity routing/filtering model
- [ ] Consider probe retention/session archival strategy

---

# Search / Relationship System

## Semantic Navigation

- [ ] Persist search trajectories/journeys
- [ ] Track relationship between sequential searches
- [ ] Track relationship between viewed fonts
- [ ] Track relationship between selected/final fonts
- [ ] Support semantic pivot suggestions
- [ ] Support "people also explored"-style recommendations
- [ ] Support relationship-driven discovery

## Similarity / Graph Exploration

- [ ] Investigate font similarity modeling
- [ ] Investigate semantic neighborhood/grouping system
- [ ] Investigate graph-based exploration UI
- [ ] Investigate clustering by visual similarity
- [ ] Investigate embedding-style relationship indexing
- [ ] Investigate saved exploration journeys

---

# UI Direction — Future Exploration

## Exploration Workspace

- [ ] Investigate "typographic light table" presentation style
- [ ] Investigate comparison-oriented spatial layouts
- [ ] Investigate visual adjacency/grouping concepts
- [ ] Investigate inline expansion vs dedicated detail mode

## Metadata / Inspector Mode

- [ ] Add advanced metadata query mode
- [ ] Add metadata inspector panel
- [ ] Add advanced filtering support
- [ ] Add OpenType feature visibility
- [ ] Add glyph count visibility
- [ ] Add Unicode range visibility
- [ ] Add variable-font axis visibility

## Explicit Font Loading

- [ ] Move from browser family-name rendering to explicit `@font-face` loading
- [ ] Serve exact discovered font files from backend
- [ ] Ensure deterministic browser rendering
- [ ] Remove ambiguity between duplicate family names

---

# Tooling / Project Hygiene

- [ ] Add TODO Tree evaluation for VS Code
- [ ] Evaluate lightweight task prioritization workflow
- [ ] Add backlog prioritization categories
- [ ] Add architectural milestone tracking

---

# Completed

## Backend / Discovery

- [x] Initial FastAPI application setup
- [x] Windows filesystem font discovery
- [x] Windows registry font discovery
- [x] FontCandidate abstraction
- [x] FontInfo abstraction
- [x] FontInfoCollection uniqueness enforcement
- [x] Path-based duplicate truncation
- [x] Immutable application configuration object
- [x] Class-oriented discovery subsystem architecture

## Diagnostics

- [x] Probe taxonomy separation
- [x] Trace probe support
- [x] Error probe severity levels
- [x] Lazy probe message construction
- [x] Runtime probe filtering
- [x] ANSI colorized console probes
- [x] VS Code clickable source paths
- [x] Probe persistence to file
- [x] Startup probe log reset behavior

## Tooling

- [x] Black integration
- [x] isort integration
- [x] Strict pyright typing
- [x] Format-on-save workflow
- [x] 108-column formatting standard

## Frontend

- [x] Initial frontend static hosting
- [x] Initial font rendering grid
- [x] Initial search filtering
- [x] Minimal metadata presentation
- [x] Initial Swagger/OpenAPI integration

