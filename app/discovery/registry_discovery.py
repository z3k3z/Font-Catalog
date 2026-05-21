import winreg
from pathlib import Path

from app.diagnostics.probe import emit_error_probe, emit_trace_probe
from app.discovery.font_candidate import DiscoverySource, FontCandidate
from app.models.result import Result


_WINDOWS_FONT_REGISTRY_SUBKEY: str = (
    r"Software\Microsoft\Windows NT\CurrentVersion\Fonts"
)


def collect_registry_font_candidates() -> list[FontCandidate]:
    font_candidates: list[FontCandidate] = []

    machine_candidates: list[FontCandidate] = _collect_registry_font_candidates_from_key(
        root_key=winreg.HKEY_LOCAL_MACHINE,
        discovery_source=DiscoverySource.WINDOWS_MACHINE_REGISTRY,
        discovery_detail=(
            r"HKLM\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
        ),
    )

    user_candidates: list[FontCandidate] = _collect_registry_font_candidates_from_key(
        root_key=winreg.HKEY_CURRENT_USER,
        discovery_source=DiscoverySource.WINDOWS_USER_REGISTRY,
        discovery_detail=(
            r"HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
        ),
    )

    font_candidates.extend(machine_candidates)
    font_candidates.extend(user_candidates)

    return font_candidates


def _collect_registry_font_candidates_from_key(
    root_key: int,
    discovery_source: DiscoverySource,
    discovery_detail: str,
) -> list[FontCandidate]:
    try:
        registry_key: winreg.HKEYType = winreg.OpenKey(
            root_key,
            _WINDOWS_FONT_REGISTRY_SUBKEY,
        )

    except OSError as exception:
        emit_error_probe(
            lambda: (
                f"Unable to open font registry key. "
                f"Source: {discovery_source.value}. "
                f"Detail: {discovery_detail}. "
                f"Reason: {exception}"
            )
        )

        return []

    font_candidates: list[FontCandidate] = _collect_registry_font_candidates_from_open_key(
        registry_key=registry_key,
        discovery_source=discovery_source,
        discovery_detail=discovery_detail,
    )

    winreg.CloseKey(registry_key)

    return font_candidates


def _collect_registry_font_candidates_from_open_key(
    registry_key: winreg.HKEYType,
    discovery_source: DiscoverySource,
    discovery_detail: str,
) -> list[FontCandidate]:
    font_candidates: list[FontCandidate] = []

    value_count: int = winreg.QueryInfoKey(registry_key)[1]

    for value_index in range(value_count):
        font_candidate_result: Result[FontCandidate] = (
            _try_collect_registry_font_candidate(
                registry_key=registry_key,
                value_index=value_index,
                discovery_source=discovery_source,
                discovery_detail=discovery_detail,
            )
        )

        if font_candidate_result.succeeded():
            font_candidate: FontCandidate = font_candidate_result.get_value()
            font_candidates.append(font_candidate)

        if font_candidate_result.failed():
            emit_error_probe(
                lambda value_index=value_index, font_candidate_result=font_candidate_result: (
                    f"Skipped registry font value at index {value_index}. "
                    f"Reason: {font_candidate_result.error}"
                )
            )

    emit_trace_probe(
        lambda: (
            f"Collected {len(font_candidates)} font candidates "
            f"from registry source {discovery_source.value}."
        )
    )

    return font_candidates


def _try_collect_registry_font_candidate(
    registry_key: winreg.HKEYType,
    value_index: int,
    discovery_source: DiscoverySource,
    discovery_detail: str,
) -> Result[FontCandidate]:
    try:
        value_name: str
        value_data: object
        value_type: int

        value_name, value_data, value_type = winreg.EnumValue(
            registry_key,
            value_index,
        )

        result: Result[FontCandidate] = _build_registry_font_candidate(
            value_name=value_name,
            value_data=value_data,
            value_type=value_type,
            discovery_source=discovery_source,
            discovery_detail=discovery_detail,
        )

    except OSError as exception:
        result = Result(
            value=None,
            error=f"Unable to enumerate registry value: {exception}",
        )

    return result


def _build_registry_font_candidate(
    value_name: str,
    value_data: object,
    value_type: int,
    discovery_source: DiscoverySource,
    discovery_detail: str,
) -> Result[FontCandidate]:
    if value_type != winreg.REG_SZ:
        result: Result[FontCandidate] = Result(
            value=None,
            error=(
                f"Registry value '{value_name}' is not REG_SZ. "
                f"Actual type: {value_type}"
            ),
        )

        return result

    if not isinstance(value_data, str):
        result = Result(
            value=None,
            error=f"Registry value '{value_name}' does not contain string data.",
        )

        return result

    file_path: Path = _resolve_registry_font_path(value_data)

    font_candidate: FontCandidate = FontCandidate(
        file_path=file_path,
        discovery_source=discovery_source,
        discovery_detail=f"{discovery_detail}\\{value_name}",
    )

    result = Result(value=font_candidate)

    return result


def _resolve_registry_font_path(registry_font_path: str) -> Path:
    candidate_path: Path = Path(registry_font_path)

    if candidate_path.is_absolute():
        resolved_path: Path = candidate_path
    else:
        resolved_path = Path("C:/Windows/Fonts") / candidate_path

    return resolved_path