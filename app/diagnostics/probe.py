import logging
import os
from collections.abc import Callable
from dataclasses import dataclass
from typing import TextIO

_LOGGER_NAME: str = "font_catalog"


"""
Runtime powershell commands:

$env:FONT_CATALOG_TRACE="1"
$env:FONT_CATALOG_ERROR_PROBES="1"
fastapi dev app/main.py
"""

_TRACE_ENVIRONMENT_VARIABLE_NAME: str = "FONT_CATALOG_TRACE"
_ERROR_ENVIRONMENT_VARIABLE_NAME: str = "FONT_CATALOG_ERROR_PROBES"

_TRACE_PROBE_KIND: str = "TRACE_PROBE"
_ERROR_PROBE_KIND: str = "ERROR_PROBE"

_logger: logging.Logger = logging.getLogger(_LOGGER_NAME)


@dataclass(frozen=True)
class ProbeConfiguration:
    fTraceProbeEnabled: bool
    fErrorProbeEnabled: bool


_probeConfiguration: ProbeConfiguration | None = None


def configure_probes() -> None:
    global _probeConfiguration

    handler: logging.StreamHandler[TextIO] = logging.StreamHandler()

    formatter: logging.Formatter = logging.Formatter(
        fmt=(
            "%(asctime)s "
            "%(probe_kind)s "
            "%(levelname)s "
            "%(filename)s:%(lineno)d:%(funcName)s(): "
            "%(message)s"
        ),
        datefmt="%y-%m-%d T %H-%M-%S",
    )

    handler.setFormatter(formatter)

    _logger.setLevel(logging.DEBUG)
    _logger.addHandler(handler)
    _logger.propagate = False

    _probeConfiguration = ProbeConfiguration(
        fTraceProbeEnabled=_is_environment_flag_enabled(
            _TRACE_ENVIRONMENT_VARIABLE_NAME
        ),
        fErrorProbeEnabled=_is_environment_flag_enabled(
            _ERROR_ENVIRONMENT_VARIABLE_NAME
        ),
    )


def emit_trace_probe(message_provider: Callable[[], str]) -> None:
    probeConfiguration: ProbeConfiguration = _get_probe_configuration()

    if probeConfiguration.fTraceProbeEnabled:
        message: str = message_provider()

        _logger.info(
            message,
            extra={"probe_kind": _TRACE_PROBE_KIND},
            stacklevel=2,
        )


def emit_error_probe(message_provider: Callable[[], str]) -> None:
    probeConfiguration: ProbeConfiguration = _get_probe_configuration()

    if probeConfiguration.fErrorProbeEnabled:
        message: str = message_provider()

        _logger.debug(
            message,
            extra={"probe_kind": _ERROR_PROBE_KIND},
            stacklevel=2,
        )


def _get_probe_configuration() -> ProbeConfiguration:
    if _probeConfiguration is None:
        raise RuntimeError("Probes have not been configured.")

    return _probeConfiguration


def _is_environment_flag_enabled(environment_variable_name: str) -> bool:
    raw_value: str = os.getenv(environment_variable_name, "")
    normalized_value: str = raw_value.strip().lower()

    is_enabled: bool = normalized_value in ("1", "true", "yes", "on")

    return is_enabled