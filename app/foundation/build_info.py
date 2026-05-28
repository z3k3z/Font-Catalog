# app/foundation/build_info.py

import json
from pathlib import Path
from typing import Any

from app.foundation.runtime_paths import get_project_root_path


def read_build_info() -> dict[str, Any]:
    build_info_path: Path = get_project_root_path() / "packaging" / "build-info.json"

    if not build_info_path.exists():
        return {
            "appName": "Fontopia",
            "version": "development",
            "gitCommit": "",
            "gitCommitShort": "",
            "buildTimeUtc": "",
        }

    build_info_text: str = build_info_path.read_text(encoding="utf-8-sig")
    build_info: dict[str, Any] = json.loads(build_info_text)

    return build_info
