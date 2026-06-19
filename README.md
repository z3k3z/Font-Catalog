# Fontopia

Fontopia is a Windows font catalog and typography exploration tool. It discovers locally installed fonts, serves exact discovered font files through a FastAPI backend, and provides a browser-based exploration interface for filtering, previewing, tagging, and comparing candidate fonts.

The current release line is **v0.2.x**.

---

## Project Goals

Fontopia is evolving from a simple font list into a typography exploration workspace.

Current emphasis:

- Visually dominant font-card previews
- Fast local filtering
- Include/exclude search chips
- User-defined tags
- System tags for preference workflows
- Lightweight comparison-oriented exploration
- Minimal metadata noise during discovery

Longer-term direction:

- Comparison/cart workflows
- Metadata inspector mode
- Relationship-driven exploration
- Visual similarity and clustering
- Saved exploration journeys

---

## Current Feature Themes

### Font Discovery

The backend discovers Windows fonts from both filesystem and registry sources. Discovery is cataloged through a runtime `FontCatalog` that assigns opaque frontend-facing font IDs while preserving backend semantic identity.

Important boundaries:

- Backend owns semantic uniqueness.
- Frontend receives opaque runtime IDs.
- Font files are served through backend endpoints.
- Collection-backed fonts are converted into browser-loadable single-font streams when needed.

### Font Rendering

The frontend does not rely on browser family-name resolution. Instead, it lazily registers exact discovered font files using generated `@font-face` rules.

Current strategy:

- Load all font metadata at startup.
- Render font cards with fallback fonts initially.
- Use `IntersectionObserver` to lazy-load exact font files as cards enter view.
- Keep loaded fonts registered for the session.

### Search

Search is based on composable search chips.

Supported behavior:

- Multiple search chips
- AND-combined constraints
- Required text constraints
- Excluded text constraints
- Required tag constraints
- Excluded tag constraints

Examples:

```text
Roboto
-Roboto
#Likey
-#No-Likey
Roboto #Bulletin -#No-Likey
```

Tag search is exact and case-sensitive.

### Tags

Fontopia supports user-defined tags and system-defined tags.

Current system tags:

- `Likey`
- `No-Likey`

System tags are intentionally ordinary tags:

- Visible in tag lists
- Searchable
- Removable through normal tag-chip removal
- Used by card-level preference buttons

Current default search behavior excludes `#No-Likey`.

### Likey / No-Likey

Font cards expose preference buttons:

- Smile / heart-oriented action for `Likey`
- Vomit-face action for `No-Likey`

Behavior:

- Mutually exclusive
- Reflected in tag state
- Reflected in search filtering
- Uses short no-undo toast feedback
- Toast dismissal has semantic trails:
  - heart trail for `Likey`
  - poop trail for `No-Likey`

When tag mutation causes a card to no longer satisfy active tag filters, the card fades out and the grid reflows using FLIP-style animation without resetting scroll position.

### Backlog Direction

Near-term backlog themes:

- Convert tag-summary popup from hover to click
- Distinguish default search chips from session-added chips
- Persist user-configurable default search constraints
- Evolve the existing cart/header subsystem into comparison/cart management
- Expand detail view metadata inspection
- Improve keyboard navigation for search chips

---

## Architecture Overview

### Backend

Major backend responsibilities:

```text
Discovery
    -> FontInfo / FontCandidate
    -> FontInfoCollection
    -> FontCatalog
    -> API response models
```

Key concepts:

- `LocalDiscovery`
- `FileDiscovery`
- `RegistryDiscovery`
- `FontCandidate`
- `FontInfo`
- `FontSourceReference`
- `FontCatalog`
- `CatalogFontRecord`

The backend is intentionally class-oriented and favors explicit ownership boundaries.

### Frontend

The frontend is implemented as vanilla JavaScript using ES modules.

Frameworks are intentionally deferred.

Major subsystems include:

- `FontApiClient`
- `FontLoader`
- `FontGridView`
- `FontGridCardView`
- `FontGridCardTagsView`
- `FontSearch`
- `SearchChipBar`
- `SearchTagSuggestionController`
- `SuggestionDecorator`
- `TagLoader`
- `TagSuggestionProvider`
- `ToastView`
- `CardSampleTextController`
- `CardGridPresentationController`
- `FontDetailView`

`app.js` is the composition root. It should primarily create subsystems, resolve DOM dependencies, and wire listeners.

### Design Principles

Fontopia intentionally optimizes for reducing cognitive surface.

Preferred direction:

- One owner per concept
- Explicit dependency injection
- Explicit subsystem boundaries
- Small reusable foundation helpers when patterns repeat
- Composition root for wiring
- Avoid hidden globals and ambient coupling
- Avoid DRY-driven coupling when separate contracts are clearer

Useful framing:

```text
Do not duplicate knowledge.
Do not prematurely unify responsibilities.
```

---

## Development Environment

These instructions assume Windows 11 with PowerShell, VS Code, and Python installed.

### Required Tools

Install or verify:

- Python 3.12 or newer
- Git
- VS Code
- A modern Chromium-based browser such as Edge or Chrome

Recommended VS Code extensions:

- Python
- Pylance
- Black Formatter
- isort
- Prettier
- Code Spell Checker

### Clone the Repository

```powershell
git clone <repository-url>
cd <repository-folder>
```

### Create a Virtual Environment

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, allow local script execution for the current user:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate again:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Install Python Dependencies

If the repository contains `requirements.txt`:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If dependencies are not yet pinned, the known core runtime dependencies include:

```powershell
pip install fastapi uvicorn fonttools pydantic
```

Development dependencies commonly used by this project:

```powershell
pip install black isort pyright
```

If the project has moved to `pyproject.toml` dependency groups, prefer the repository-specific install instructions in that file.

---

## Runtime Environment

### Start the Development Server

Typical FastAPI launch pattern:

```powershell
uvicorn app.main:app --reload
```

If the application entry point differs, use the actual module path from the repository. Common alternatives are:

```powershell
uvicorn main:app --reload
uvicorn src.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000/
```

API documentation:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
```

### Environment Variables

The backend probe system supports environment-based configuration.

Known probe-related variables include:

```text
FONT_CATALOG_TRACE
FONT_CATALOG_ERROR_PROBE_LEVEL
```

Typical development usage:

```powershell
$env:FONT_CATALOG_TRACE = "1"
$env:FONT_CATALOG_ERROR_PROBE_LEVEL = "warning"
uvicorn app.main:app --reload
```

If exact accepted values differ, check the backend diagnostics configuration code before relying on a value.

### Font Discovery Configuration

Fontopia discovers Windows fonts from configured filesystem and registry locations.

When changing discovery behavior, check the application configuration object rather than hardcoding paths directly in discovery helpers.

Expected discovery sources:

- Windows font directories
- Windows registry font entries
- Future per-user font locations

---

## Formatting and Static Checks

### Python Formatting

```powershell
black .
isort .
```

Project conventions:

- 108-column width
- Explicit typing where practical
- Strict Pylance / pyright feedback treated seriously

### Frontend Formatting

Frontend uses Prettier with:

- 4 spaces
- semicolons
- 108-column width

If Prettier is available through VS Code, use format-on-save.

If a local Node/Prettier setup exists:

```powershell
npx prettier --write static
```

Adjust the path if frontend assets live elsewhere.

---

## Git Workflow

### Check Status

```powershell
git status
```

### Create a Feature Branch

```powershell
git checkout -b feature/<short-description>
```

### Commit Changes

```powershell
git add .
git commit -m "Describe the change"
```

### Merge a Feature Branch into Main

```powershell
git checkout main
git pull origin main
git merge feature/<short-description>
git push origin main
```

### Rename Files

Use Git-aware rename:

```powershell
git mv old-name.js new-name.js
git commit -m "Rename old-name.js to new-name.js"
```

For case-only renames on Windows, use a temporary name:

```powershell
git mv OldName.js temp-name.js
git mv temp-name.js new-name.js
git commit -m "Normalize filename casing"
```

---

## Frontend Naming Conventions

File names use kebab-case / snake-style lowercase naming:

```text
font-grid-card-view.js
font-grid-card-tags-view.js
search-tag-suggestion-controller.js
most-recent-request-tracker.js
```

Classes use PascalCase:

```javascript
FontGridCardView
FontGridCardTagsView
SearchTagSuggestionController
MostRecentRequestTracker
```

This convention is intentional and should be preserved.

---

## Operational Notes

### Async / Await

Several frontend flows are asynchronous:

- Loading fonts
- Loading tags
- Loading tag snapshots
- Autocomplete suggestions
- Lazy font registration

Important rule:

```text
If a function awaits, it returns a Promise.
Callers needing the result must await it.
```

Where possible, repeated async patterns should be encapsulated rather than duplicated.

Current reusable async helpers include:

- `MostRecentRequestTracker`
- `MostRecentValueCache`

### Suggestion Behavior

`SuggestionDecorator` owns generic autocomplete UI behavior.

Consumers provide:

- input element
- suggestion container
- suggestion loader
- display text
- acceptance behavior

Tag-specific matching and lexical-distance ranking belong outside the decorator.

### Tag Filtering

Tag mutation should not rebuild the full grid.

Current preferred behavior:

```text
Tag changes
    -> updated tagNames emitted
    -> preference buttons update
    -> affected card is evaluated against active tag constraints
    -> card is removed with animation if no longer visible
```

Avoid using a brute-force full `_applySearch()` for card-level tag changes because it resets scroll position.

---

## Known Deferred Work

### Tag Popup Interaction

Current tag summary popup is hover-based.

Desired future interaction:

```text
Click tag summary
    -> open popup

Click outside / Escape
    -> close popup
```

Reason:

- Reduces hover corridor complexity
- Better supports touch devices
- Makes popup state explicit

### Search Defaults

Current default exclusion:

```text
-#No-Likey
```

Future work:

- Persist default search constraints
- Visually distinguish default chips
- Allow user modification of defaults

### Cart / Comparison

Do not remove the existing cart/header concept casually.

The current cart-like subsystem may evolve into comparison management for selected fonts.

### Metadata Inspector

Backend metadata extraction exists, but richer frontend metadata presentation is deferred.

---

## Continuity Documents

Recommended project continuity files:

- `README.md`
- `project-continuity.md`
- `project-backlog.md`

The continuity document should preserve project state, architectural intent, and design rationale.

The backlog should remain forward-looking and avoid retaining completed history except where rejected decisions need explanation.
