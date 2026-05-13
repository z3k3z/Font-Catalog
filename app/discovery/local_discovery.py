from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._n_a_m_e import NameRecord, table__n_a_m_e

from app.diagnostics.probe import emit_error_probe, emit_trace_probe
from app.models.font_info import FontInfo
from app.models.result import Result


_FONT_DIRECTORIES: tuple[Path, ...] = (
    Path("C:/Windows/Fonts"),
)


_SUPPORTED_EXTENSIONS: tuple[str, ...] = (
    ".ttf",
    ".otf",
    ".ttc",
)


def discover_fonts() -> list[FontInfo]:
    emit_trace_probe(lambda: "Starting local font discovery.")

    font_paths: list[Path] = _collect_font_paths()
    font_infos: list[FontInfo] = _load_font_infos(font_paths)

    emit_trace_probe(
        lambda: (
            f"Completed local font discovery. "
            f"Loaded {len(font_infos)} fonts from {len(font_paths)} candidate files."
        )
    )

    return font_infos


def _collect_font_paths() -> list[Path]:
    font_paths: list[Path] = []

    for directory in _FONT_DIRECTORIES:
        directory_font_paths: list[Path] = _collect_font_paths_from_directory(directory)
        font_paths.extend(directory_font_paths)

    return font_paths


def _collect_font_paths_from_directory(directory: Path) -> list[Path]:
    if not directory.exists():
        emit_error_probe(lambda: f"Font directory does not exist: '{directory}'.")
        return []

    directory_paths: list[Path] = list(directory.iterdir())
    font_paths: list[Path] = _filter_supported_font_paths(directory_paths)

    emit_trace_probe(
        lambda: (
            f"Collected {len(font_paths)} supported font files "
            f"from directory '{directory}'."
        )
    )

    return font_paths


def _filter_supported_font_paths(paths: list[Path]) -> list[Path]:
    font_paths: list[Path] = []

    for path in paths:
        if _is_supported_font_file(path):
            font_paths.append(path)

    return font_paths


def _is_supported_font_file(path: Path) -> bool:
    is_supported_file: bool = path.is_file() and path.suffix.lower() in _SUPPORTED_EXTENSIONS

    return is_supported_file


def _load_font_infos(font_paths: list[Path]) -> list[FontInfo]:
    font_infos: list[FontInfo] = []

    for font_path in font_paths:
        font_info_result: Result[FontInfo] = _try_load_font_info(font_path)

        if font_info_result.succeeded():
            font_info: FontInfo = font_info_result.get_value()
            font_infos.append(font_info)

        if font_info_result.failed():
            emit_error_probe(
                lambda font_path=font_path, font_info_result=font_info_result: (
                    f"Skipped font candidate '{font_path}'. "
                    f"Reason: {font_info_result.error}"
                )
            )

    return font_infos


def _try_load_font_info(path: Path) -> Result[FontInfo]:
    font_result: Result[TTFont] = _try_open_font(path)

    if font_result.failed():
        result: Result[FontInfo] = Result(value=None, error=font_result.error)
        return result

    font: TTFont = font_result.get_value()
    font_info: FontInfo = _build_font_info(font, path)
    result = Result(value=font_info)

    return result


def _try_open_font(path: Path) -> Result[TTFont]:
    try:
        font: TTFont = TTFont(path)
        result: Result[TTFont] = Result(value=font)

    except Exception as exception:
        error_message: str = f"Failed to open font file '{path}': {exception}"

        result = Result(
            value=None,
            error=error_message,
        )

    return result


def _build_font_info(font: TTFont, path: Path) -> FontInfo:
    family_name: str = _extract_name(font, 1)
    style_name: str = _extract_name(font, 2)
    full_name: str = _extract_name(font, 4)

    font_info: FontInfo = FontInfo(
        family_name=family_name,
        style_name=style_name,
        full_name=full_name,
        file_path=path,
    )

    return font_info


def _extract_name(font: TTFont, name_id: int) -> str:
    matching_records: list[NameRecord] = _collect_matching_name_records(font, name_id)
    extracted_name: str = _extract_first_decodable_name(matching_records)

    return extracted_name


def _collect_matching_name_records(
    font: TTFont,
    name_id: int,
) -> list[NameRecord]:
    name_table: table__n_a_m_e = font["name"]
    matching_records: list[NameRecord] = []

    for record in name_table.names:
        if record.nameID == name_id:
            matching_records.append(record)

    return matching_records


def _extract_first_decodable_name(records: list[NameRecord]) -> str:
    extracted_name: str = ""

    for record in records:
        if extracted_name == "":
            decoded_name: str = _try_decode_name_record(record)

            if decoded_name != "":
                extracted_name = decoded_name

    return extracted_name


def _try_decode_name_record(record: NameRecord) -> str:
    try:
        decoded_name: str = str(record.toUnicode())

    except Exception:
        decoded_name = ""

    return decoded_name