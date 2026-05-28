from dataclasses import dataclass
from pathlib import Path

from app.diagnostics.probe_level import ProbeLevel


@dataclass(frozen=True)
class ApplicationConfiguration:
    application_log: Path
    windows_font_directory: Path
    windows_font_registry_subkey: str
    is_trace_enabled: bool
    error_probe_level: ProbeLevel


def create_application_configuration() -> ApplicationConfiguration:
    configuration: ApplicationConfiguration = ApplicationConfiguration(
        application_log=Path("./logs/app.log"),
        windows_font_directory=Path("C:/Windows/Fonts"),
        windows_font_registry_subkey=(r"Software\Microsoft\Windows NT\CurrentVersion\Fonts"),
        is_trace_enabled=True,
        error_probe_level=ProbeLevel.DEBUG,
    )

    return configuration
