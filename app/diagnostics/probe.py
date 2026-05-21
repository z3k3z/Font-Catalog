import logging
import os
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from typing import TextIO


_TRACE_LOGGER_NAME: str = "font_catalog.trace"
_ERROR_PROBE_LOGGER_NAME: str = "font_catalog.error_probe"

_TRACE_ENVIRONMENT_VARIABLE_NAME: str = "FONT_CATALOG_TRACE"
_ERROR_PROBE_LEVEL_ENVIRONMENT_VARIABLE_NAME: str = "FONT_CATALOG_ERROR_PROBE_LEVEL"

"""
$env:FONT_CATALOG_TRACE="0"
$env:FONT_CATALOG_ERROR_PROBE_LEVEL="ERROR"
fastapi dev app/main.py
"""

_TRACE_PROBE_KIND: str = "TRACE_PROBE"
_ERROR_PROBE_KIND: str = "ERROR_PROBE"


_traceLogger: logging.Logger = logging.getLogger(_TRACE_LOGGER_NAME)
_errorProbeLogger: logging.Logger = logging.getLogger(_ERROR_PROBE_LOGGER_NAME)


class ProbeLevel(Enum):
    DEBUG = logging.DEBUG
    WARNING = logging.WARNING
    ERROR = logging.ERROR


@dataclass(frozen=True)
class ProbeConfiguration:
    fTraceProbeEnabled: bool
    errorProbeMinimumLevel: ProbeLevel


_probeConfiguration: ProbeConfiguration | None = None


def configure_probes() -> None:
    global _probeConfiguration

    _probeConfiguration = ProbeConfiguration(
        fTraceProbeEnabled=_is_environment_flag_enabled(
            _TRACE_ENVIRONMENT_VARIABLE_NAME
        ),
        errorProbeMinimumLevel=_read_error_probe_minimum_level(),
    )

    _configure_logger(
        logger=_traceLogger,
        level=logging.INFO,
    )

    _configure_logger(
        logger=_errorProbeLogger,
        level=_probeConfiguration.errorProbeMinimumLevel.value,
    )


def emit_trace_probe(message_provider: Callable[[], str]) -> None:
    probeConfiguration: ProbeConfiguration = _get_probe_configuration()

    if (
        probeConfiguration.fTraceProbeEnabled
        and _traceLogger.isEnabledFor(logging.INFO)
    ):
        message: str = message_provider()

        _traceLogger.info(
            message,
            extra={"probe_kind": _TRACE_PROBE_KIND},
            stacklevel=2,
        )


def emit_error_probe(
    probe_level: ProbeLevel,
    message_provider: Callable[[], str],
) -> None:
    _get_probe_configuration()

    if _errorProbeLogger.isEnabledFor(probe_level.value):
        message: str = message_provider()

        _errorProbeLogger.log(
            probe_level.value,
            message,
            extra={"probe_kind": _ERROR_PROBE_KIND},
            stacklevel=2,
        )


def _configure_logger(
    logger: logging.Logger,
    level: int,
) -> None:
    logger.handlers.clear()
    handler: logging.StreamHandler[TextIO] = logging.StreamHandler()

    formatter: logging.Formatter = logging.Formatter(
        fmt=(
            "%(asctime)s "
            "%(probe_kind)s "
            "%(levelname)s "
            "%(pathname)s:%(lineno)d "
            "%(funcName)s(): "
            "%(message)s"
        ),
        datefmt="%y-%m-%d T %H-%M-%S",
    )

    handler.setFormatter(formatter)

    logger.setLevel(level)
    logger.addHandler(handler)
    logger.propagate = False


def _get_probe_configuration() -> ProbeConfiguration:
    if _probeConfiguration is None:
        raise RuntimeError("Probes have not been configured.")

    return _probeConfiguration


def _read_error_probe_minimum_level() -> ProbeLevel:
    raw_value: str = os.getenv(
        _ERROR_PROBE_LEVEL_ENVIRONMENT_VARIABLE_NAME,
        "ERROR",
    )

    normalized_value: str = raw_value.strip().upper()

    if normalized_value == "DEBUG":
        probe_level: ProbeLevel = ProbeLevel.DEBUG

    elif normalized_value == "WARNING":
        probe_level = ProbeLevel.WARNING

    else:
        probe_level = ProbeLevel.ERROR

    return probe_level


def _is_environment_flag_enabled(environment_variable_name: str) -> bool:
    raw_value: str = os.getenv(environment_variable_name, "")
    normalized_value: str = raw_value.strip().lower()

    fEnabled: bool = normalized_value in ("1", "true", "yes", "on")

    return fEnabled