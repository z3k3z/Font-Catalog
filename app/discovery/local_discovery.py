from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._n_a_m_e import NameRecord, table__n_a_m_e

from app.application_configuration import ApplicationConfiguration
from app.diagnostics.probe import emit_error_probe, emit_trace_probe,  ProbeLevel
from app.discovery.file_discovery import FileDiscovery
from app.discovery.registry_discovery import RegistryDiscovery
from app.discovery.font_candidate import FontCandidate
from app.models.font_info import FontInfo
from app.models.result import Result


class LocalDiscovery:
    def __init__(
        self,
        application_configuration: ApplicationConfiguration,
    ) -> None:
        self._applicationConfiguration: ApplicationConfiguration = (
            application_configuration
        )

    def discover_fonts(self) -> list[FontInfo]:
        emit_trace_probe(lambda: "Starting local font discovery.")

        file_font_infos: list[FontInfo] = self._discover_file_font_infos()
        registry_font_infos: list[FontInfo] = self._discover_registry_font_infos()

        font_infos: list[FontInfo] = self._merge_unique_font_infos(
            primary_font_infos=file_font_infos,
            secondary_font_infos=registry_font_infos,
        )

        emit_trace_probe(
            lambda: (
                f"Completed local font discovery. "
                f"Loaded {len(font_infos)} total unique fonts. "
                f"File discovery loaded {len(file_font_infos)} fonts. "
                f"Registry discovery added "
                f"{len(font_infos) - len(file_font_infos)} fonts."
            )
        )

        return font_infos

    def _discover_file_font_infos(self) -> list[FontInfo]:
        file_discovery: FileDiscovery = FileDiscovery(
            self._applicationConfiguration
        )

        font_candidates: list[FontCandidate] = (
            file_discovery.collect_font_candidates()
        )

        font_infos: list[FontInfo] = self._load_font_infos(font_candidates)

        return font_infos

    def _discover_registry_font_infos(self) -> list[FontInfo]:
        registry_discovery: RegistryDiscovery = RegistryDiscovery(
            self._applicationConfiguration
        )

        font_candidates: list[FontCandidate] = (
            registry_discovery.collect_font_candidates()
        )

        font_infos: list[FontInfo] = self._load_font_infos(font_candidates)

        return font_infos

    def _load_font_infos(
        self,
        font_candidates: list[FontCandidate],
    ) -> list[FontInfo]:
        font_infos: list[FontInfo] = []

        for font_candidate in font_candidates:
            font_info_result: Result[FontInfo] = self._try_load_font_info(
                font_candidate
            )

            if font_info_result.succeeded():
                font_info: FontInfo = font_info_result.get_value()
                font_infos.append(font_info)

            else:
                emit_error_probe(
                    ProbeLevel.ERROR,
                    lambda font_candidate=font_candidate, font_info_result=font_info_result: (
                        f"Skipped font candidate '{font_candidate.file_path}'. "
                        f"Source: {font_candidate.discovery_source.value}. "
                        f"Detail: {font_candidate.discovery_detail}. "
                        f"Reason: {font_info_result.error}"
                    )
                )

        return font_infos

    def _try_load_font_info(
        self,
        font_candidate: FontCandidate,
    ) -> Result[FontInfo]:
        font_result: Result[TTFont] = self._try_open_font(font_candidate)

        if font_result.failed():
            result: Result[FontInfo] = Result(
                value=None,
                error=font_result.error,
            )

            return result

        font: TTFont = font_result.get_value()

        font_info: FontInfo = self._build_font_info(
            font,
            font_candidate,
        )

        result: Result[FontInfo] = Result(value=font_info)

        return result

    def _try_open_font(
        self,
        font_candidate: FontCandidate,
    ) -> Result[TTFont]:
        try:
            font: TTFont = TTFont(font_candidate.file_path)

            result: Result[TTFont] = Result(value=font)

        except Exception as exception:
            result = Result(
                value=None,
                error=(
                    f"Failed to open font file '{font_candidate.file_path}'. "
                    f"Source: {font_candidate.discovery_source.value}. "
                    f"Detail: {font_candidate.discovery_detail}. "
                    f"Reason: {exception}"
                ),
            )

        return result

    def _build_font_info(
        self,
        font: TTFont,
        font_candidate: FontCandidate,
    ) -> FontInfo:
        family_name: str = self._extract_name(font, 1)
        style_name: str = self._extract_name(font, 2)
        full_name: str = self._extract_name(font, 4)

        font_info: FontInfo = FontInfo(
            family_name=family_name,
            style_name=style_name,
            full_name=full_name,
            font_candidate=font_candidate,
        )

        return font_info

    def _extract_name(
        self,
        font: TTFont,
        name_id: int,
    ) -> str:
        matching_records: list[NameRecord] = (
            self._collect_matching_name_records(font, name_id)
        )

        extracted_name: str = self._extract_first_decodable_name(
            matching_records
        )

        return extracted_name

    def _collect_matching_name_records(
        self,
        font: TTFont,
        name_id: int,
    ) -> list[NameRecord]:
        name_table: table__n_a_m_e = font["name"]

        matching_records: list[NameRecord] = []

        for record in name_table.names:
            if record.nameID == name_id:
                matching_records.append(record)

        return matching_records

    def _extract_first_decodable_name(
        self,
        records: list[NameRecord],
    ) -> str:
        extracted_name: str = ""

        for record in records:
            if extracted_name == "":
                decoded_name: str = self._try_decode_name_record(record)

                if decoded_name != "":
                    extracted_name = decoded_name

        return extracted_name

    def _try_decode_name_record(
        self,
        record: NameRecord,
    ) -> str:
        try:
            decoded_name: str = str(record.toUnicode())

        except Exception:
            decoded_name = ""

        return decoded_name

    def _merge_unique_font_infos(
        self,
        primary_font_infos: list[FontInfo],
        secondary_font_infos: list[FontInfo],
    ) -> list[FontInfo]:
        merged_font_infos: list[FontInfo] = []

        for font_info in primary_font_infos:
            merged_font_infos.append(font_info)

        known_identity_keys: set[tuple[str, str, str]] = (
            self._build_font_identity_key_set(merged_font_infos)
        )

        for font_info in secondary_font_infos:
            identity_key: tuple[str, str, str] = (
                self._build_font_identity_key(font_info)
            )

            if identity_key not in known_identity_keys:
                merged_font_infos.append(font_info)
                known_identity_keys.add(identity_key)

            else:
                emit_error_probe(
                    ProbeLevel.DEBUG,
                    lambda font_info=font_info: (
                        f"Suppressed duplicate discovered font. "
                        f"Family: '{font_info.family_name}'. "
                        f"Style: '{font_info.style_name}'. "
                        f"Full name: '{font_info.full_name}'. "
                        f"Source: "
                        f"{font_info.font_candidate.discovery_source.value}. "
                        f"Detail: "
                        f"{font_info.font_candidate.discovery_detail}."
                    )
                )

        return merged_font_infos

    def _build_font_identity_key_set(
        self,
        font_infos: list[FontInfo],
    ) -> set[tuple[str, str, str]]:
        identity_keys: set[tuple[str, str, str]] = set()

        for font_info in font_infos:
            identity_key: tuple[str, str, str] = (
                self._build_font_identity_key(font_info)
            )

            identity_keys.add(identity_key)

        return identity_keys

    def _build_font_identity_key(
        self,
        font_info: FontInfo,
    ) -> tuple[str, str, str]:
        identity_key: tuple[str, str, str] = (
            font_info.family_name.strip().casefold(),
            font_info.style_name.strip().casefold(),
            font_info.full_name.strip().casefold(),
        )

        return identity_key