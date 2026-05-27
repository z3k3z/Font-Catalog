# Windows Font Catalog — Project Continuity

Updated: 2026-05-24

---

# Project Direction

The project is evolving toward a typography exploration environment centered around:

- semantic search
- exploratory workflows
- visually dominant font rendering
- relationship-driven discovery
- progressively richer navigation and comparison tools

The user experience philosophy intentionally minimizes metadata noise during exploration and instead emphasizes:

- typography samples
- fast filtering
- lightweight interaction
- eventual semantic relationships and recommendations

The frontend architecture direction now strongly prefers:

- object-oriented subsystem ownership
- bounded responsibilities
- explicit composition
- dependency injection patterns
- ES module separation

The project intentionally avoids frontend frameworks at this stage.

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

Source uniqueness is now represented through:

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

Registry discovery no longer uses hardcoded registry path literals and instead consumes values from application configuration.

## Shared Discovery Infrastructure

A common discovery helper base class exists for shared helper behavior.

Project architectural direction now prefers:

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

Source references are now polymorphic and represented through:

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

# Catalog Layer

A new middle-layer catalog abstraction now exists between:

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

which is considered an important architectural boundary.

---

# API Layer

## FastAPI

The backend exposes:

```text
/
/api/fonts
/api/fonts/{font_id}/file
```

## Response Models

Pydantic response models are now used for JSON endpoints.

Swagger/OpenAPI documentation is considered a first-class maintained artifact.

Field-level descriptions are added using:

```python
Field(...)
```

Route-level descriptions use:

- summary
- description
- response_description

## Font File Endpoint

The frontend now loads exact discovered font files from:

```text
/api/fonts/{font_id}/file
```

Collection-backed fonts are extracted into browser-loadable
single-font byte streams in-memory during API response generation.

No intermediate extracted font files are persisted.

Browser cache headers are now explicitly provided to avoid redundant
network retrievals during lazy loading.

The endpoint is documented in OpenAPI using explicit response metadata.

---

# Frontend Architecture

## Current Direction

Frontend code is transitioning from:

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

Frameworks are intentionally deferred.

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

## Frontend Subsystems

### FrontendDiagnostics

Encapsulates frontend diagnostics/probes.

Key decisions:

- class-oriented implementation
- nested `ProbeLevel` class
- probe-level ownership of:
  - enablement semantics
  - textual rendering
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

### FontApiClient

Encapsulates backend transport behavior.

Owns:

- metadata retrieval
- font file URL construction
- fetch failure diagnostics

### FontLoader

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

Failed font loads now place cards into a visually disabled/inert state
rather than removing them from the grid.

### FontGridView

Owns:

- card rendering
- visibility observation
- viewport-triggered font loading
- sample rendering

Uses `IntersectionObserver`.

DOM elements are injected directly during construction.

The view no longer performs DOM id lookups.

### FontSearch

Owns:

- search-term state
- filtering semantics
- searchable text construction

Supports:

- stacked search constraints
- REQUIRE constraints
- EXCLUDE constraints
- semantic chip modes

### SearchChipBar

Owns:

- search chip rendering
- search input behavior
- search term add/remove events

Uses grouped listener configuration:

```javascript
setListeners(...)
```

rather than individual setter methods.


### Header Navigation

Owns:

- lightweight application navigation
- Swagger/ReDoc access
- CSS-only dropdown interaction

Project intentionally prefers:

- minimal JS ceremony
- lightweight interaction surfaces

where practical.

## Composition Root

`app.js` is now intentionally evolving into:

```text
frontend composition root
```

Responsibilities:

- subsystem creation
- dependency wiring
- DOM dependency resolution
- orchestration

## DOM Dependency Philosophy

DOM lookup responsibility belongs in the composition root.

Subsystems should receive:

```text
validated dependencies
```

rather than raw ids.

Pattern established:

```javascript
getRequiredElementById(...)
```

which:

- throws immediately on missing DOM
- centralizes dependency validation
- removes downstream null-check sprawl

---

# Font Rendering Strategy

## Initial Strategy

Originally:

```text
browser resolved fonts by family name
```

This proved nondeterministic.

## Current Strategy

Frontend now renders exact discovered font files using generated:

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

Collection-backed fonts are transparently converted into browser-loadable
single-font byte streams during API response generation.

This intentionally avoids:

- backend pagination
- eager font retrieval
- virtualized metadata loading

Current architectural expectation:

```text
all metadata local
+ future UI virtualization
```

rather than server-side pagination.

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

Environment variable now specifies:

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

The application naming direction has now been established as:

```text
Font-O-Matic!
```

---

# Important Backlog Themes

## Search

- stacked search chips
- persisted default chips
- distinction between default vs session chips
- predictive/autocomplete behavior

## Detail View

- full character set rendering
- custom sample text
- point-size adjustment
- responsive live preview

## Frontend Architecture

- continued subsystem extraction
- reduction of orchestration sprawl
- stronger component boundaries

## Discovery

- TTC enumeration
- multi-font-per-path support
- improved uniqueness semantics

## Relationship Exploration

- semantic similarity
- clustering
- graph navigation
- saved exploration paths

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

over:

- clever abstraction
- ambient magic
- highly dynamic patterns

## Frontend/Backend Symmetry

The frontend architecture is intentionally beginning to mirror backend subsystem structure.

This is considered desirable and should continue where practical.

