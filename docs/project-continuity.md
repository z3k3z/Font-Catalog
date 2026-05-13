# Font Catalog Project Continuity

## Project Overview

Local Windows-based font catalog and preview system.

Primary goals:
- Enumerate locally installed fonts
- Extract reliable font metadata
- Provide searchable preview catalog
- Support typography trait indexing
- Support user-defined tagging
- Operate entirely locally

Current direction is a local web application using Python and FastAPI.

---

# Current Architecture

```text
Frontend UI
    ↓
FastAPI backend
    ↓
Catalog/service layer
    ↓
Persistence layer
    ↓
Local font discovery layer
```

The architecture intentionally separates:
- local font enumeration
- persistence
- API exposure
- future semantic catalog behavior
- future UI concerns

No layer-skipping is desired.

---

# Technology Stack

## Current

- Python
- FastAPI
- SQLite (planned)
- HTML/CSS/JavaScript frontend (planned)
- VS Code
- Pylance strict type validation

## Current Python Libraries

- fontTools

---

# Environment Configuration

## Python Installation

Python was installed using:
- Python Install Manager for Windows

Project conventions:
- Prefer `py` launcher over direct `python` invocation where practical
- Virtual environments remain project-local (`.venv`)
- VS Code interpreter targets `.venv`

## Virtual Environment

Project uses:

```text
.venv/
```

## VS Code

Required:
- Python extension
- Pylance

Current configuration expectation:
- strict type validation enabled

---

# Project Structure

```text
font-catalog/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── font_catalog_app.py
│   ├── api/
│   ├── catalog/
│   ├── diagnostics/
│   ├── discovery/
│   ├── models/
│   ├── persistence/
│   └── static/
│
├── test/
│
├── README.md
├── project-continuity.md
├── requirements.txt
└── .gitignore
```

---

# Current Runtime Architecture

## main.py

Responsibilities:
- process entrypoint
- configure diagnostics
- create application object
- expose FastAPI application instance

## FontCatalogApp

Responsibilities:
- own runtime application state
- configure FastAPI lifecycle
- configure routes
- coordinate startup discovery

Current runtime-owned state:

```python
self._discoveredFonts: list[FontInfo]
```

---

# FastAPI Lifecycle Direction

The project uses FastAPI lifespan handlers.

Deprecated `on_event()` startup/shutdown handlers are intentionally avoided.

Current direction:
- explicit lifespan management
- explicit route registration
- avoid decorator-heavy hidden framework behavior where practical

Routes are registered using:

```python
fastapi_app.add_api_route(...)
```

rather than nested decorated functions.

Reasoning:
- clearer ownership
- avoids strict-Pylance false positives
- avoids hidden registration semantics
- scales better as route count increases

---

# Python Coding Discipline

The project uses Python-native constructs, but rejects casual script-style implementation.

Principles:
- Favor clear main-line flow over compact cleverness
- Preserve explicit intermediate variables and type hints
- Keep function control flow visually simple
- Use early returns only for guard clauses
- Avoid `continue` unless clearly simpler than extraction
- Avoid nested branching when named helper functions can express intent
- Keep exception-handling scopes narrow
- Use exceptions only at IO/library/runtime-boundary failure points
- Do not use exceptions for ordinary control flow
- Convert caught exceptions immediately into structured status/report objects
- Let the caller decide severity and logging
- Use structured `Result[T]` at subsystem boundaries and failure-prone IO boundaries
- Do not spread `Result[T]` to every tiny transformation unless justified

The project favors readability and architectural inspection over dense idiomatic compactness.

---

# Type Discipline

Pylance strict type validation is enabled.

Project expectations:
- explicit collection typing
- avoid untyped `list` and `dict`
- preserve strong type signatures
- avoid unnecessary `cast()` usage
- use `cast()` only when type information is genuinely unavailable
- avoid type-suppression-oriented implementation

Current project uses:

```python
list[FontInfo]
Result[TTFont]
list[NameRecord]
```

rather than weakly typed collections.

---

# Runtime Configuration Discipline

Project direction prefers immutable runtime configuration.

Principles:
- configuration initialized once during startup
- configuration exposed through controlled accessors
- configuration represented using frozen dataclasses where practical
- avoid mutable module-global primitive state
- avoid ambient mutable booleans distributed across modules

Current implementation example:
- `ProbeConfiguration`

---

# Result Pattern

Project uses a lightweight structured result model.

Current implementation:

```python
Result[T]
```

Responsibilities:
- carry value-or-error state
- isolate exception handling at subsystem boundaries
- preserve readable main-line flow
- avoid exception-driven ordinary control flow

Current API:

```python
succeeded()
failed()
get_value()
```

`get_value()` raises runtime error if accessed in failed state.

This preserves strict non-null semantics after success validation.

---

# Diagnostics / Probe System

## Current Probe Types

Current probe categories:
- TRACE_PROBE
- ERROR_PROBE

## Current Semantics

### Trace Probes

Trace probes:
- represent expected-flow lifecycle artifacts
- represent milestones and operational breadcrumbs
- are runtime configurable

### Error Probes

Current temporary semantics:
- represent lower-level conditions potentially rising above expected flow
- are currently runtime configurable
- are not yet finalized semantically

Current implementation uses:

```python
emit_trace_probe(lambda: ...)
emit_error_probe(lambda: ...)
```

Lazy message providers are intentionally used so message construction cost is avoided when probes are disabled.

## Probe Formatting

Current probe formatting includes:
- timestamp
- probe kind
- log level
- full source pathname
- source line number
- function name
- message

Timestamp format:

```text
yy-mm-dd T hh-MM-ss
```

Current formatting intentionally supports VS Code terminal clickable file/line navigation.

## Logger Isolation

Project uses a dedicated logger:

```python
font_catalog
```

Important lesson learned:
- do NOT use `logging.basicConfig()` for probe formatting
- custom probe formatter must not affect root logger
- third-party libraries may emit records lacking probe metadata

Current implementation:
- dedicated handler attached only to application logger
- logger propagation disabled

---

# Deferred Probe TODOs

## Probe Taxonomy Revisit

Deferred until after first-pass font discovery stabilizes.

Desired future semantics:

### Error-Level Probes

- always enabled
- require no configuration
- represent true error conditions

### Debug-Level Probes

- runtime configurable
- represent conditions whose disposition as true errors is not discernable at low-level call sites
- distinct from tracing

## Probe Colorization

Deferred until probe taxonomy stabilizes.

Desired future direction:
- custom formatter-based ANSI colorization
- formatting-time color application only
- no call-site color logic
- compatible with:
  - VS Code integrated terminal
  - Windows Terminal
  - modern PowerShell/cmd

---

# Font Discovery Subsystem

## Current Module

```text
app/discovery/local_discovery.py
```

## Responsibilities

- enumerate local Windows font files
- filter supported font extensions
- load font metadata
- construct `FontInfo`
- isolate font-loading failures

## Current Supported Extensions

```text
.ttf
.otf
.ttc
```

## Current Discovery Strategy

Current first-pass strategy:
- enumerate:

```text
C:/Windows/Fonts
```

- non-recursive
- filesystem-based only
- no registry enumeration yet
- no normalization layer yet
- no persistence yet

## Current Metadata Extraction

Uses:
- fontTools
- TTFont
- OpenType name table extraction

Current extracted fields:
- family_name
- style_name
- full_name
- file_path

## Current Internal Model

```python
FontInfo
```

Current fields:

```python
family_name
style_name
full_name
file_path
```

No tags, traits, persistence IDs, or UI concerns are currently included.

---

# Current Discovery Observations

## TrueType Collections (.ttc)

Some `.ttc` files fail opening because they require explicit `fontNumber` selection.

Current behavior:
- discovery failure preserved intentionally
- no incomplete fallback implementation accepted

Deferred TODO:
- proper enumeration of all collection entries
- avoid simplistic `fontNumber=0` fallback

---

# Current Known Architectural Boundaries

## Discovery Layer

Responsible ONLY for:
- locating installed fonts
- extracting raw metadata
- filesystem interaction
- future registry interaction

NOT responsible for:
- tagging
- searching
- persistence
- UI rendering
- semantic categorization

---

# Current Application State

Working:
- FastAPI startup
- lifespan handling
- strict typing
- local font enumeration
- metadata extraction
- runtime probe configuration
- VS Code integration
- probe output formatting
- clickable source navigation from probe output

Observed:
- some `.ttc` discovery failures
- FontTools runtime behavior validated
- probe system functioning correctly

Not yet implemented:
- persistence
- catalog layer
- search
- UI
- tagging
- normalization
- trait indexing
- font preview rendering

---

# Current Immediate Direction

Current focus remains:
- stabilizing first-pass discovery
- understanding Windows font ecosystem behavior
- validating metadata quality
- identifying malformed/problematic fonts
- determining future normalization needs

Persistence and UI work intentionally deferred until discovery behavior is better understood.

