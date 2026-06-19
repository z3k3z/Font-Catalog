# Windows Font Catalog / Fontopia — Project Continuity

Updated: 2026-06-19
Current release: v0.2.0

---

# Purpose of This Document

This document is primarily for future-assistant continuity. It is intentionally detailed and may be more verbose than a human-oriented README.

The goal is to bootstrap a future conversation with enough project state, design philosophy, architectural intent, current deployed behavior, and known backlog to continue development with minimal continuity loss.

The project is commonly referred to as:

```text
Fontopia!
```

The application began as a Windows font catalog and is evolving into a typography exploration workspace.

---

# User / Collaboration Context

The user is an experienced software engineer with a strong maintenance-driven design philosophy.

Important collaboration principles:

- The user values convention even on small projects.
- The user optimizes for reduction of cognitive surface, not merely reduction of line count.
- "DRY" is valued but not supreme. Abusing DRY can introduce unnecessary coupling.
- The preferred question is often: "How many places must understand this concept?"
- Good designs have clear owners, clear boundaries, and low cognitive surface for future change.
- The user prefers explicitness over cleverness.
- Future maintainers and fast onboarding are important concerns.
- Project managers who disregard design discipline are a known pain point from the user's past experience.
- The user appreciates design conversation, not merely code generation.

The phrase:

```text
reduction of cognitive surface
```

is a key design lens for this project.

Meaning:

- Reduce the number of places where a rule/concept must be understood.
- Prefer one owner for a concept.
- Prefer explicit state transitions and ownership.
- Accept some extra structure if it reduces future reasoning burden.
- Avoid unifying responsibilities merely because code looks similar.

---

# Project Direction

Fontopia is evolving toward a typography exploration environment centered around:

- semantic and tag-based search
- exploratory workflows
- visually dominant font rendering
- relationship-driven discovery
- progressively richer navigation and comparison tools
- lightweight preference tagging
- future cart/comparison workflows

The user experience philosophy intentionally minimizes metadata noise during exploration and emphasizes:

- large font samples
- fast local filtering
- low-friction tagging
- visual feedback
- discoverability through interaction
- eventually richer detail and comparison views

The frontend intentionally remains framework-free for now. The project currently uses vanilla JavaScript ES modules. However, for a future frontend-heavy "next go," the user prefers TypeScript or a stronger/static modeling stack because plain JavaScript defers too much defect discovery to runtime.

Do not propose changing Fontopia midstream to TypeScript unless the user explicitly revisits that topic.

---

# Current Release Snapshot — v0.2.0

v0.2.0 was released to users after completing the tagging/search/preference cycle.

Major user-visible capabilities now include:

```text
Font catalog browsing
Exact discovered font rendering
Search chips
Include/exclude constraints
Card sample text control
Card size controls
Font detail view
User-defined tags
Card tag adornment
Tag popover with chips
Add/remove tags
Undo removal toast
Tag autocomplete
Tag search using #TagName
Tag exclusion using -#TagName
Likey / No-Likey system tags
Preference buttons on cards
Default hiding of No-Likey fonts
Animated card removal
Animated grid reflow
Toast trail animations
Total/shown font counts
```

v0.2.0 represents a coherent search/tag/preference milestone.

The project is currently paused for user feedback before backlog work resumes.

---

# Current Backend Architecture

## Discovery Pipeline

```text
LocalDiscovery
├── FileDiscovery
└── RegistryDiscovery
```

`LocalDiscovery` orchestrates discovery and owns the master `FontInfoCollection`.

Discovery helpers independently discover fonts while updating the shared collection in-place to avoid redundant processing.

Source uniqueness is represented through:

```text
FontSourceReference-derived identity semantics
```

This allows:

- multiple fonts per physical file
- TTC collection support
- future extensible source-address semantics

Discovery ordering no longer implicitly determines uniqueness behavior.

## Discovery Helpers

### FileDiscovery

Discovers fonts directly from configured filesystem locations.

### RegistryDiscovery

Discovers fonts from Windows registry entries.

Registry discovery consumes registry paths from application configuration rather than hardcoded literals.

## Shared Discovery Infrastructure

A common discovery helper base class exists for shared helper behavior.

Architectural direction prefers:

```text
class-oriented encapsulation
```

over free-floating procedural helpers whenever practical.

---

# Font Model

## FontCandidate

Represents a discovered font source.

Contains:

- source reference
- discovery source
- source-specific metadata

Discovery source is represented using an enumeration rather than string literals.

Source references are polymorphic and represented through:

- `SingleFontSourceReference`
- `CollectionFontSourceReference`

This isolates TTC-specific behavior from generic discovery semantics.

## FontInfo

Represents extracted semantic font metadata.

`FontInfo` contains a reference to the originating `FontCandidate` rather than copying source fields.

This preserves:

- source provenance
- ownership clarity
- future extensibility

## FontSourceReference

Represents a source-address abstraction for a font resource.

Concrete implementations currently include:

- `SingleFontSourceReference`
- `CollectionFontSourceReference`

Responsibilities include:

- opening fonts
- source identity semantics
- browser-loadable byte retrieval
- source-description rendering

## FontSourceReferenceBuilder

Owns orchestration of source-reference construction.

Responsibilities include:

- identifying TTC files
- expanding TTC collections
- constructing the proper derived source-reference type

This intentionally centralizes collection-specific logic into a single subsystem boundary.

## FontInfoCollection

Owns uniqueness semantics.

Supports:

- insertion
- containment checks
- retrieval
- iteration

Uses configurable key-building semantics.

Currently also maintains efficient path indexing to truncate redundant font loading.

Important architectural distinction:

```text
FontInfoCollection owns semantic uniqueness.
```

---

# Metadata Extraction

Backend metadata extraction is complete enough for current use.

Implemented:

- `FontMetadataExtractor`
- centralized OpenType name-table parsing
- family/style/full-name extraction moved into metadata extraction ownership
- glyph-count extraction
- platform/language selection policy
- metadata diagnostics/probe reporting

Important:

- Metadata presentation in the frontend remains intentionally deferred.
- Metadata search integration remains intentionally deferred.
- Metadata remains available through backend models for future use.

---

# Catalog Layer

A middle-layer catalog abstraction exists between:

```text
Discovery
→ Catalog
→ API/UI
```

## FontCatalog

Owns:

- runtime catalog records
- opaque frontend-facing ids
- runtime lookup by id
- lookup/translation needed by tag snapshot endpoints

## CatalogFontRecord

```text
font_id
+ FontInfo
```

Important architectural rule:

```text
Frontend identity is opaque.
```

The frontend never derives semantic uniqueness.

The catalog owns:

- semantic uniqueness
- transport/runtime identity

The frontend only receives:

```text
opaque runtime handles
```

This separates:

```text
semantic identity
vs
transport identity
```

which is an important architectural boundary.

---

# Tagging Backend Architecture

Tagging is backend-persisted user data separate from font metadata.

## Tag Model

The user-defined tagging model is:

```text
Font ↔ many-to-many ↔ Tag
```

Rules:

- A font may have zero or more tags.
- A tag may be associated with zero or more fonts.
- Tags may exist with zero fonts.
- Tag names preserve display casing.
- Tag creation/merge semantics are case-insensitive, but the canonical stored/display name matters.
- Search against tag constraints is exact and case-sensitive.
- Tags are keyed to fonts by semantic font identity, not frontend runtime id.

## Persistence

Persistence is lightweight:

- backend-owned file
- JSON
- versioned document model
- keyed using semantic font key rather than frontend id

Current persistence types include:

- `PersistedTag`
- `TagFontDocument`

Earlier naming evolved; `TagFontDocument` is the current owner document type.

## Repository

The repository owns tag storage and associations.

Important repository capabilities:

- `add_font_to_tag`
- `remove_font_from_tag`
- `list_tags`
- `list_tags_for_font`
- `create_tag`
- `rename_tag`
- `delete_tag`
- `find_tag`

Tag lookup uses a result-style shape such as `TagResult`.

The service layer should not depend upon `FontCatalog`.

Important rule established during implementation:

```text
Tag service/repository operate on semantic font keys.
API layer translates frontend font_id to semantic key.
```

## API Layer for Tags

Implemented endpoints include the logical equivalents of:

```text
GET    /api/tags
GET    /api/fonts/{font_id}/tags
POST   /api/fonts/{font_id}/tags
DELETE /api/fonts/{font_id}/tags/{tag_name}
GET    /api/tags/snapshot
```

Exact route spelling should be checked in current code.

### `/api/tags`

Purpose:

```text
List known tag names.
```

Used by:

- tag autocomplete
- tag management
- search input tag suggestions

This endpoint should remain lightweight.

### `/api/tags/snapshot`

Purpose:

```text
Provide tag-to-font associations for client-side filtering.
```

Response shape is conceptually:

```json
{
  "tags": [
    {
      "name": "Bulletin",
      "font_ids": ["12", "44"]
    }
  ]
}
```

This endpoint is intentionally separate from `/api/tags`.

Reasoning:

```text
/api/tags
    tag catalog

/api/tags/snapshot
    tag association snapshot
```

Do not overload `/api/tags` with optional association fields via a parameter unless design direction changes. Separate endpoints preserve explicit contracts and avoid optional response-shape coupling.

---

# API Layer General

## FastAPI

Core backend exposes:

```text
/
/api/fonts
/api/fonts/{font_id}/file
```

Plus tag endpoints described above.

## Response Models

Pydantic response models are used for JSON endpoints.

Swagger/OpenAPI documentation is considered a first-class maintained artifact.

Field-level descriptions use:

```python
Field(...)
```

Route-level descriptions use:

- summary
- description
- response_description

## Font File Endpoint

The frontend loads exact discovered font files from:

```text
/api/fonts/{font_id}/file
```

Collection-backed fonts are extracted into browser-loadable single-font byte streams in-memory during API response generation.

No intermediate extracted font files are persisted.

Browser cache headers are explicitly provided to avoid redundant network retrievals during lazy loading.

---

# Frontend Architecture

## Current Direction

Frontend code has transitioned from:

```text
single procedural script
```

into:

```text
composed subsystem architecture
```

using:

- ES modules
- class-oriented ownership
- explicit composition
- dependency injection
- framework-free vanilla JavaScript

Frameworks are intentionally deferred.

The frontend is increasingly organized around subsystem ownership rather than one large script.

## ES Module Structure

Current frontend uses:

```html
<script type="module" src="/static/app.js"></script>
```

This enables:

- imports/exports
- isolated module scope
- subsystem ownership
- dependency visibility

## Composition Root

`app.js` is the frontend composition root.

Responsibilities:

- subsystem creation
- dependency wiring
- DOM dependency resolution
- top-level orchestration
- application startup

`app.js` should not accumulate feature-specific behavior if a subsystem can own it.

Recent example:

- Search tag suggestion wiring became large enough to justify extraction into a search-specific controller.

## DOM Dependency Philosophy

DOM lookup responsibility belongs in the composition root.

Subsystems should receive validated dependencies rather than raw ids.

Established helpers:

- `RequiredDomElement`
- `RequiredDomElementSet`

This pattern:

- throws immediately on missing DOM
- centralizes dependency validation
- removes downstream null-check sprawl

---

# Frontend Subsystems

## FrontendDiagnostics

Encapsulates frontend diagnostics/probes.

Key decisions:

- class-oriented implementation
- nested `ProbeLevel` class
- probe-level ownership of enablement and textual rendering
- explicit switch-based console routing
- lazy message providers
- exported singleton instance:

```javascript
_diags
```

Current browser strategy intentionally relies on:

- native DevTools file/line tracking
- console stack expansion

rather than explicit stack parsing.

## FontApiClient

Encapsulates backend transport behavior.

Owns:

- metadata retrieval
- font file URL construction
- tag endpoint calls
- tag snapshot endpoint calls
- fetch failure diagnostics

## FontLoader

Owns:

- lazy `@font-face` registration
- loaded-font cache state
- CSS family naming semantics
- style element manipulation

Important design:

```text
metadata eager
font files lazy
```

Fonts are only loaded when cards become visible.

Loaded fonts remain registered for the session.

Failed font loads place cards into a visually disabled/inert state rather than removing them from the grid.

## TagLoader

Owns frontend tag transport/cache behavior.

Responsibilities include:

- load tags for a font
- add tag to font
- remove tag from font
- load all tags
- load tag snapshot
- invalidate per-font tag cache
- invalidate all-tags cache
- invalidate tag-snapshot cache

Uses `MostRecentValueCache` for cache/pending-promise behavior.

Important pattern:

```text
MostRecentValueCache
    shares one in-flight request
    caches completed value
    invalidates on mutation
```

This prevents duplicate overlapping `/api/tags` or snapshot loads.

## TagSnapshot

Frontend model representing tag-to-font associations.

Conceptual structure:

```text
Map<tagName, Set<fontId>>
```

Primary behavior:

```javascript
hasFontForTag(fontId, tagName)
```

Tag matching is exact and case-sensitive.

## TagSuggestionProvider

Owns tag-specific suggestion logic.

Responsibilities:

- load all tags via `TagLoader`
- filter suggestions by typed text
- rank suggestions by lexical closeness
- limit suggestion count

Suggestion matching is intentionally partial/ranked. Applied search constraints are exact.

This distinction is important:

```text
Autocomplete:
    partial / ranked / assistive

Search chip:
    exact / case-sensitive / authoritative
```

## SuggestionDecorator

Generic frontend behavior for decorating an input field with suggestions.

Owns:

- input event handling
- suggestion rendering
- keyboard/mouse selection
- stale request protection
- hiding suggestions

Consumer provides:

- input element
- suggestion container element
- `loadSuggestions(inputText)`
- `getSuggestionText(suggestion)`
- `onSuggestionAccepted(suggestion)`

Used for:

- card tag add input autocomplete
- search input tag autocomplete

Do not bake tag-specific assumptions into `SuggestionDecorator`.

## MostRecentRequestTracker

Generic helper for stale async request suppression.

Purpose:

```text
Allow many async operations to start.
Only the most recent one may publish results.
```

Used by `SuggestionDecorator`.

## MostRecentValueCache

Generic helper for overlapping request sharing/caching.

Purpose:

```text
If value exists:
    return value

If load is already in progress:
    return same pending promise

Otherwise:
    start load once
```

Used by `TagLoader`.

---

# Font Grid Architecture

## FontGridView

Owns the visible grid collection and card orchestration.

Responsibilities:

- render font cards
- set card size class
- own grid-level listeners
- observe cards for lazy font loading
- route card events
- update selected card
- coordinate card removal animation
- react to card tag changes

The view no longer performs DOM id lookups.

Current important dependencies include:

- `FontGridCardView`
- `FontGridCardTagsView`
- `FontSearch` or equivalent search dependency for tag-visibility checks
- `FontLoader`
- `TagLoader`
- `ToastView`

`FontGridView` should remain collection-oriented. Avoid moving per-card internals back into it.

## FontGridCardView

Owns one card's DOM structure and card-level behavior.

Responsibilities:

- sample region
- footer
- font name
- tag summary placement
- preference action buttons
- selected/load-failed CSS state
- card click behavior
- apply loaded font to card
- update preference button state
- fade/remove card
- participate in grid reflow animation if coordinated by grid

Current preference buttons:

```text
🥰  -> Likey
🤮  -> No-Likey
```

Unselected buttons are dim/silhouette-like. Selected buttons are active. Hover has a brief animation.

## FontGridCardTagsView

Owns tag UI for one card.

Responsibilities:

- tag adornment
- tag count
- tag popover
- chip rendering
- add-tag input
- remove tag
- undo tag removal toast
- refresh tag state
- notify when tags change

Important current design:

```text
loadTags()
    robust load/update path with error capture

_refreshTags()
    invalidates first
    delegates to loadTags()
```

`loadTags()` updates tag summary and calls `_notifyTagsChanged(...)`.

This consolidation eliminated an earlier `.then(...)` callback during card construction and reduced cognitive surface. Tag state changes now have one notification path.

## Tag Popover Interaction

Current deployed v0.2.0 state still uses hover to reveal the tag popover.

Known future direction:

```text
Replace hover with click.
```

Reasoning:

- hover caused corridor/zone/delay issues
- click is more intentional
- click is mobile-friendly
- click reduces transient state and cognitive surface

Planned interaction:

```text
Click tag badge
    open popup

ESC
    close

Click elsewhere
    close
```

Do not add delayed hover unless user revisits; current preference is to eventually replace hover with click.

---

# Search Architecture

## FontSearch

Owns:

- search constraint state
- filtering semantics
- searchable text construction
- text constraint matching
- tag constraint matching

Search constraints are cumulative AND constraints.

Examples:

```text
Roboto #Bulletin
    font text matches Roboto
    AND font has Bulletin tag

#Bulletin #Favorite
    font has Bulletin
    AND font has Favorite

-#No-Likey
    font does not have No-Likey
```

Implemented behavior:

- normal text search
- require constraints
- exclude constraints
- tag constraints
- tag exclusion constraints
- tag-only matching based on current tag names for local card visibility checks

Important refactor:

Search matching was split conceptually into:

```text
fontSatisfiesEveryTextConstraint(...)
fontSatisfiesEveryTagConstraint(...)
fontSatisfiesEveryTagConstraintFromTagNames(...)
```

or equivalent.

Purpose:

- reuse tag-only matching when a card's tags mutate
- avoid full grid re-render
- avoid scroll reset

When tags change on a visible card:

```text
Grid receives updated tagNames
    ↓
Grid updates preference buttons
    ↓
Grid asks FontSearch whether current tag constraints still pass
    ↓
If not, remove only that card
```

Text constraints do not need re-evaluation during tag mutation because font text did not change.

## SearchConstraint

Current conceptual shape:

```text
searchTerm
mode
kind/type
```

Modes:

```text
REQUIRE
EXCLUDE
```

Kinds/types:

```text
TEXT
TAG
```

The current design direction:

```text
SearchChipBar parses user syntax.
SearchConstraint stores interpreted intent.
FontSearch executes intent.
```

Do not split parsing rules across SearchChipBar and SearchConstraint.

Important reasoning:

- `SearchChipBar` already parses require/exclude intent.
- It should also parse text-vs-tag intent.
- `SearchConstraint` should be a simple container of intentions/rules.
- This keeps syntax ownership in one place.

## SearchChipBar

Owns:

- search input behavior
- parsing raw user input into constraint intent
- search chip rendering
- search term add/remove events
- distinction between require/exclude
- distinction between text/tag constraints
- visual chip display

Tag search syntax:

```text
#TagName
```

Tag exclusion syntax:

```text
-#TagName
```

The search chip for a tag uses a tag icon to distinguish it from a text chip. A minor CSS nudge was needed to vertically align the icon.

Potential future direction:

- default search chips visually distinct from session chips
- user-editable default filters

Current default:

```text
-#No-Likey
```

This hides No-Likey tagged fonts at startup through a visible/default search constraint rather than a secret hard-coded filter.

## SearchTagSuggestionController

This was extracted from `app.js` because wiring tag suggestions into the search input occupied too much composition-root code.

Responsibilities:

- create/manage search suggestion container
- detect tag input prefixes:
  - `#`
  - `-#`
- ask `TagSuggestionProvider` for matching tags
- filter already-chipped equivalent tag constraints
- preserve prefix on suggestion acceptance
- delegate rendering/keyboard behavior to `SuggestionDecorator`

Important rule:

```text
#Bulletin prevents suggesting Bulletin while typing #
-#Bulletin prevents suggesting Bulletin while typing -#
#Bulletin does not prevent suggesting -#Bulletin
```

Because require/exclude are different intentions.

---

# User Preference / System Tags

## System Tags

Current system-defined preference tags:

```text
Likey
No-Likey
```

These are intentionally represented as tags.

They appear in:

- tag count
- tag popover
- tag chip list
- tag search
- tag autocomplete
- tag snapshot

This is currently considered sufficient to allow neutral/unset behavior:

```text
Remove Likey chip
    -> neutral

Remove No-Likey chip
    -> neutral
```

No special "click selected preference button again to unset" behavior is currently needed.

## Preference Buttons

Cards include two preference buttons:

```text
🥰  Likey
🤮  No-Likey
```

Behavior:

```text
Click 🥰
    add Likey
    remove No-Likey

Click 🤮
    add No-Likey
    remove Likey
```

These tags are mutually exclusive.

Button state reflects current tags:

```text
Likey present
    🥰 active

No-Likey present
    🤮 active

Neither present
    both dim
```

Removing the corresponding tag chip dims the related button via the tag-change notification path.

## No-Likey Default Filter

The application now starts with a visible default constraint equivalent to:

```text
-#No-Likey
```

This hides fonts tagged No-Likey by default.

This is intentionally a search constraint, not special hidden filtering logic.

## Shopping Cart / Liked Count

Do not remove the shopping-cart liked-count/header subsystem yet.

It is deferred because it may evolve into a future cart management subsystem for comparison of carted font items.

Important distinction:

```text
Likey / No-Likey
    preference tags

Shopping cart
    future comparison/cart management concept
```

Do not conflate them.

---

# Toast System

## ToastView

Toast system supports:

- undo toast for ordinary tag removal
- short no-undo toast for preference actions
- auto-dismiss
- slide/wiggle entry animation
- slide-right dismissal animation
- optional icon trail on dismissal

Undo removal toast is used for normal tag chip removal.

Short no-undo toast is used for Likey/No-Likey preference actions.

## Toast Dismissal Trail

Optional `trailIcon` behavior exists.

Likey trail:

```text
❤️
```

No-Likey trail:

```text
💩
```

The trail is implemented as a layer behind the toast. The toast slides right and reveals icons behind it. Each icon fades after being uncovered.

Important implementation insight:

- Do not make all icons visible via class at once.
- Let keyframe opacity control fade.
- The trail layer must sit directly behind the toast.
- The toast slides horizontally; it should not move downward.

This effect is intentionally playful and currently considered complete.

---

# Card Removal / Grid Reflow Animation

When a tag mutation causes a card to no longer satisfy current tag constraints, only that card is removed rather than reapplying the entire search.

Reason:

- full `_applySearch()` re-renders the grid
- full re-render resets scroll position
- tag mutation only affects current card tag visibility

Current behavior:

```text
card fades out
remaining cards slide/reflow into vacated space
```

Implemented using a FLIP-style animation.

Do not extract the grid mutation animation yet unless it is reused elsewhere.

Potential future breadcrumb:

```text
Grid mutation animation
```

may become reusable for sorting, filtering, cart management, or bulk operations.

---

# Header / Counts

Header now displays:

```text
438 fonts total | 127 fonts shown
```

Implementation uses separate DOM elements for:

```text
fontTotal
fontCount
```

and a separator element.

This preserves ownership:

```text
fontTotal
    owns total count

fontCount
    owns shown count

container
    owns presentation
```

Avoid composing both counts into one string unless design changes.

---

# Font Rendering Strategy

## Initial Strategy

Originally:

```text
browser resolved fonts by family name
```

This proved nondeterministic.

## Current Strategy

Frontend renders exact discovered font files using generated:

```css
@font-face
```

rules.

Cards initially render using fallback system fonts.

When visible:

```text
IntersectionObserver
→ lazy font registration
→ backend font retrieval
→ exact rendering
```

Collection-backed fonts are transparently converted into browser-loadable single-font byte streams during API response generation.

Current architectural expectation:

```text
all metadata local
+ future UI virtualization
```

rather than server-side pagination.

---

# Detail View

Implemented:

- font detail panel
- initialized from global sample text
- editable sample text
- point-size adjustment
- dark/light preview controls
- keep/cancel controls

Current "keep" behavior may still interact with older liked/cart concepts. Check current code before modifying.

Future direction:

- detail view may own less-used tag management features
- removing/renaming tags may eventually be more detail-oriented
- metadata inspection belongs here or in a related secondary surface

---

# Diagnostics / Probe Infrastructure

## Backend Probe System

Implemented:

- trace probes
- error probes
- severity filtering
- ANSI colorization
- VS Code clickable paths
- probe persistence to file
- startup file overwrite behavior

## Probe Severity

Environment variable specifies:

```text
minimum severity level
```

instead of binary enable/disable semantics.

## Deferred TODO

Future direction:

```text
error probes should evolve toward configurable severity semantics
```

rather than simple category toggles.

---

# Formatting / Tooling

## Python

Configured:

- Black
- isort
- strict pyright typing

Formatting standards:

- 108-column width
- explicit typing
- format-on-save

## Frontend

Configured:

- Prettier
- format-on-save

Formatting standards:

- 4 spaces
- semicolons enabled
- 108-column width

Naming convention:

```text
file names:
    kebab-case / snake-like hyphenated JS names

class names:
    PascalCase

methods/properties:
    camelCase
```

Examples:

```text
font-grid-view.js
font-grid-card-view.js
font-grid-card-tags-view.js
suggestion-decorator.js
most-recent-request-tracker.js
most-recent-value-cache.js

FontGridView
FontGridCardView
FontGridCardTagsView
SuggestionDecorator
MostRecentRequestTracker
MostRecentValueCache
```

Python modules should use valid Python import naming:

```text
tag_response.py
```

not:

```text
tag-response.py
tag-reponse.py
```

A past bug was caused by a misspelled/hyphenated Python filename.

---

# JavaScript Async / Await Notes

The user understands async/await but feels some architectural friction with how async behavior propagates up signatures.

Important points discussed:

- An `async` function always returns a Promise.
- Adding `await` to a function changes its return contract to Promise-based.
- Callers that need the resolved value must `await`.
- Propagation stops at a boundary that can tolerate a Promise, such as an event handler.
- `.then(...)` and `await` are different surfaces over Promise continuations.
- Promise rejections must be caught somewhere, either via `.catch(...)` or `try/catch`.

User preference:

- Capture error state at some level.
- Probe unwinding is nice but not currently a priority.
- Avoid spreading async cognitive burden unnecessarily.
- Encapsulate repeated async coordination in abstractions like:
  - `MostRecentRequestTracker`
  - `MostRecentValueCache`
  - `SuggestionDecorator`

---

# UI Philosophy

## Exploration-First Design

Primary user focus:

```text
font rendering samples
```

Metadata remains intentionally minimized.

Metadata/details should remain secondary and optionally inspectable.

## Relationship System Direction

Future direction includes:

- search trajectories
- exploration graphing
- semantic pivots
- "people also explored" relationships
- similarity/grouping systems

The project may eventually evolve toward:

```text
typographic exploration workspace
```

rather than a simple searchable list.

## Personality / Delight

Fontopia has developed playful UI personality:

```text
Likey
No-Likey
heart trails
poop trails
animated card collapse
```

This is accepted as long as it does not increase cognitive surface too much.

The user values polish when the complexity cost is reasonable.

---

# Important Backlog Themes

## Immediate / Near-Term

- Pause after v0.2.0 release to gather user feedback.
- Convert tag popover trigger from hover to click.
- Update README.
- Update BACKLOG.
- Review current code for unused imports / dead wiring after v0.2.0.
- Consider whether system tags need distinct visual styling later.

## Search

- default search chips should eventually be visually distinct from session chips
- persisted default chips
- user-editable defaults
- tag-aware search autocomplete already implemented
- search chip tag icon alignment is currently CSS-nudged; consider inline-flex if chip styling is revisited
- possible future richer syntax:
  - `#Tag`
  - `-#Tag`
  - `family:serif`
  - `designer:...`
  - etc.

## Tagging

- tag popover hover-to-click conversion
- detail-view tag management:
  - rename tags
  - delete tags
  - perhaps bulk operations
- system tag styling decision:
  - visible like ordinary tags for now
  - possibly style differently later
- ensure tag mutation paths continue to invalidate:
  - per-font cache
  - all-tags cache
  - tag snapshot cache

## Frontend Architecture

- continue subsystem extraction when a concept occupies too much composition-root code
- keep `app.js` as composition root
- avoid growing `FontGridView` with per-card internals
- consider extracting grid mutation animation only after reuse
- future frontend projects should consider TypeScript or stronger static modeling stack

## Detail View

- full character set rendering
- custom sample text refinements
- point-size adjustment improvements
- metadata inspector UI
- richer preview controls
- tag management features

## Discovery

- TTC enumeration
- multi-font-per-path support
- improved uniqueness semantics
- metadata coverage expansion

## Relationship Exploration

- semantic similarity
- clustering
- graph navigation
- saved exploration paths
- cart-based comparison workflows

## Shopping Cart / Comparison

Shopping cart should evolve separately from Likey/No-Likey.

Possible future direction:

```text
cart management subsystem
    select fonts for comparison
    compare specimens
    compare metadata
    maybe export/share selected sets
```

Do not prematurely remove the cart because it no longer owns "liked" behavior.

---

# Architectural Principles Established

## Ownership Clarity

Subsystems should own:

- their behavior
- their state
- their semantics

and should avoid:

- ambient globals
- procedural sprawl
- hidden dependencies

## Composition Root Philosophy

Composition and dependency resolution should happen:

```text
once
at startup
at boundaries
```

Subsystems should receive valid dependencies.

## Preference Toward Explicitness

Project direction consistently prefers:

- explicit control flow
- explicit ownership
- explicit configuration
- named concepts
- readable responsibilities

over:

- clever abstraction
- ambient magic
- highly dynamic patterns

## Reduce Cognitive Surface

Core principle:

```text
Minimize how many places must understand a concept.
```

This is more important than minimizing line count.

Examples from recent work:

- Tag refresh owns tag-change notification.
- SearchChipBar owns raw search syntax parsing.
- SearchConstraint stores interpreted intent.
- FontSearch executes search semantics.
- SuggestionDecorator owns generic suggestion mechanics.
- TagSuggestionProvider owns tag-specific ranking/filtering.
- MostRecentValueCache owns overlapping loader request behavior.
- FontGridView owns visible card collection behavior.
- FontGridCardTagsView owns tag UI behavior.

## Explicit Public Contracts, Shared Internals

When DRY conflicts with clear contracts:

```text
Prefer separate explicit contracts.
Share internals below the boundary.
```

Example:

```text
/api/tags
    tag catalog

/api/tags/snapshot
    tag association snapshot
```

Separate endpoints are preferred over one endpoint with optional shape-changing parameters.

## Frontend/Backend Symmetry

The frontend architecture intentionally mirrors backend subsystem structure where practical.

This is considered desirable and should continue.

---

# Known Current State Summary for Future Assistant

If a future chat begins from this document, assume:

```text
Fontopia v0.2.0 has been released.

The current main working feature area just completed:
    user tags
    tag search
    tag suggestions
    Likey / No-Likey system tags
    card visibility animation

The user is pausing for feedback before backlog work.

Likely next housekeeping tasks:
    README update
    BACKLOG update

Likely next implementation task:
    convert tag popover from hover to click

Likely future design discussion:
    cart/comparison subsystem
```

When continuing, preserve the user's design lens:

```text
maintenance
ownership
low cognitive surface
explicit boundaries
future maintainability
```

