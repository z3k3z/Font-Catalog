import logging
from enum import Enum


class ProbeLevel(Enum):
    DEBUG = logging.DEBUG
    WARNING = logging.WARNING
    ERROR = logging.ERROR
