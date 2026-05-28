import sys
from pathlib import Path


def get_project_root_path() -> Path:
    if _is_running_frozen() is True:
        executable_path = Path(sys.executable)
        project_root_path = executable_path.parent

        return project_root_path

    current_file_path = Path(__file__).resolve()

    project_root_path = current_file_path.parent.parent.parent

    return project_root_path


def get_static_root_path() -> Path:
    static_root_path = get_project_root_path() / "app" / "static"

    return static_root_path


def _is_running_frozen() -> bool:
    is_running_frozen = getattr(sys, "frozen", False)

    return bool(is_running_frozen)
