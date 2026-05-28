import logging
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import TextIO

from app.application_configuration import ApplicationConfiguration
from app.diagnostics.probe_level import ProbeLevel

_TRACE_LOGGER_NAME: str = "font_catalog.trace"
_ERROR_PROBE_LOGGER_NAME: str = "font_catalog.error_probe"

_TRACE_PROBE_KIND: str = "TRACE_PROBE"
_ERROR_PROBE_KIND: str = "ERROR_PROBE"


_traceLogger: logging.Logger = logging.getLogger(_TRACE_LOGGER_NAME)
_errorProbeLogger: logging.Logger = logging.getLogger(_ERROR_PROBE_LOGGER_NAME)

_ANSI_RESET: str = "\033[0m"
_ANSI_TRACE: str = "\033[36m"
_ANSI_DEBUG: str = "\033[90m"
_ANSI_WARNING: str = "\033[33m"
_ANSI_ERROR: str = "\033[31m"


class ProbeFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        formattedMessage: str = super().format(record)
        color: str = self._get_color_for_record(record)

        formattedProbeMessage: str = f"{color}{formattedMessage}{_ANSI_RESET}"

        return formattedProbeMessage

    def _get_color_for_record(
        self,
        record: logging.LogRecord,
    ) -> str:
        probeKind: str = str(getattr(record, "probe_kind", ""))

        if probeKind == _TRACE_PROBE_KIND:
            color: str = _ANSI_TRACE

        elif record.levelno == logging.DEBUG:
            color = _ANSI_DEBUG

        elif record.levelno == logging.WARNING:
            color = _ANSI_WARNING

        elif record.levelno >= logging.ERROR:
            color = _ANSI_ERROR

        else:
            color = ""

        return color


@dataclass(frozen=True)
class ProbeConfiguration:
    fTraceProbeEnabled: bool
    errorProbeMinimumLevel: ProbeLevel
    applicationLogFile: Path


_probeConfiguration: ProbeConfiguration | None = None


def configure_probes(application_configuration: ApplicationConfiguration) -> None:
    global _probeConfiguration

    _probeConfiguration = ProbeConfiguration(
        fTraceProbeEnabled=application_configuration.is_trace_enabled,
        errorProbeMinimumLevel=application_configuration.error_probe_level,
        applicationLogFile=application_configuration.application_log,
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

    if probeConfiguration.fTraceProbeEnabled and _traceLogger.isEnabledFor(logging.INFO):
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
    logger.setLevel(level)

    fmtStr: str = (
        "%(asctime)s "
        # "%(probe_kind)s "
        "%(levelname)s "
        "%(message)s "
        "%(pathname)s:%(lineno)d "
        "%(funcName)s():"
    )
    dateStr: str = "%y-%m-%d T %H:%M:%S"

    handler: logging.StreamHandler[TextIO] = logging.StreamHandler()
    handler.setFormatter(ProbeFormatter(fmt=fmtStr, datefmt=dateStr))
    logger.addHandler(handler)

    # explicitly clear the existing log file to avoid missing startup probes
    logFile: Path = _get_probe_configuration().applicationLogFile
    logFile.parent.mkdir(parents=True, exist_ok=True)
    logFile.write_text("", encoding="utf-8")
    fileHandler: logging.FileHandler = logging.FileHandler(
        filename=str(logFile),
        mode="a",
        encoding="utf-8",
    )
    fileHandler.setFormatter(logging.Formatter(fmt=fmtStr, datefmt=dateStr))
    logger.addHandler(fileHandler)

    logger.propagate = False


def _get_probe_configuration() -> ProbeConfiguration:
    if _probeConfiguration is None:
        raise RuntimeError("Probes have not been configured.")

    return _probeConfiguration
