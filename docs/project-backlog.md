# Windows Font Catalog — Backlog

Updated: 2026-05-24

---

# Active / Near-Term

## UI — Search Experience

- [x] Implement multi-layered / stacked search terms
- [x] Allow user to add multiple independent search chips
- [x] Support removable search chips via inline `x`
- [x] Keep search chips visually adjacent to search field
- [x] Search should AND-combine active chips by default
- [ ] Add local-session search state persistence
- [ ] Add keyboard-friendly search-chip navigation

## UI — Font Rendering / Inspection

- [x] Add clickable font-card detail view
- [x] Render full character set for selected font
- [x] Add editable custom sample text field# Windows Font Catalog — Backlog

Updated: 2026-05-24

---

# Active / Near-Term

## UI — Search Experience

- [x] Implement multi-layered / stacked search terms
- [x] Allow user to add multiple independent search chips
- [x] Support removable search chips via inline `x`
- [x] Keep search chips visually adjacent to search field
- [x] Search should AND-combine active chips by default
- [ ] Add local-session search state persistence
- [ ] Add keyboard-friendly search-chip navigation

## UI — Font Rendering / Inspection

- [x] Add clickable font-card detail view
- [x] Render full character set for selected font
- [x] Add editable custom sample text field
- [x] Ensure sample text updates responsively while typing
- [x] Add point-size adjustment control
- [x] Add scalable preview rendering
- [x] Add large-format typography preview area
- [x] Add close/back interaction for detail mode

## UI — Search Defaults

- [ ] Support configurable default-applied search terms
- [ ] Allow user to modify persisted default search-term set
- [ ] Visually distinguish default chips from session-added chips
- [ ] Preserve default chips across sessions
- [ ] Preserve session chips independently from defaults

## UI — General Exploration

- [x] Add lightweight hamburger-style navigation menu
- [x] Add navigation links to Swagger Docs and ReDoc
- [x] Implement CSS-only hover/dropdown interaction
- [x] Improve visual card density tuning
- [ ] Improve scrolling ergonomics
- [ ] Improve visual hierarchy between sample and metadata
- [ ] Keep metadata hidden/minimized during exploration workflows
- [ ] Add optional metadata reveal/expand interaction

## UI — Uncategorized

- [x] Add some type of navigation to docs and logs
- [ ] Add endpoint to render log file view
- [x] Add hover-over card animation
- [ ] Track font selection. Show/highlight counts on card
- [ ] Support comparative selection during user search
- [ ] Mark cards for a focused selection set

---

# Frontend Architecture

## ES Modules / Subsystems

- [x] Convert frontend to ES module architecture
- [x] Establish lightweight header/navigation subsystem pattern
- [x] Create FrontendDiagnostics subsystem
- [x] Create FontApiClient subsystem
- [x] Create FontLoader subsystem
- [x] Create FontGridView subsystem
- [x] Create FontSearch subsystem
- [x] Create SearchChipBar subsystem
- [x] Establish frontend composition-root pattern in `app.js`
- [x] Establish validated DOM dependency injection pattern
- [x] Establish frontend dependency ownership boundaries
- [ ] Continue reducing orchestration sprawl in `app.js`
- [x] Introduce detail-view subsystem architecture
- [ ] Introduce comparative-selection subsystem architecture
- [ ] Evaluate future Web Components transition

## Frontend Diagnostics

- [x] Add frontend diagnostics/probe framework
- [x] Add frontend probe severity levels
- [x] Add lazy frontend probe message construction
- [x] Add nested `ProbeLevel` ownership semantics
- [x] Add frontend singleton diagnostics instance
- [x] Add frontend probe categories/taxonomy
- [x] Add optional frontend stack/caller extraction
- [ ] Add frontend probe persistence strategy

---

# Discovery / Backend

## Discovery

- [x] Properly support `.ttc` font collections
- [x] Enumerate TTC fontNumber entries
- [x] Support multiple FontInfo entries per physical path
- [x] Revisit path uniqueness assumptions
- [x] Improve path normalization semantics
- [ ] Investigate recursive discovery expansion
- [ ] Investigate per-user/local-user font discovery

## Catalog Layer

- [x] Introduce FontCatalog middle layer
- [x] Introduce opaque frontend font ids
- [x] Separate semantic identity from transport identity
- [ ] Investigate future persistent catalog identity semantics
- [ ] Investigate future persistence/database integration

## API

- [x] Add `/api/fonts/{font_id}/file` endpoint
- [x] Add OpenAPI documentation for font-file endpoint
- [x] Introduce frontend-safe font transport model
- [x] Keep Swagger/OpenAPI documentation aligned with implementation
- [ ] Continue expanding field-level response descriptions
- [ ] Continue expanding endpoint-level semantic descriptions
- [ ] Add richer API response models

## Diagnostics

- [ ] Consider richer probe taxonomy evolution
- [ ] Consider structured/JSON probe output
- [ ] Consider future severity routing/filtering model
- [ ] Consider probe retention/session archival strategy

---

# Font Rendering

## Explicit Font Loading

- [x] Move from browser family-name rendering to explicit `@font-face` loading
- [x] Serve exact discovered font files from backend
- [x] Ensure deterministic browser rendering
- [ ] Remove ambiguity between duplicate family names
- [x] Introduce lazy viewport-driven font loading
- [x] Introduce frontend font registration cache
- [ ] Investigate future font-load failure handling
- [ ] Investigate future UI virtualization/windowing

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

---

# Tooling / Project Hygiene

- [ ] Add TODO Tree evaluation for VS Code
- [ ] Evaluate lightweight task prioritization workflow
- [ ] Add backlog prioritization categories
- [ ] Add architectural milestone tracking
- [x] Configure Prettier frontend formatting
- [x] Add frontend format-on-save workflow
- [x] Align frontend formatting width to 108 columns

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
- [x] Lightweight header navigation/dropdown menu
- [x] Initial font rendering grid
- [x] Initial search filtering
- [x] Minimal metadata presentation
- [x] Initial Swagger/OpenAPI integration



---

# Backlog Update — 2026-06-05

## Active Priority — User Tagging

- [ ] Design tag persistence subsystem
- [ ] Define persisted tag file format
- [ ] Define semantic font-key ownership strategy
- [ ] Add API endpoint to retrieve tags
- [ ] Add API endpoint to add tag to font
- [ ] Add API endpoint to remove tag from font
- [ ] Add API endpoint to rename tag
- [ ] Display tags on font cards
- [ ] Display tags in font detail view
- [ ] Support tag include search
- [ ] Support tag exclude search

## Deferred

### Metadata UI
- Backend metadata extraction complete
- Metadata presentation deferred
- Metadata inspector deferred
- Metadata search enhancements deferred

### Header Layout Refresh
- Deferred pending stabilization of search/tagging workflows

## Recently Completed

- [x] Backend metadata extraction
- [x] FontMetadataExtractor ownership consolidation
- [x] Global sample text control
- [x] Card-size presentation control
- [x] Font detail initialization from global sample text

## Diagnostics Ideas

- [ ] Log-view UI
- [ ] Acknowledged warning suppression
- [ ] User-maintained reviewed-probe filters


## Tooling

- [x] Black integration
- [x] isort integration
- [x] Strict pyright typing
- [x] Format-on-save workflow
- [x] 108-column formatting standard

## Frontend

- [x] Initial frontend static hosting
- [x] Lightweight header navigation/dropdown menu
- [x] Initial font rendering grid
- [x] Initial search filtering
- [x] Minimal metadata presentation
- [x] Initial Swagger/OpenAPI integration

