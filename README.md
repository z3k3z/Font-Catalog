# Font Catalog

Local Windows font catalog and preview system.

## Goals

- Enumerate locally installed fonts
- Provide searchable preview catalog
- Support typography traits
- Support user-defined tagging
- Operate entirely locally

## Tech Stack

- Python
- FastAPI
- SQLite
- HTML/CSS/JavaScript frontend

## Development

Activate environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Run server:

```powershell
fastapi dev app/main.py
```