# Project Continuity

## Current Architecture Direction

Local web application:

Frontend UI
↓
FastAPI backend
↓
SQLite persistence
↓
Windows font discovery

## Architectural Discipline

- Incremental evolution
- Strong ownership boundaries
- No premature abstraction
- SQLite authoritative persistence
- Thin API layer
- Separate discovery/catalog/persistence responsibilities

## Python Style Discipline

The project favors clear main-line flow over compact idiomatic cleverness.

Rules:
- Keep function control flow visually simple.
- Use early returns only for guard clauses.
- Avoid `continue` unless it is clearly simpler than extraction.
- Avoid nested branching when named helper functions can express intent.
- Keep exception-handling scopes narrow.
- Prefer explicit intermediate variables over dense expressions.
- Preserve type hints on public and internal function signatures.
- Separate filtering, loading, normalization, and transformation steps.

## Python Coding Discipline

The project uses Python-native constructs, but rejects casual script-style implementation.

Principles:
- Favor clear main-line flow over compact cleverness.
- Preserve explicit intermediate variables and type hints.
- Pylance strict type validation is enabled.
- Collections should have explicit type declarations.
- Avoid untyped `list`, `dict`, and loosely inferred collection values.
- Prefer concrete typed aliases when third-party library types become noisy.
- Keep function control flow visually simple.
- Use early returns only for guard clauses.
- Avoid `continue` unless it is clearly simpler than extraction.
- Avoid nested branching when named helper functions can express intent.
- Keep exception-handling scopes narrow.
- Use exceptions only at IO, library, or runtime-boundary failure points.
- Do not use exceptions for ordinary control flow.
- Convert caught exceptions immediately into structured status/report objects.
- Let the caller decide severity and logging.
- Use structured `Result[T]` at subsystem boundaries and failure-prone IO boundaries.
- Do not spread `Result[T]` to every small transformation unless justified.

## Current Status

Environment configuration complete.

Verified:
- Python virtual environment
- FastAPI server execution
- VS Code integration
- Git repository initialization

## Environment Notes

Python installed using Python Install Manager for Windows.

Project conventions:
- Prefer `py` launcher over direct `python` invocation
- Virtual environments remain project-local (`.venv`)
- VS Code interpreter should target `.venv`