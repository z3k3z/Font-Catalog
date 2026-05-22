from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._n_a_m_e import NameRecord, table__n_a_m_e

from app.application_configuration import ApplicationConfiguration
from app.diagnostics.probe import ProbeLevel, emit_error_probe, emit_trace_probe
from app.discovery.file_discovery import FileDiscovery
from app.discovery.font_candidate import FontCandidate
from app.discovery.registry_discovery import RegistryDiscovery
from app.models.font_info import FontInfo
from app.models.font_info_collection import FontInfoCollection
from app.models.result import Result


class LocalDiscovery:
    def __init__(self, application_configuration: ApplicationConfiguration) -> None:
        self._applicationConfiguration: ApplicationConfiguration = application_configuration
        self._fontCollection: FontInfoCollection = FontInfoCollection(
            key_builder=self._build_font_identity_key
        )

    def discover_fonts(self) -> list[FontInfo]:
        count: int = 0
        emit_trace_probe(lambda: "Starting local font discovery.")

        # load fonts from Windows font folder
        count = self._discover_file_font_infos()
        emit_trace_probe(lambda: (f"File discovery loaded {count} fonts."))
        # load additional unique fonts housed in the registry
        count = self._discover_registry_font_infos()
        emit_trace_probe(lambda: (f"Registry discovery loaded {count} fonts."))

        emit_trace_probe(
            lambda: (
                f"Completed local font discovery. "
                f"Loaded {len(self._fontCollection)} total unique fonts. "
            )
        )

        return self._fontCollection.to_list()

    def _discover_file_font_infos(self) -> int:
        file_discovery: FileDiscovery = FileDiscovery(self._applicationConfiguration)

        font_candidates: list[FontCandidate] = file_discovery.collect_font_candidates()

        return self._load_font_infos(font_candidates)

    def _discover_registry_font_infos(self) -> int:
        registry_discovery: RegistryDiscovery = RegistryDiscovery(self._applicationConfiguration)

        font_candidates: list[FontCandidate] = registry_discovery.collect_font_candidates()

        return self._load_font_infos(font_candidates)

    def _load_font_infos(
        self,
        font_candidates: list[FontCandidate],
    ) -> int:
        count: int = 0

        for font_candidate in font_candidates:
            # only load the file if we have not done so before
            if not self._fontCollection.contains_path(font_candidate.file_path):
                font_info_result: Result[FontInfo] = self._try_load_font_info(font_candidate)

                if font_info_result.succeeded():
                    font_info: FontInfo = font_info_result.get_value()
                    if self._fontCollection.insert(font_info):
                        count += 1
                    else:
                        emit_error_probe(
                            ProbeLevel.WARNING,
                            lambda: (f"Skipped duplicate font found at {font_candidate.file_path}."),
                        )

                else:
                    emit_error_probe(
                        ProbeLevel.ERROR,
                        lambda font_candidate=font_candidate, font_info_result=font_info_result: (
                            f"Skipped font candidate '{font_candidate.file_path}'. "
                            f"Source: {font_candidate.discovery_source.value}. "
                            f"Detail: {font_candidate.discovery_detail}. "
                            f"Reason: {font_info_result.error}"
                        ),
                    )

        return count

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
        matching_records: list[NameRecord] = self._collect_matching_name_records(font, name_id)

        extracted_name: str = self._extract_first_decodable_name(matching_records)

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
