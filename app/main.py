from app.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)
from app.diagnostics.probe import configure_probes
from app.font_catalog_app import FontCatalogApp

"""
Runtime powershell commands:

$env:FONT_CATALOG_TRACE="1"
$env:FONT_CATALOG_ERROR_PROBES="1"
fastapi dev app/main.py
"""

# configure error probes and tracing
configure_probes()

_applicationConfiguration: ApplicationConfiguration = create_application_configuration()

# create the application and run it
_fontCatalogApp: FontCatalogApp = FontCatalogApp(_applicationConfiguration)
app = _fontCatalogApp.create_fastapi_app()
