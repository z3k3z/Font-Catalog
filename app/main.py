from app.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)
from app.diagnostics.probe import configure_probes, emit_trace_probe
from app.font_catalog_app import FontCatalogApp

"""
Runtime powershell commands:

fastapi dev app/main.py
"""

_applicationConfiguration: ApplicationConfiguration = create_application_configuration()

# configure error probes and tracing
configure_probes(_applicationConfiguration)
emit_trace_probe(lambda: ("Application start!"))

# create the application and run it
_fontCatalogApp: FontCatalogApp = FontCatalogApp(_applicationConfiguration)
app = _fontCatalogApp.create_fastapi_app()
