# Windows Font Catalog — Project Continuity

Updated: 2026-05-22

---

# Project Purpose

Windows-hosted font catalog and typography exploration application.

Primary goals:
- discover locally installed fonts
- catalog semantic metadata
- support user tagging/classification
- support typography exploration workflows
- eventually support semantic/behavioral font relationships
- provide visually oriented search and discovery

The project has intentionally shifted away from a traditional CRUD/database-management mental model and toward:

```text
visual typography exploration workstation
```

with strong support for:
- visual traversal
- semantic narrowing
- relationship discovery
- rapid comparison
- eventually behavior-driven recommendations

---

# Technology Stack

## Backend

- Python
- FastAPI
- fontTools
- VS Code
- Pylance strict typing

## Formatting / Tooling

- Black
- isort
- pyright

Formatting standards:
- Black line length configured to 108
- 4-space indentation
- spaces, not tabs

Repository-owned configuration:

```toml
[tool.black]
line-length = 108

[tool.isort]
profile = "black"

[tool.pyright]
typeCheckingMode = "strict"
reportMissingTypeStubs = "none"
```

VS Code editor behavior:
- format on save
- Black formatter
- organize imports on save

---

# Architectural Discipline

The project strongly favors:

- explicit ownership
- immutable runtime configuration
- explicit type discipline
- subsystem identity
- class-oriented encapsulation
- low cognitive noise
- deterministic behavior
- inspectable flow

Go-forward project standard:

```text
Prefer classes for subsystem ownership and behavior encapsulation.
Use free functions only where the abstraction cost of a class clearly outweighs the benefits.
```

Python style discipline:
- clear main-line flow
- narrow exception scopes
- no exception-driven ordinary control flow
- avoid arbitrary continue/return branching
- explicit intermediate variables preferred
- extraction into helpers preferred over nested logic

---

# Current Runtime Architecture

```text
main.py
  -> configure_probes()
  -> create_application_configuration()
  -> FontCatalogApp

FontCatalogApp
  -> FastAPI lifecycle ownership
  -> startup discovery orchestration

LocalDiscovery
  -> orchestration
  -> loading pipeline
  -> duplicate suppression
  -> collection ownership

FileDiscovery
  -> filesystem candidate enumeration

RegistryDiscovery
  -> Windows registry candidate enumeration

FontInfoCollection
  -> semantic uniqueness enforcement
  -> path indexing
```

---

# Discovery Architecture

## FontCandidate

Represents discovered font provenance.

Contains:
- file path
- discovery source enum
- discovery detail

Discovery sources currently:
- Windows font directory
- Windows machine registry
- Windows user registry

## FontInfo

Represents semantic metadata extracted from a font.

Contains:
- family name
- style name
- full name
- originating FontCandidate

---

# Local Discovery Model

LocalDiscovery owns:
- master FontInfoCollection
- discovery orchestration
- loading policy
- duplicate suppression
- reporting

Discovery flow:

```text
FileDiscovery
  -> FontCandidates
  -> load fonts
  -> insert unique FontInfos

RegistryDiscovery
  -> FontCandidates
  -> skip previously visited paths
  -> load remaining fonts
  -> insert unique FontInfos
```

No modality merge step exists anymore.

Discovery methods now contribute directly into the master collection.

This removed:
- intermediate merge structures
- parallel uniqueness tracking
- merge-order bookkeeping
- duplicated semantic key logic

---

# Duplicate Suppression

## Path-Based Suppression

Current implementation suppresses revisiting known font file paths before loading.

This prevents redundant TTFont loading when:
- filesystem discovery
- registry discovery

point to the same physical font file.

Current behavior:

```text
known path
  -> skip loading
```

Debug-level probes report these skips.

## Semantic Uniqueness

FontInfoCollection enforces uniqueness via configurable semantic key builder.

Current key:

```text
family_name
style_name
full_name
```

normalized/casefolded.

---

# IMPORTANT TTC TODO

Current path suppression intentionally assumes:

```text
one path exhausted after one successful load
```

This is NOT correct for:

```text
.ttc font collections
```

because a single file may contain multiple distinct fonts.

Deferred TODO:
- revisit path indexing model
- support multiple FontInfo entries per path
- support fontNumber enumeration
- avoid truncating TTC collections after first load

---

# Diagnostics / Probe Architecture

Diagnostics subsystem is now mature and operationally useful.

Capabilities:
- semantic probe taxonomy
- runtime filtering
- colored console output
- session log persistence
- lazy message construction
- VS Code clickable source navigation
- immutable runtime configuration
- isolated loggers

---

# Probe Taxonomy

## Trace Probes

Purpose:
- expected-flow visibility
- operational tracing
- discovery metrics
- subsystem flow

Enabled independently via:

```text
FONT_CATALOG_TRACE
```

## Error Probes

Purpose:
- conditions potentially representing issues
- differentiated severity
- not necessarily fatal errors

Levels:
- DEBUG
- WARNING
- ERROR

Configured via:

```text
FONT_CATALOG_ERROR_PROBE_LEVEL
```

Example:

```powershell
$env:FONT_CATALOG_ERROR_PROBE_LEVEL="WARNING"
```

Logger-native filtering now used.

---

# Probe Logging

Current probe outputs:

## Console

- ANSI colorized
- clickable VS Code paths
- live runtime visibility

## File

Probe logs now persist to file.

Behavior:
- startup truncates previous session log
- subsequent probes append during runtime

Implementation detail:
- file truncation occurs explicitly during configuration
- handlers themselves use append mode
- avoids reload-time accidental truncation

---

# Probe Formatting

Current probe formatting includes:

```text
timestamp
probe kind
logging level
path
line number
function
message
```

Timestamp format:

```text
yy-mm-dd T hh-MM-ss
```

Color semantics:
- TRACE = cyan
- DEBUG = gray
- WARNING = yellow
- ERROR = red

Colorization occurs ONLY in formatter logic.

No formatting/color burden exists at call sites.

---

# Runtime Configuration

Application configuration now centralized via immutable configuration object.

Current examples:
- Windows font directory
- registry subkey
- future probe file paths

Project standard:

```text
Prefer immutable runtime configuration objects over mutable ambient module-global primitives.
```

---

# UI Direction — IMPORTANT DESIGN SHIFT

Initial mental model:

```text
font database inspector
```

Current evolved mental model:

```text
visual typography search/exploration engine
```

This is a major design shift.

The primary artifact is:

```text
the typography rendering itself
```

Metadata should remain secondary and largely hidden during exploratory workflows.

---

# Current UI Philosophy

## Primary Mode

Visual exploration.

Characteristics:
- typography-dominant
- minimal chrome
- low metadata noise
- rapid visual traversal
- comparison-oriented
- search-centric

Likely structure:

```text
search/filter
↓
continuous visual field of font renderings
↓
optional metadata reveal on focus/select
```

The UI should feel closer to:
- visual search engine
- typographic light table
- comparison workspace

than:
- enterprise CRUD application
- metadata inspector

---

# Metadata Philosophy

Metadata remains important, but should:
- progressively reveal
- remain hidden during broad exploration
- support advanced workflows intentionally

Advanced/metadata search remains an important escape hatch.

Future advanced search examples:

```text
supports Cyrillic
weight > 700
variable font
OpenType alternates
installed from registry only
```

---

# Search / Relationship Direction

This became one of the most important emerging project directions.

The application should eventually support:

```text
semantic exploration trajectories
```

Example:

```text
retro
→ geometric
→ rounded
→ eurostile-like
→ compact sci-fi
→ final selection
```

The path itself has value.

---

# Future Relationship Model

Potential future concepts:

- fonts commonly explored together
- semantic neighborhood suggestions
- co-selection behavior
- search refinement trajectories
- relationship graphs
- exploration breadcrumbs
- saved journeys
- similarity clustering

This implies future dual indexing:

## Structured Metadata Index

Deterministic:
- names
- tags
- provenance
- OpenType features
- technical metadata

## Behavioral / Semantic Index

Probabilistic:
- search journeys
- co-selection
- visual similarity
- relationship inference
- semantic clustering

This may become one of the genuinely differentiated aspects of the application.

---

# Immediate Next UI Direction

Likely first vertical slice:

```text
simple browser UI
→ search field
→ rendered font result cards
→ minimal metadata
→ backend font endpoint
```

Initial rendering can rely on browser/system family resolution.

Long-term likely direction:

```css
@font-face
```

with explicit backend-served font loading for deterministic rendering.

---

# Current Deferred TODOs

## Discovery

- proper TTC enumeration support
- multiple FontInfos per path
- better path normalization semantics
- possible recursive/per-user discovery expansion

## Diagnostics

- richer probe taxonomy evolution
- potential future error severity routing
- possible structured/JSON logging later

## UI

- relationship exploration concepts
- semantic navigation
- behavioral recommendation systems
- metadata inspector mode
- advanced search/query language

---

# Current Project State

Backend/discovery/diagnostics foundation is now strong enough to shift focus toward:

```text
first meaningful exploratory UI experience
```

without significant architectural debt pressure.

